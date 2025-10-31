import express from "express";
import bcrypt from "bcrypt";
import { db } from "../../db.js";
import { requireAuth } from "../../auth.js";

const router = express.Router();
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

router.post("/adminRegister", requireAuth, async (req, res) => {
  //const { firstname, birthdate, email, password_hash } = req.body;
  if (req.user.role !== 1)
    return res
      .status(403)
      .json({ error: "Nur Admin darf Admins registrieren" });

  const { firstname, birthdate, email, password_hash } = req.body;
  if (!firstname || !birthdate || !email || !password_hash)
    return res.status(400).json({ error: "Pflichtfelder fehlen" });

  try {
    const hashedPassword = await bcrypt.hash(password_hash, saltRounds);
    await db.execute(
      "INSERT INTO users (firstname, birthdate, email, password_hash, role_id) VALUES (?, ?, ?, ?, 1)",
      [firstname, birthdate || null, email, hashedPassword]
    );
    res.status(201).json({ message: `Admin ${firstname} registriert.` });
  } catch (error) {
    console.error("Admin-Registrierungsfehler:", error);
    res.status(500).json({ error: error.message });
  }
});

// Trainer-Registrierung (nur Admin darf)
router.post("/registerTrainer", requireAuth, async (req, res) => {
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

router.get("/getAll", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT uid, firstname, birthdate, email, role_id FROM users"
    );
    res.json({ users: rows });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzer:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Benutzer" });
  }
});

router.get("/getAllOwners", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT uid, firstname, birthdate, email, role_id FROM users WHERE role_id = 1"
    );
    res.json({ users: rows });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzer:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Benutzer" });
  }
});

router.get("/getAllUsers", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT uid, firstname, birthdate, email, role_id FROM users WHERE role_id = 2"
    );
    res.json({ users: rows });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzer:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Benutzer" });
  }
});

router.get("/getAllTrainers", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT uid, firstname, birthdate, email, role_id FROM users WHERE role_id = 3"
    );
    res.json({ users: rows });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzer:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Benutzer" });
  }
});

router.get("/getNumberOfUsers", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS userCount FROM users WHERE role_id = 2"
    );
    const userCount = rows[0].userCount;
    res.json({ userCount });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzeranzahl:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

router.get("/getNumberOfTrainers", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS trainerCount FROM users WHERE role_id = 3"
    );
    const trainerCount = rows[0].trainerCount;
    res.json({ trainerCount });
  } catch (error) {
    console.error("Fehler beim Abrufen der Traineranzahl:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Beispiel-Dashboard
router.get("/dashboard", (req, res) => {
  res.json({ message: `Willkommen im Dashboard, ${req.user.email}` });
});

export default router;
