class DBError extends Error {
  constructor(message: string) {
    super(message || "DB Error");
  }
}

export default {};
