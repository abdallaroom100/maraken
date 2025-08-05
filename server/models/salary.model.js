import mongoose, {Schema} from "mongoose";

const salarySchema = new Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    basicSalary: {
        type: Number,
        required: true,
        default: 0
    },
    absenceDays: {
        type: Number,
        default: 0
    },
    incentives: {
        type: Number,
        default: 0
    },
    deductions: {
        type: Number,
        default: 0
    },
    withdrawals: {
        type: Number,
        default: 0
    },
    finalSalary: {
        type: Number,
        default: 0
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paymentDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound index to ensure one salary record per worker per month
salarySchema.index({ workerId: 1, year: 1, month: 1 }, { unique: true });

const Salary = mongoose.model("Salary", salarySchema);

export default Salary; 