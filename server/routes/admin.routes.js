import { Router } from "express";
import { loginAdmin, signupAdmin, getCurrentAdmin, listAdmins } from "../controllers/admin.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";

const router = Router()

// Public routes
router.post("/login", loginAdmin)
router.post("/signup", signupAdmin)

// Protected routes
router.get("/", verifyToken, requireRole(["manager"]), listAdmins)
router.get("/me", verifyToken, getCurrentAdmin)

export default router