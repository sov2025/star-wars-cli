import { StarWarsApiClient } from "./api-client";
import { CliPrompt } from "./cli";
import { createAbortContext } from "./abort";

const { controller } = createAbortContext();

const wsUrl = (process.env.STARWARS_API_WS || "ws://localhost:3000") as `ws://${string}`;

const apiClient = new StarWarsApiClient(wsUrl);

const cli = new CliPrompt(controller);

cli.prompt();

for await (const line of cli) {
    const query = line.trim();

    if (query.length === 0) {
        cli.handleInvalidPrompt("Please enter a valid search query\n");
        continue;
    }

    if (query === "exit" || query === "quit") {
        controller.abort("User requested exit");

        break;
    }

    console.log(`\n > Searching for character: "${query}"\n`);

    for await (const searchResult of apiClient.searchCharacter({ query })) {
        if (searchResult instanceof Error) {
            console.error(`\t  - Error: ${searchResult.message}\n`);
        } else {
            console.log(
                `\t - Character (${searchResult.page}/${searchResult.resultCount}): ${searchResult.name} - Films: ${searchResult.films.join(", ")}`,
            );
        }
    }

    // a new beginning...
    console.log('\nSearch ended. You can enter a new search query, or type "exit" to quit.\n');
    cli.prompt();
}
