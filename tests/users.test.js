/**
 * tests/users.test.js
 *
 * Covers: GET /users/me, GET /users/:userId, GET /users/organisations,
 *         GET /users/notification-preferences, GET /profile, GET /profile/:user_id
 *
 * Actual API shape (confirmed):
 *   GET /users/me  → { status, status_code, message, data: { user: { id, email, ... } } }
 *
 * Positive  : 7
 * Negative  : 8
 * Edge case : 3
 * Total     : 18
 */

"use strict";
require("dotenv").config();

const axios = require("axios");
const { getPrimaryToken } = require("../utils/auth");
const { authedClient, anonClient, BASE_URL } = require("../utils/helpers");

let token;
let currentUserId;

beforeAll(async () => {
  token = await getPrimaryToken();
  // /users/me returns data.data.user.id
  const res = await authedClient(token).get("/users/me");
  currentUserId = res.data?.data?.user?.id || res.data?.data?.id;
  if (!currentUserId) {
    throw new Error(
      `Could not get user ID. Response: ${JSON.stringify(res.data).slice(0, 200)}`
    );
  }
});

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── GET /users/me — positive ─────────────────────────────────────────────────

describe("GET /users/me — positive", () => {
  test("✅ returns 200 with success status", async () => {
    const res = await authedClient(token).get("/users/me");

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("status_code", 200);
    expect(res.data).toHaveProperty("message");
    expect(res.data).toHaveProperty("data");
  });

  test("✅ response data contains a user object with id and email", async () => {
    const res = await authedClient(token).get("/users/me");

    // API returns data.data.user
    const user = res.data.data.user || res.data.data;
    expect(user).toHaveProperty("id");
    expect(typeof user.id).toBe("string");
    expect(user.id.length).toBeGreaterThan(0);
    expect(user).toHaveProperty("email");
    expect(user.email).toContain("@");
  });

  test("✅ user email matches the authenticated account", async () => {
    const res = await authedClient(token).get("/users/me");

    const user = res.data.data.user || res.data.data;
    expect(user.email).toBe(process.env.TEST_EMAIL);
  });
});

// ─── GET /users/me — negative ─────────────────────────────────────────────────

describe("GET /users/me — negative", () => {
  test("❌ returns 401 when no Authorization header is sent", async () => {
    await expectStatus(anonClient().get("/users/me"), 401);
  });

  test("❌ returns 401 when a malformed JWT token is provided", async () => {
    await expectStatus(
      axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: "Bearer not.a.real.token" },
      }),
      401
    );
  });

  test("❌ returns 401 when Authorization uses wrong scheme (Basic)", async () => {
    await expectStatus(
      axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: "Basic dXNlcjpwYXNz" },
      }),
      401
    );
  });
});

// ─── GET /users/:userId — positive ───────────────────────────────────────────

describe("GET /users/:userId — positive", () => {
  test("✅ returns a specific user by their valid UUID", async () => {
    const res = await authedClient(token).get(`/users/${currentUserId}`);

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    // The user id may be in data.data or data.data.user
    const user = res.data.data?.user || res.data.data;
    expect(user).toHaveProperty("id");
  });
});

// ─── GET /users/:userId — negative ───────────────────────────────────────────

describe("GET /users/:userId — negative", () => {
  test("❌ returns 4xx for a nil UUID (non-existent user)", async () => {
    await expect4xx(
      authedClient(token).get("/users/00000000-0000-0000-0000-000000000000")
    );
  });

  test("❌ returns 401 when fetching user by ID without a token", async () => {
    await expectStatus(anonClient().get(`/users/${currentUserId}`), 401);
  });
});

// ─── GET /users/:userId — edge cases ─────────────────────────────────────────

describe("GET /users/:userId — edge cases", () => {
  test("🔲 returns 4xx when userId is a plain string (not a UUID)", async () => {
    await expect4xx(authedClient(token).get("/users/not-a-valid-uuid"));
  });

  test("🔲 returns 4xx when userId is a numeric string", async () => {
    await expect4xx(authedClient(token).get("/users/12345"));
  });
});

// ─── GET /users/organisations — positive ─────────────────────────────────────

describe("GET /users/organisations — positive", () => {
  test("✅ returns 200 with organisations data for authenticated user", async () => {
    const res = await authedClient(token).get("/users/organisations");

    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });
});

// ─── GET /users/organisations — negative ─────────────────────────────────────

describe("GET /users/organisations — negative", () => {
  test("❌ returns 401 when fetching organisations without a token", async () => {
    await expectStatus(anonClient().get("/users/organisations"), 401);
  });
});

// ─── GET /users/notification-preferences — positive ──────────────────────────

describe("GET /users/notification-preferences — positive", () => {
  test("✅ returns 200 with notification preferences", async () => {
    const res = await authedClient(token).get(
      "/users/notification-preferences"
    );

    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });
});

// ─── GET /users/notification-preferences — negative ──────────────────────────

describe("GET /users/notification-preferences — negative", () => {
  test("❌ returns 401 when fetching notification preferences without a token", async () => {
    await expectStatus(
      anonClient().get("/users/notification-preferences"),
      401
    );
  });
});

// ─── GET /profile — positive ──────────────────────────────────────────────────

describe("GET /profile — positive", () => {
  test("✅ returns full profile for authenticated user", async () => {
    const res = await authedClient(token).get("/profile");

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("message");
    expect(res.data).toHaveProperty("data");
  });
});

// ─── GET /profile — negative ──────────────────────────────────────────────────

describe("GET /profile — negative", () => {
  test("❌ returns 401 when fetching profile without a token", async () => {
    await expectStatus(anonClient().get("/profile"), 401);
  });
});

// ─── GET /profile/:user_id — edge cases ──────────────────────────────────────

describe("GET /profile/:user_id — edge cases", () => {
  test("🔲 returns 4xx for a non-existent user_id on profile endpoint", async () => {
    await expect4xx(
      authedClient(token).get(
        "/profile/00000000-0000-0000-0000-000000000000"
      )
    );
  });
});
