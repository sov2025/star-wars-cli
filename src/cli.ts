import * as readline from "node:readline";

export class CliPrompt {
    private readonly rl: readline.Interface;
    private readonly abortController: AbortController;

    constructor(abortController: AbortController) {
        this.abortController = abortController;

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "Enter your search query for a Star Wars character: ",
            historySize: 10,
            signal: abortController.signal,
        });

        this.rl.on("SIGINT", () => this.abortController.abort());
        this.rl.on("SIGTERM", () => this.abortController.abort());
    }

    prompt(): void {
        this.rl.prompt();
    }

    handleInvalidPrompt(message: string): void {
        console.log(message);
        this.prompt();
    }

    async *[Symbol.asyncIterator](): AsyncIterableIterator<string> {
        yield* this.rl;
    }
}
