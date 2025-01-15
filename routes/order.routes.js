import express from "express";
import { createOrder, getOrders } from "../controllers/order.controller.js";
import userValidation from "../middleware/userValidation.js";

const orderRouter = express.Router();

orderRouter.post("/create", userValidation, createOrder);
orderRouter.get("/get", userValidation, getOrders);

export default orderRouter;