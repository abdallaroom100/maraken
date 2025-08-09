import {Router} from "express"
import { createInvoice, getAllInvoices, deleteInvoice, getInvoiceById, updateInvoice } from "../controllers/invoice.controller.js"

const router = Router()

router.post("/create",createInvoice)
router.get("/list",getAllInvoices)
router.delete("/delete/:id",deleteInvoice)
router.get("/:id",getInvoiceById)
router.put("/update/:id",updateInvoice)

export default router