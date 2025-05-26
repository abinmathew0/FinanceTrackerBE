const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  "https://finance-tracker-fe-chi.vercel.app",
  "https://finance-tracker-fe-git-main-abin-mathews-projects.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Special middleware to bypass Vercel auth
app.use((req, res, next) => {
  // Bypass Vercel's auth for API routes
  if (req.path.startsWith("/api")) {
    return next();
  }
  next();
});

// Handle preflight requests
app.options("*", cors());

// Body parsing
app.use(express.json());

// Your routes
app.use("/api/auth", require("./routes/authRoutes"));
// ... other routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
