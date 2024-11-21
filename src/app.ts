import express from "express";
import bodyParser from "body-parser";
import {blockAnalysisRouter} from "./routes/blockAnalysis.js";


const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use("/api/block", blockAnalysisRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
