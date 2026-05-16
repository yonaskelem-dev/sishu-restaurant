const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;


//  MongoDB

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" }, // customer email (optional)
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: String, required: true },
  occasion: { type: String, default: "" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Reservation = mongoose.model("Reservation", reservationSchema);

// 
//  Nodemailer — Gmail transport
//
//  Add these to your .env file:
//    EMAIL_USER=sishurestaurant@gmail.com
//    EMAIL_PASS=xxxx xxxx xxxx xxxx   ← Gmail App Password
//    ADMIN_EMAIL=sishurestaurant@gmail.com
//
//  How to get a Gmail App Password:
//    Google Account → Security → 2-Step Verification
//    → App Passwords → create one for "Mail"
// 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Email helper 
async function sendReservationEmails(reservation) {
  const { name, phone, email, date, time, guests, occasion, notes } =
    reservation;

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const occasionText =
    occasion ?
      occasion.charAt(0).toUpperCase() + occasion.slice(1)
    : "Not specified";

  // ── Email to ADMIN 
  const adminMail = {
    from: `"Sishu Restaurant" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🍽 New Reservation — ${name} · ${formattedDate}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FAF6EE;border:1px solid #e0d4b8;">

        <!-- Header -->
        <div style="background:#2A1A0A;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;color:#E8B558;font-size:28px;letter-spacing:2px;">Sishu Restaurant</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:3px;text-transform:uppercase;">New Table Reservation</p>
        </div>

        <!-- Body -->
        <div style="padding:32px 36px;">
          <h2 style="margin:0 0 22px;color:#2A1A0A;font-size:18px;font-weight:600;">Reservation Details</h2>

          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr style="border-bottom:1px solid #e8dcc8;">
              <td style="padding:11px 0;color:#9A7A58;width:36%;font-size:13px;letter-spacing:0.5px;">Guest Name</td>
              <td style="padding:11px 0;color:#2A1A0A;font-weight:600;">${name}</td>
            </tr>
            <tr style="border-bottom:1px solid #e8dcc8;">
              <td style="padding:11px 0;color:#9A7A58;font-size:13px;">Phone</td>
              <td style="padding:11px 0;color:#2A1A0A;">${phone}</td>
            </tr>
            ${
              email ?
                `
            <tr style="border-bottom:1px solid #e8dcc8;">
              <td style="padding:11px 0;color:#9A7A58;font-size:13px;">Email</td>
              <td style="padding:11px 0;color:#2A1A0A;">${email}</td>
            </tr>`
              : ""
            }
            <tr style="border-bottom:1px solid #e8dcc8;">
              <td style="padding:11px 0;color:#9A7A58;font-size:13px;">Date</td>
              <td style="padding:11px 0;color:#2A1A0A;font-weight:600;">${formattedDate}</td>
            </tr>
            <tr style="border-bottom:1px solid #e8dcc8;">
              <td style="padding:11px 0;color:#9A7A58;font-size:13px;">Time</td>
              <td style="padding:11px 0;color:#2A1A0A;font-weight:600;">${time}</td>
            </tr>
            <tr style="border-bottom:1px solid #e8dcc8;">
              <td style="padding:11px 0;color:#9A7A58;font-size:13px;">Guests</td>
              <td style="padding:11px 0;color:#2A1A0A;">${guests}</td>
            </tr>
            <tr style="border-bottom:1px solid #e8dcc8;">
              <td style="padding:11px 0;color:#9A7A58;font-size:13px;">Occasion</td>
              <td style="padding:11px 0;color:#2A1A0A;">${occasionText}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;color:#9A7A58;font-size:13px;vertical-align:top;">Special Requests</td>
              <td style="padding:11px 0;color:#2A1A0A;">${notes || "None"}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="background:#2A1A0A;padding:16px 32px;text-align:center;">
          <p style="margin:0;color:rgba(255,255,255,0.35);font-size:12px;">
            Sishu Restaurant · Bole Road, Addis Ababa · +251 911 234 567
          </p>
        </div>

      </div>
    `,
  };

  // ── Email to CUSTOMER (only if they gave their email) ──
  let customerMail = null;
  if (email) {
    customerMail = {
      from: `"Sishu Restaurant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your reservation at Sishu is confirmed ✓`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FAF6EE;border:1px solid #e0d4b8;">

          <!-- Header -->
          <div style="background:#2A1A0A;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#E8B558;font-size:28px;letter-spacing:2px;">Sishu Restaurant</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Reservation Confirmed</p>
          </div>

          <!-- Body -->
          <div style="padding:36px;">
            <p style="font-size:18px;color:#2A1A0A;margin:0 0 6px;">
              Dear <strong>${name}</strong>,
            </p>
            <p style="font-size:15px;color:#5C3D20;line-height:1.8;margin:0 0 30px;font-weight:300;">
              Thank you for choosing Sishu. We are delighted to confirm your reservation and look forward
              to welcoming you. We will have your table ready and waiting.
            </p>

            <!-- Booking summary box -->
            <div style="background:#fff;border:1px solid #e0d4b8;padding:26px 28px;margin-bottom:30px;">
              <h3 style="margin:0 0 18px;color:#2A1A0A;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Your Booking Summary</h3>
              <table style="width:100%;border-collapse:collapse;font-size:15px;">
                <tr style="border-bottom:1px solid #ede4d0;">
                  <td style="padding:10px 0;color:#9A7A58;width:36%;font-size:13px;">Date</td>
                  <td style="padding:10px 0;color:#2A1A0A;font-weight:600;">${formattedDate}</td>
                </tr>
                <tr style="border-bottom:1px solid #ede4d0;">
                  <td style="padding:10px 0;color:#9A7A58;font-size:13px;">Time</td>
                  <td style="padding:10px 0;color:#2A1A0A;font-weight:600;">${time}</td>
                </tr>
                <tr style="border-bottom:1px solid #ede4d0;">
                  <td style="padding:10px 0;color:#9A7A58;font-size:13px;">Guests</td>
                  <td style="padding:10px 0;color:#2A1A0A;">${guests}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#9A7A58;font-size:13px;">Occasion</td>
                  <td style="padding:10px 0;color:#2A1A0A;">${occasionText}</td>
                </tr>
              </table>
            </div>

            <!-- Location & contact -->
            <p style="font-size:14px;color:#5C3D20;line-height:1.8;margin:0 0 6px;">
              📍 <strong>Bole Road, 2nd Floor, Near Edna Mall, Addis Ababa</strong>
            </p>
            <p style="font-size:14px;color:#5C3D20;line-height:1.8;margin:0 0 6px;">
              📞 To change or cancel: <strong>+251 911 234 567</strong>
            </p>
            <p style="font-size:14px;color:#5C3D20;line-height:1.8;margin:0;">
              ✉️ <strong>hello@sishurestaurant.com</strong>
            </p>
          </div>

          <!-- Gold band -->
          <div style="background:#C8922A;padding:18px 32px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:13px;font-style:italic;font-family:Georgia,serif;">
              "Where ancient Ethiopian flavors meet the warmth of modern hospitality"
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#2A1A0A;padding:14px 32px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">
              © 2025 Sishu Restaurant · hello@sishurestaurant.com
            </p>
          </div>

        </div>
      `,
    };
  }

  // Send both emails concurrently
  const tasks = [transporter.sendMail(adminMail)];
  if (customerMail) tasks.push(transporter.sendMail(customerMail));
  await Promise.all(tasks);
}


//  Middleware

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


//  Routes

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── POST /reserve — create reservation + send emails ──
app.post("/reserve", async (req, res) => {
  const { name, phone, email, date, time, guests, occasion, notes } = req.body;

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
      email,
      date,
      time,
      guests,
      occasion,
      notes,
    });

    console.log("✅ Reservation saved:", reservation._id);

    // Fire emails — don't block the HTTP response if email fails
    sendReservationEmails(reservation).catch((err) =>
      console.error("❌ Email send error:", err.message),
    );

    res.json({
      success: true,
      message:
        `Thank you, ${name}! Your table for ${guests} on ${date} at ${time} is reserved.` +
        (email ? " A confirmation email has been sent to you." : ""),
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

// ── GET /reservations — list all 
app.get("/reservations", async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json({ success: true, total: reservations.length, reservations });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Could not fetch reservations." });
  }
});

// ── DELETE /reservations/:id 
app.delete("/reservations/:id", async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Reservation deleted." });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Could not delete reservation." });
  }
});

app.get("/reservations.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reservations.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 
//  Start
// 
app.listen(PORT, () => {
  console.log(`🍽  Sishu Restaurant running → http://localhost:${PORT}`);
});
