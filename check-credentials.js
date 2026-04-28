/**
 * check-credentials.js
 * Run: node check-credentials.js
 * Verifies that your .env credentials work before running the full test suite.
 */
"use strict";
require("dotenv").config();
const axios = require("axios");

const BASE_URL = process.env.BASE_URL;
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

console.log("Checking credentials...");
console.log("BASE_URL :", BASE_URL);
console.log("EMAIL    :", EMAIL);
console.log("PASSWORD :", PASSWORD ? "***set***" : "NOT SET");

axios
  .post(`${BASE_URL}/auth/login`, { email: EMAIL, password: PASSWORD })
  .then((r) => {
    console.log("\n✅ Login SUCCESS");
    console.log("   Status      :", r.status);
    console.log("   User ID     :", r.data.data.user.id);
    console.log("   Token prefix:", r.data.data.access_token.slice(0, 30) + "...");
    console.log("\nYou are ready to run: npm test");
  })
  .catch((e) => {
    console.log("\n❌ Login FAILED");
    console.log("   HTTP Status :", e.response?.status);
    console.log("   Message     :", e.response?.data?.message || e.message);
    console.log(
      "\nPlease update TEST_EMAIL and TEST_PASSWORD in your .env file with valid staging credentials."
    );
    process.exit(1);
  });
