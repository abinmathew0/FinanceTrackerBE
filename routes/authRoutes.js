const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const router = express.Router();

// ✅ Register a new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("🔹 Register Request Received:", { name, email });

  try {
    const client = await pool.connect();

    // ✅ Check if email already exists
    const existingUser = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      client.release();
      console.log("❌ Email already exists");
      return res.status(400).json({ error: "Email already exists" });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔹 Hashed Password Created");

    // ✅ Insert new user into database
    await client.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );

    client.release();
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
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    const user = result.rows[0];
    client.release();

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

// ✅ Fetch authenticated user details
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No Token Provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await pool.connect();
    const user = await client.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [decoded.id]
    );
    client.release();

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error("❌ Error Fetching User Data:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// ✅ Change Password (for logged-in user)
router.post("/change-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No Token Provided" });
  }
  
  try {
    // Verify the JWT token from the headers
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    
    const client = await pool.connect();
    // Retrieve the user's current password hash from the database
    const userResult = await client.query("SELECT password FROM users WHERE id = $1", [decoded.id]);
    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: "User not found" });
    }
    
    const user = userResult.rows[0];
    // Compare provided current password with the stored hash
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      client.release();
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update the user's password in the database
    await client.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, decoded.id]);
    client.release();
    
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Error changing password:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});



module.exports = router;
