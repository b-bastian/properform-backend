import express from "express";
import bcrypt from "bcrypt";
import { db } from "../db.js";

const router = express.Router();
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

// Trainer-Registrierung (nur Admin darf)
router.post("/registerTrainer", async (req, res) => {
  if (req.user.role !== 1)
    return res
      .status(403)
      .json({ error: "Nur Admin darf Trainer registrieren" });

  const { firstname, birthdate, email, password_hash } = req.body;
  if (!firstname || !birthdate || !email || !password_hash)
    return res.status(400).json({ error: "Pflichtfelder fehlen" });

  try {
    const hashedPassword = await bcrypt.hash(password_hash, saltRounds);
    await db.execute(
      "INSERT INTO users (firstname, birthdate, email, password_hash, role_id) VALUES (?, ?, ?, ?, 3)",
      [firstname, birthdate || null, email, hashedPassword]
    );
    res.status(201).json({ message: `Trainer ${firstname} registriert.` });
  } catch (error) {
    console.error("Trainer-Registrierungsfehler:", error);
    res.status(500).json({ error: error.message });
  }
});

// Beispiel-Dashboard
router.get("/dashboard", (req, res) => {
  res.json({ message: `Willkommen im Dashboard, ${req.user.email}` });
});

export default router;
