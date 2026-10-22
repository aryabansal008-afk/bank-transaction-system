const express = require("express");
const authController = require("../controllers/auth.controller")
const router = express.Router();

// /api/auth/register
router.post("/register", authController.userRegisterController)

// /api/auth/login
router.post("/login",authController.userLoginController)

module.exports = router

