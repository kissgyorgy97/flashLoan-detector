import request from "supertest";
import app from "../src/app";

describe("End-to-End Test: Flash Loan Detector", () => {
  it("should detect known attack patterns", async () => {
    const testCases = [
      { blockNumber: 14684307, description: "Saddle Finance" },
      { blockNumber: 13118320, description: "xToken" },
      { blockNumber: 13499798, description: "Cream Finance" },
      { blockNumber: 14602790, description: "Beanstalk" }
    ];

    for (const testCase of testCases) {
      const { blockNumber, description } = testCase;

      const response = await request(app)
        .post("/api/block/analyze")
        .send({ blockNumber });

      expect(response.status).toBe(200);
      expect(response.body.blockNumber).toBe(blockNumber);
      expect(response.body.suspiciousTransactions.length).toBeGreaterThan(0);
      expect(response.body.detectedSuspiciousActivity).toBe(true);
      console.log(`Test passed for ${description}`);
    }
  });
  it("should return false for clean blocks", async () => {
    const blockNumber = 16817997
    const response = await request(app)
      .post("/api/block/analyze")
      .send({blockNumber});

      expect(response.status).toBe(200);
      expect(response.body.blockNumber).toBe(blockNumber);
      expect(response.body.detectedSuspiciousActivity).toBe(false);

      console.log(`Test passed for clean block ${blockNumber}`);
  });
  it("should return a 400 error for invalid input", async () => {
    const response = await request(app)
      .post("/api/block/analyze")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});