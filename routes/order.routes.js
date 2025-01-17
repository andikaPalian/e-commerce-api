import express from "express";
import { confirmCodPayment, createOrder, getOrders, getUserOrders, handleRazorpayWebhook, handleStripeWebhook, refundOrder, updateOrderStatus, verifyRazorpayPayment, verifyStripePayment } from "../controllers/order.controller.js";
import userValidation from "../middleware/userValidation.js";
import adminValidation from "../middleware/adminValidation.js";

const orderRouter = express.Router();

orderRouter.post("/create", userValidation, createOrder);
orderRouter.get("/get-user-orders", userValidation, getUserOrders);
orderRouter.post("/confirm-cod/:id", userValidation, confirmCodPayment);
orderRouter.post("/refund/orderId", userValidation, refundOrder);

orderRouter.get("/get", adminValidation, getOrders);
orderRouter.put("/update-status/:id", adminValidation, updateOrderStatus);

orderRouter.post("/verify/stripe", userValidation, verifyStripePayment);
orderRouter.post("/verify/razorpay", userValidation, verifyRazorpayPayment);

orderRouter.post("/webhook/stripe", express.raw({type: "application/json"}), handleStripeWebhook);
orderRouter.post("/webhook/razorpay", handleRazorpayWebhook);

export default orderRouter;