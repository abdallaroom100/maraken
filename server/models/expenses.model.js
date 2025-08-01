import mongoose , {Schema} from "mongoose";


const expensesSchema = new Schema({
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    adminId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"FlowerAdmin",
    },
    description: {
        type: String,
        required: true,
    },
},{
    timestamps: true,
})


const Expenses = mongoose.model("Expenses", expensesSchema);

export default Expenses;