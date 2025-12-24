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

router.post("/createUser", async (req, res) => {
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

router.post("/adminRegister", async (req, res) => {
  //const { firstname, birthdate, email, password_hash } = req.body;

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
