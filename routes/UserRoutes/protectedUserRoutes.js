import express from "express";
import bcrypt from "bcrypt";
import { db } from "../../db.js";
import { requireAuth } from "../../auth.js";

const router = express.Router();
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

router.post("/createUser", requireAuth, async (req, res) => {
  const {
    firstname,
    birthdate,
    email,
    password,
    weight,
    height,
    gender,
    onboarding_completed,
    fitness_level,
    training_frequency,
    primary_goal,
  } = req.body;

  if (
    !firstname ||
    !birthdate ||
    !email ||
    !password ||
    weight == null ||
    height == null ||
    !gender ||
    onboarding_completed === undefined ||
    !fitness_level ||
    !training_frequency ||
    !primary_goal
  ) {
    return res
      .status(400)
      .json({ error: "Bitte füllen Sie alle erforderlichen Felder aus." });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Das Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Die E-Mail-Adresse ist ungültig.",
    });
  }

  try {
    const role_id = 2; // Standardmäßig auf "User" setzen

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await db.execute(
      "INSERT INTO users (firstname, birthdate, email, password_hash, weight, height, gender, onboarding_completed, fitness_level, training_frequency, primary_goal, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        firstname,
        birthdate,
        email,
        hashedPassword,
        weight,
        height,
        gender,
        onboarding_completed,
        fitness_level,
        training_frequency,
        primary_goal,
        role_id,
      ]
    );

    res
      .status(201)
      .json({ message: "Benutzer erfolgreich erstellt", uid: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "E-Mail bereits registriert." });
    }

    console.error("Fehler beim Erstellen des Benutzers:", error);
    res.status(500).json({ error: "Fehler beim Erstellen des Benutzers" });
  }
});

router.get("/getAll", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT uid, firstname, birthdate, email, role_id FROM users"
    );

    const [trainerRows] = await db.execute(
      "SELECT tid, firstname, birthdate, email FROM trainers"
    );

    rows.push(...trainerRows);
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
      "SELECT tid, firstname, birthdate, email FROM trainers"
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

router.delete("/deleteUser/:uid", requireAuth, async (req, res) => {
  const { uid } = req.params;

  console.log(`Lösche Benutzer mit UID: ${uid}`);

  try {
    const [result] = await db.execute("DELETE FROM users WHERE uid = ?", [uid]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    res.json({ message: "Benutzer erfolgreich gelöscht" });
  } catch (error) {
    console.error("Fehler beim Löschen des Benutzers:", error);
    res.status(500).json({ error: "Fehler beim Löschen des Benutzers" });
  }
});

// Beispiel-Dashboard
router.get("/dashboard", (req, res) => {
  res.json({ message: `Willkommen im Dashboard, ${req.user.email}` });
});

export default router;
