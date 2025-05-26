const express = require("express");
const { dynamodb } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");
const {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const router = express.Router();
const TRANSACTIONS_TABLE = "transactions";

// Add a transaction
router.post("/", authMiddleware, async (req, res) => {
  const { name, amount, type, category, date } = req.body;
  try {
    const transactionId = uuidv4();
    await dynamodb.send(
      new PutCommand({
        TableName: TRANSACTIONS_TABLE,
        Item: {
          id: transactionId,
          user_id: req.user.id,
          name,
          amount,
          type,
          category,
          date: date || new Date().toISOString(),
        },
      })
    );
    res.status(201).json({ message: "Transaction added successfully" });
  } catch (error) {
    console.error("❌ Error Adding Transaction:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Get all transactions for the current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const params = {
      TableName: TRANSACTIONS_TABLE,
      IndexName: "user_id-index", // Requires GSI on user_id
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: { ":uid": req.user.id },
      ScanIndexForward: false, // Get latest transactions first
    };
    const data = await dynamodb.send(new QueryCommand(params));
    res.json(data.Items);
  } catch (error) {
    console.error("❌ Error Fetching Transactions:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Update a transaction
router.put("/:id", authMiddleware, async (req, res) => {
  const transactionId = req.params.id;
  const { name, amount, type, category, date } = req.body;
  try {
    // Get transaction to verify ownership
    const t = await dynamodb.send(
      new GetCommand({
        TableName: TRANSACTIONS_TABLE,
        Key: { id: transactionId },
      })
    );
    if (!t.Item || t.Item.user_id !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    // Update transaction
    await dynamodb.send(
      new UpdateCommand({
        TableName: TRANSACTIONS_TABLE,
        Key: { id: transactionId },
        UpdateExpression:
          "set #n = :n, amount = :a, #t = :t, category = :c, #d = :d",
        ExpressionAttributeNames: {
          "#n": "name",
          "#t": "type",
          "#d": "date",
        },
        ExpressionAttributeValues: {
          ":n": name,
          ":a": amount,
          ":t": type,
          ":c": category,
          ":d": date,
        },
      })
    );
    res.status(200).json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("❌ Error Updating Transaction:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Delete a transaction
router.delete("/:id", authMiddleware, async (req, res) => {
  const transactionId = req.params.id;
  try {
    // Get transaction to verify ownership
    const t = await dynamodb.send(
      new GetCommand({
        TableName: TRANSACTIONS_TABLE,
        Key: { id: transactionId },
      })
    );
    if (!t.Item || t.Item.user_id !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    await dynamodb.send(
      new DeleteCommand({
        TableName: TRANSACTIONS_TABLE,
        Key: { id: transactionId },
      })
    );
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("❌ Error Deleting Transaction:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
