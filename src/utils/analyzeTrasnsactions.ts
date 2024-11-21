import { Alchemy, Network, Utils } from 'alchemy-sdk';
import dotenv from 'dotenv';
import { ethers } from "ethers";
dotenv.config();
// Initialize Alchemy SDK
const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
});

// Function to convert gasUsed (string or BigNumber) to number
const gasUsedAsNumber = (gasUsed: string | null): number => {
  if (!gasUsed) {
    return 0; // Handle cases where gasUsed is null
  }
  return ethers.toNumber(gasUsed); // Convert string to BigNumber, then to number
};

// Function to create a wait time
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to analyze transactions
async function analyzeTransactions(blockNumber: number): Promise<any[]> {
  try {
    // Step 1: Fetch all transactions from the block
    const params = {
      blockNumber: blockNumber.toString()
    }
    const block = await alchemy.core.getTransactionReceipts(params);
    const transactions = block.receipts!;

    // Step 2: Sort transactions by gas used
    const sortedTransactions = transactions
      .filter((tx) => tx.gasUsed) // Ensure gasUsed is present
      .sort(
        (a, b) =>
          gasUsedAsNumber(a.gasUsed.toString()) - gasUsedAsNumber(b.gasUsed.toString())
      );

    // Step 3: Remove the lowest and highest 5 transactions
    const trimmedTransactions = sortedTransactions.slice(5, sortedTransactions.length - 5);

    // Step 4: Calculate the average gas usage
    const averageGasUsed =
      trimmedTransactions.reduce((acc, tx) => acc + gasUsedAsNumber(tx.gasUsed.toString()), 0) /
      trimmedTransactions.length;

    // Step 5: Filter transactions using more than 10x the average gas
    const highGasTransactions = transactions.filter(
      (tx) =>
        tx.gasUsed && gasUsedAsNumber(tx.gasUsed.toString()) > 10 * averageGasUsed
    );


    // Step 6: Check the transaction count of addresses with high gas usage
    const suspiciousAddresses = [];
    for (const tx of highGasTransactions) {
      const txCount = await alchemy.core.getTransactionCount(tx.from, tx.blockNumber);
      if (txCount < 25) {

        // Check for at least two ERC-20 Transfer events in the logs
        const transferEvents = tx.logs.filter((log) => {
          
          if (
            log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
            &&
            log.data !== "0x"
          ) {
            return (
              true
            );
          }
        });

        if (transferEvents.length >= 3) {
          const pairTransactions = []; // To store detected pairs
          // Look for pairs: A -> B and B -> A within the same transaction and transfering of the same token
          for (let i = 0; i < transferEvents.length; i++) {
            const fromA = `0x${transferEvents[i].topics[1].slice(26)}`; // Extract 'from' address
            const toB = `0x${transferEvents[i].topics[2].slice(26)}`; // Extract 'to' address
            for (let j = 0; j < transferEvents.length; j++) {
              if (
                i !== j &&
                `0x${transferEvents[j].topics[1].slice(26)}` === toB && // B -> A
                `0x${transferEvents[j].topics[2].slice(26)}` === fromA &&// A -> B
                fromA !== '0x0000000000000000000000000000000000000000' && // Exclude zero address
                toB !== '0x0000000000000000000000000000000000000000' &&
                transferEvents[j].address === transferEvents[i].address
              ) {
                pairTransactions.push({
                  fromA,
                  toB,
                  txHash: tx.transactionHash,
                  blockNumber: tx.blockNumber
                });
              }
            }
          }

          if (pairTransactions.length > 0) {
            suspiciousAddresses.push({
              txHash: tx.transactionHash,
              initiatorAddress: tx.from,
              possibleAttack: true,
              suspectedFlashLoan: true
            });
          }
        }
      }
    }
    if (suspiciousAddresses.length > 0) {
      for (let item of suspiciousAddresses) {
        console.log(`${item.txHash}`)
      }

    }
    // Return the suspicious addresses
    return suspiciousAddresses;
  } catch (error) {
    console.error("Error analyzing transactions:", error);
    return [];
  }
}

/**
 * Scans multiple blocks for malicious flash loan activity.
 * @param {number} startBlock - The starting block number.
 * @param {number} endBlock - The ending block number.
 */
export async function scanBlocksForMaliciousFlashLoans(blockNumber: number): Promise <any[]> {
  try {
      const threats = await analyzeTransactions(blockNumber);
      return threats // Execute the provided action for the block
  } catch (error) {
    console.error(`Error while iterating blocks: ${error}`);
    throw new Error("Analysis failed");
  }
}
