import express from "express";
import cors from "cors";
import "dotenv/config";
import db from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";

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
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});