import { io, Socket } from "socket.io-client";
import { EventEmitter, on } from "events";
import { z } from "zod";

type WebSocketDsn = `ws://${string}`;
type SearchEvent = "search";

const apiSearchResultSchema = z.object({
    page: z.number(),
    resultCount: z.number(),
    name: z.string(),
    films: z.array(z.string()),
});

const apiSearchErrorSchema = z.object({
    page: z.literal(-1),
    resultCount: z.literal(-1),
    error: z.string(),
});

const apiSearchResponseSchema = z.union([apiSearchResultSchema, apiSearchErrorSchema]);

type ApiSearchRequest = { query: string };
type ApiSearchResponse = z.infer<typeof apiSearchResponseSchema>;

export type ApiSearchResult = z.infer<typeof apiSearchResultSchema>;

const isResult = (response: ApiSearchResponse): response is ApiSearchResult => {
    return "name" in response;
};

type ListenEvents = {
    search: (response: ApiSearchResponse) => void;
};

type EmitEvents = {
    search: (request: ApiSearchRequest) => void;
};

export class StarWarsApiClient {
    private readonly searchEvent: SearchEvent = "search";
    private readonly wsDsn: WebSocketDsn;

    constructor(wsDsn: WebSocketDsn) {
        this.wsDsn = wsDsn;
    }

    public async *searchCharacter(query: ApiSearchRequest): AsyncGenerator<ApiSearchResult | Error> {
        const emitter = new EventEmitter();
        const ws: Socket<ListenEvents, EmitEvents> = io(this.wsDsn, {
            reconnection: false,
        });

        let shouldStop = false;
        let responseTimeout: NodeJS.Timeout | null = null;

        const refreshTimeout = () => {
            if (responseTimeout) {
                clearTimeout(responseTimeout);
            }

            responseTimeout = setTimeout(() => {
                emitErrorAndStop(`Search request timed out for query: "${query.query}"`);
            }, 5_000);
        };

        const emitErrorAndStop = (errorMessage: string) => {
            if (responseTimeout) {
                clearTimeout(responseTimeout);
            }

            emitter.emit("data", new Error(errorMessage));
            shouldStop = true;
        };

        const handleSearchResponse = (response: unknown) => {
            const parseResult = apiSearchResponseSchema.safeParse(response);
            
            if (!parseResult.success) {
                emitErrorAndStop(`Invalid response format received from API: ${parseResult.error}`);

                return;
            }

            const validResponse = parseResult.data;

            if (isResult(validResponse)) {
                emitter.emit("data", validResponse);

                if (validResponse.page === validResponse.resultCount) {
                    shouldStop = true;
                }
            } else {
                emitErrorAndStop(`Search Error: ${validResponse.error}`);
            }
        };

        try {
            ws.on("disconnect", () => emitErrorAndStop(`WebSocket disconnected from ${this.wsDsn}`));
            ws.on("connect_error", () => emitErrorAndStop(`Failed to connect to WebSocket at ${this.wsDsn}`));

            ws.on(this.searchEvent, handleSearchResponse);
            ws.emit(this.searchEvent, query);

            refreshTimeout();

            for await (const [data] of on(emitter, "data")) {
                yield data as ApiSearchResult | Error;

                if (shouldStop) {
                    break;
                }

                refreshTimeout();
            }
        } finally {
            emitter.removeAllListeners();

            if (ws.connected) {
                ws.disconnect();
            }

            // although already cleaned, do it again just in case for defensive programming
            if (responseTimeout) {
                clearTimeout(responseTimeout);
            }
        }
    }
}
