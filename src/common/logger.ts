import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";

const logDir = "log";
const { combine, timestamp, printf } = winston.format;

const logFormat = printf((info) => {
  return `${info.timestamp} ${info.level} : ${info.message}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: combine(
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    logFormat
  ),
  transports: [
    new winstonDaily({
      level: "info",
      datePattern: "YYYY-MM-DD",
      dirname: logDir,
      filename: `%DATE%.log`,
      maxFiles: 100,
      zippedArchive: true,
    }),

    new winstonDaily({
      level: "error",
      datePattern: "YYYY-MM-DD",
      dirname: logDir,
      filename: `%DATE%.err.log`,
      maxFiles: 100,
      zippedArchive: true,
    }),
  ],
});

// const ENV: string = process.argv[2] || "dev";
// if (ENV === "dev") {
// 	logger.add(
// 		new winston.transports.Console({
// 			format: winston.format.combine(
// 				winston.format.colorize(),
// 				winston.format.simple()
// 			),
// 		})
// 	);
// }

export default logger;
