/**
 * utils/auth.js
 * Shared authentication utility.
 * All tests that need a token import getAuthToken() from here.
 * No tokens are ever hardcoded.
 */

require("dotenv").config();
const axios = require("axios");

const BASE_URL = process.env.BASE_URL;

/**
 * Logs in with the provided credentials and returns the access token.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} access_token
 */
async function getAuthToken(email, password) {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email,
    password,
  });
  const token = response.data?.data?.access_token;
  if (!token) {
    throw new Error("Login succeeded but no access_token was returned");
  }
  return token;
}

/**
 * Returns a token for the primary test user defined in .env
 */
async function getPrimaryToken() {
  return getAuthToken(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);
}

/**
 * Returns a token for the secondary test user defined in .env
 */
async function getSecondaryToken() {
  return getAuthToken(process.env.TEST_EMAIL_2, process.env.TEST_PASSWORD_2);
}

module.exports = { getAuthToken, getPrimaryToken, getSecondaryToken };
