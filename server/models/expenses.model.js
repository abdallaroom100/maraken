import mongoose , {Schema} from "mongoose";

const expensesSchema = new Schema({
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: [
          'general', 'salary', 'other',
          'مياه', 'كهرباء', 'إيجار', 'صيانة', 'مشتريات', 'رواتب', 'أخرى', 'عامة'
        ]
    },
    adminId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"FlowerAdmin",
    },
    description: {
        type: String,
        required: true,
    },
    // For salary-related expenses
    salaryPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalaryPayment"
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
    },
    workerName: {
        type: String
    },
    workerJob: {
        type: String
    },
    year: {
        type: Number
    },
    month: {
        type: Number
    }
},{
    timestamps: true,
})

const Expenses = mongoose.model("Expenses", expensesSchema);

export default Expenses;