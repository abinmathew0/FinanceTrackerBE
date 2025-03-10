const express = require("express");
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Get expense limits for the current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT limits FROM expense_limits WHERE user_id = $1",
      [req.user.id]
    );
    client.release();

    // If a record exists, return its limits, otherwise return an empty object
    res.json(result.rows.length > 0 ? result.rows[0].limits : {});
  } catch (error) {
    console.error("❌ Error fetching expense limits:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// ✅ Save (or update) expense limits for the current user
router.post("/", authMiddleware, async (req, res) => {
  const limits = req.body;
  try {
    const client = await pool.connect();
    // Upsert using ON CONFLICT; ensure your expense_limits table has a UNIQUE constraint on user_id
    await client.query(
      `INSERT INTO expense_limits (user_id, limits)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET limits = EXCLUDED.limits`,
      [req.user.id, limits]
    );
    client.release();

    console.log("✅ Expense limits saved successfully");
    res.status(200).json({ message: "Expense limits saved successfully" });
  } catch (error) {
    console.error("❌ Error saving expense limits:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
