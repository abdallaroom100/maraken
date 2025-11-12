import express from "express";
import {
    createExpense,
    getExpenses,
    getExpense,
    getAdminExpenses,
    updateExpense,
    deleteExpense
} from "../controllers/expense.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// Create expense
router.post("/", createExpense);

// Get expenses with role-based filtering
router.get("/", getExpenses);

// Manager specific: Get expenses for a particular admin
router.get("/admin/:adminId", requireRole(["manager"]), getAdminExpenses);

// Get single expense
router.get("/:id", getExpense);

// Update expense
router.put("/:id", updateExpense);

// Delete expense
router.delete("/:id", deleteExpense);

export default router; 