/**
 * tests/organisations.test.js
 * Tests for /organisations endpoints:
 *   - POST /organisations (create)
 *   - GET /organisations/:orgId
 *   - PUT /organisations/:orgId (update)
 *   - DELETE /organisations/:orgId
 *   - GET /organisations/:orgId/users
 *   - GET /organisations/:orgId/roles
 *   - POST /organisations/:orgId/roles (create role)
 */

require("dotenv").config();
const { getPrimaryToken } = require("../utils/auth");
const { authedClient, anonClient, uniqueUsername } = require("../utils/helpers");

let token;
let createdOrgId;
let createdRoleId;

beforeAll(async () => {
  token = await getPrimaryToken();
});

// ─── CREATE ORGANISATION ──────────────────────────────────────────────────────

describe("POST /organisations", () => {
  test("creates a new organisation with valid data", async () => {
    const orgName = `TestOrg_${Date.now()}`;

    const res = await authedClient(token).post("/organisations", {
      name: orgName,
      description: "Automated test organisation",
      email: `org_${Date.now()}@mailinator.com`,
      type: "tech",
      location: "Lagos",
      country: "Nigeria",
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("data");
    expect(res.data.data).toHaveProperty("id");
    expect(typeof res.data.data.id).toBe("string");
    expect(res.data.data).toHaveProperty("name", orgName);

    createdOrgId = res.data.data.id;
  });

  test("returns 401 when creating an organisation without a token", async () => {
    try {
      await anonClient().post("/organisations", {
        name: `NoTokenOrg_${Date.now()}`,
        description: "Should fail",
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });

  test("returns error when organisation name is missing (edge case)", async () => {
    try {
      await authedClient(token).post("/organisations", {
        description: "Missing name field",
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });
});

// ─── GET ORGANISATION ─────────────────────────────────────────────────────────

describe("GET /organisations/:orgId", () => {
  test("retrieves an existing organisation by ID", async () => {
    if (!createdOrgId) return;

    const res = await authedClient(token).get(`/organisations/${createdOrgId}`);

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data.data).toHaveProperty("id", createdOrgId);
  });

  test("returns 404 for a non-existent organisation ID", async () => {
    try {
      await authedClient(token).get(
        "/organisations/00000000-0000-0000-0000-000000000000"
      );
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });

  test("returns 401 when fetching organisation without a token", async () => {
    if (!createdOrgId) return;
    try {
      await anonClient().get(`/organisations/${createdOrgId}`);
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── UPDATE ORGANISATION ──────────────────────────────────────────────────────

describe("PUT /organisations/:orgId", () => {
  test("updates an existing organisation successfully", async () => {
    if (!createdOrgId) return;

    const updatedName = `UpdatedOrg_${Date.now()}`;
    const res = await authedClient(token).put(
      `/organisations/${createdOrgId}`,
      {
        name: updatedName,
        description: "Updated description",
      }
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data.data).toHaveProperty("name", updatedName);
  });

  test("returns 401 when updating an organisation without a token", async () => {
    if (!createdOrgId) return;
    try {
      await anonClient().put(`/organisations/${createdOrgId}`, {
        name: "ShouldFail",
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── ORGANISATION USERS ───────────────────────────────────────────────────────

describe("GET /organisations/:orgId/users", () => {
  test("retrieves users in an organisation", async () => {
    if (!createdOrgId) return;

    const res = await authedClient(token).get(
      `/organisations/${createdOrgId}/users`
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("status", "success");
    expect(res.data).toHaveProperty("data");
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test("returns 401 when fetching org users without a token", async () => {
    if (!createdOrgId) return;
    try {
      await anonClient().get(`/organisations/${createdOrgId}/users`);
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

// ─── ORGANISATION ROLES ───────────────────────────────────────────────────────

describe("POST /organisations/:orgId/roles", () => {
  test("creates a new role in the organisation", async () => {
    if (!createdOrgId) return;

    const res = await authedClient(token).post(
      `/organisations/${createdOrgId}/roles`,
      {
        name: `Role_${Date.now()}`,
        description: "Automated test role",
      }
    );

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("status", "success");

    // Store for later cleanup / use
    createdRoleId = res.data?.data?.id;
  });

  test("returns 401 when creating a role without a token", async () => {
    if (!createdOrgId) return;
    try {
      await anonClient().post(`/organisations/${createdOrgId}/roles`, {
        name: "NoTokenRole",
        description: "Should fail",
      });
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});

describe("GET /organisations/:orgId/roles", () => {
  test("retrieves all roles in an organisation", async () => {
    if (!createdOrgId) return;

    const res = await authedClient(token).get(
      `/organisations/${createdOrgId}/roles`
    );

    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });
});

// ─── DELETE ORGANISATION ──────────────────────────────────────────────────────

describe("DELETE /organisations/:orgId", () => {
  test("deletes an organisation successfully", async () => {
    if (!createdOrgId) return;

    const res = await authedClient(token).delete(
      `/organisations/${createdOrgId}`
    );

    // API returns 204 No Content on success
    expect([200, 204]).toContain(res.status);
  });

  test("returns error when deleting a non-existent organisation (edge case)", async () => {
    try {
      await authedClient(token).delete(
        "/organisations/00000000-0000-0000-0000-000000000000"
      );
      throw new Error("Expected request to fail");
    } catch (err) {
      expect(err.response.status).toBeGreaterThanOrEqual(400);
      expect(err.response.status).toBeLessThan(500);
    }
  });
});
