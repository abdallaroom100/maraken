


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
router.post('/salaries/pay', salaryController.paySalary);
router.post('/salaries/cancel-payment', salaryController.cancelSalaryPayment);
router.get('/salaries', salaryController.getSalariesByMonth);
router.get('/salaries/:id', salaryController.getSalaryById);
router.get('/salary-payments', salaryController.getSalaryPayments);
router.get('/salary-stats', salaryController.getSalaryStats);

export default router;