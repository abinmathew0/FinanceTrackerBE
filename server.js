// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// ----------------------------------------------------------------------------
// 🔐 CORS configuration
// ----------------------------------------------------------------------------
// Read your primary front-end URL from .env (e.g. finance-tracker FE)
// and also allow your personal domain abi nmath ew.xyz
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://finance-tracker-fe-abin-mathews-projects.vercel.app";

const allowedOrigins = [
  FRONTEND_URL,
  "https://abinmathew.xyz",
  "https://finance-tracker-fe-chi.vercel.app",
  "https://finance-tracker-fe-git-main-abin-mathews-projects.vercel.app/",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you ever send cookies or auth headers
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Parse JSON bodies
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
