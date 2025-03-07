const express = require("express");
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Add a transaction
router.post("/", authMiddleware, async (req, res) => {
  const { name, amount, type, category } = req.body;
  console.log("🔹 Add Transaction Request:", { name, amount, type, category });

  try {
    const client = await pool.connect();

    // ✅ Insert into database
    await client.query(
      "INSERT INTO transactions (user_id, name, amount, type, category) VALUES ($1, $2, $3, $4, $5)",
      [req.user.id, name, amount, type, category]
    );

    client.release();
    console.log("✅ Transaction Added Successfully");
    res.status(201).json({ message: "Transaction added successfully" });
  } catch (error) {
    console.error("❌ Error Adding Transaction:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// ✅ Get all transactions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const client = await pool.connect();
    const transactions = await client.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC",
      [req.user.id]
    );
    client.release();

    res.json(transactions.rows);
  } catch (error) {
    console.error("❌ Error Fetching Transactions:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// ✅ Update a transaction (Newly Added) with date support
router.put("/:id", authMiddleware, async (req, res) => {
  const transactionId = req.params.id;
  const { name, amount, type, category, date } = req.body;
  console.log("🔹 Update Transaction Request:", {
    transactionId,
    name,
    amount,
    type,
    category,
    date,
  });

  try {
    const client = await pool.connect();

    // ✅ Check if transaction exists and belongs to the user
    const transaction = await client.query(
      "SELECT * FROM transactions WHERE id = $1 AND user_id = $2",
      [transactionId, req.user.id]
    );

    if (transaction.rows.length === 0) {
      client.release();
      console.log("❌ Transaction not found or unauthorized");
      return res.status(404).json({ error: "Transaction not found" });
    }

    // ✅ Update transaction in the database including date
    await client.query(
      "UPDATE transactions SET name = $1, amount = $2, type = $3, category = $4, date = $5 WHERE id = $6",
      [name, amount, type, category, date, transactionId]
    );

    client.release();
    console.log("✅ Transaction Updated Successfully");
    res.status(200).json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("❌ Error Updating Transaction:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// ✅ Delete a transaction
router.delete("/:id", authMiddleware, async (req, res) => {
  const transactionId = req.params.id;
  console.log("🔹 Delete Transaction Request:", transactionId);

  try {
    const client = await pool.connect();

    // ✅ Check if transaction exists and belongs to the user
    const transaction = await client.query(
      "SELECT * FROM transactions WHERE id = $1 AND user_id = $2",
      [transactionId, req.user.id]
    );

    if (transaction.rows.length === 0) {
      client.release();
      console.log("❌ Transaction not found or unauthorized");
      return res.status(404).json({ error: "Transaction not found" });
    }

    // ✅ Delete transaction from database
    await client.query("DELETE FROM transactions WHERE id = $1", [
      transactionId,
    ]);

    client.release();
    console.log("✅ Transaction Deleted Successfully");
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("❌ Error Deleting Transaction:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
