import express, { Request, Response } from "express";
import { scanBlocksForMaliciousFlashLoans } from "../utils/analyzeTrasnsactions.js";

export const blockAnalysisRouter = express.Router();

/**
 * POST /api/block/analyze
 * Endpoint to analyze a specific block for suspicious transactions.
 */
blockAnalysisRouter.post("/analyze", async (req: Request, res: Response): Promise<Response | any> => {
  const { blockNumber } = req.body;

  if (!blockNumber || isNaN(Number(blockNumber))) {
    return res.status(400).json({ error: "Invalid block number provided" });
  }

  try {
    const suspiciousTransactions = await scanBlocksForMaliciousFlashLoans(Number(blockNumber));
    if(suspiciousTransactions.length >0){
      return res.status(200).json({ blockNumber,detectedSuspiciousActivity: true, suspiciousTransactions });
    }
    else{
      return res.status(200).json({ blockNumber, detectedSuspiciousActivity: false, suspiciousTransactions });
    }
  } catch (error) {
    console.error("Error analyzing block:", error);
    return res.status(500).json({ error: "An error occurred while analyzing the block" });
  }
});

