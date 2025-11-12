import Expenses from "../models/expenses.model.js";

const parseInteger = (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
};

const buildDateFilters = ({ role, month, year }) => {
    const parsedMonth = parseInteger(month);
    const parsedYear = parseInteger(year);

    if (role !== "manager" && !parsedMonth && !parsedYear) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        return {
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth,
            },
        };
    }

    if (!parsedMonth && !parsedYear) {
        return {};
    }

    const targetYear = parsedYear ?? new Date().getFullYear();

    if (parsedMonth) {
        const startOfMonth = new Date(targetYear, parsedMonth - 1, 1);
        const endOfMonth = new Date(targetYear, parsedMonth, 0, 23, 59, 59, 999);
        return {
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth,
            },
        };
    }

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    return {
        createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
        },
    };
};

export const createExpense = async (req, res) => {
    const { amount, description, type } = req.body;
    try {
        if (!amount || !type || !description) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const numericAmount = Number(amount);
        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number" });
        }

        const now = new Date();
        const expense = await Expenses.create({
            amount: numericAmount,
            description,
            type,
            adminId: req.admin._id,
            adminName: req.admin.name,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
        });
        res.status(201).json({ expense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getExpenses = async (req, res) => {
    try {
        const query = {};

        if (req.admin.role === "manager") {
            if (req.query.adminId) {
                query.adminId = req.query.adminId;
            }
        } else {
            query.adminId = req.admin._id;
        }

        const dateFilters = buildDateFilters({
            role: req.admin.role,
            month: req.query.month,
            year: req.query.year,
        });

        Object.assign(query, dateFilters);

        const expenses = await Expenses.find(query).sort({ createdAt: -1 });

        res.status(200).json({ expenses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getExpense = async (req, res) => {
    const { id } = req.params;
    try {
        const expense = await Expenses.findById(id);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        if (
            req.admin.role !== "manager" &&
            expense.adminId.toString() !== req.admin._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized to access this expense" });
        }

        res.status(200).json({ expense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAdminExpenses = async (req, res) => {
    try {
        if (req.admin.role !== "manager") {
            return res.status(403).json({ message: "Not authorized to access this resource" });
        }

        const { adminId } = req.params;
        const dateFilters = buildDateFilters({
            role: req.admin.role,
            month: req.query.month,
            year: req.query.year,
        });

        const expenses = await Expenses.find({
            adminId,
            ...dateFilters,
        }).sort({ createdAt: -1 });

        res.status(200).json({ expenses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateExpense = async (req, res) => {
    const { id } = req.params;
    const { amount, description, type } = req.body;
    try {
        const expense = await Expenses.findById(id);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        if (
            req.admin.role !== "manager" &&
            expense.adminId.toString() !== req.admin._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized to update this expense" });
        }

        if (amount !== undefined) {
            const numericAmount = Number(amount);
            if (Number.isNaN(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({ message: "Amount must be a positive number" });
            }
            expense.amount = numericAmount;
        }
        expense.description = description ?? expense.description;
        expense.type = type ?? expense.type;

        const updatedExpense = await expense.save();
        res.status(200).json({ expense: updatedExpense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteExpense = async (req, res) => {
    const { id } = req.params;
    try {
        const expense = await Expenses.findById(id);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        if (
            req.admin.role !== "manager" &&
            expense.adminId.toString() !== req.admin._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized to delete this expense" });
        }

        await expense.deleteOne();
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};