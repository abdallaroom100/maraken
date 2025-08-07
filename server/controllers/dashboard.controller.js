import Expenses from "../models/expenses.model.js";
import Revenues from "../models/revenues.model.js";
import Admin from "../models/admin.model.js";
import SalaryPayment from "../models/salaryPayment.model.js";
import mongoose from "mongoose";

// الحصول على إحصائيات شاملة
export const getDashboardStats = async (req, res) => {
    try {
        const { year, month, adminId, allData } = req.query;
        
        console.log('Received query params:', { year, month, adminId });
        console.log('AdminId type:', typeof adminId);
        console.log('AdminId value:', adminId);

        // بناء query للتاريخ حسب السنة والشهر
        let dateQuery = {};
        if (year && month) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
            
            dateQuery = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            };
        }

        // إذا كان allData=true أرجع كل البيانات دفعة واحدة
        if (allData === 'true') {
            const expenses = await Expenses.find({ ...dateQuery })
                .select('amount type adminId description createdAt')
                .lean();
            const revenues = await Revenues.find({ ...dateQuery })
                .select('amount type adminId description createdAt')
                .lean();
            return res.status(200).json({
                success: true,
                data: { expenses, revenues }
            });
        }

        // بناء query للمدير
        let adminQuery = {};
        if (adminId && adminId !== '') {
            // تحويل adminId إلى ObjectId إذا كان صحيحاً
            try {
                const objectId = new mongoose.Types.ObjectId(adminId);
                adminQuery = { adminId: objectId };
                console.log('Filtering by adminId:', adminId, 'ObjectId:', objectId);
            } catch (error) {
                console.error('Invalid adminId:', adminId);
                return res.status(400).json({
                    success: false,
                    message: "معرف المدير غير صحيح"
                });
            }
        } else {
            console.log('No adminId filter - showing all admins');
        }

        console.log('Date query:', dateQuery);
        console.log('Admin query:', adminQuery);

        // التحقق من البيانات الموجودة
        const allExpenses = await Expenses.find({}).limit(5);
        const allRevenues = await Revenues.find({}).limit(5);
        const allAdmins = await Admin.find({});
        console.log('Sample expenses:', allExpenses.map(e => ({ id: e._id, adminId: e.adminId, amount: e.amount })));
        console.log('Sample revenues:', allRevenues.map(r => ({ id: r._id, adminId: r.adminId, amount: r.amount })));
        console.log('All admins:', allAdmins.map(a => ({ id: a._id, name: a.name, email: a.email })));

        // التحقق من البيانات بدون فلتر adminId
        const expensesWithoutAdminFilter = await Expenses.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const revenuesWithoutAdminFilter = await Revenues.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        console.log('Data without admin filter - Expenses:', expensesWithoutAdminFilter);
        console.log('Data without admin filter - Revenues:', revenuesWithoutAdminFilter);

        // التحقق من البيانات مع فلتر adminId محدد
        if (adminId && adminId !== '') {
            const expensesWithAdminFilter = await Expenses.aggregate([
                { $match: { ...dateQuery, adminId: new mongoose.Types.ObjectId(adminId) } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const revenuesWithAdminFilter = await Revenues.aggregate([
                { $match: { ...dateQuery, adminId: new mongoose.Types.ObjectId(adminId) } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            console.log('Data with admin filter - Expenses:', expensesWithAdminFilter);
            console.log('Data with admin filter - Revenues:', revenuesWithAdminFilter);
        }

        // الحصول على إجمالي المصروفات
        const totalExpenses = await Expenses.aggregate([
            { $match: { ...dateQuery, ...adminQuery } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        console.log('Total expenses query result:', totalExpenses);
        console.log('Expenses match query:', { ...dateQuery, ...adminQuery });

        // الحصول على إجمالي الإيرادات
        const totalRevenues = await Revenues.aggregate([
            { $match: { ...dateQuery, ...adminQuery } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        console.log('Total revenues query result:', totalRevenues);
        console.log('Revenues match query:', { ...dateQuery, ...adminQuery });

        // الحصول على إجمالي الرواتب المدفوعة
        let salaryQuery = {};
        if (year && month) {
            salaryQuery = { year: parseInt(year), month: parseInt(month) };
        }
        if (adminId && adminId !== '') {
            salaryQuery.adminId = new mongoose.Types.ObjectId(adminId);
        }

        const totalSalaries = await SalaryPayment.aggregate([
            { $match: salaryQuery },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]);

        // الحصول على إحصائيات الرواتب حسب الموظف
        const salariesByWorker = await SalaryPayment.aggregate([
            { $match: salaryQuery },
            {
                $lookup: {
                    from: "workers",
                    localField: "workerId",
                    foreignField: "_id",
                    as: "worker"
                }
            },
            { $unwind: "$worker" },
            {
                $group: {
                    _id: "$workerId",
                    workerName: { $first: "$worker.name" },
                    workerJob: { $first: "$worker.job" },
                    totalSalary: { $sum: "$amount" },
                    paymentsCount: { $sum: 1 }
                }
            },
            { $sort: { totalSalary: -1 } }
        ]);

        // التحقق من البيانات بدون فلتر adminId
        if (adminId && adminId !== '') {
            const expensesWithoutAdminFilter = await Expenses.aggregate([
                { $match: dateQuery },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const revenuesWithoutAdminFilter = await Revenues.aggregate([
                { $match: dateQuery },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            console.log('Data without admin filter - Expenses:', expensesWithoutAdminFilter);
            console.log('Data without admin filter - Revenues:', revenuesWithoutAdminFilter);
        }

        // الحصول على المصروفات حسب النوع
        const expensesByType = await Expenses.aggregate([
            { $match: { ...dateQuery, ...adminQuery } },
            { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);

        // الحصول على الإيرادات حسب النوع
        const revenuesByType = await Revenues.aggregate([
            { $match: { ...dateQuery, ...adminQuery } },
            { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);

        // الحصول على أحدث المعاملات
        const recentExpenses = await Expenses.find({ ...dateQuery, ...adminQuery })
            .populate('adminId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentRevenues = await Revenues.find({ ...dateQuery, ...adminQuery })
            .populate('adminId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // الحصول على أحدث مدفوعات الرواتب
        const recentSalaryPayments = await SalaryPayment.find(salaryQuery)
            .populate('workerId', 'name job')
            .populate('adminId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // الحصول على إحصائيات حسب المدير
        const statsByAdmin = await Expenses.aggregate([
            { $match: dateQuery },
            {
                $lookup: {
                    from: "floweradmins",
                    localField: "adminId",
                    foreignField: "_id",
                    as: "admin"
                }
            },
            { $unwind: "$admin" },
            {
                $group: {
                    _id: "$adminId",
                    adminName: { $first: "$admin.name" },
                    totalExpenses: { $sum: "$amount" },
                    expensesCount: { $sum: 1 }
                }
            }
        ]);

        // الحصول على إحصائيات الإيرادات حسب المدير
        const revenuesByAdmin = await Revenues.aggregate([
            { $match: dateQuery },
            {
                $lookup: {
                    from: "floweradmins",
                    localField: "adminId",
                    foreignField: "_id",
                    as: "admin"
                }
            },
            { $unwind: "$admin" },
            {
                $group: {
                    _id: "$adminId",
                    adminName: { $first: "$admin.name" },
                    totalRevenues: { $sum: "$amount" },
                    revenuesCount: { $sum: 1 }
                }
            }
        ]);

        // دمج إحصائيات المديرين
        const adminStats = statsByAdmin.map(expense => {
            const revenue = revenuesByAdmin.find(r => {
                return r._id && expense._id && r._id.toString() === expense._id.toString();
            });
            return {
                adminId: expense._id,
                adminName: expense.adminName,
                totalExpenses: expense.totalExpenses,
                expensesCount: expense.expensesCount,
                totalRevenues: revenue ? revenue.totalRevenues : 0,
                revenuesCount: revenue ? revenue.revenuesCount : 0,
                netAmount: (revenue ? revenue.totalRevenues : 0) - expense.totalExpenses
            };
        });

        // إضافة المديرين الذين ليس لديهم مصروفات
        revenuesByAdmin.forEach(revenue => {
            if (revenue && revenue._id) {
                const exists = adminStats.find(s => {
                    return s && s.adminId && s.adminId.toString() === revenue._id.toString();
                });
                if (!exists) {
                    adminStats.push({
                        adminId: revenue._id,
                        adminName: revenue.adminName,
                        totalExpenses: 0,
                        expensesCount: 0,
                        totalRevenues: revenue.totalRevenues,
                        revenuesCount: revenue.revenuesCount,
                        netAmount: revenue.totalRevenues
                    });
                }
            }
        });

        const totalExpensesAmount = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
        const totalRevenuesAmount = totalRevenues.length > 0 ? totalRevenues[0].total : 0;
        const totalSalariesAmount = totalSalaries.length > 0 ? totalSalaries[0].total : 0;
        const netAmount = totalRevenuesAmount - totalExpensesAmount;

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalExpenses: totalExpensesAmount,
                    totalRevenues: totalRevenuesAmount,
                    totalSalaries: totalSalariesAmount,
                    netAmount: netAmount,
                    expensesCount: await Expenses.countDocuments({ ...dateQuery, ...adminQuery }),
                    revenuesCount: await Revenues.countDocuments({ ...dateQuery, ...adminQuery }),
                    salariesCount: totalSalaries.length > 0 ? totalSalaries[0].count : 0
                },
                expensesByType,
                revenuesByType,
                recentExpenses,
                recentRevenues,
                recentSalaryPayments,
                salariesByWorker,
                adminStats: adminStats.sort((a, b) => b.netAmount - a.netAmount)
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: "حدث خطأ في جلب الإحصائيات",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// الحصول على إحصائيات الرواتب
export const getSalaryStats = async (req, res) => {
    try {
        const { year, month, adminId } = req.query;
        
        // بناء query للرواتب
        let salaryQuery = {};
        if (year && month) {
            salaryQuery = { year: parseInt(year), month: parseInt(month) };
        }
        if (adminId && adminId !== '') {
            try {
                salaryQuery.adminId = new mongoose.Types.ObjectId(adminId);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "معرف المدير غير صحيح"
                });
            }
        }

        // إجمالي الرواتب المدفوعة
        const totalSalaries = await SalaryPayment.aggregate([
            { $match: salaryQuery },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]);

        // الرواتب حسب الموظف
        const salariesByWorker = await SalaryPayment.aggregate([
            { $match: salaryQuery },
            {
                $lookup: {
                    from: "workers",
                    localField: "workerId",
                    foreignField: "_id",
                    as: "worker",
                    
                }
            },
            { $unwind: "$worker" },
            {
                $match: {
                    "worker.isActive": true
                }
            },
            {
                $group: {
                    _id: "$workerId",
                    workerName: { $first: "$worker.name" },
                    workerJob: { $first: "$worker.job" },
                 
                    totalSalary: { $sum: "$amount" },
                    paymentsCount: { $sum: 1 }
                }
            },
            { $sort: { totalSalary: -1 } }
        ]);

        // الرواتب حسب طريقة الدفع
        const salariesByPaymentMethod = await SalaryPayment.aggregate([
            { $match: salaryQuery },
            {
                $group: {
                    _id: "$paymentMethod",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // أحدث مدفوعات الرواتب
        const recentSalaryPayments = await SalaryPayment.find(salaryQuery)
            .populate('workerId', 'name job isActive')
            .populate('adminId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // إحصائيات الرواتب حسب المدير
        const salariesByAdmin = await SalaryPayment.aggregate([
            { $match: salaryQuery },
            {
                $lookup: {
                    from: "floweradmins",
                    localField: "adminId",
                    foreignField: "_id",
                    as: "admin"
                }
            },
            { $unwind: "$admin" },
            {
                $group: {
                    _id: "$adminId",
                    adminName: { $first: "$admin.name" },
                    totalSalaries: { $sum: "$amount" },
                    salariesCount: { $sum: 1 }
                }
            },
            { $sort: { totalSalaries: -1 } }
        ]);

        const totalSalariesAmount = totalSalaries.length > 0 ? totalSalaries[0].total : 0;
        const totalSalariesCount = totalSalaries.length > 0 ? totalSalaries[0].count : 0;

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalSalaries: totalSalariesAmount,
                    salariesCount: totalSalariesCount,
                    averageSalary: totalSalariesCount > 0 ? totalSalariesAmount / totalSalariesCount : 0
                },
                salariesByWorker,
                salariesByPaymentMethod,
                salariesByAdmin,
                recentSalaryPayments
            }
        });

    } catch (error) {
        console.error('Salary stats error:', error);
        res.status(500).json({
            success: false,
            message: "حدث خطأ في جلب إحصائيات الرواتب",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// الحصول على قائمة المديرين
export const getAdminsList = async (req, res) => {
    try {
        const admins = await Admin.find({}, 'name email role');
        
        res.status(200).json({
            success: true,
            data: admins
        });

    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({
            success: false,
            message: "حدث خطأ في جلب قائمة المديرين",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// للتحقق من البيانات (مؤقت)
export const debugData = async (req, res) => {
    try {
        const expenses = await Expenses.find({}).limit(10);
        const revenues = await Revenues.find({}).limit(10);
        const admins = await Admin.find({});
        
        res.status(200).json({
            success: true,
            data: {
                expenses: expenses.map(e => ({ id: e._id, adminId: e.adminId, amount: e.amount, type: e.type })),
                revenues: revenues.map(r => ({ id: r._id, adminId: r.adminId, amount: r.amount, type: r.type })),
                admins: admins.map(a => ({ id: a._id, name: a.name, email: a.email }))
            }
        });
    } catch (error) {
        console.error('Debug data error:', error);
        res.status(500).json({
            success: false,
            message: "حدث خطأ في جلب البيانات للتحقق",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 