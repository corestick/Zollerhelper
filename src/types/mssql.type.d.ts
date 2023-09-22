interface SqlParam {
  name: string;
  sqlType?: "nvarchar" | "decimal" | "int";
  value?: string | number;
}

interface SqlQueryString {
  queryString: string;
  sqlParams: Array<SqlParam> | null;
}
