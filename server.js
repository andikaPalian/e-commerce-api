import express from "express";
// import fileUpload from "express-fileupload";
import multer from "multer";
import cors from "cors";
import "dotenv/config";
import db from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";

// App config
const app = express();
const port = process.env.PORT;
db();
connectCloudinary();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(multer().any());
// app.use(fileUpload());

// API endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});