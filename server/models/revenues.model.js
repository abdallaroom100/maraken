import mongoose , {Schema} from "mongoose";


const revenuesSchema = new Schema({
    amount: {
        type: Number,
        required: true,
    },
    adminId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"FlowerAdmin",
    },
    type: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
},{
    timestamps: true,
})


const Revenues = mongoose.model("Revenues", revenuesSchema);

export default Revenues;