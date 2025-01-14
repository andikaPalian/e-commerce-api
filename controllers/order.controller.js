import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import productModel from "../models/product.model.js";
import Stripe from "stripe";
import Razorpay from "razorpay";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
    
})


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
            }
        }
    } catch (error) {
        
    }
}