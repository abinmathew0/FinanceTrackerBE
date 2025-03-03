const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, connectDB } = require("../config/db");

const router = express.Router();

// ✅ Register a new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("🔹 Register Request Received:", { name, email });

  try {
    const pool = await connectDB(); // ✅ Ensure valid DB connection

    if (!pool.connected) {
      console.error("❌ Database connection is not available.");
      return res.status(500).json({ error: "Database connection failed" });
    }

    console.log("🔹 Connected to Database");

    // ✅ Check if email already exists
    const existingUser = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (existingUser.recordset.length > 0) {
      console.log("❌ Email already exists");
      return res.status(400).json({ error: "Email already exists" });
    }

    // ✅ Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("🔹 Hashed Password Created");

    // ✅ Insert new user into database
    await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPassword)
      .query(
        "INSERT INTO Users (name, email, password) VALUES (@name, @email, @password)"
      );

    console.log("✅ User Registered Successfully");
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Error Registering User:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// ✅ Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("🔹 Login Request Received:", { email });

  try {
    const pool = await connectDB();
    console.log("🔹 Connected to Database");

    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    const user = result.recordset[0];

    if (!user) {
      console.log("❌ Invalid email");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.log("❌ Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("✅ User Logged In Successfully");
    res.json({ token });
  } catch (error) {
    console.error("❌ Error Logging In:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// ✅ Fetch authenticated user details (Protected Route)
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No Token Provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await connectDB();

    const user = await pool
      .request()
      .input("id", sql.Int, decoded.id)
      .query("SELECT id, name, email FROM Users WHERE id = @id");

    if (!user.recordset[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.recordset[0]);
  } catch (error) {
    console.error("❌ Error Fetching User Data:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
