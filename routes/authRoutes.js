const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { dynamodb } = require("../config/db");
const {
  QueryCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const router = express.Router();
const USERS_TABLE = "users";

// Register a new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if email already exists
    const params = {
      TableName: USERS_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    };
    const data = await dynamodb.send(new QueryCommand(params));
    if (data.Items.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await dynamodb.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: { id: userId, name, email, password: hashedPassword },
      })
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Error Registering User:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Look up user by email
    const params = {
      TableName: USERS_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    };
    const data = await dynamodb.send(new QueryCommand(params));
    const user = data.Items[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ token });
  } catch (error) {
    console.error("❌ Error Logging In:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Get user details
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No Token Provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await dynamodb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: decoded.id },
      })
    );
    if (!user.Item) {
      return res.status(404).json({ message: "User not found" });
    }
    const { id, name, email } = user.Item;
    res.json({ id, name, email });
  } catch (error) {
    console.error("❌ Error Fetching User Data:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Change password
router.post("/change-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No Token Provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await dynamodb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: decoded.id },
      })
    );
    if (!user.Item) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.Item.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dynamodb.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: decoded.id },
        UpdateExpression: "set password = :p",
        ExpressionAttributeValues: { ":p": hashedPassword },
      })
    );
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Error changing password:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
