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
const { protect, admin } = require("../middleware/authMiddleware");

// @desc Fetch all users (Admin Only)
// @route GET /api/users
// @access Private/Admin
router.get("/", protect, admin, getUsers);

// @desc Get user by ID
// @route GET /api/users/:id
// @access Private
router.get("/:id", protect, getUserById);

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
router.put("/:id", protect, updateUser);

// @desc Delete user
// @route DELETE /api/users/:id
// @access Private/Admin
router.delete("/:id", protect, admin, deleteUser);

module.exports = router;
