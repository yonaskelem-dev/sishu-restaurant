/* =============================================
   SISHU RESTAURANT — server.js
   For Render deployment
============================================= */

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Serve static files from /public ───────────────
app.use(express.static(path.join(__dirname, "public")));

// In-memory reservation storage
let reservations = [];

// ── Home ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Create reservation ─────────────────────────────
app.post("/reserve", (req, res) => {
  const { name, phone, date, time, guests, occasion, notes } = req.body;

  if (!name || !phone || !date || !time || !guests) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields.",
    });
  }

  const reservation = {
    id: Date.now(),
    name,
    phone,
    date,
    time,
    guests,
    occasion: occasion || "",
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };

  reservations.push(reservation);
  console.log("✅ New reservation:", reservation);

  res.json({
    success: true,
    message: `Thank you, ${name}! Your table for ${guests} on ${date} at ${time} is reserved. We will confirm by phone shortly.`,
    data: reservation,
  });
});

// ── View all reservations (admin) ──────────────────
app.get("/reservations", (req, res) => {
  res.json({ success: true, total: reservations.length, reservations });
});

// ── Clear all reservations (admin/debug) ───────────
app.delete("/reservations", (req, res) => {
  reservations = [];
  res.json({ success: true, message: "All reservations cleared." });
});

// ── Catch-all: return index.html for any unknown route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽  Sishu Restaurant running → http://localhost:${PORT}`);
});
