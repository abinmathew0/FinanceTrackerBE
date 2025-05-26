const express = require("express");
const { dynamodb } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const router = express.Router();
const EXPENSE_LIMITS_TABLE = "expense_limits";

// Get expense limits for the current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: EXPENSE_LIMITS_TABLE,
        Key: { user_id: req.user.id },
      })
    );
    res.json(result.Item ? result.Item.limits : {});
  } catch (error) {
    console.error("❌ Error fetching expense limits:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Save/update expense limits for the current user
router.post("/", authMiddleware, async (req, res) => {
  const limits = req.body;
  try {
    await dynamodb.send(
      new PutCommand({
        TableName: EXPENSE_LIMITS_TABLE,
        Item: { user_id: req.user.id, limits },
      })
    );
    res.status(200).json({ message: "Expense limits saved successfully" });
  } catch (error) {
    console.error("❌ Error saving expense limits:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
