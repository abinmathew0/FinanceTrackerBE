const sql = require("mssql");

const config = {
  user: "abin",
  password: "demo@12345678",
  server: "demosqlserver12345.database.windows.net",
  port: 1433,
  database: "demo",
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

const testConnection = async () => {
  try {
    const pool = await sql.connect(config);
    console.log("✅ Azure SQL Connection Successful!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message);
    process.exit(1);
  }
};

testConnection();
