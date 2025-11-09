import express from "express";
import {
    getOperationsLog,
    getAdminsList,
    getCurrentMonthStats,
    getOperationTypes
} from "../controllers/operations.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// جميع routes محمية بـ verifyToken (للمدير فقط)
router.use(verifyToken);
router.use(requireRole(['manager']));

// جلب سجل العمليات مع الفلاتر
router.get("/log", getOperationsLog);

// جلب قائمة الأدمن
router.get("/admins", getAdminsList);

// جلب جميع أنواع العمليات المتاحة
router.get("/types", getOperationTypes);

// جلب إحصائيات الشهر الحالي
router.get("/current-month-stats", getCurrentMonthStats);

export default router;