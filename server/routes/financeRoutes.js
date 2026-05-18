const express = require('express');
const router = express.Router();
const {
  createFeeStructure,
  getInstallments,
  markInstallmentPaid,
  sendManualReminder,
  getDashboardMetrics,
  getPaymentDetails,
  deleteInstallment,
  editInstallment,
  createStandaloneInstallment,
  getReceiptPDF
} = require('../controllers/financeController');
// const { protect, admin } = require('../middleware/authMiddleware'); // Uncomment and use as per your setup

// Prefix: /api/finance
router.route('/dashboard')
  .get(getDashboardMetrics);

router.route('/fee-structure')
  .post(createFeeStructure);

router.route('/installments')
  .get(getInstallments);

router.route('/installments/:id')
  .put(editInstallment)
  .delete(deleteInstallment);

router.route('/installments/standalone')
  .post(createStandaloneInstallment);

router.route('/installments/:id/pay')
  .post(markInstallmentPaid);

router.route('/installments/:id/payment')
  .get(getPaymentDetails);

router.route('/installments/:id/receipt-pdf')
  .get(getReceiptPDF);

router.route('/installments/:id/remind')
  .post(sendManualReminder);

module.exports = router;
