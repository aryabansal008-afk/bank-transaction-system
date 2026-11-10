const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();

// Create a new transaction
// POST /api/transactions
transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)

// Create initial funds transaction from system user
// POST /api/transactions/system/initial-funds
transactionRoutes.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes