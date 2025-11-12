import { Worker, Salary, SalaryPayment, Expenses, SalaryAdvance } from '../models/index.js';
import mongoose from 'mongoose';

const resolveAdminContext = (req, fallbackAdminId) => {
    const authenticatedAdmin = req.admin;
    const adminId = authenticatedAdmin?._id || fallbackAdminId;

    if (!adminId) {
        return null;
    }

    return {
        id: adminId,
        name: authenticatedAdmin?.name || undefined
    };
};

const recalcSalaryAdvanceTotals = async (salaryId) => {
    const salary = await Salary.findById(salaryId);
    if (!salary) {
        return null;
    }

    const entries = await SalaryAdvance.find({ salaryId }).sort({ createdAt: -1 });
    const totalAdvance = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

    salary.advance = totalAdvance;

    const baseSalary = Number(salary.basicSalary || 0);
    const incentives = Number(salary.incentives || 0);
    const deductions = Number(salary.deductions || 0);
    const withdrawals = Number(salary.withdrawals || 0);

    salary.finalSalary = baseSalary + incentives - deductions - withdrawals - totalAdvance;

    if (entries.length > 0) {
        const latestEntry = entries[0];
        salary.advanceCreatedBy = latestEntry.adminId;
        salary.advanceCreatedByName = latestEntry.adminName;
        salary.advanceUpdatedAt = latestEntry.updatedAt || latestEntry.createdAt;
    } else {
        salary.advanceCreatedBy = undefined;
        salary.advanceCreatedByName = undefined;
        salary.advanceUpdatedAt = undefined;
    }

    await salary.save();

    return {
        salary,
        totalAdvance,
        latestEntry: entries[0] || null,
    };
};

const ensureLegacyAdvanceEntries = async ({ workerId, year, month, admin }) => {
    const legacyQuery = {
        advance: { $gt: 0 },
    };

    if (workerId) {
        legacyQuery.workerId = workerId;
    }
    if (year) {
        legacyQuery.year = year;
    }
    if (month) {
        legacyQuery.month = month;
    }

    const salaries = await Salary.find(legacyQuery);

    for (const salary of salaries) {
        const hasEntries = await SalaryAdvance.exists({ salaryId: salary._id });
        if (hasEntries) {
            continue;
        }

        await salary.populate('workerId', 'name job');

        if (!salary.workerId) {
            continue;
        }

        const fallbackAdminId = salary.advanceCreatedBy || admin?._id || null;
        const fallbackAdminName = salary.advanceCreatedByName || admin?.name || 'غير محدد';

        await SalaryAdvance.create({
            salaryId: salary._id,
            workerId: salary.workerId._id,
            workerName: salary.workerId.name,
            workerJob: salary.workerId.job,
            amount: salary.advance,
            notes: salary.notes || '',
            year: salary.year,
            month: salary.month,
            adminId: fallbackAdminId,
            adminName: fallbackAdminName,
        });

        await recalcSalaryAdvanceTotals(salary._id);
    }
};

