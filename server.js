// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// ----------------------------------------------------------------------------
// 🔐 CORS configuration: allow all origins
// ----------------------------------------------------------------------------
const corsOptions = {
  origin: true, // reflect request origin, effectively allowing all
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you ever send cookies or auth headers
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight across the board
app.options("*", cors(corsOptions));

// ----------------------------------------------------------------------------
// 🚀 JSON body parsing
// ----------------------------------------------------------------------------
app.use(express.json());

// ----------------------------------------------------------------------------
// 🚀 Your API routes
// ----------------------------------------------------------------------------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/expense-limits", require("./routes/expenseLimits"));

// ----------------------------------------------------------------------------
// 📡 Start server
// ----------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
