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

// Update salary data only (without payment)
export const updateSalaryData = async (req, res) => {
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

        // Update salary data only
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
            message: 'تم تحديث بيانات الراتب بنجاح',
            data: {
                _id: salary._id,
                workerName: salary.workerId.name,
                year: salary.year,
                month: salary.month,
                basicSalary: salary.basicSalary,
                absenceDays: salary.absenceDays,
                incentives: salary.incentives,
                deductions: salary.deductions,
                withdrawals: salary.withdrawals,
                finalSalary: salary.finalSalary,
                isPaid: salary.isPaid,
                notes: salary.notes
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث بيانات الراتب',
            error: error.message
        });
    }
};

// Mark salary as paid (simple payment)
export const markSalaryAsPaid = async (req, res) => {
    try {
        const { salaryId, paymentMethod = 'cash', notes, adminId } = req.body;

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
                message: 'هذا الراتب مدفوع مسبقاً'
            });
        }

        // Mark as paid
        salary.isPaid = true;
        salary.paymentDate = new Date();
        await salary.save();

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
                _id: salary._id,
                workerName: salary.workerId.name,
                year: salary.year,
                month: salary.month,
                finalSalary: salary.finalSalary,
                isPaid: salary.isPaid,
                paymentDate: salary.paymentDate
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

