import { Worker, Salary, SalaryPayment, Expenses } from '../models/index.js';

// Create new worker
export const createWorker = async (req, res) => {
    try {
        const { name, job, basicSalary, identityNumber } = req.body;

        // Check if worker with same identity number exists
        const existingWorker = await Worker.findOne({ identityNumber });
        if (existingWorker) {
            return res.status(400).json({
                success: false,
                message: 'موظف بهذا الرقم القومي موجود بالفعل'
            });
        }

        const worker = new Worker({
            name,
            job,
            basicSalary: Number(basicSalary),
            identityNumber
        });

        await worker.save();

        res.status(201).json({
            success: true,
            message: 'تم إضافة الموظف بنجاح',
            data: worker
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة الموظف',
            error: error.message
        });
    }
};

// Get all workers
export const getAllWorkers = async (req, res) => {
    try {
        const workers = await Worker.find({ isActive: true }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: workers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الموظفين',
            error: error.message
        });
    }
};

// Get worker by ID
export const getWorkerById = async (req, res) => {
    try {
        const { id } = req.params;
        const worker = await Worker.findById(id);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            data: worker
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات الموظف',
            error: error.message
        });
    }
};

// Update worker
export const updateWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, job, basicSalary, identityNumber } = req.body;

        // Check if identity number is being changed and if it already exists
        if (identityNumber) {
            const existingWorker = await Worker.findOne({
                identityNumber,
                _id: { $ne: id }
            });
            if (existingWorker) {
                return res.status(400).json({
                    success: false,
                    message: 'موظف بهذا الرقم القومي موجود بالفعل'
                });
            }
        }

        const worker = await Worker.findByIdAndUpdate(
            id,
            {
                name,
                job,
                basicSalary: Number(basicSalary),
                identityNumber
            },
            { new: true, runValidators: true }
        );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            message: 'تم تحديث بيانات الموظف بنجاح',
            data: worker
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث بيانات الموظف',
            error: error.message
        });
    }
};

// Soft delete worker (mark as inactive)
export const deleteWorker = async (req, res) => {
    try {
        const { id } = req.params;

        const worker = await Worker.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            message: 'تم حذف الموظف بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف الموظف',
            error: error.message
        });
    }
};

// Get worker salary history
export const getWorkerSalaryHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { year, month } = req.query;

        let query = { workerId: id };

        if (year) query.year = Number(year);
        if (month) query.month = Number(month);

        const salaries = await Salary.find(query)
            .sort({ year: -1, month: -1 })
            .populate('workerId', 'name job');

        // Recalculate finalSalary relative to components to ensure consistency on read
        const processedSalaries = salaries.map(s => {
            const salary = s.toObject();
            const absenceValue = Math.floor((salary.basicSalary / 30) * (salary.absenceDays || 0));

            // Re-calculate final salary: basic + incentives - deductions - withdrawals - advance - absence
            // This ensures that even if DB is stale, the UI gets the correct math.
            salary.finalSalary = salary.basicSalary + (salary.incentives || 0) - (salary.deductions || 0) - (salary.withdrawals || 0) - (salary.advance || 0) - absenceValue;

            return salary;
        });

        res.status(200).json({
            success: true,
            data: processedSalaries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تاريخ الرواتب',
            error: error.message
        });
    }
};

// Search workers by name
export const searchWorkers = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'اسم الموظف مطلوب'
            });
        }

        // Search for workers whose name contains the search term (case-insensitive)
        const workers = await Worker.find({
            isActive: true,
            name: { $regex: name.trim(), $options: 'i' } // case-insensitive search
        })
            .select('_id name job basicSalary')
            .limit(20) // Limit to 20 results
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: workers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في البحث عن الموظفين',
            error: error.message
        });
    }
}; 