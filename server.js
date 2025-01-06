import express from "express";
import cors from "cors";
import "dotenv/config";
import db from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/user.routes.js";

// App config
const app = express();
const port = process.env.PORT;
db();
connectCloudinary();

// Middlewares
app.use(cors());
app.use(express.json());

// API endpoints
app.use("/api/user", userRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});