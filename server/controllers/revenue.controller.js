
import Admin from "../models/admin.model.js";
import Revenues from "../models/revenues.model.js";


export const createRevenue = async (req, res) => {
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
            const revenue = await Revenues.create({ amount, description, type, adminId });
            res.status(201).json({ revenue });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
}

export const getRevenues = async (req, res) => {
    try {
        const {adminId} = req.params
        const revenues = await Revenues.find({adminId});
        res.status(200).json({ revenues });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getRevenue = async (req, res) => { 
    const {id} = req.params;
    try {
        const revenue = await Revenues.findById(id);
        res.status(200).json({ revenue });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAdminRevenues = async (req, res) => {
    const {adminId} = req.params;
    try {
        const revenues = await Revenues.find({adminId});
        res.status(200).json({ revenues });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateRevenue = async (req, res) => {
    const {id} = req.params;
    const {amount, description, type} = req.body;
    try {
        const revenue = await Revenues.findByIdAndUpdate(id, {amount, description, type}, {new: true});
        res.status(200).json({ revenue });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteRevenue = async (req, res) => {
    const {id} = req.params;
    try {
        await Revenues.findByIdAndDelete(id);
        res.status(200).json({ message: "Revenue deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

