import Expenses from "../models/expenses.model.js";
import Revenues from "../models/revenues.model.js";
import Admin from "../models/admin.model.js";

// جلب سجل العمليات مع الفلاتر
export const getOperationsLog = async (req, res) => {
    try {
        const { 
            year, 
            month, 
            operationType, // 'revenues', 'expenses', 'all'
            adminId 
        } = req.query;

        // التحقق من وجود السنة والشهر
        if (!year || !month) {
            return res.status(400).json({ 
                message: "السنة والشهر مطلوبان" 
            });
        }

        // بناء query للتاريخ
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

        let operations = {
            revenues: [],
            expenses: [],
            totalRevenues: 0,
            totalExpenses: 0
        };

        // جلب الإيرادات
        if (operationType === 'revenues' || operationType === 'all') {
            let revenueQuery = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            };

            if (adminId && adminId !== 'all') {
                revenueQuery.adminId = adminId;
            }

            const revenues = await Revenues.find(revenueQuery)
                .populate('adminId', 'name email')
                .sort({ createdAt: -1 });

            operations.revenues = revenues;
            operations.totalRevenues = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
        }

        // جلب المصروفات
        if (operationType === 'expenses' || operationType === 'all') {
            let expenseQuery = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                type:{
                    $ne:"salary"
                }
            };

            if (adminId && adminId !== 'all') {
                expenseQuery.adminId = adminId;
            }

            const expenses = await Expenses.find(expenseQuery)
                .populate('adminId', 'name email')
                .sort({ createdAt: -1 });

            operations.expenses = expenses;
            operations.totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        }

        // حساب صافي الربح
        operations.netProfit = operations.totalRevenues - operations.totalExpenses;

        res.status(200).json({
            message: "تم جلب سجل العمليات بنجاح",
            operations,
            filters: {
                year: parseInt(year),
                month: parseInt(month),
                operationType,
                adminId
            }
        });

    } catch (error) {
        console.error('Get operations log error:', error);
        res.status(500).json({ 
            message: "حدث خطأ في الخادم",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// جلب قائمة الأدمن
export const getAdminsList = async (req, res) => {
    try {
        const admins = await Admin.find({role:"moderator"}, 'name email role')
            .sort({ name: 1 });

        res.status(200).json({
            message: "تم جلب قائمة الأدمن بنجاح",
            admins
        });

    } catch (error) {
        console.error('Get admins list error:', error);
        res.status(500).json({ 
            message: "حدث خطأ في الخادم",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// جلب إحصائيات سريعة للشهر الحالي
export const getCurrentMonthStats = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // جلب إجمالي الإيرادات للشهر الحالي
        const totalRevenues = await Revenues.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // جلب إجمالي المصروفات للشهر الحالي
        const totalExpenses = await Expenses.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const stats = {
            currentYear,
            currentMonth,
            totalRevenues: totalRevenues.length > 0 ? totalRevenues[0].total : 0,
            totalExpenses: totalExpenses.length > 0 ? totalExpenses[0].total : 0
        };

        stats.netProfit = stats.totalRevenues - stats.totalExpenses;

        res.status(200).json({
            message: "تم جلب إحصائيات الشهر الحالي بنجاح",
            stats
        });

    } catch (error) {
        console.error('Get current month stats error:', error);
        res.status(500).json({ 
            message: "حدث خطأ في الخادم",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};