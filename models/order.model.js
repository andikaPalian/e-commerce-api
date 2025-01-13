import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    size: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    }
}, {
    _id: false,
})

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        name: String,
        phoneNumber: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["cod", "stripe", "razorpay"],
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    paymentDetails: {
        transactionId: String,
        paymentId: String,
    },
},
{
    timestamps: true,
});

const orderModel = mongoose.model("Order", orderSchema);
export default orderModel;