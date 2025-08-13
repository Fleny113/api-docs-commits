import { inspect } from "node:util";
import pc from "picocolors";

export const LogLevel = {
    Debug: 0,
    Info: 1,
    Warn: 2,
    Error: 3,
    Fatal: 4,
};
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const prefixes = new Map<LogLevel, string>()
    .set(LogLevel.Debug, pc.white(pc.bgBlack("DBG")))
    .set(LogLevel.Info, pc.cyan(pc.bgBlack("INF")))
    .set(LogLevel.Warn, pc.yellow(pc.bgBlack("WRN")))
    .set(LogLevel.Error, pc.red(pc.bgBlack("ERR")))
    .set(LogLevel.Fatal, pc.red(pc.bgBlack(pc.bold("FTL"))));

export function createLogger(name: string, logLevel: LogLevel) {
    let currentLogLevel = logLevel;

    const log = (level: LogLevel, ...args: unknown[]) => {
        if (currentLogLevel > level) return;

        if (typeof args[0] !== "string") args[0] = inspect(args[0], { colors: true });

        const date = new Date();
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = date.getUTCDate().toString().padStart(2, "0");
        const hours = date.getUTCHours().toString().padStart(2, "0");
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        const seconds = date.getUTCSeconds().toString().padStart(2, "0");

        // You either construct the date string manually or rely on a random locale to have the format you want.
        const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const prefix = prefixes.get(level) ?? pc.white(pc.bgBlack("UNK"));

        const dateAndTime = pc.greenBright(pc.bold(`[${timestamp}]`));
        const message = `${dateAndTime} ${prefix} ${name} ${pc.black(">")} ${args[0]}`;

        switch (level) {
            case LogLevel.Debug: {
                console.debug(message, ...args.slice(1));
                break;
            }
            case LogLevel.Warn: {
                console.warn(message, ...args.slice(1));
                break;
            }
            case LogLevel.Error:
            case LogLevel.Fatal: {
                console.error(message, ...args.slice(1));
                break;
            }
            default: {
                console.info(message, ...args.slice(1));
                break;
            }
        }
    };

    return {
        log,

        debug: log.bind(null, LogLevel.Debug),
        info: log.bind(null, LogLevel.Info),
        warn: log.bind(null, LogLevel.Warn),
        error: log.bind(null, LogLevel.Error),
        fatal: log.bind(null, LogLevel.Fatal),

        setLevel(level: LogLevel) {
            currentLogLevel = level;
        },
    };
}

export const logger = createLogger("api-docs-commits", LogLevel.Info);
