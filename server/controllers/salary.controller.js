import { Worker, Salary, SalaryPayment, Expenses } from '../models/index.js';

// Create or update salary record for a worker
export const createOrUpdateSalary = async (req, res) => {
    try {
        const { 
            workerId, 
            year, 
            month, 
            basicSalary, 
            absenceDays, 
            incentives, 
            deductions, 
            withdrawals,
            notes 
        } = req.body;

        // Validate worker exists
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        // Calculate final salary
        const finalSalary = Number(basicSalary) + Number(incentives) - Number(deductions) - Number(withdrawals);

        // Check if salary record exists for this month
        let salary = await Salary.findOne({ workerId, year, month });

        if (salary) {
            // Update existing record
            salary.basicSalary = Number(basicSalary);
            salary.absenceDays = Number(absenceDays);
            salary.incentives = Number(incentives);
            salary.deductions = Number(deductions);
            salary.withdrawals = Number(withdrawals);
            salary.finalSalary = finalSalary;
            salary.notes = notes;
        } else {
            // Create new record
            salary = new Salary({
                workerId,
                year: Number(year),
                month: Number(month),
                basicSalary: Number(basicSalary),
                absenceDays: Number(absenceDays),
                incentives: Number(incentives),
                deductions: Number(deductions),
                withdrawals: Number(withdrawals),
                finalSalary,
                notes
            });
        }

        await salary.save();

        res.status(200).json({
            success: true,
            message: salary.isNew ? 'تم إنشاء راتب الموظف بنجاح' : 'تم تحديث راتب الموظف بنجاح',
            data: salary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في حفظ راتب الموظف',
            error: error.message
        });
    }
};

// Update salary record (for editing existing salary)
export const updateSalary = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            basicSalary, 
            absenceDays, 
            incentives, 
            deductions, 
            withdrawals,
            notes 
        } = req.body;

        const salary = await Salary.findById(id).populate('workerId');
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        // Calculate final salary
        const finalSalary = Number(basicSalary) + Number(incentives) - Number(deductions) - Number(withdrawals);

        // Update salary record
        salary.basicSalary = Number(basicSalary);
        salary.absenceDays = Number(absenceDays);
        salary.incentives = Number(incentives);
        salary.deductions = Number(deductions);
        salary.withdrawals = Number(withdrawals);
        salary.finalSalary = finalSalary;
        salary.notes = notes;

        await salary.save();

        res.status(200).json({
            success: true,
            message: 'تم تحديث راتب الموظف بنجاح',
            data: salary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث راتب الموظف',
            error: error.message
        });
    }
};

// Pay salary (mark as paid and create payment record)
export const paySalary = async (req, res) => {
    try {
        const { 
            salaryId, 
            paymentMethod = 'cash', 
            notes,
            adminId 
        } = req.body;

        const salary = await Salary.findById(salaryId).populate('workerId');
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        if (salary.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'تم دفع هذا الراتب مسبقاً'
            });
        }

        // Create payment record
        const payment = new SalaryPayment({
            salaryId,
            workerId: salary.workerId._id,
            workerName: salary.workerId.name,
            workerJob: salary.workerId.job,
            year: salary.year,
            month: salary.month,
            amount: salary.finalSalary,
            paymentMethod,
            adminId: adminId || null,
            notes
        });

        await payment.save();

        // Mark salary as paid
        salary.isPaid = true;
        salary.paymentDate = new Date();
        await salary.save();

        // Create expense record
        const expense = new Expenses({
            amount: salary.finalSalary,
            type: 'salary',
            adminId: adminId || null,
            description: `راتب ${salary.workerId.name} - ${salary.workerId.job} - ${salary.year}/${salary.month}`,
            salaryPaymentId: payment._id,
            workerId: salary.workerId._id,
            workerName: salary.workerId.name,
            workerJob: salary.workerId.job,
            year: salary.year,
            month: salary.month
        });

        await expense.save();

        res.status(200).json({
            success: true,
            message: 'تم دفع الراتب بنجاح',
            data: {
                payment,
                salary
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في دفع الراتب',
            error: error.message
        });
    }
};

// Cancel salary payment (unmark as paid and remove payment record)
export const cancelSalaryPayment = async (req, res) => {
    try {
        const { salaryId } = req.body;

        const salary = await Salary.findById(salaryId).populate('workerId');
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        if (!salary.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'هذا الراتب لم يتم دفعه مسبقاً'
            });
        }

        // Find and delete payment record
        const payment = await SalaryPayment.findOne({ salaryId });
        if (payment) {
            // Delete related expense record
            await Expenses.findOneAndDelete({ salaryPaymentId: payment._id });
            await payment.deleteOne();
        }

        // Unmark salary as paid
        salary.isPaid = false;
        salary.paymentDate = undefined;
        await salary.save();

        res.status(200).json({
            success: true,
            message: 'تم إلغاء دفع الراتب بنجاح',
            data: salary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في إلغاء دفع الراتب',
            error: error.message
        });
    }
};

// Get all salaries for a specific month
export const getSalariesByMonth = async (req, res) => {
    try {
        const { year, month, workerId } = req.query;
        
        let query = { year: Number(year), month: Number(month) };
        if (workerId) {
            query.workerId = workerId;
        }
        
        const salaries = await Salary.find(query)
            .populate('workerId', 'name job identityNumber')
            .sort({ 'workerId.name': 1 });

        res.status(200).json({
            success: true,
            data: salaries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الرواتب',
            error: error.message
        });
    }
};

// Get salary by ID
export const getSalaryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const salary = await Salary.findById(id)
            .populate('workerId', 'name job identityNumber');

        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            data: salary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات الراتب',
            error: error.message
        });
    }
};

// Get salary payments history
export const getSalaryPayments = async (req, res) => {
    try {
        const { year, month, workerId } = req.query;
        
        let query = {};
        if (year) query.year = Number(year);
        if (month) query.month = Number(month);
        if (workerId) query.workerId = workerId;

        const payments = await SalaryPayment.find(query)
            .populate('workerId', 'name job')
            .populate('adminId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب سجل المدفوعات',
            error: error.message
        });
    }
};

// Get salary statistics
export const getSalaryStats = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let query = {};
        if (year) query.year = Number(year);
        if (month) query.month = Number(month);

        const salaries = await Salary.find(query);
        
        const stats = {
            totalWorkers: salaries.length,
            totalBasicSalary: salaries.reduce((sum, s) => sum + s.basicSalary, 0),
            totalIncentives: salaries.reduce((sum, s) => sum + s.incentives, 0),
            totalDeductions: salaries.reduce((sum, s) => sum + s.deductions, 0),
            totalWithdrawals: salaries.reduce((sum, s) => sum + s.withdrawals, 0),
            totalFinalSalary: salaries.reduce((sum, s) => sum + s.finalSalary, 0),
            paidSalaries: salaries.filter(s => s.isPaid).length,
            unpaidSalaries: salaries.filter(s => !s.isPaid).length
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات الرواتب',
            error: error.message
        });
    }
}; 