import express from "express";
import { createOrder, getOrders, updateOrderStatus, userOrders } from "../controllers/order.controller.js";
import userValidation from "../middleware/userValidation.js";
import adminValidation from "../middleware/adminValidation.js";

const orderRouter = express.Router();

orderRouter.post("/create", userValidation, createOrder);
orderRouter.get("/get-user-orders", userValidation, userOrders);

orderRouter.get("/get", adminValidation, getOrders);
orderRouter.put("/update-status/:id", adminValidation, updateOrderStatus);

export default orderRouter;