import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requireAuth } from "./auth.js";
import publicRoutes from "./routes/publicRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Öffentliche Routen (keine Auth nötig)
app.use("/users", publicRoutes);

// Auth-Middleware aktiviert → alles darunter geschützt
app.use(requireAuth);

// Geschützte Routen (nur mit Token zugänglich)
app.use("/users", protectedRoutes);

// Test-Route
app.get("/", (req, res) => {
  res.json({ status: "✅ Jo geht", timestamp: new Date().toISOString() });
});

// Fallback für ungültige Routen
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => console.log(`🚀 API läuft auf Port ${PORT}`));