// Mark salary as unpaid (cancel payment)
export const markSalaryAsUnpaid = async (req, res) => {
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
                message: 'هذا الراتب غير مدفوع مسبقاً'
            });
        }

        // Find and delete payment record
        const payment = await SalaryPayment.findOne({ salaryId });
        if (payment) {
            // Delete related expense record
            await Expenses.findOneAndDelete({ salaryPaymentId: payment._id });
            await payment.deleteOne();
        }

        // Mark as unpaid
        salary.isPaid = false;
        salary.paymentDate = undefined;
        await salary.save();

        res.status(200).json({
            success: true,
            message: 'تم إلغاء دفع الراتب بنجاح',
            data: {
                _id: salary._id,
                workerName: salary.workerId.name,
                year: salary.year,
                month: salary.month,
                finalSalary: salary.finalSalary,
                isPaid: salary.isPaid,
                paymentDate: salary.paymentDate
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في إلغاء دفع الراتب',
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

        console.log('Pay salary request:', { salaryId, paymentMethod, notes, adminId });

        const salary = await Salary.findById(salaryId).populate('workerId');
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        console.log('Found salary:', {
            id: salary._id,
            workerName: salary.workerId?.name,
            year: salary.year,
            month: salary.month,
            isPaid: salary.isPaid,
            finalSalary: salary.finalSalary
        });

        const wasAlreadyPaid = salary.isPaid;

        // إذا كان الراتب مدفوع مسبقاً، نحذف السجلات القديمة أولاً
        if (salary.isPaid) {
            console.log('Salary was already paid, deleting old records...');
            // حذف سجل الدفع القديم
            const oldPayment = await SalaryPayment.findOne({ salaryId });
            if (oldPayment) {
                console.log('Deleting old payment record:', oldPayment._id);
                // حذف سجل المصروفات المرتبط
                await Expenses.findOneAndDelete({ salaryPaymentId: oldPayment._id });
                await oldPayment.deleteOne();
            }
        }

        // إنشاء سجل دفع جديد
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

        console.log('Creating new payment record:', {
            salaryId: payment.salaryId,
            workerName: payment.workerName,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod
        });

        await payment.save();
        console.log('Payment record saved successfully');

        // تحديث حالة الراتب كمدفوع
        salary.isPaid = true;
        salary.paymentDate = new Date();
        await salary.save();
        console.log('Salary marked as paid');

        // إنشاء سجل مصروفات جديد
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

        console.log('Creating expense record:', {
            amount: expense.amount,
            type: expense.type,
            description: expense.description
        });

        await expense.save();
        console.log('Expense record saved successfully');

        const message = wasAlreadyPaid ? 'تم إعادة دفع الراتب بنجاح' : 'تم دفع الراتب بنجاح';

        res.status(200).json({
            success: true,
            message,
            data: {
                payment,
                salary: {
                    _id: salary._id,
                    workerName: salary.workerId.name,
                    year: salary.year,
                    month: salary.month,
                    finalSalary: salary.finalSalary,
                    isPaid: salary.isPaid,
                    paymentDate: salary.paymentDate
                }
            }
        });
    } catch (error) {
        console.error('Error in paySalary:', error);
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

// Reset salary payment status (helper function)
export const resetSalaryPaymentStatus = async (req, res) => {
    try {
        const { salaryId } = req.body;

        const salary = await Salary.findById(salaryId);
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        // حذف سجل الدفع إذا وجد
        const payment = await SalaryPayment.findOne({ salaryId });
        if (payment) {
            // حذف سجل المصروفات المرتبط
            await Expenses.findOneAndDelete({ salaryPaymentId: payment._id });
            await payment.deleteOne();
        }

        // إعادة تعيين حالة الراتب
        salary.isPaid = false;
        salary.paymentDate = undefined;
        await salary.save();

        res.status(200).json({
            success: true,
            message: 'تم إعادة تعيين حالة دفع الراتب بنجاح',
            data: salary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في إعادة تعيين حالة دفع الراتب',
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

// Check salary payment status
export const checkSalaryPaymentStatus = async (req, res) => {
    try {
        const { salaryId } = req.params;

        const salary = await Salary.findById(salaryId).populate('workerId');
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        // التحقق من وجود سجل دفع
        const payment = await SalaryPayment.findOne({ salaryId });
        const expense = payment ? await Expenses.findOne({ salaryPaymentId: payment._id }) : null;

        const status = {
            salary: {
                _id: salary._id,
                workerName: salary.workerId?.name,
                year: salary.year,
                month: salary.month,
                finalSalary: salary.finalSalary,
                isPaid: salary.isPaid,
                paymentDate: salary.paymentDate
            },
            payment: payment ? {
                _id: payment._id,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                createdAt: payment.createdAt
            } : null,
            expense: expense ? {
                _id: expense._id,
                amount: expense.amount,
                type: expense.type,
                description: expense.description
            } : null,
            isConsistent: (salary.isPaid && payment && expense) || (!salary.isPaid && !payment && !expense)
        };

        res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error in checkSalaryPaymentStatus:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في التحقق من حالة دفع الراتب',
            error: error.message
        });
    }
};

// Check and fix salary payment status
export const checkAndFixSalaryPaymentStatus = async (req, res) => {
    try {
        const { salaryId } = req.body;

        const salary = await Salary.findById(salaryId);
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        // التحقق من وجود سجل دفع
        const payment = await SalaryPayment.findOne({ salaryId });
        const expense = payment ? await Expenses.findOne({ salaryPaymentId: payment._id }) : null;

        // إصلاح الحالة إذا كانت غير متسقة
        let fixed = false;
        let message = 'حالة الدفع صحيحة';

        if (salary.isPaid && !payment) {
            // الراتب محدد كمدفوع لكن لا يوجد سجل دفع
            salary.isPaid = false;
            salary.paymentDate = undefined;
            await salary.save();
            fixed = true;
            message = 'تم إصلاح حالة الدفع - الراتب لم يعد محدد كمدفوع';
        } else if (!salary.isPaid && payment) {
            // الراتب غير محدد كمدفوع لكن يوجد سجل دفع
            salary.isPaid = true;
            salary.paymentDate = payment.createdAt;
            await salary.save();
            fixed = true;
            message = 'تم إصلاح حالة الدفع - الراتب محدد كمدفوع';
        } else if (salary.isPaid && payment && !expense) {
            // الراتب محدد كمدفوع ويوجد سجل دفع لكن لا يوجد سجل مصروفات
            const newExpense = new Expenses({
                amount: salary.finalSalary,
                type: 'salary',
                adminId: payment.adminId,
                description: `راتب ${payment.workerName} - ${payment.workerJob} - ${payment.year}/${payment.month}`,
                salaryPaymentId: payment._id,
                workerId: payment.workerId,
                workerName: payment.workerName,
                workerJob: payment.workerJob,
                year: payment.year,
                month: payment.month
            });
            await newExpense.save();
            fixed = true;
            message = 'تم إصلاح حالة الدفع - تم إنشاء سجل المصروفات المفقود';
        }

        res.status(200).json({
            success: true,
            message,
            data: {
                salary,
                payment,
                expense,
                fixed
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في التحقق من حالة دفع الراتب',
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