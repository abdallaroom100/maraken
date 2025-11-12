import mongoose, { Schema } from "mongoose";

const salaryAdvanceSchema = new Schema({
    salaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Salary",
        required: true,
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
        required: true,
    },
    workerName: {
        type: String,
        required: true,
        trim: true,
    },
    workerJob: {
        type: String,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    notes: {
        type: String,
        trim: true,
    },
    year: {
        type: Number,
        required: true,
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FlowerAdmin",
    },
    adminName: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

salaryAdvanceSchema.index({ salaryId: 1, createdAt: -1 });
salaryAdvanceSchema.index({ workerId: 1, year: 1, month: 1, createdAt: -1 });
salaryAdvanceSchema.index({ adminId: 1, createdAt: -1 });

const SalaryAdvance = mongoose.model("SalaryAdvance", salaryAdvanceSchema);

export default SalaryAdvance;

