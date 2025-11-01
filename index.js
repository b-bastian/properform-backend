import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requireAuth } from "./auth.js";
import publicUserRoutes from "./routes/UserRoutes/publicUserRoutes.js";
import protectedUserRoutes from "./routes/UserRoutes/protectedUserRoutes.js";
import protectedSystemRoutes from "./routes/SystemRoutes/ProtectedSystemRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- CORS Setup ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://dashboard.properform.app",
  "https://properform.app",
  "https://www.properform.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// --- Öffentliche Routen ---
app.use("/users", publicUserRoutes);

// --- Auth Middleware ---
app.use(requireAuth);

// --- Geschützte Routen ---
app.use("/users", protectedUserRoutes);
app.use("/system", protectedSystemRoutes);

// --- Test ---
app.get("/", (req, res) => {
  res.json({ status: "✅ Jo geht", timestamp: new Date().toISOString() });
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => console.log(`🚀 API läuft auf Port ${PORT}`));