const parseInteger = (value, { min, max } = {}) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        return undefined;
    }

    if (min !== undefined && parsed < min) {
        return undefined;
    }

    if (max !== undefined && parsed > max) {
        return undefined;
    }

    return parsed;
};

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

        // Calculate final salary (advance is subtracted from basicSalary)
        const advance = Number(req.body.advance || 0);
        const finalSalary = Number(basicSalary) + Number(incentives) - Number(deductions) - Number(withdrawals) - advance;

        // Check if salary record exists for this month
        let salary = await Salary.findOne({ workerId, year, month });

        if (salary) {
            // Update existing record
            salary.basicSalary = Number(basicSalary);
            salary.absenceDays = Number(absenceDays);
            salary.incentives = Number(incentives);
            salary.deductions = Number(deductions);
            salary.withdrawals = Number(withdrawals);
            salary.advance = advance;
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
                advance: advance,
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

        // Calculate final salary (advance is subtracted from basicSalary)
        const advanceAmount = Number(req.body.advance !== undefined ? req.body.advance : salary.advance || 0);
        const finalSalary = Number(basicSalary) + Number(incentives) - Number(deductions) - Number(withdrawals) - advanceAmount;

        // Update salary record
        salary.basicSalary = Number(basicSalary);
        salary.absenceDays = Number(absenceDays);
        salary.incentives = Number(incentives);
        salary.deductions = Number(deductions);
        salary.withdrawals = Number(withdrawals);
        salary.advance = advanceAmount;
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

        // Calculate final salary (advance is subtracted from basicSalary)
        const advance = Number(req.body.advance || 0);
        const finalSalary = Number(basicSalary) + Number(incentives) - Number(deductions) - Number(withdrawals) - advance;

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
                advance: salary.advance,
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

// Add or update advance payment (moderator only, current month only)
export const addAdvance = async (req, res) => {
    try {
        const { workerId, advance, notes } = req.body;
        const adminRole = req.admin?.role;

        // Check if admin is moderator (not manager)
        if (adminRole !== 'moderator') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بإضافة الصرفة. هذه الميزة متاحة للأدمن العادي فقط'
            });
        }

        // Validate worker exists
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        // Get current month and year
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // Validate advance amount
        const advanceAmount = Number(advance);
        if (Number.isNaN(advanceAmount) || advanceAmount < 0) {
            return res.status(400).json({
                success: false,
                message: 'قيمة الصرفة يجب أن تكون أكبر من أو تساوي صفر'
            });
        }

        // Check if advance exceeds basic salary
        if (advanceAmount > worker.basicSalary) {
            return res.status(400).json({
                success: false,
                message: `الصرفة (${advanceAmount}) لا يمكن أن تكون أكبر من الراتب الأساسي (${worker.basicSalary})`
            });
        }

        // Find or create salary record for current month
        let salary = await Salary.findOne({ workerId, year: currentYear, month: currentMonth });

        if (!salary) {
            // Create new salary record for current month
            salary = new Salary({
                workerId,
                year: currentYear,
                month: currentMonth,
                basicSalary: worker.basicSalary,
                absenceDays: 0,
                incentives: 0,
                deductions: 0,
                withdrawals: 0,
                advance: 0,
                finalSalary: worker.basicSalary,
                isPaid: false,
                notes: ''
            });

            await salary.save();
        } else {
            // Ensure salary advance totals are up to date before validation
            const recalculated = await recalcSalaryAdvanceTotals(salary._id);
            if (recalculated?.salary) {
                salary = recalculated.salary;
            }
        }

        const currentTotalAdvance = Number(salary.advance || 0);
        if (currentTotalAdvance + advanceAmount > salary.basicSalary) {
            return res.status(400).json({
                success: false,
                message: `إجمالي الصرفات (${currentTotalAdvance + advanceAmount}) لا يمكن أن يتجاوز الراتب الأساسي (${salary.basicSalary})`
            });
        }

        const adminContext = resolveAdminContext(req);

        const advanceEntry = await SalaryAdvance.create({
            salaryId: salary._id,
            workerId: worker._id,
            workerName: worker.name,
            workerJob: worker.job,
            amount: advanceAmount,
            notes: notes?.trim() || '',
            year: currentYear,
            month: currentMonth,
            adminId: adminContext?.id || req.admin?._id || null,
            adminName: adminContext?.name || req.admin?.name || 'غير محدد',
        });

        const recalculated = await recalcSalaryAdvanceTotals(salary._id);

        res.status(200).json({
            success: true,
            message: 'تم إضافة الصرفة بنجاح',
            data: {
                entry: {
                    _id: advanceEntry._id,
                    salaryId: advanceEntry.salaryId,
                    workerId: advanceEntry.workerId,
                    workerName: advanceEntry.workerName,
                    workerJob: advanceEntry.workerJob,
                    amount: advanceEntry.amount,
                    notes: advanceEntry.notes,
                    month: advanceEntry.month,
                    year: advanceEntry.year,
                    adminId: advanceEntry.adminId,
                    adminName: advanceEntry.adminName,
                    createdAt: advanceEntry.createdAt,
                    updatedAt: advanceEntry.updatedAt,
                },
                salary: recalculated?.salary,
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة الصرفة',
            error: error.message
        });
    }
};

