import express from "express";
import { getDashboardStats, getAdminsList, debugData, getSalaryStats } from "../controllers/dashboard.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// الحصول على إحصائيات لوحة التحكم
router.get("/stats", verifyToken, getDashboardStats);

// الحصول على إحصائيات الرواتب
router.get("/salary-stats", verifyToken, getSalaryStats);

// الحصول على قائمة المديرين
router.get("/admins", verifyToken, getAdminsList);

// للتحقق من البيانات (مؤقت) - بدون authentication
router.get("/debug-public", debugData);

// للتحقق من البيانات (مؤقت) - مع authentication
router.get("/debug", verifyToken, debugData);

export default router; 