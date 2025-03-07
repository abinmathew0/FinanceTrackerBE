const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ✅ Use connection string for PostgreSQL
  ssl: {
    rejectUnauthorized: false, // ✅ Required for Render PostgreSQL
  },
});

// ✅ Establish connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL Database");
    client.release(); // Release connection
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
