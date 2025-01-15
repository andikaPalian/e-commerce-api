import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import productModel from "../models/product.model.js";
import Stripe from "stripe";
import Razorpay from "razorpay";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    secret_key: process.env.RAZORPAY_SECRET_KEY,
});


const createOrder = async (req, res) => {
    try {
        const {shippingAddress, paymentMethod} = req.body;
        const userId = req.user.userId;

        // Get user and cart
        const user = await userModel.findById(userId).populate("cart.items.productId");
        if (!user || user.cart.items.length === 0) {
            return res.status(400).json({message: "Cart is empty"});
        };

        // Verify stock availability and decrease stock
        for (const item of user.cart.items) {
            const product = await productModel.findById(item.productId);
            if (!product) {
                return res.status(404).json({message: `Product ${item.productId} not found`});
            };

            if (!product.checkStock(item.size, item.quantity)) {
                return res.status(400).json({
                    message: "Insufficient stock",
                    product: product.name,
                    size: item.size,
                });
            };
        };

        // Create Order
        const order = new orderModel({
            userId,
            items: user.cart.items,
            totalAmount: user.cart.totalAmount,
            shippingAddress,
            paymentMethod
        });

        // Handle different payment methods
        if (paymentMethod === "stripe") {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(order.totalAmount * 100),
                currency: "usd",
                metadata: {
                    orderId: order._id.toString(),
                },
            });
            order.paymentDetails = {
                paymentId: paymentIntent.id,
            };
        } else if (paymentMethod === "razorpay") {
            const payment = await razorpay.orders.create({
                amount: Math.round(order.totalAmount * 100),
                currency: "INR",
                receipt: order._id.toString(),
            });
            order.paymentDetails = {
                paymentId: payment.id,
            };
        };

        // Decrease stock for all items
        for (const item of order.items) {
            const product = await productModel.findById(item.productId);
            product.decreaseStock(item.size, item.quantity);
            await product.save();
        };

        await order.save();

        // Clear user cart
        user.cart = {
            items: [],
            totalAmount: 0,
        };
        await user.save();

        res.status(201).json({
            message: "Order created successfully",
            data: order,
            paymentDetails: order.paymentDetails,
        })
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {createOrder};