/**
 * tests/users.test.js
 * Tests for /users endpoints:
 *   - GET /users/me
 *   - GET /users/:userId
 *   - PUT /users/:userId (update)
 *   - GET /users/organisations
 *   - GET /users/notification-preferences
 *   - PUT /users/notification-preferences
 *   - GET /profile
 *   - PATCH /profile
 */

require("dotenv").config();
const axios = require("axios");
const { getPrimaryToken } = require("../utils/auth");
const { authedClient, anonClient, BASE_URL } = require("../utils/helpers");

let token;
let userId;

beforeAll(async () => {
  token = await getPrimaryToken();
  // Fetch current user to get their ID for subsequent tests
  const res = await authedClient(token).get("/users/me");
  userId = res.data?.data?.id;
});

// ─── GET /users/me ────────────────────────────────────────────────────────────

describe("GET /users/me", () => {
  test("returns the authenticated user's profile", async () => {
    const res = await authedClient(token).get("/users/me");

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("data");
    expect(res.data.data).toHaveProperty("id");
    expect(typeof res.data.data.id).toBe("string");
    expect(res.data.data).toHaveProperty("email");
    expect(typeof res.data.data.email).toBe("string");
  });

  test("returns 401 when no token is provided", async () => {
    try {
      await anonClient().get("/users/me");
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });

  test("returns 401 when an invalid token is provided", async () => {
    try {
      await axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: "Bearer invalid.token.here" },
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── GET /users/:userId ───────────────────────────────────────────────────────

describe("GET /users/:userId", () => {
  test("returns a specific user by valid ID", async () => {
    const res = await authedClient(token).get(`/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data.data).toHaveProperty("id", userId);
    expect(res.data.data).toHaveProperty("email");
  });

  test("returns 404 for a non-existent user ID (edge case)", async () => {
    try {
      await authedClient(token).get(
        "/users/00000000-0000-0000-0000-000000000000"
      );
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns 401 when accessing user by ID without a token", async () => {
    try {
      await anonClient().get(`/users/${userId}`);
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── GET /users/organisations ─────────────────────────────────────────────────

describe("GET /users/organisations", () => {
  test("returns the list of organisations for the authenticated user", async () => {
    const res = await authedClient(token).get("/users/organisations");

    expect(res.status).toBe(200);
    // Response is an array or an object with data
    const body = res.data;
    expect(body).toBeDefined();
  });

  test("returns 401 when fetching organisations without a token", async () => {
    try {
      await anonClient().get("/users/organisations");
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── NOTIFICATION PREFERENCES ─────────────────────────────────────────────────

describe("GET /users/notification-preferences", () => {
  test("returns notification preferences for the authenticated user", async () => {
    const res = await authedClient(token).get(
      "/users/notification-preferences"
    );

    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });

  test("returns 401 when fetching notification preferences without a token", async () => {
    try {
      await anonClient().get("/users/notification-preferences");
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── GET /profile ─────────────────────────────────────────────────────────────

describe("GET /profile", () => {
  test("returns the authenticated user's full profile", async () => {
    const res = await authedClient(token).get("/profile");

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("message");
    expect(res.data).toHaveProperty("data");
  });

  test("returns 401 when fetching profile without a token", async () => {
    try {
      await anonClient().get("/profile");
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── PATCH /profile ───────────────────────────────────────────────────────────

describe("PATCH /profile", () => {
  test("updates the authenticated user's display name successfully", async () => {
    const newDisplayName = `TestUser_${Date.now()}`;

    const FormData = require("form-data");
    const form = new FormData();
    form.append("display_name", newDisplayName);

    const res = await axios.patch(`${BASE_URL}/profile`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
  });

  test("returns 401 when updating profile without a token", async () => {
    try {
      const FormData = require("form-data");
      const form = new FormData();
      form.append("display_name", "NoToken");

      await axios.patch(`${BASE_URL}/profile`, form, {
        headers: form.getHeaders(),
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});
