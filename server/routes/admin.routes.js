import { Router } from "express";
import { loginAdmin, signupAdmin, getCurrentAdmin } from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router()

// Public routes
router.post("/login", loginAdmin)
router.post("/signup", signupAdmin)

// Protected routes
router.get("/me", verifyToken, getCurrentAdmin)

export default router