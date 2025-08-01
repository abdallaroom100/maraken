import { Router } from "express";



const router = Router()


router.post("/create/:adminId",createExpense)
router.get("/get",getExpenses)
router.get("/get/:id",getExpense)
router.get("/get/admin/:adminId",getAdminExpenses)
router.put("/update/:id",updateExpense)
router.delete("/delete/:id",deleteExpense)

export default router