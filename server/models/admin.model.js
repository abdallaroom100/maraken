
import mongoose , {Schema} from "mongoose";


const adminSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["moderator", "manager"],
        default: "moderator",
    },
    
},{
    timestamps: true,
})


const Admin = mongoose.model("FlowerAdmin", adminSchema);

export default Admin;