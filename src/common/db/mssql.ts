import * as sql from "mssql";

const getPool = async (config: sql.config): Promise<sql.ConnectionPool> => {
  return await sql.connect(config);
};

export const execMssql = async (
  config: sql.config,
  sqlQueryString: SqlQueryString
): Promise<JSON> => {
  const pool = await getPool(config);
  const request = pool.request();

  const sqlParams = sqlQueryString.sqlParams;
  if (sqlParams !== null) {
    sqlParams.forEach((param) => {
      request.input(param.name, param.value);
    });
  }

  const result = await request.query(sqlQueryString.queryString);

  pool.close();

  if (result.recordset === undefined)
    return JSON.parse(JSON.stringify({ rowsAffected: result.rowsAffected }));
  else return JSON.parse(JSON.stringify(result.recordset));
};
