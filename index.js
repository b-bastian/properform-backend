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

/* =========================
   🎨 COLORS (ANSI)
========================= */
const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

const BOX_COLOR = COLORS.cyan;
const TEXT_COLOR = COLORS.white;
const MUTED_COLOR = COLORS.gray;
const TITLE_COLOR = COLORS.green;

const BOX_WIDTH = 64;

/* entfernt ANSI-Farbcodes */
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/* entfernt Emojis + Sonderbreite */
function stripWide(str) {
  return stripAnsi(str).replace(/[^\x00-\x7F]/g, "");
}

function line(text = "") {
  const visible = stripWide(text);
  const padded = visible.padEnd(BOX_WIDTH - 2, " ");
  return (
    BOX_COLOR +
    "║" +
    TEXT_COLOR +
    " " +
    padded +
    " " +
    BOX_COLOR +
    "║" +
    COLORS.reset
  );
}

function box(lines = []) {
  console.log(BOX_COLOR + "╔" + "═".repeat(BOX_WIDTH) + "╗" + COLORS.reset);
  console.log(line());
  lines.forEach((l) => console.log(line(l)));
  console.log(line());
  console.log(BOX_COLOR + "╚" + "═".repeat(BOX_WIDTH) + "╝" + COLORS.reset);
}

/* =========================
   🚀 STARTUP LOG
========================= */
console.clear();

box([
  `${TITLE_COLOR}ProPerform API${TEXT_COLOR}`,
  "",
  `Version:      1.0.0`,
  `Environment:  ${process.env.NODE_ENV || "development"}`,
]);

console.log(`\n${MUTED_COLOR}⏳ Loading modules...${COLORS.reset}`);
console.log(`${COLORS.green}✔ Express loaded${COLORS.reset}`);
console.log(`${COLORS.green}✔ CORS configured${COLORS.reset}`);
console.log(`${COLORS.green}✔ Database configured${COLORS.reset}`);
console.log(`${COLORS.green}✔ Authentication middleware loaded${COLORS.reset}`);
console.log(`${COLORS.green}✔ Routes mounted${COLORS.reset}\n`);

/* =========================
   🌐 APP SETUP
========================= */
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
  res.json({
    status: "API online",
    timestamp: new Date().toISOString(),
  });
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
  console.log(`${COLORS.yellow}✨ Server started ✨${COLORS.reset}\n`);

  box([
    `${TITLE_COLOR}ProPerform API is ONLINE${TEXT_COLOR}`,
    "",
    `Local:   http://localhost:${PORT}`,
    `Network: http://0.0.0.0:${PORT}`,
    `Started: ${new Date().toLocaleString("de-AT")}`,
    "",
    "Ready to handle requests",
  ]);
});
