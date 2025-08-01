import express from "express";
import {
    createExpense,
    getExpenses,
    getExpense,
    getAdminExpenses,
    updateExpense,
    deleteExpense
} from "../controllers/expense.controller.js";

const router = express.Router();

// Create expense
router.post("/:adminId", createExpense);

// Get all expenses
router.get("/", getExpenses);

// Get single expense
router.get("/:id", getExpense);

// Get admin expenses
router.get("/admin/:adminId", getAdminExpenses);

// Update expense
router.put("/:id", updateExpense);

// Delete expense
router.delete("/:id", deleteExpense);

export default router; 