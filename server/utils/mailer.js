const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendDispatchEmail({ toEmail, callerName, emergencyType, location, vehicleType, etaMinutes }) {
  const typeEmoji = emergencyType === "Medical" ? "🚑" : emergencyType === "Fire" ? "🔥" : "🚓";

  const mailOptions = {
    from: `"SAVEMENOW Alerts 🚨" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `🚨 Emergency Help is On The Way — SAVEMENOW`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 2px solid #e74c3c; border-radius: 10px;">
        <h1 style="color: #e74c3c; text-align: center;">🚨 SAVEMENOW</h1>
        <h2 style="text-align: center;">Help is on the way, ${callerName}!</h2>
        <hr/>
        <p><strong>${typeEmoji} Emergency Type:</strong> ${emergencyType}</p>
        <p><strong>📍 Location:</strong> ${location}</p>
        <p><strong>🚘 Vehicle Dispatched:</strong> ${vehicleType}</p>
        <p><strong>⏱️ Estimated Arrival:</strong> ${etaMinutes} minutes</p>
        <hr/>
        <p style="color: #e74c3c; font-weight: bold;">Stay calm and stay safe. Help is coming!</p>
        <p style="color: gray; font-size: 12px;">This is an automated message from SAVEMENOW Emergency System.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Dispatch email sent to ${toEmail}`);
}

module.exports = { sendDispatchEmail };
