const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middleware");

const transactionRoutes = Router();

// Create a new transaction
// POST /api/transactions