import { Router } from "express";



const router = Router()


router.post("/create/:adminId",createRevenue)
router.get("/get",getRevenues)
router.get("/get/:id",getRevenue)
router.get("/get/admin/:adminId",getAdminRevenues)
router.put("/update/:id",updateRevenue)
router.delete("/delete/:id",deleteRevenue)

export default router