const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

require("dotenv").config();
const app = express();

app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const client = twilio(accountSid, authToken);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/send-verification", async (req, res) => {
  console.log("send verify hit: ", req.body);
  try {
    const { phoneNumber, channel = "sms" } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Start verification
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phoneNumber,
        channel: channel, // 'sms' or 'call' or 'whatsapp'
      });

    res.json({
      message: `Verification code sent to ${phoneNumber}`,
      status: verification.status,
    });
  } catch (error) {
    console.error("Error sending verification:", error);
    res.status(500).json({
      error: "Failed to send verification code",
      details: error.message,
    });
  }
});

// Verify the code
app.post("/verify-code", async (req, res) => {
  console.log("verify the code");
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        error: "Phone number and verification code are required",
      });
    }

    // Check verification code
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    if (verificationCheck.status === "approved") {
      res.json({
        message: "Verification successful",
        status: verificationCheck.status,
      });
    } else {
      res.status(400).json({
        error: "Invalid verification code",
        status: verificationCheck.status,
      });
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({
      error: "Failed to verify code",
      details: error.message,
    });
  }
});

module.exports = app;
