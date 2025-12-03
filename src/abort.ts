export function createAbortContext(): {
    controller: AbortController;
    signal: AbortSignal;
} {
    const controller = new AbortController();
    const signal = controller.signal;

    const abort = () => {
        if (!signal.aborted) {
            controller.abort();
        }
    };

    process.on("SIGINT", abort);
    process.on("SIGTERM", abort);

    // now register our actual shutdown handler to process exit
    onAbort(signal, () => {
        console.log("\n\nShutting down...");

        process.exit(0);
    });

    return { controller, signal };
}

export function onAbort(signal: AbortSignal, fn: () => void): () => void {
    if (signal.aborted) {
        fn();

        return () => {};
    }

    signal.addEventListener("abort", fn, { once: true });

    // return a cleanup function
    return () => {
        signal.removeEventListener("abort", fn);
    };
}
