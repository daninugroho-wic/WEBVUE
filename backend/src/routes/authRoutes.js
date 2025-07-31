const express = require("express");
const router = express.Router();
const AuthController = require("../controller/AuthController");

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.get("/users", AuthController.getAllUsers);
router.delete("/users/:id", AuthController.deleteUser);
router.put("/users/:id", AuthController.updateUser);
router.get("/login-history", AuthController.getLoginHistory); // Tambahkan ini

module.exports = router;