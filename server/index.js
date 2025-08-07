import express from "express";  
import cors from "cors";
import connectDB from "./config/connectDB.js";
import dotenv from "dotenv";
import {fileURLToPath} from "url"
import path from "path"

// Import routes
import expenseRoutes from "./routes/expense.routes.js";
import revenueRoutes from "./routes/revenue.routes.js";
import adminRoutes from "./routes/admin.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import workerRoutes from "./routes/worker.routes.js"
import operationsRoutes from "./routes/operations.routes.js"
dotenv.config() 

 const __filename = fileURLToPath(import.meta.url)
 const __dirname = path.dirname(__filename)


const app = express()


app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/revenues", revenueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/operations", operationsRoutes);

// Serve static files first
app.use(express.static(path.join(__dirname, "../client/dist")));

// Catch-all route should be last
app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname, "../client/dist/index.html"))
})


await connectDB()

app.listen(8000, () => {
    console.log("Server is running on port 8000");
}); 