const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ─────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ── Reservation Schema ─────────────────────────────
const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: String, required: true },
  occasion: { type: String, default: "" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Reservation = mongoose.model("Reservation", reservationSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Home ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Create reservation ─────────────────────────────
app.post("/reserve", async (req, res) => {
  const { name, phone, date, time, guests, occasion, notes } = req.body;

  if (!name || !phone || !date || !time || !guests) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields.",
    });
  }

  try {
    const reservation = await Reservation.create({
      name,
      phone,
      date,
      time,
      guests,
      occasion,
      notes,
    });
    console.log("✅ New reservation saved:", reservation);
    res.json({
      success: true,
      message: `Thank you, ${name}! Your table for ${guests} on ${date} at ${time} is reserved.`,
      data: reservation,
    });
  } catch (err) {
    console.error("❌ Save error:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

// ── View all reservations ──────────────────────────
app.get("/reservations", async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json({ success: true, total: reservations.length, reservations });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Could not fetch reservations.",
    });
  }
});

// ── Delete a reservation by ID ─────────────────────
app.delete("/reservations/:id", async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Reservation deleted." });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Could not delete reservation.",
    });
  }
});

// ── Serve reservations page ────────────────────────
app.get("/reservations.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reservations.html"));
});

// ── Catch-all ──────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽  Sishu Restaurant running → http://localhost:${PORT}`);
});
