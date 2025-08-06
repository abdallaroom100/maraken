


import { Router } from "express";
import * as workerController from '../controllers/worker.controller.js';
import * as salaryController from '../controllers/salary.controller.js';

const router = Router();

// Worker routes
router.post('/', workerController.createWorker); 
router.get('/', workerController.getAllWorkers);
router.get('/:id', workerController.getWorkerById);
router.put('/:id', workerController.updateWorker);
router.delete('/:id', workerController.deleteWorker);
router.get('/:id/salary-history', workerController.getWorkerSalaryHistory);

// Salary routes
router.post('/salaries', salaryController.createOrUpdateSalary);
router.put('/salaries/:id', salaryController.updateSalary);

// New separated salary routes
router.put('/salaries/:id/data', salaryController.updateSalaryData); // تحديث البيانات فقط
router.post('/salaries/mark-paid', salaryController.markSalaryAsPaid); // دفع الراتب
router.post('/salaries/mark-unpaid', salaryController.markSalaryAsUnpaid); // إلغاء الدفع

// Old salary routes (for backward compatibility)
router.post('/salaries/pay', salaryController.paySalary);
router.post('/salaries/cancel-payment', salaryController.cancelSalaryPayment);
router.post('/salaries/reset-payment', salaryController.resetSalaryPaymentStatus);
router.post('/salaries/check-payment', salaryController.checkAndFixSalaryPaymentStatus);
router.get('/salaries/:id/payment-status', salaryController.checkSalaryPaymentStatus);
router.get('/salaries', salaryController.getSalariesByMonth);
router.get('/salaries/:id', salaryController.getSalaryById);
router.get('/salary-payments', salaryController.getSalaryPayments);
router.get('/salary-stats', salaryController.getSalaryStats);

export default router;