

import mongoose, {Schema} from "mongoose";

const workerSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    job: {
        type: String,
        required: true,
        trim: true
    },
    basicSalary: {
        type: Number,
        required: true,
        default: 0
    },
    identityNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Worker = mongoose.model("Worker", workerSchema);

export default Worker;