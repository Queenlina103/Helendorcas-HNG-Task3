/**
 * tests/auth.test.js
 *
 * Covers: POST /auth/register, POST /auth/login, POST /auth/logout,
 *         POST /auth/password-reset, POST /auth/password-reset/verify,
 *         POST /auth/magick-link, POST /auth/magick-link/verify
 *
 * Positive  : 8
 * Negative  : 13
 * Edge case : 6
 * Total     : 27
 */

"use strict";
require("dotenv").config();

const axios = require("axios");
const { getAuthToken } = require("../utils/auth");
const { uniqueEmail, uniqueUsername, anonClient } = require("../utils/helpers");

const BASE_URL = process.env.BASE_URL;

// ─── shared helpers ───────────────────────────────────────────────────────────

async function expect4xx(promise) {
  try {
    const res = await promise;
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    return res;
  } catch (err) {
    if (err.response) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
      return err.response;
    }
    throw err;
  }
}

async function expectStatus(promise, code) {
  try {
    const res = await promise;
    expect(res.status).toBe(code);
    return res;
  } catch (err) {
    if (err.response) {
      expect(err.response.status).toBe(code);
      return err.response;
    }
    throw err;
  }
}

// ─── REGISTER — positive ─────────────────────────────────────────────────────

describe("POST /auth/register — positive", () => {
  test("✅ registers a new user with required fields only", async () => {
    const res = await anonClient().post("/auth/register", {
      email: uniqueEmail(),
      password: "Test@12345!",
      username: uniqueUsername(),
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("status_code", 201);
    expect(typeof res.data.message).toBe("string");
    expect(res.data.message.length).toBeGreaterThan(0);
  });

  test("✅ registers a new user with optional first_name and last_name", async () => {
    const res = await anonClient().post("/auth/register", {
      email: uniqueEmail(),
      password: "Test@12345!",
      username: uniqueUsername(),
      first_name: "Helen",
      last_name: "Dorcas",
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("status", "success");
  });
});

// ─── REGISTER — negative ─────────────────────────────────────────────────────

describe("POST /auth/register — negative", () => {
  test("❌ returns 4xx when email is missing", async () => {
    await expect4xx(
      anonClient().post("/auth/register", {
        password: "Test@12345!",
        username: uniqueUsername(),
      })
    );
  });

  test("❌ returns 4xx when password is missing", async () => {
    await expect4xx(
      anonClient().post("/auth/register", {
        email: uniqueEmail(),
        username: uniqueUsername(),
      })
    );
  });

  test("❌ returns 4xx for malformed email format", async () => {
    await expect4xx(
      anonClient().post("/auth/register", {
        email: "notanemail",
        password: "Test@12345!",
        username: uniqueUsername(),
      })
    );
  });

  test("❌ returns 4xx for empty request body", async () => {
    await expect4xx(anonClient().post("/auth/register", {}));
  });
});

// ─── REGISTER — edge cases ───────────────────────────────────────────────────

describe("POST /auth/register — edge cases", () => {
  test("🔲 returns 4xx for email with no domain (edge case)", async () => {
    await expect4xx(
      anonClient().post("/auth/register", {
        email: "user@",
        password: "Test@12345!",
        username: uniqueUsername(),
      })
    );
  });

  test("🔲 returns 4xx for extremely long username (300 chars)", async () => {
    await expect4xx(
      anonClient().post("/auth/register", {
        email: uniqueEmail(),
        password: "Test@12345!",
        username: "a".repeat(300),
      })
    );
  });

  test("🔲 returns 4xx when email contains only whitespace", async () => {
    await expect4xx(
      anonClient().post("/auth/register", {
        email: "   ",
        password: "Test@12345!",
        username: uniqueUsername(),
      })
    );
  });
});

// ─── LOGIN — positive ─────────────────────────────────────────────────────────

describe("POST /auth/login — positive", () => {
  test("✅ logs in with valid credentials and returns access_token", async () => {
    const res = await anonClient().post("/auth/login", {
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("status_code", 200);

    const d = res.data.data;
    expect(d).toHaveProperty("access_token");
    expect(typeof d.access_token).toBe("string");
    expect(d.access_token.length).toBeGreaterThan(10);
    expect(d).toHaveProperty("user");
    expect(d.user).toHaveProperty("id");
    expect(typeof d.user.id).toBe("string");
    expect(d.user).toHaveProperty("email", process.env.TEST_EMAIL);
  });

  test("✅ login response contains access_token_expires_in field", async () => {
    const res = await anonClient().post("/auth/login", {
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty("access_token_expires_in");
  });

  test("✅ login response user object contains expected fields", async () => {
    const res = await anonClient().post("/auth/login", {
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD,
    });

    const user = res.data.data.user;
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("is_verified");
    expect(typeof user.is_verified).toBe("boolean");
  });
});

// ─── LOGIN — negative ─────────────────────────────────────────────────────────

describe("POST /auth/login — negative", () => {
  test("❌ returns 4xx with correct email but wrong password", async () => {
    await expect4xx(
      anonClient().post("/auth/login", {
        email: process.env.TEST_EMAIL,
        password: "WrongPassword_999!",
      })
    );
  });

  test("❌ returns 4xx with non-existent email", async () => {
    await expect4xx(
      anonClient().post("/auth/login", {
        email: uniqueEmail(),
        password: "Test@12345!",
      })
    );
  });

  test("❌ returns 4xx when email field is absent", async () => {
    await expect4xx(
      anonClient().post("/auth/login", { password: "Test@12345!" })
    );
  });

  test("❌ returns 4xx when password field is absent", async () => {
    await expect4xx(
      anonClient().post("/auth/login", { email: process.env.TEST_EMAIL })
    );
  });

  test("❌ returns 4xx when both fields are absent", async () => {
    await expect4xx(anonClient().post("/auth/login", {}));
  });
});

// ─── LOGIN — edge cases ───────────────────────────────────────────────────────

describe("POST /auth/login — edge cases", () => {
  test("🔲 returns 4xx when email is an empty string", async () => {
    await expect4xx(
      anonClient().post("/auth/login", { email: "", password: "Test@12345!" })
    );
  });

  test("🔲 returns 4xx when password is an empty string", async () => {
    await expect4xx(
      anonClient().post("/auth/login", {
        email: process.env.TEST_EMAIL,
        password: "",
      })
    );
  });
});

// ─── LOGOUT — positive ───────────────────────────────────────────────────────

describe("POST /auth/logout — positive", () => {
  test("✅ logs out successfully with a valid bearer token", async () => {
    const token = await getAuthToken(
      process.env.TEST_EMAIL,
      process.env.TEST_PASSWORD
    );

    const res = await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Platform": "web",
        },
      }
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
  });
});

// ─── LOGOUT — negative ───────────────────────────────────────────────────────

describe("POST /auth/logout — negative", () => {
  test("❌ returns 401 when no Authorization header is sent", async () => {
    await expectStatus(
      axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        { headers: { "X-Platform": "web" } }
      ),
      401
    );
  });

  test("❌ returns 401 when a malformed JWT token is sent", async () => {
    await expectStatus(
      axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: "Bearer this.is.not.a.real.jwt.token",
            "X-Platform": "web",
          },
        }
      ),
      401
    );
  });

  test("❌ returns 401 when Authorization header uses wrong scheme (Token)", async () => {
    await expectStatus(
      axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: "Token abc123",
            "X-Platform": "web",
          },
        }
      ),
      401
    );
  });
});

