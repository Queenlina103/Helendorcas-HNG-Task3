/**
 * utils/helpers.js
 * Shared helper utilities for generating dynamic test data
 * and building axios instances.
 */

require("dotenv").config();
const axios = require("axios");

const BASE_URL = process.env.BASE_URL;

/**
 * Generates a unique email address using a timestamp + random suffix.
 */
function uniqueEmail() {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `testuser_${ts}_${rand}@mailinator.com`;
}

/**
 * Generates a unique username.
 */
function uniqueUsername() {
  const rand = Math.random().toString(36).slice(2, 9);
  return `user_${rand}`;
}

/**
 * Returns an axios instance with the Authorization header pre-set.
 * @param {string} token
 */
function authedClient(token) {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Returns a plain (unauthenticated) axios instance.
 */
function anonClient() {
  return axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
  });
}

module.exports = { uniqueEmail, uniqueUsername, authedClient, anonClient, BASE_URL };
