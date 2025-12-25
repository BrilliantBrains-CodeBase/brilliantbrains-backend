const request = require("supertest");
const app = require("../src/app");

describe("Health Check API", () => {
  it("should return server health status", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("timestamp");
  });
});
