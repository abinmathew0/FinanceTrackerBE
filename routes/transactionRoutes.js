const express = require("express");
const { sql, connectDB } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Add a transaction
router.post("/", authMiddleware, async (req, res) => {
  const { name, amount, type, category } = req.body;
  console.log("🔹 Add Transaction Request:", { name, amount, type, category });

  try {
    const pool = await connectDB();
    console.log("🔹 Connected to Database");

    if (!pool.connected) {
      console.error("❌ Database connection is not available.");
      return res.status(500).json({ error: "Database connection failed" });
    }

    // ✅ Insert into database
    await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .input("name", sql.VarChar, name)
      .input("amount", sql.Decimal, amount)
      .input("type", sql.VarChar, type)
      .input("category", sql.VarChar, category)
      .query(
        "INSERT INTO Transactions (userId, name, amount, type, category) VALUES (@userId, @name, @amount, @type, @category)"
      );

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
    const pool = await connectDB();
    const transactions = await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query(
        "SELECT * FROM Transactions WHERE userId = @userId ORDER BY date DESC"
      );

    res.json(transactions.recordset);
  } catch (error) {
    console.error("❌ Error Fetching Transactions:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// ✅ Delete a transaction
router.delete("/:id", authMiddleware, async (req, res) => {
  const transactionId = req.params.id;
  console.log("🔹 Delete Transaction Request:", transactionId);

  try {
    const pool = await connectDB();
    console.log("🔹 Connected to Database");

    // ✅ Check if transaction exists and belongs to the user
    const transaction = await pool.request()
      .input("id", sql.Int, transactionId)
      .input("userId", sql.Int, req.user.id)
      .query("SELECT * FROM Transactions WHERE id = @id AND userId = @userId");

    if (transaction.recordset.length === 0) {
      console.log("❌ Transaction not found or unauthorized");
      return res.status(404).json({ error: "Transaction not found" });
    }

    // ✅ Delete transaction from database
    await pool.request()
      .input("id", sql.Int, transactionId)
      .query("DELETE FROM Transactions WHERE id = @id");

    console.log("✅ Transaction Deleted Successfully");
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("❌ Error Deleting Transaction:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
