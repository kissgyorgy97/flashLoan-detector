# Flash Loan Attack Detector

This project is a TypeScript-based REST API for analyzing Ethereum blockchain transactions for potential flash loan attacks. It utilizes the Alchemy SDK for blockchain interactions and provides an endpoint to detect suspicious activity in a given block.

---

## Prerequisites

Before starting, ensure you have the following installed on your system:

- **Node.js**: [Download and install Node.js](https://nodejs.org/)
- **npm**: Comes with Node.js installation.
- **TypeScript**: Install globally using:
  ```bash
  npm install -g typescript

- **Alchemy**: You will need an Alchemy API key, as the application does use it as a provider to fetch data from Ethereum

# Installation

Follow these steps to set up the project:

1. **Clone the Repository**:
   ```bash
   npm install

2. **Install Dependencies**:
   ```bash
   git clone <repository_url>
   cd detector

3. **Set Up Environment Variables**:
    ```env
    ALCHEMY_API_KEY=your-alchemy-api-key
    PORT=3000

4. **Build the Project**:
   ```bash
   npm run build

5. **Start the Server**:
   ```bash
   npm run start

# Usage

The API provides an endpoint to analyze Ethereum blocks for potential flash loan attacks.

## Endpoint

- **URL**: `POST /api/block/analyze`
- **Description**: Analyzes a specified Ethereum block for suspicious transactions.

## Example Call

Using `curl`, you can analyze a block as follows:

```bash
curl --location 'http://localhost:3000/api/block/analyze' \
--header 'Content-Type: application/json' \
--data '{
    "blockNumber": 16817996
}'
```

## Example Response

When you analyze a block using the API, you will receive a response in JSON format. Below is an example of what the response may look like:

```json
{
    "blockNumber": 16817996,
    "detectedSuspiciousActivity": true,
    "suspiciousTransactions": [
        {
            "txHash": "0xc310a0affe2169d1f6feec1c63dbc7f7c62a887fa48795d327d4d2da2d6b111d",
            "initiatorAddress": "0x5f259d0b76665c337c6104145894f4d1d2758b8c",
            "possibleAttack": true,
            "suspectedFlashLoan": true
        }
    ]
}
```


# References for Checking Attacks

Below are examples of blocks and their detection results based on known flash loan attacks:

| **Attack Type**    | **Detection Status** | **Block Number** | **Transaction Hash**                                                              |
|--------------------|----------------------|------------------|-----------------------------------------------------------------------------------|
| Saddle Finance     | Detect OK           | 14684307         | `0x2b023d65485c4bb68d781960c2196588d03b871dc9eb1c054f596b7ca6f7da56`              |
| xToken             | Detect OK           | 13118320         | `0x924e6a6288587b497f73ddcf6ae3c184f15ab35dfcb85f3074b55266974029ef`              |
| Alpha Finance      | Detect FAIL         | N/A              | Attack pattern differs from others.                                              |
| Cream Finance      | Detect OK           | 13499798         | `0x0fe2542079644e107cbf13690eb9c2c65963ccb79089ff96bfaf8dced2331c92`              |
| Beanstalk          | Detect OK           | 14602790         | `0xcd314668aaa9bbfebaf1a0bd2b6553d01dd58899c508d4729fa7311dc5d33ad7`              |
| Euler (6 Blocks)   | Detect OK           | Various          |                                                                                   |
|                    |                     | 16817996         | `0xc310a0affe2169d1f6feec1c63dbc7f7c62a887fa48795d327d4d2da2d6b111d`              |
|                    |                     | 16818057         | `0x71a908be0bef6174bccc3d493becdfd28395d78898e355d451cb52f7bac38617`              |
|                    |                     | 16818062         | `0x62bd3d31a7b75c098ccf28bc4d4af8c4a191b4b9e451fab4232258079e8b18c4`              |
|                    |                     | 16818065         | `0x465a6780145f1efe3ab52f94c006065575712d2003d83d85481f3d110ed131d9`              |
|                    |                     | 16818085         | `0x3097830e9921e4063d334acb82f6a79374f76f0b1a8f857e89b89bc58df1f311`              |
|                    |                     | 16818024         | `0x47ac3527d02e6b9631c77fad1cdee7bfa77a8a7bfd4880dccbda5146ace4088f`              |

### Notes:
- **Saddle Finance**, **xToken**, **Cream Finance**, and **Beanstalk** attacks were successfully detected using this API.
- The **Alpha Finance** attack was not detected due to differing attack patterns.
- **Euler Finance** attacks across multiple blocks were successfully detected, showcasing the robustness of the detection logic.


# Detector Logic

The Flash Loan Attack Detector is designed to identify suspicious transactions in a given Ethereum block that may indicate flash loan exploits. The detection logic leverages patterns commonly associated with flash loan attacks, such as unusual gas usage, circular token transfers, and abnormal transaction behavior. Below is a detailed explanation of the logic.

---

## Steps in the Detection Process

### 1. **Fetch Transactions from the Block**
- The detector uses the Alchemy SDK to fetch all transaction receipts for the specified block.
- Each transaction receipt includes detailed information such as gas used, logs, and transaction metadata.

### 2. **Filter and Sort Transactions**
- **Gas Usage Filtering**: Transactions are sorted by their `gasUsed` field to identify anomalies.
- **Trim Extremes**: The detector removes the highest and lowest 5 transactions to exclude outliers that may skew the analysis.
- **Average Gas Calculation**: The average gas usage is calculated from the remaining transactions.

### 3. **Identify High Gas Transactions**
- Transactions with `gasUsed` greater than **10x the average gas usage** are flagged as potentially suspicious.
- These high gas transactions are further analyzed for patterns indicative of flash loan activity.

### 4. **Check Transaction Count for Involved Addresses**
- For each flagged transaction:
  - The detector retrieves the transaction count of the `from` address.
  - Addresses with fewer than 25 total transactions are flagged as suspicious, as these may indicate newly created or rarely used wallets associated with exploit behavior.

### 5. **Analyze Event Logs for ERC-20 Transfers**
- The detector inspects the logs of each flagged transaction:
  - It identifies **ERC-20 `Transfer` events** using the signature:
    ```
    0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
    ```
  - Transactions with at least **two ERC-20 `Transfer` events** are considered further.

### 6. **Detect Circular Token Transfers**
- The detector looks for circular token transfers within the same transaction:
  - Transfer A → B followed by Transfer B → A.
  - Transfers must involve the same token and exclude interactions with the `0x0000000000000000000000000000000000000000` address.

### 7. **Generate Suspicious Transaction List**
- Suspicious transactions are compiled into a structured response that includes:
  - **Transaction Hash**: The unique identifier for the transaction.
  - **Block Number**: The block containing the transaction.
  - **Involved Addresses**: The addresses and their respective roles in the suspicious activity.

---

## Possible Next step

1. **Decrease false positive results**:
   - Currently analyzing 2000 block or ~ 300.000 transactions results in 8-15 false positive threat detection.
   - This could be reduced by ~80% by taking into consideration token prices and applying a USD value threshold of the token involved in the suspicious transactions. Attacks usually aim for large profit and this would sort out low value but high interaction count transactions of swaps etc.

2. **Better attacker alanysis**:
   - The detector currently only checks for new or unused accounts as these usually present a threat ( especially with the value threshold implementation in place).
   - This should be extended with a more robust analysis on the initator account to check of unusal behaviour.

3. **Contract analysis**:
   - The detector checks for ERC20 transfers as these occur on FlashLoans.This could be extended to verify known FlashLoan platform address interactions and function signatures.
   - For an advanced analysis an interaction value comparison could be made to check if the volume of invovled transfers might manipulate current assets of a DeFi platfrom. 

---

## Summary

The Flash Loan Attack Detector combines gas usage analysis, transaction metadata, and ERC-20 event log inspection to identify suspicious activity in Ethereum blocks. By leveraging known patterns and addressing edge cases, the detector serves as a powerful tool for analyzing flash loan-related exploits.

# Tools and Technologies Used

This project relies on the following key tools to interact with the Ethereum blockchain efficiently:

---

## 1. **Alchemy SDK**
- **Purpose**: Fetches Ethereum blockchain data, including blocks, transactions, and logs.
- **Why It’s Used**: Provides a reliable and efficient way to access blockchain data necessary for detecting suspicious transaction patterns.
- **Website**: [Alchemy SDK](https://docs.alchemy.com/alchemy/)

---

## 2. **Ethers.js**
- **Purpose**: Parses blockchain data and performs utility functions like gas value conversions and log decoding.
- **Why It’s Used**: Ensures seamless handling of Ethereum transaction and contract data, enabling accurate analysis of events and patterns.
- **Website**: [Ethers.js](https://docs.ethers.io/)

---
