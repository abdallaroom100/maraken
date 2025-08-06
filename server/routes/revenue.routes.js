import express from "express";
import {
    createRevenue,
    getRevenues,
    getRevenue,
    getAdminRevenues,
    updateRevenue,
    deleteRevenue
} from "../controllers/revenue.controller.js";

const router = express.Router();

// Create revenue
router.post("/:adminId", createRevenue);

// Get all revenues
router.get("/:adminId", getRevenues);

// Get single revenue
router.get("/find/:id", getRevenue);

// Get admin revenues
router.get("/admin/:adminId", getAdminRevenues);

// Update revenue
router.put("/:id", updateRevenue);

// Delete revenue
router.delete("/:id", deleteRevenue);

export default router; 