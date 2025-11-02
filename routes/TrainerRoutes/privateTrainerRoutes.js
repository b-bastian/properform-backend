import express from "express";
import mysql from "mysql2/promise";
import { db } from "../../db.js";
import { requireAuth } from "../../auth.js";
import { generateTrainerCode } from "../../functions/TrainerFunctions.js";

const router = express.Router();

router.post("/createTrainer", requireAuth, async (req, res) => {
  const {
    firstname,
    lastname,
    birthdate,
    email,
    phone_number,
    profile_image_url,
  } = req.body;

  if (
    !firstname ||
    !lastname ||
    !email ||
    !phone_number ||
    !birthdate ||
    !profile_image_url
  ) {
    return res.status(400).json({ error: "Pflichtfelder fehlen" });
  }

  try {
    const trainerCode = generateTrainerCode();

    const [result] = await db.execute(
      "INSERT INTO trainers (firstname, lastname, birthdate, email, phone_number, profile_image_url, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        firstname,
        lastname,
        birthdate,
        email,
        phone_number,
        profile_image_url,
        trainerCode,
      ]
    );
    res.status(201).json({
      message: `Trainer ${firstname} ${lastname} erstellt.`,
      trainerId: result.insertId,
      invite_code: trainerCode,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ein Trainer mit dieser E-Mail existiert bereits." });
    }

    res.status(500).json({ error: error.message });
  }
});

router.post("/verify-code", requireAuth, async (req, res) => {
  const { invite_code } = req.body;

  if (!invite_code || invite_code.trim() === "") {
    return res.status(400).json({ error: "Einladungscode fehlt." });
  }

  try {
    const [rows] = await db.execute(
      "SELECT tid, firstname, lastname, email, invite_code FROM trainers WHERE invite_code = ?",
      [invite_code.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ungültiger Einladungscode." });
    }

    res.status(200).json({
      valid: true,
      trainer: rows[0],
    });
  } catch (error) {
    console.error("Fehler bei /verify-code:", error);
    res.status(500).json({ error: "Interner Serverfehler." });
  }
});

export default router;
