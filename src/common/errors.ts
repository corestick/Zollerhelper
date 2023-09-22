class DBError extends Error {
  constructor(message: string) {
    super(message || "DB Error");
  }
}

class QueryXMLError extends Error {
  constructor(message: string) {
    super(message || "Query xml Error");
  }
}

export default {
  DBError,
  QueryXMLError,
};
