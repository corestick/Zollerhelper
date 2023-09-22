const config = {
  mssql: {
    unimes: {
      user: "ifuser",
      password: "#IT4257",
      server: "192.168.30.4",
      port: 1433,
      database: "IFDB",
      options: {
        trustedConnection: true,
        encrypt: false,
      },
    },
  },
};

export default config;
