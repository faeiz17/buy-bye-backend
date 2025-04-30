const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,

  updateUser,
  deleteUser,
  loginUser,
  registerUser,
} = require("../controllers/userController");
const { protectAdmin } = require("../middleware/authMiddleware");

// @desc Fetch all users (Admin Only)
// @route GET /api/users
// @access Private/Admin
router.get("/", protectAdmin, getUsers);

// @desc Get user by ID
// @route GET /api/users/:id
// @access Private
router.get("/:id", protectAdmin, getUserById);

// @desc Register a new user
// @route POST /api/users/register
// @access Public
router.post("/register", registerUser);

// @desc Login user
// @route POST /api/users/login
// @access Public
router.post("/login", loginUser);

// @desc Update user profile
// @route PUT /api/users/:id
// @access Private
router.put("/:id", protectAdmin, updateUser);

// @desc Delete user
// @route DELETE /api/users/:id
// @access Private/Admin
router.delete("/:id", protectAdmin, deleteUser);

module.exports = router;
