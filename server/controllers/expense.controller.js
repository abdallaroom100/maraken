import Expenses from "../models/expenses.model.js";
import Admin from "../models/admin.model.js";


export const createExpense = async (req, res) => {
        const { amount, description, type } = req.body;
        const {adminId} = req.params;
        try {
            if(!amount  || !type ){
                return res.status(400).json({ message: "All fields are required" });
            }
            const admin = await Admin.findById(adminId);
            if(!admin){
                return res.status(400).json({ message: "Admin not found" });
            }
            const expense = await Expenses.create({ amount, description, type, adminId });
            res.status(201).json({ expense });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
}

export const getExpenses = async (req, res) => {
    try {
        const { adminId } = req.params;
        const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const expenses = await Expenses.find({adminId,createdAt:{$gte:startOfMonth,$lte:endOfMonth}})
        res.status(200).json({ expenses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getExpense = async (req, res) => {
    const {id} = req.params;
    try {
        const expense = await Expenses.findById(id);
        res.status(200).json({ expense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAdminExpenses = async (req, res) => {
    const {adminId} = req.params;
    try {
        const expenses = await Expenses.find({adminId});
        res.status(200).json({ expenses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateExpense = async (req, res) => {
    const {id} = req.params;
    const {amount, description, type} = req.body;
    try {
        const expense = await Expenses.findByIdAndUpdate(id, {amount, description, type}, {new: true});
        res.status(200).json({ expense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteExpense = async (req, res) => {
    const {id} = req.params;
    try {
        await Expenses.findByIdAndDelete(id);
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

