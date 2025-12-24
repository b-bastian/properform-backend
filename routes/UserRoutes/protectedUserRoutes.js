import express from "express";
import bcrypt from "bcrypt";
import { db } from "../../db.js";
import { requireAuth } from "../../auth.js";

const router = express.Router();
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

const ROLES = {
  OWNER: 1,
  USER: 2,
  TRAINER: 3,
};

// Handler Funktion
const handleUsersRequest = async (req, res) => {
  try {
    const role = req.params.role?.toLowerCase();

    const validRoles = ["owners", "users", "trainers"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error:
          "Ungültige Rollenangabe. Erlaubte Werte: 'owners', 'users', 'trainers'",
      });
    }

    let allUsers = [];

    // Owners abrufen (role_id = 1 aus users-Tabelle)
    if (!role || role === "owners") {
      const [owners] = await db.execute(
        "SELECT uid, firstname, birthdate, email, role_id FROM users WHERE role_id = ?",
        [ROLES.OWNER]
      );
      allUsers = allUsers.concat(
        owners.map((owner) => ({ ...owner, type: "owner" }))
      );
    }

    // Users abrufen (role_id = 2 aus users-Tabelle)
    if (!role || role === "users") {
      const [users] = await db.execute(
        "SELECT uid, firstname, birthdate, email, role_id FROM users WHERE role_id = ?",
        [ROLES.USER]
      );
      allUsers = allUsers.concat(
        users.map((user) => ({ ...user, type: "user" }))
      );
    }

    // Trainers abrufen (aus trainers-Tabelle) - WICHTIG: tid NICHT als uid aliassen!
    if (!role || role === "trainers") {
      const [trainers] = await db.execute(
        "SELECT tid, firstname, lastname, birthdate, email, phone_number FROM trainers"
      );
      allUsers = allUsers.concat(
        trainers.map((trainer) => ({
          tid: trainer.tid,
          firstname: trainer.firstname,
          lastname: trainer.lastname,
          birthdate: trainer.birthdate,
          email: trainer.email,
          phone_number: trainer.phone_number,
          type: "trainer",
          source: "trainers",
        }))
      );
    }

    res.json({
      count: allUsers.length,
      users: allUsers,
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Benutzer:", err);
    res.status(500).json({
      error: "Fehler beim Abrufen der Benutzer",
    });
  }
};

// Routes
router.get("/users", requireAuth, handleUsersRequest);
router.get("/users/:role", requireAuth, handleUsersRequest);

// Separate Route für Statistiken
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const [[userStats]] = await db.execute(
      `
      SELECT
        SUM(role_id = ?) AS owners,
        SUM(role_id = ?) AS users
      FROM users
    `,
      [ROLES.OWNER, ROLES.USER]
    );

    const [[trainerStats]] = await db.execute(
      "SELECT COUNT(*) AS trainers FROM trainers"
    );

    const total =
      (parseInt(userStats.owners) || 0) +
      (parseInt(userStats.users) || 0) +
      (parseInt(trainerStats.trainers) || 0);

    res.json({
      stats: {
        owners: parseInt(userStats.owners) || 0,
        users: parseInt(userStats.users) || 0,
        trainers: parseInt(trainerStats.trainers) || 0,
        total: total,
      },
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Statistiken:", err);
    res.status(500).json({
      error: "Fehler beim Abrufen der Statistiken",
    });
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
