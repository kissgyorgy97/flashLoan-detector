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

      console.log(`Test passed for ${description}`);
    }
  });
});