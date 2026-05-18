require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

const requiredEnv = [
  "MONGO_URI",
  "EMAIL_USER",
  "EMAIL_PASS",
  "ADMIN_EMAIL",
  "ADMIN_KEY",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

const reservationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  phone: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: "",
  },

  date: {
    type: String,
    required: true,
  },

  time: {
    type: String,
    required: true,
  },

  guests: {
    type: String,
    required: true,
  },

  occasion: {
    type: String,
    default: "",
    trim: true,
  },

  notes: {
    type: String,
    default: "",
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reservation = mongoose.model("Reservation", reservationSchema);

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("Email transporter error:", err.message);
  } else {
    console.log("Email service ready");
  }
});

async function sendReservationEmails(reservation) {
  try {
    const { name, phone, email, date, time, guests, occasion, notes } =
      reservation;

    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const adminMail = {
      from: `"Sishu Restaurant" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,

      subject: `New Reservation - ${name}`,

      text: `
New Reservation

Name: ${name}
Phone: ${phone}
Email: ${email || "N/A"}

Date: ${formattedDate}
Time: ${time}
Guests: ${guests}

Occasion: ${occasion || "Not specified"}

Notes:
${notes || "None"}
      `,
    };

    const tasks = [transporter.sendMail(adminMail)];

    if (email) {
      const customerMail = {
        from: `"Sishu Restaurant" <${process.env.EMAIL_USER}>`,
        to: email,

        subject: "Your Reservation is Confirmed",

        text: `
Hello ${name},

Thank you for reserving with Sishu Restaurant.

Reservation Details:
Date: ${formattedDate}
Time: ${time}
Guests: ${guests}

We look forward to serving you.

Sishu Restaurant
Addis Ababa, Ethiopia
        `,
      };

      tasks.push(transporter.sendMail(customerMail));
    }

    await Promise.all(tasks);

    console.log("Emails sent successfully");
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

function adminAuth(req, res, next) {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/reserve", async (req, res) => {
  try {
    const { name, phone, email, date, time, guests, occasion, notes } =
      req.body;

    if (!name || !phone || !date || !time || !guests) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const reservation = await Reservation.create({
      name,
      phone,
      email,
      date,
      time,
      guests,
      occasion,
      notes,
    });

    console.log("Reservation saved:", reservation._id);

    sendReservationEmails(reservation);

    return res.json({
      success: true,
      message:
        `Thank you ${name}! Your reservation for ${guests} guest(s) on ${date} at ${time} has been received.` +
        (email ? " Confirmation email sent." : ""),
    });
  } catch (err) {
    console.error("Reservation error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

app.get("/reservations", adminAuth, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      total: reservations.length,
      reservations,
    });
  } catch (err) {
    console.error("Fetch reservations error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch reservations.",
    });
  }
});

app.delete("/reservations/:id", adminAuth, async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Reservation deleted successfully.",
    });
  } catch (err) {
    console.error("Delete error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Could not delete reservation.",
    });
  }
});

app.get("/reservations.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reservations.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Sishu Restaurant server running on port ${PORT}`);
});
