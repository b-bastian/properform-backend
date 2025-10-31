import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requireAuth } from "./auth.js";
import publicUserRoutes from "./routes/UserRoutes/publicUserRoutes.js";
import protectedUserRoutes from "./routes/UserRoutes/protectedUserRoutes.js";
import protectedSystemRoutes from "./routes/SystemRoutes/ProtectedSystemRoutes.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "https://localhost:5173",
      "https://dashboard.properform.app",
      "https://www.properform.app",
      "https://properform.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options(/.*/, cors()); // Preflight-Anfragen unterstützen

app.use(express.json());

// Öffentliche Routen (keine Auth nötig)
app.use("/users", publicUserRoutes);

// Auth-Middleware aktiviert → alles darunter geschützt
app.use(requireAuth);

// Geschützte Routen (nur mit Token zugänglich)
app.use("/users", protectedUserRoutes);

app.use("/system", protectedSystemRoutes);

// Test-Route
app.get("/", (req, res) => {
  res.json({ status: "✅ Jo geht", timestamp: new Date().toISOString() });
});

// Fallback für ungültige Routen
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => console.log(`🚀 API läuft auf Port ${PORT}`));
