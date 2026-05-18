const mongoose = require('mongoose');

const InstallmentSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  fee_structure_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: false,
  },
  installment_no: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  due_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue'],
    default: 'Pending',
  },
  paid_date: {
    type: Date,
    default: null,
  },
  payment_mode: {
    type: String,
    enum: ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Razorpay', 'Other', null],
    default: null,
  }
}, { timestamps: true });

module.exports = mongoose.model('Installment', InstallmentSchema);
