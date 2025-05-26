const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet"); // Added for security headers

dotenv.config();

const app = express();

// ----------------------------------------------------------------------------
// 🛡️ Security Middleware
// ----------------------------------------------------------------------------
app.use(helmet());

// ----------------------------------------------------------------------------
// 🔐 Enhanced CORS configuration
// ----------------------------------------------------------------------------
const allowedOrigins = [
  "https://finance-tracker-fe-git-main-abin-mathews-projects.vercel.app",
  "https://finance-tracker-fe-chi.vercel.app",
  "http://localhost:3000", // For local development
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests
app.options("*", cors(corsOptions));

// Special middleware to handle preflight requests
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    // Respond immediately to OPTIONS requests
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }
  next();
});

// ----------------------------------------------------------------------------
// 🚀 JSON body parsing
// ----------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------------------------------
// 🚀 Health Check Endpoint
// ----------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// ----------------------------------------------------------------------------
// 🚀 Your API routes
// ----------------------------------------------------------------------------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/expense-limits", require("./routes/expenseLimits"));

// ----------------------------------------------------------------------------
// 🛑 Error Handling Middleware
// ----------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Policy",
      message: "Request not allowed from this origin",
    });
  }

  res.status(500).json({ error: "Internal Server Error" });
});

// ----------------------------------------------------------------------------
// 📡 Start server
// ----------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🛡️  CORS allowed origins: ${allowedOrigins.join(", ")}`);
});

// Handle server shutdown gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