// Get advance history with role-based filtering
export const getAdvanceHistory = async (req, res) => {
    try {
        const parsedMonth = parseInteger(req.query.month, { min: 1, max: 12 });
        const parsedYear = parseInteger(req.query.year);
        const { adminId, workerId } = req.query;
        const now = new Date();

        const isManager = req.admin?.role === 'manager';
        const effectiveYear = parsedYear || now.getFullYear();

        const filters = {
            year: effectiveYear,
        };

        let workerObjectId = null;
        if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
            workerObjectId = new mongoose.Types.ObjectId(workerId);
            filters.workerId = workerObjectId;
        }

        if (isManager) {
            if (parsedMonth) {
                filters.month = parsedMonth;
            }
            if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
                filters.adminId = new mongoose.Types.ObjectId(adminId);
            }
        } else {
            filters.month = parsedMonth || (now.getMonth() + 1);
            filters.adminId = req.admin._id;
        }

        await ensureLegacyAdvanceEntries({
            workerId: workerObjectId,
            year: effectiveYear,
            month: filters.month,
            admin: req.admin,
        });

        const advances = await SalaryAdvance.find(filters)
            .sort({ createdAt: -1 })
            .populate('workerId', 'name job')
            .populate('adminId', 'name')
            .populate('salaryId', 'basicSalary advance finalSalary year month');

        const advanceHistory = advances.map(entry => {
            const workerDoc = (entry.workerId && typeof entry.workerId === 'object' && '_id' in entry.workerId)
                ? entry.workerId
                : null;
            const adminDoc = (entry.adminId && typeof entry.adminId === 'object' && '_id' in entry.adminId)
                ? entry.adminId
                : null;
            const salaryDoc = (entry.salaryId && typeof entry.salaryId === 'object' && '_id' in entry.salaryId)
                ? entry.salaryId
                : null;

            const totalAdvance = salaryDoc?.advance ?? null;
            const finalSalary = salaryDoc?.finalSalary ?? null;
            const basicSalary = salaryDoc?.basicSalary ?? null;

            return {
                _id: entry._id,
                salaryId: salaryDoc?._id || entry.salaryId,
                workerId: workerDoc?._id || entry.workerId,
                workerName: workerDoc?.name || entry.workerName || 'غير متوفر',
                workerJob: workerDoc?.job || entry.workerJob || '',
                amount: entry.amount,
                totalAdvance,
                basicSalary,
                finalSalary,
                notes: entry.notes || '',
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                month: entry.month,
                year: entry.year,
                adminId: adminDoc?._id || entry.adminId,
                adminName: adminDoc?.name || entry.adminName || 'غير محدد'
            };
        });

        res.status(200).json({
            success: true,
            message: 'تم جلب سجل الصرفات بنجاح',
            data: advanceHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب سجل الصرفات',
            error: error.message
        });
    }
};

