import express from "express";
import { createOrder } from "../controllers/order.controller.js";
import userValidation from "../middleware/userValidation.js";

const orderRouter = express.Router();

orderRouter.post("/create", userValidation, createOrder);

export default orderRouter;