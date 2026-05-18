const mongoose = require('mongoose');

const PaymentHistorySchema = new mongoose.Schema({
  installment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment',
    required: true,
  },
  paid_amount: {
    type: Number,
    required: true,
  },
  payment_mode: {
    type: String,
    enum: ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Razorpay', 'Other'],
    required: true,
  },
  reference_id: {
    type: String,
    trim: true, // Transaction ID/UPI ID
  },
  receipt_url: {
    type: String,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentHistory', PaymentHistorySchema);
