const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  port: 1433, // ✅ Explicitly set SQL Server Port
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // ✅ Required for Azure SQL
    trustServerCertificate: false,
  },
};

// ✅ Create a single connection pool and reuse it
let poolPromise;

const connectDB = async () => {
  if (!poolPromise) {
    try {
      poolPromise = new sql.ConnectionPool(config);
      await poolPromise.connect();
      console.log("✅ Connected to Azure SQL Database");
    } catch (error) {
      console.error("❌ Database Connection Failed:", error.message);
      process.exit(1);
    }
  }
  return poolPromise;
};

// ✅ Export a function that always returns the same pool
module.exports = { sql, connectDB };
