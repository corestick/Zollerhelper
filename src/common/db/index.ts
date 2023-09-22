import { execMssql } from "./mssql";

export const execQuery = async <T>(
  queryString: QueryString<T>[],
  dbConn?: string
): Promise<void> => {
  try {
    const sqlConfig =
      _CONFIG.mssql[
        _toString(dbConn || Object.keys(_CONFIG.mssql).shift()).toLowerCase()
      ];

    await Promise.all(
      queryString.map((el) => {
        const queryString = el.queryString;
        const sqlParams = makeSqlParams(el.params);

        execMssql(sqlConfig, {
          queryString,
          sqlParams,
        });

        queryLog(queryString, sqlParams);
      })
    );
  } catch (err) {
    if (err instanceof Error) _LOG.error(`${err.message}`);

    throw err;
  }
};

const makeSqlParams = (params: any): Array<SqlParam> => {
  const sqlParmas: Array<SqlParam> = new Array<SqlParam>();

  const keys = Object.keys(params);
  keys.forEach((key) => {
    sqlParmas.push({
      name: key,
      sqlType: typeof params[key] === "number" ? "decimal" : "nvarchar",
      value: params[key],
    });
  });

  return sqlParmas;
};

const queryLog = (queryString: string, sqlParams: SqlParam[] | null): void => {
  let log: string = _EOL;

  if (sqlParams !== null) {
    if (sqlParams instanceof Array) {
      sqlParams.forEach((param) => {
        log = log.concat(`Declare @${param.name} ${param.sqlType}`);

        if (String(param.sqlType).toLowerCase() === "nvarchar")
          log = log.concat(`(${String(param.value).length})`);
        else if (String(param.sqlType).toLowerCase() === "decimal")
          log = log.concat(`(22,6)`);

        log = log.concat(` = '${param.value}'`);

        log = log.concat(_EOL);
      });
    }
  }

  log = log.concat(queryString);

  _LOG.info(log);
};
