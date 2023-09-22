import { Logger } from "winston";

declare global {
  namespace Express {
    export interface Request {
      data?: unknown;
    }
  }

  declare var _LOG: Logger;
  declare var _EOL: string;
  declare var _COM: Module;
  declare var _ERR: Module;
  declare var _CONFIG: Module;

  declare var _dirname: function;

  declare var _execQuery: <T>(
    sql: QueryString<T>[],
    dbConn?: string
  ) => Promise<void>;
  declare var _execFunc: function;
  declare var _toString: function;
}

export {};
