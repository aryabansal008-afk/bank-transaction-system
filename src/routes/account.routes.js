const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");

// To create a new account
// POST /api/accounts/
router.post("/",authMiddleware.authMiddleware, accountController.createAccountController)

// Get all accounts of logged in user
// GET /api/accounts/
router.get("/",authMiddleware.authMiddleware, accountController.getUserAccountsController)

// GET /api/accounts/balance/:accountId
router.get("/balance/:accountId",authMiddleware.authMiddleware, accountController.getAccountBalanceController)

module.exports = router