// ─── PASSWORD RESET — positive ───────────────────────────────────────────────

describe("POST /auth/password-reset — positive", () => {
  test("✅ sends password reset link for a registered email", async () => {
    const res = await anonClient().post("/auth/password-reset", {
      email: process.env.TEST_EMAIL,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(typeof res.data.message).toBe("string");
  });
});

// ─── PASSWORD RESET — negative ───────────────────────────────────────────────

describe("POST /auth/password-reset — negative", () => {
  test("❌ returns 4xx when email field is missing", async () => {
    await expect4xx(anonClient().post("/auth/password-reset", {}));
  });
});

// ─── PASSWORD RESET VERIFY — edge cases ──────────────────────────────────────

describe("POST /auth/password-reset/verify — edge cases", () => {
  test("🔲 returns 4xx for a completely invalid reset token", async () => {
    await expect4xx(
      anonClient().post("/auth/password-reset/verify", {
        token: "invalid-token-that-does-not-exist-xyz-000",
        new_password: "NewPass@12345!",
      })
    );
  });

  test("🔲 returns 4xx when token is missing from verify request", async () => {
    await expect4xx(
      anonClient().post("/auth/password-reset/verify", {
        new_password: "NewPass@12345!",
      })
    );
  });

  test("🔲 returns 4xx when new_password is missing from verify request", async () => {
    await expect4xx(
      anonClient().post("/auth/password-reset/verify", {
        token: "some-token",
      })
    );
  });
});

// ─── MAGIC LINK — positive ───────────────────────────────────────────────────

describe("POST /auth/magick-link — positive", () => {
  test("✅ sends magic link for a valid registered email", async () => {
    const res = await anonClient().post("/auth/magick-link", {
      email: process.env.TEST_EMAIL,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(typeof res.data.message).toBe("string");
  });
});

// ─── MAGIC LINK — negative ───────────────────────────────────────────────────

describe("POST /auth/magick-link — negative", () => {
  test("❌ returns 4xx when email is missing", async () => {
    await expect4xx(anonClient().post("/auth/magick-link", {}));
  });
});

// ─── MAGIC LINK VERIFY — edge cases ──────────────────────────────────────────

describe("POST /auth/magick-link/verify — edge cases", () => {
  test("🔲 returns 4xx for an invalid magic link token", async () => {
    await expect4xx(
      anonClient().post("/auth/magick-link/verify", {
        token: "totally-invalid-magic-token-000",
      })
    );
  });

  test("🔲 returns 4xx when token field is missing from verify", async () => {
    await expect4xx(anonClient().post("/auth/magick-link/verify", {}));
  });
});
