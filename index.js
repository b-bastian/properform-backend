import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import publicUserRoutes from "./routes/UserRoutes/publicUserRoutes.js";
import protectedUserRoutes from "./routes/UserRoutes/protectedUserRoutes.js";
import protectedSystemRoutes from "./routes/SystemRoutes/ProtectedSystemRoutes.js";
import publicTrainerRoutes from "./routes/TrainerRoutes/publicTrainerRoutes.js";
import privateTrainerRoutes from "./routes/TrainerRoutes/privateTrainerRoutes.js";
import { requireAuth } from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------
// 🔧 GLOBAL CORS CONFIG
// --------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://dashboard.properform.app",
  "https://properform.app",
  "https://www.properform.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// Express automatically handles OPTIONS via cors()
app.use(express.json());

// --------------------
// 🔓 PUBLIC ROUTES
// --------------------
app.use("/users", publicUserRoutes);
app.use("/trainers", publicTrainerRoutes);

// --------------------
// 🔐 PROTECTED ROUTES
// --------------------
app.use(requireAuth);
app.use("/users", protectedUserRoutes);
app.use("/system", protectedSystemRoutes);
app.use("/trainers", privateTrainerRoutes);

// --------------------
// 🧪 TEST ROUTE
// --------------------
app.get("/", (req, res) => {
  res.json({ status: "✅ API online", timestamp: new Date().toISOString() });
});

// --------------------
// ❌ 404 HANDLER
// --------------------
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --------------------
// 🚀 START SERVER
// --------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API läuft auf Port ${PORT}`);
});
