const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");

// To create a new account
// POST /api/accounts/
router.post("/",authMiddleware.authMiddleware, accountController.createAccountController)

module.exports = router