// Update advance
export const updateAdvance = async (req, res) => {
    try {
        const { id } = req.params;
        const { advance, notes } = req.body;
        const adminRole = req.admin?.role;

        if (adminRole !== 'moderator') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بتعديل الصرفة. هذه الميزة متاحة للأدمن العادي فقط'
            });
        }

        const advanceEntry = await SalaryAdvance.findById(id);
        if (!advanceEntry) {
            return res.status(404).json({
                success: false,
                message: 'سجل الصرفة غير موجود'
            });
        }

        const salary = await Salary.findById(advanceEntry.salaryId).populate('workerId');
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        if (salary.year !== currentYear || salary.month !== currentMonth) {
            return res.status(400).json({
                success: false,
                message: 'يمكن تعديل الصرفة للشهر الحالي فقط'
            });
        }

        const advanceAmount = Number(advance);
        if (Number.isNaN(advanceAmount) || advanceAmount < 0) {
            return res.status(400).json({
                success: false,
                message: 'قيمة الصرفة يجب أن تكون أكبر من أو تساوي صفر'
            });
        }

        const recalculatedBefore = await recalcSalaryAdvanceTotals(salary._id);
        if (recalculatedBefore?.salary) {
            salary.advance = recalculatedBefore.salary.advance;
            salary.finalSalary = recalculatedBefore.salary.finalSalary;
        }

        const currentTotalAdvance = Number(salary.advance || 0);
        const totalWithoutCurrent = currentTotalAdvance - advanceEntry.amount;

        if (totalWithoutCurrent + advanceAmount > salary.basicSalary) {
            return res.status(400).json({
                success: false,
                message: `إجمالي الصرفات (${totalWithoutCurrent + advanceAmount}) لا يمكن أن يتجاوز الراتب الأساسي (${salary.basicSalary})`
            });
        }

        advanceEntry.amount = advanceAmount;
        advanceEntry.notes = notes?.trim() || '';
        advanceEntry.adminId = req.admin._id;
        advanceEntry.adminName = req.admin.name;
        advanceEntry.updatedAt = new Date();

        await advanceEntry.save();

        const recalculated = await recalcSalaryAdvanceTotals(salary._id);

        res.status(200).json({
            success: true,
            message: 'تم تحديث الصرفة بنجاح',
            data: {
                entry: {
                    _id: advanceEntry._id,
                    salaryId: advanceEntry.salaryId,
                    workerId: advanceEntry.workerId,
                    workerName: advanceEntry.workerName,
                    workerJob: advanceEntry.workerJob,
                    amount: advanceEntry.amount,
                    notes: advanceEntry.notes,
                    adminId: advanceEntry.adminId,
                    adminName: advanceEntry.adminName,
                    month: advanceEntry.month,
                    year: advanceEntry.year,
                    createdAt: advanceEntry.createdAt,
                    updatedAt: advanceEntry.updatedAt,
                },
                salary: recalculated?.salary,
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الصرفة',
            error: error.message
        });
    }
};

// Delete advance (set to 0)
export const deleteAdvance = async (req, res) => {
    try {
        const { id } = req.params;
        const adminRole = req.admin?.role;

        // Check if admin is moderator
        if (adminRole !== 'moderator') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بحذف الصرفة. هذه الميزة متاحة للأدمن العادي فقط'
            });
        }

        const advanceEntry = await SalaryAdvance.findById(id);
        if (!advanceEntry) {
            return res.status(404).json({
                success: false,
                message: 'سجل الصرفة غير موجود'
            });
        }

        const salary = await Salary.findById(advanceEntry.salaryId).populate('workerId');
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'سجل الراتب غير موجود'
            });
        }

        // Check if it's current month
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        if (salary.year !== currentYear || salary.month !== currentMonth) {
            return res.status(400).json({
                success: false,
                message: 'يمكن حذف الصرفة للشهر الحالي فقط'
            });
        }

        await advanceEntry.deleteOne();

        const recalculated = await recalcSalaryAdvanceTotals(salary._id);

        res.status(200).json({
            success: true,
            message: 'تم حذف الصرفة بنجاح',
            data: {
                salary: recalculated?.salary
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف الصرفة',
            error: error.message
        });
    }
};

// Mark salary as paid (simple payment)
export const markSalaryAsPaid = async (req, res) => {
    try {
        const { salaryId, paymentMethod = 'cash', notes, adminId } = req.body;
        const adminContext = resolveAdminContext(req, adminId);

        if (!adminContext?.id) {
            return res.status(400).json({
                success: false,
                message: 'معرف المسؤول مطلوب لإتمام العملية'
            });
        }

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
            adminId: adminContext.id,
            notes
        });

        await payment.save();

        // Create expense record
        const expense = new Expenses({
            amount: salary.finalSalary,
            type: 'salary',
            adminId: adminContext.id,
            adminName: adminContext.name,
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

        const adminContext = resolveAdminContext(req, adminId);

        if (!adminContext?.id) {
            return res.status(400).json({
                success: false,
                message: 'معرف المسؤول مطلوب لإتمام العملية'
            });
        }

        console.log('Pay salary request:', { salaryId, paymentMethod, notes, adminId: adminContext.id });

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
            adminId: adminContext.id,
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
            adminId: adminContext.id,
            adminName: adminContext.name,
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