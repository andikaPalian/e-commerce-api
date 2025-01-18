import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import productModel from "../models/product.model.js";
import Stripe from "stripe";
import Razorpay from "razorpay";
import { query } from "express";

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
        if (paymentMethod === "cod") {
            // COD status pembayaran akan pending samapi barang diterima
            order.paymentStatus = "pending";
            order.orderStatus = "processing";
            // Batas maksimum untuk cod (contoh: 5 juta)
            const COD_LIMIT = 5000000;
            if (order.totalAmount > COD_LIMIT) {
                return res.status(400).json({
                    message: "Total amount exceeds COD LIMIT",
                    limit: COD_LIMIT,
                });
            };
        } else if (paymentMethod === "stripe") {
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
            paymentDetails: order.paymentMethod !== "cod" ? order.paymentDetails : undefined,
        })
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const getOrders = async (req, res) => {
    try {
        const adminId = req.user.adminId;
        const orders = await orderModel.find({adminId}).populate("items.productId", "name image").sort("-createdAt");
        res.status(200).json({data: orders});
    } catch (error) {
        console.error("Error getting orders:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const updateOrderStatus = async (req, res) => {
    try {
        const {id} = req.params;
        const {orderStatus} = req.body;

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({message: "Order not found"});
        };
        
        // Untuk COD, statusnya tidak bisa diubah jika sudah delivered
        if (order.paymentMethod === "cod" && order.orderStatus === "delivered") {
            return res.status(400).json({message: "Cannot update status of delivered COD order"});
        };

        order.orderStatus = orderStatus;

        // Jika order COD dan statusnya di cancelled, maka kembalikan jumlah stock
        if (order.paymentMethod === "cod" && orderStatus === "cancelled") {
            for (const item of order.items) {
                const product = await productModel.findById(item.productId);
                if (product) {
                    const sizeStock = product.sizeStock.find(i => i.size === item.size);
                    if (sizeStock) {
                        sizeStock.stock += item.quantity;
                        await product.save();
                    };
                };
            };
        };

        await order.save();
        res.status(200).json({
            message: "Order status updated succesfully",
            data: order,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {page = 1, limit = 10, status, paymentStatus, startDate, endDate, paymentMethod} = req.query;
        const filter = {userId};

        // Add filters
        if (status) {
            filter.orderStatus = status;
        };
        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        };
        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        };
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            };
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            };
        };

        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count for pagination 
        const totalOrders = await orderModel.countDocuments(filter);

        // Get orders with pagination and populated data
        const orders = await orderModel.find(filter).populate("items.productId", "name image price").sort({createdAt: -1}).skip(skip).limit(parseInt(limit));
        
        // Calculate total pages
        const totalPages = Math.ceil(totalOrders / parseInt(limit));

        res.status(200).json({
            data: {
                orders,
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
            },
        });
    } catch (error) {
        console.error("Error getting user orders:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const verifyStripePayment = async (req, res) => {
    try {
        const {orderId, paymentIntentId} = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({message: "Order not found"});
        };
        if (order.paymentMethod !== "stripe") {
            return res.status(400).json({message: "Invalid payment method"});
        };

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === "succeeded") {
            order.paymentStatus = "paid";
            order.paymentDetails.paymentIntent = paymentIntentId;
            order.paymentDetails.transactionId = paymentIntent.charges.data[0].id;
            order.paymentDetails.paymentDate = new Date();
            order.paymentDetails.currency = paymentIntent.currency;

            await order.save();
            return res.status(200).json({
                message: "Payment verified successfully",
                order: order,
            });
        };
    } catch (error) {
        console.error("Error verifying stripe payment:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const {orderId, razorpay_payment_id, razorpay_signature} = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({message: "Order not found"});
        };
        if (order.paymentMethod !== "razorpay") {
            return res.status(400).json({message: "Invalid payment method"});
        };

        if (order.verifyRazorpayPayment(razorpay_payment_id, razorpay_signature)) {
            order.paymentStatus = "paid";
            order.paymentDetails.transactionId = razorpay_payment_id;
            order.paymentDetails.paymentSignature = razorpay_signature;
            order.paymentDetails.paymentDate = new Date();

            await order.save();
            return res.status(200).json({
                message: "Payment verified successfully",
                order: order,
            });
        };
    } catch (error) {
        console.error("Error verifying razorpay payment:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const refundOrder = async (req, res) => {
    try {
        const {orderId} = req.params;
        const {reason} = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({message: "Order not found"});
        };
        if (order.paymentStatus !== "paid") {
            return res.status(400).json({message: "Order is not paid yet"});
        };

        let refund;
        if (order.paymentMethod === "stripe") {
            refund = await stripe.refunds.create({
                payment_intent: order.paymentDetails.paymentIntent,
                reason: reason || "requested_by_customer",
            });
        } else if (order.paymentMethod === "razorpay") {
            refund = await razorpay.payments.refund(order.paymentDetails.transactionId, {
                notes: {reason: reason || "customer_requested"},
            });
        } else {
            return res.status(400).json({message: "Refund not available for this payment method"});
        };

        order.paymentStatus = "refunded";
        order.paymentDetails.refundId = refund.id;
        order.paymentDetails.refundStatus = refund.status;
        order.paymentDetails.refundDate = new Date();

        await order.save();
        res.status(200).json({
            message: "Refund processed successfully",
            data: order,
        })
    } catch (error) {
        console.error("Error processing refund:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const handleStripeWebhook = async (req, res) => {
    try {
        const signature = req.headers["stripe-signature"];
        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_SECRET_WEBHOOK
        );

        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            const order = await orderModel.findOne({
                'paymentDetails.paymentId': paymentIntent.id
            });

            if (order) {
                order.paymentStatus = "paid";
                order.paymentDetails.transactionId = paymentIntent.charges.data[0].id;
                await order.save();
            };
        };

        res.status(200).json({received: true});
    } catch (error) {
        console.error("Error handling Stripe webhook:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const handleRazorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_SECRET_WEBOOK;
        const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex");

        if (signature === req.headers["x-razorpay-signature"]) {
            const payment = req.body.payload.payment.entity;

            const order = await orderModel.findOne({
                'paymentDetails.paymentId': payment.order_id
            });

            if (order) {
                order.paymentStatus = "paid";
                order.paymentDetails.transactionId = payment.id;
                await order.save();
            };
        };
        
        res.status(200).json({received: true});
    } catch (error) {
        console.error("Error handling Razorpay webhook:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const confirmCodPayment = async (req, res) => {
    try {
        const {id} = req.params;

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({message: "Order not found"});
        };

        if (order.paymentMethod !== "cod") {
            return res.status(400).json({message: "Invalid payment method. This order is not COD"});
        };

        if (order.orderStatus !== "delivered") {
            return res.status(400),json({message: "Order must be delivered before confirming payment"});
        };

        order.paymentStatus = "paid";
        await order.save();

        res.status(200).json({
            message: "COD payment confirmed successfully",
            data: order,
        });
    } catch (error) {
        console.error("Error confirming COD payment:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {createOrder, getOrders, updateOrderStatus, getUserOrders, verifyStripePayment, verifyRazorpayPayment, refundOrder, handleStripeWebhook, handleRazorpayWebhook, confirmCodPayment};