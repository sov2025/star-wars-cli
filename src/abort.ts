export function createShutdownAbortContext(): {
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

    return { controller, signal };
}
