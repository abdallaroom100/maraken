

import mongoose  from "mongoose";



const connectDB = async () =>{
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/flower";
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("MongoDB connection error:", error.message);
        console.log("Continuing without database...");
    }
}

export default connectDB