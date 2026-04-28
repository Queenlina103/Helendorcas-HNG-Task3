/**
 * tests/auth.test.js
 * Tests for /auth endpoints:
 *   - Register
 *   - Login (positive + negative)
 *   - Logout
 *   - Password reset request
 *   - Magic link request
 *   - Protected endpoint access (token validation)
 */

require("dotenv").config();
const axios = require("axios");
const { getAuthToken } = require("../utils/auth");
const { uniqueEmail, uniqueUsername, authedClient, anonClient } = require("../utils/helpers");

const BASE_URL = process.env.BASE_URL;

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe("POST /auth/register", () => {
  test("registers a new user successfully with valid data", async () => {
    const email = uniqueEmail();
    const username = uniqueUsername();

    const res = await anonClient().post("/auth/register", {
      email,
      password: "Test@1234!",
      username,
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("message");
    expect(typeof res.data.message).toBe("string");
    expect(res.data).toHaveProperty("status_code", 201);
  });

  test("returns 400 when email is missing", async () => {
    try {
      await anonClient().post("/auth/register", {
        password: "Test@1234!",
        username: uniqueUsername(),
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns 400 when password is missing", async () => {
    try {
      await anonClient().post("/auth/register", {
        email: uniqueEmail(),
        username: uniqueUsername(),
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns 400 when username is missing", async () => {
    try {
      await anonClient().post("/auth/register", {
        email: uniqueEmail(),
        password: "Test@1234!",
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns error when registering with a duplicate email", async () => {
    // Register once
    const email = uniqueEmail();
    const username = uniqueUsername();
    await anonClient().post("/auth/register", {
      email,
      password: "Test@1234!",
      username,
    });

    // Attempt to register again with the same email
    try {
      await anonClient().post("/auth/register", {
        email,
        password: "Test@1234!",
        username: uniqueUsername(),
      });
      throw new Error("Expected duplicate registration to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
    }
  });

  test("returns error when email format is invalid (edge case)", async () => {
    try {
      await anonClient().post("/auth/register", {
        email: "not-an-email",
        password: "Test@1234!",
        username: uniqueUsername(),
      });
      throw new Error("Expected invalid email to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  test("logs in successfully with valid credentials", async () => {
    const res = await anonClient().post("/auth/login", {
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("status_code", 200);
    expect(res.data.data).toHaveProperty("access_token");
    expect(typeof res.data.data.access_token).toBe("string");
    expect(res.data.data.access_token.length).toBeGreaterThan(0);
    expect(res.data.data).toHaveProperty("user");
    expect(res.data.data.user).toHaveProperty("id");
    expect(res.data.data.user).toHaveProperty("email");
  });

  test("returns 401 with wrong password", async () => {
    try {
      await anonClient().post("/auth/login", {
        email: process.env.TEST_EMAIL,
        password: "WrongPassword999!",
      });
      throw new Error("Expected login to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
      expect(err.response.data).toHaveProperty("message");
    }
  });

  test("returns error with non-existent email", async () => {
    try {
      await anonClient().post("/auth/login", {
        email: uniqueEmail(),
        password: "Test@1234!",
      });
      throw new Error("Expected login to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns 422 when email field is missing", async () => {
    try {
      await anonClient().post("/auth/login", {
        password: "Test@1234!",
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns 422 when password field is missing", async () => {
    try {
      await anonClient().post("/auth/login", {
        email: process.env.TEST_EMAIL,
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns error when request body is empty (edge case)", async () => {
    try {
      await anonClient().post("/auth/login", {});
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
  test("logs out successfully with a valid token", async () => {
    const token = await getAuthToken(
      process.env.TEST_EMAIL,
      process.env.TEST_PASSWORD
    );

    const res = await authedClient(token).post(
      "/auth/logout",
      {},
      { headers: { "X-Platform": "web" } }
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
  });

  test("returns 401 when logging out without a token", async () => {
    try {
      await anonClient().post(
        "/auth/logout",
        {},
        { headers: { "X-Platform": "web" } }
      );
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });

  test("returns 401 when using a malformed token", async () => {
    try {
      await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: "Bearer this.is.not.a.valid.jwt",
            "X-Platform": "web",
          },
        }
      );
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── PASSWORD RESET ───────────────────────────────────────────────────────────

describe("POST /auth/password-reset", () => {
  test("sends password reset link for a valid email", async () => {
    const res = await anonClient().post("/auth/password-reset", {
      email: process.env.TEST_EMAIL,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("message");
  });

  test("returns error when email is missing from password reset request", async () => {
    try {
      await anonClient().post("/auth/password-reset", {});
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns error for invalid token on password-reset verify (edge case)", async () => {
    try {
      await anonClient().post("/auth/password-reset/verify", {
        token: "completely-invalid-token-xyz",
        new_password: "NewPass@1234!",
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });
});

// ─── MAGIC LINK ───────────────────────────────────────────────────────────────

describe("POST /auth/magick-link", () => {
  test("sends magic link for a valid email", async () => {
    const res = await anonClient().post("/auth/magick-link", {
      email: process.env.TEST_EMAIL,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("message");
  });

  test("returns error when email is missing from magic link request", async () => {
    try {
      await anonClient().post("/auth/magick-link", {});
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns error for invalid magic link token on verify (edge case)", async () => {
    try {
      await anonClient().post("/auth/magick-link/verify", {
        token: "invalid-magic-token-000",
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });
});
