import mongoose, {Schema} from "mongoose";

const salaryPaymentSchema = new Schema({
    salaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Salary",
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
        required: true
    },
    workerName: {
        type: String,
        required: true
    },
    workerJob: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank', 'check'],
        default: 'cash'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FlowerAdmin",
        required: false,
        default: null
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const SalaryPayment = mongoose.model("SalaryPayment", salaryPaymentSchema);

export default SalaryPayment; 