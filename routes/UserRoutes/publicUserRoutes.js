import express from "express";
import bcrypt from "bcrypt";
import { db } from "../../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

// DB-Test
router.get("/dbtest", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT NOW() AS now");
    res.json({
      databaseTime: rows[0].now,
      status: "✅ DB Verbindung erfolgreich",
    });
  } catch (error) {
    res.status(500).json({
      error: "Datenbankverbindung fehlgeschlagen",
      details: error.message,
    });
  }
});

// Admin-Login
router.post("/adminLogin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ error: "E-Mail und Passwort sind erforderlich" });

  try {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND role_id = 1",
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: "Ungültige Anmeldeinformationen" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: "Ungültige Anmeldeinformationen" });

    // ✅ JWT erzeugen
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Token + Message zurückgeben
    res.json({ message: "Admin-Login erfolgreich", token });
  } catch (error) {
    console.error("Admin-Anmeldefehler:", error);
    res.status(500).json({ error: "Serverfehler: " + error.message });
  }
});

export default router;
