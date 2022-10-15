function log(...args: any[]) {
    console.log(`[$API][$TS=${Date.now()}][$LOG]`, ...args);
}

export function logm(arg: string) {
    console.log(`[$API][$TS=${Date.now()}][$LOG]`, arg.substring(0, arg.length - 1));
}

export function error(...args: any[]) {
    console.error(`[$API][$TS=${Date.now()}][$ERR]`, ...args);
}

log.error = error;

export default log;
