


import { Router } from "express";
import * as workerController from '../controllers/worker.controller.js';
import * as salaryController from '../controllers/salary.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Worker routes
router.post('/', workerController.createWorker); 
router.get('/', workerController.getAllWorkers);
router.get('/search', workerController.searchWorkers); // Search workers by name
router.get('/:id', workerController.getWorkerById);
router.put('/:id', workerController.updateWorker);
router.delete('/:id', workerController.deleteWorker);
router.get('/:id/salary-history', workerController.getWorkerSalaryHistory);

// Salary routes
router.post('/salaries', verifyToken, salaryController.createOrUpdateSalary);
router.put('/salaries/:id', verifyToken, salaryController.updateSalary);

// New separated salary routes
router.put('/salaries/:id/data', verifyToken, salaryController.updateSalaryData); // تحديث البيانات فقط
router.post('/salaries/mark-paid', verifyToken, salaryController.markSalaryAsPaid); // دفع الراتب
router.post('/salaries/mark-unpaid', verifyToken, salaryController.markSalaryAsUnpaid); // إلغاء الدفع
router.post('/salaries/advance', verifyToken, salaryController.addAdvance); // إضافة الصرفة (moderator only)
router.get('/salaries/advance-history', verifyToken, requireRole(['moderator', 'manager']), salaryController.getAdvanceHistory); // جلب سجل الصرفات (المشرف والمدير)
router.put('/salaries/advance/:id', verifyToken, salaryController.updateAdvance); // تحديث الصرفة (moderator only)
router.delete('/salaries/advance/:id', verifyToken, salaryController.deleteAdvance); // حذف الصرفة (moderator only)

// Old salary routes (for backward compatibility)
router.post('/salaries/pay', verifyToken, salaryController.paySalary);
router.post('/salaries/cancel-payment', verifyToken, salaryController.cancelSalaryPayment);
router.post('/salaries/reset-payment', verifyToken, salaryController.resetSalaryPaymentStatus);
router.post('/salaries/check-payment', verifyToken, salaryController.checkAndFixSalaryPaymentStatus);
router.get('/salaries/:id/payment-status', verifyToken, salaryController.checkSalaryPaymentStatus);
router.get('/salaries', verifyToken, salaryController.getSalariesByMonth);
router.get('/salaries/:id', verifyToken, salaryController.getSalaryById);
router.get('/salary-payments', verifyToken, salaryController.getSalaryPayments);
router.get('/salary-stats', verifyToken, salaryController.getSalaryStats);

export default router;