// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// ----------------------------------------------------------------------------
// 🔐 CORS configuration
// ----------------------------------------------------------------------------
// Define all allowed client origins via environment variables
const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g. https://finance-tracker-fe-abin-mathews-projects.vercel.app
  process.env.FE_PREVIEW_URL, // e.g. https://finance-tracker-fe-chi.vercel.app
  "https://abinmathew.xyz",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin like mobile apps or curl
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const msg = `CORS blocked: Origin ${origin} not in allowed list`;
    return callback(new Error(msg), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you ever send cookies or auth headers
};

// Apply CORS
app.use(cors(corsOptions));
// Explicitly handle preflight
app.options("*", cors(corsOptions));

// JSON body parsing
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
