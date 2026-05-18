const FeeStructure = require('../models/FeeStructure');
const Installment = require('../models/Installment');
const PaymentHistory = require('../models/PaymentHistory');
const Expense = require('../models/Expense');
const Student = require('../models/Student');
const Setting = require('../models/Setting');
const { sendEmail } = require('../utils/emailService');
const { generateFeeReminderTemplate, generatePaymentConfirmationTemplate } = require('../utils/emailTemplates');

// @desc    Get dashboard metrics (total fees, pending, expenses, chart data)
// @route   GET /api/finance/dashboard
// @access  Private/Admin
exports.getDashboardMetrics = async (req, res) => {
  try {
    const { filter } = req.query; // 'all', 'month', 'year'
    const today = new Date();
    
    // Determine start date for stats based on filter
    let startDate = new Date(0); // 'all' time
    if (filter === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (filter === 'year') {
      startDate = new Date(today.getFullYear(), 0, 1);
    }

    // 1. Fee Metrics
    const allInstallments = await Installment.find();
    let totalFeesCollected = 0;
    let pendingFees = 0;
    let pendingCount = 0;
    let overdueFees = 0;
    
    allInstallments.forEach(inst => {
      const instDate = new Date(inst.due_date);
      
      // Pending count/fees are usually current snapshot, not strictly date-bound
      // But we'll bound Payments to the selected date range
      if (inst.status === 'Paid') {
          // Check if paid_date falls in filter range
          const paidDate = inst.paid_date ? new Date(inst.paid_date) : instDate;
          if (paidDate >= startDate) {
            totalFeesCollected += inst.amount;
          }
      } else if (inst.status === 'Overdue') {
        overdueFees += inst.amount;
        pendingCount++;
      } else if (inst.status === 'Pending') {
        pendingFees += inst.amount;
        pendingCount++;
      }
    });

    // 2. Expense Metrics
    const allExpenses = await Expense.find();
    let totalExpenses = 0;
    
    // Monthly breakdown for charts
    const monthlyDataMap = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize last 6 months including current
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyDataMap[monthKey] = { name: monthKey, income: 0, expense: 0, sortValue: d.getTime() };
    }

    // Process Payments for Income Chart
    const payments = await PaymentHistory.find();
    payments.forEach(pay => {
      const d = new Date(pay.createdAt || pay.paid_date || new Date()); // fallback
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey].income += pay.paid_amount;
      }
    });
    
    // Process Expenses for Expense Chart & Category Breakdown
    const categoryDataMap = {};
    
    allExpenses.forEach(exp => {
      const d = new Date(exp.date);
      
      // Only add to summary total if within filter range
      if (d >= startDate) {
        totalExpenses += exp.amount;
        
        // Only add to category breakdown if within filter range
        if (!categoryDataMap[exp.category]) {
          categoryDataMap[exp.category] = 0;
        }
        categoryDataMap[exp.category] += exp.amount;
      }
      
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey].expense += exp.amount;
      }
    });

    // Format Data for Charts
    const incomeVsExpenseData = Object.values(monthlyDataMap).sort((a,b) => a.sortValue - b.sortValue).map(curr => ({
      name: curr.name.split(' ')[0], // Just Month name
      income: curr.income,
      expense: curr.expense
    }));
    
    const expenseCategoryData = Object.keys(categoryDataMap).map(key => ({
      name: key,
      value: categoryDataMap[key]
    }));

    // Compile summary
    const netProfit = totalFeesCollected - totalExpenses;

    res.status(200).json({
      summaryStats: {
        totalFeesCollected,
        pendingFees: pendingFees + overdueFees,
        pendingCount,
        totalExpenses,
        netProfit,
        overdueFees
      },
      charts: {
        incomeVsExpenseData,
        expenseCategoryData
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard metrics', error: error.message });
  }
};

// @desc    Add a fee structure for a student and generate installments
// @route   POST /api/finance/fee-structure
// @access  Private/Admin
exports.createFeeStructure = async (req, res) => {
  try {
    const { student_id, total_fee, installments_data } = req.body;
    // installments_data is expected to be an array of objects: [{ amount, due_date }]
    
    if (!student_id || !total_fee || !installments_data || installments_data.length === 0) {
      return res.status(400).json({ message: 'Invalid fee structure data provided.' });
    }

    // Check if a FeeStructure already exists for this student
    const existingFS = await FeeStructure.findOne({ student_id });
    if (existingFS) {
      return res.status(400).json({ message: 'A fee structure already exists for this student. Please update the existing one instead.' });
    }

    const total_installments = installments_data.length;

    // Create the main Fee Structure record
    const feeStructure = new FeeStructure({
      student_id,
      total_fee,
      total_installments
    });
    await feeStructure.save();

    // Create individual Installment records
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const installmentDocs = installments_data.map((inst, index) => {
      const dueDate = new Date(inst.due_date);
      // Determine initial status based on due date
      const status = dueDate < today ? 'Overdue' : 'Pending';

      return {
        student_id,
        fee_structure_id: feeStructure._id,
        installment_no: index + 1,
        amount: inst.amount,
        due_date: dueDate,
        status: status
      };
    });

    await Installment.insertMany(installmentDocs);

    res.status(201).json({ message: 'Fee structure and installments created successfully!', feeStructure });
  } catch (error) {
    res.status(500).json({ message: 'Error creating fee structure', error: error.message });
  }
};

// @desc    Get all installments (with optional filters like status, student)
// @route   GET /api/finance/installments
// @access  Private/Admin
exports.getInstallments = async (req, res) => {
  try {
    const { status, student_id } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (student_id) query.student_id = student_id;

    const installments = await Installment.find(query)
      .populate('student_id', 'name email phone batch timing courseName')
      .sort({ due_date: 1 });
      
    res.status(200).json(installments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching installments', error: error.message });
  }
};

// @desc    Mark an installment as paid & record history
// @route   POST /api/finance/installments/:id/pay
// @access  Private/Admin
exports.markInstallmentPaid = async (req, res) => {
  try {
    const { paid_amount, payment_mode, reference_id, receipt_url } = req.body;
    const installmentId = req.params.id;

    // 1. Find and update the installment
    const installment = await Installment.findById(installmentId).populate('student_id', 'name email');
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }
    
    if (installment.status === 'Paid') {
      return res.status(400).json({ message: 'Installment is already marked as paid.' });
    }

    // If paid_amount differs, we adjust the installment strictly to match what is paid.
    if (paid_amount && typeof paid_amount === 'number') {
        installment.amount = paid_amount;
    }

    installment.status = 'Paid';
    installment.paid_date = new Date();
    installment.payment_mode = payment_mode;
    await installment.save();

    // 2. Create the payment history record
    const paymentRecord = new PaymentHistory({
      installment_id: installment._id,
      paid_amount: installment.amount, // It's strictly synchronized now
      payment_mode,
      reference_id,
      receipt_url
    });
    await paymentRecord.save();

    // 3. Trigger Email receipt generation
    if (installment.student_id?.email) {
      try {
        const settings = await Setting.findOne() || {};
        const emailHtml = generatePaymentConfirmationTemplate(
          installment.student_id.name,
          paid_amount || installment.amount,
          installment.installment_no,
          settings
        );

        const attachments = [];
        if (req.body.receipt_base64) {
          // Robustly extract base64 data by splitting at the comma
          const base64Parts = req.body.receipt_base64.split(',');
          const base64Data = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];
          
          attachments.push({
            filename: `Receipt_REC-${installment._id.toString().slice(-6).toUpperCase()}.pdf`,
            content: base64Data,
            encoding: 'base64',
            contentType: 'application/pdf'
          });
          console.log(`PDF receipt prepared for attachment. Size: ${Math.round(base64Data.length / 1024)} KB`);
        } else {
          console.warn("No receipt_base64 found in request body for installment:", installment._id);
        }

        await sendEmail(
          installment.student_id.email,
          `Payment Received: Official Receipt #[REC-${installment._id.toString().slice(-6).toUpperCase()}]`,
          emailHtml,
          attachments
        );
        console.log(`Receipt email sent to ${installment.student_id.email}`);
      } catch (emailErr) {
        console.error('Failed to send receipt email:', emailErr);
      }
    }

    res.status(200).json({ message: 'Payment recorded and receipt sent successfully', payment: paymentRecord });
  } catch (error) {
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
};

// @desc    Get payment details for an installment
// @route   GET /api/finance/installments/:id/payment
// @access  Private/Admin
exports.getPaymentDetails = async (req, res) => {
  try {
    const payment = await PaymentHistory.findOne({ installment_id: req.params.id });
    if (!payment) {
      return res.status(404).json({ message: 'No payment record found for this installment' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment details', error: error.message });
  }
};

// @desc    Delete a specific installment
// @route   DELETE /api/finance/installments/:id
// @access  Private/Admin
exports.deleteInstallment = async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }
    
    // Check if the installment is paid - maybe warn or prevent? 
    // For now, allow deletion but could add logic if needed.
    
    // Delete the installment
    const fsId = installment.fee_structure_id;
    await installment.deleteOne();
    
    // Check if any installments remain for this fee structure
    const remainingCount = await Installment.countDocuments({ fee_structure_id: fsId });
    if (remainingCount === 0) {
      await FeeStructure.deleteOne({ _id: fsId });
      console.log('Orphaned FeeStructure deleted after last installment removed.');
    }

    res.status(200).json({ message: 'Installment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting installment', error: error.message });
  }
};

// @desc    Send manual reminder for a specific installment
// @route   POST /api/finance/installments/:id/remind
// @access  Private/Admin
exports.sendManualReminder = async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id).populate('student_id', 'name email');
    if (!installment) return res.status(404).json({ message: 'Installment not found' });
    if (installment.status === 'Paid') return res.status(400).json({ message: 'Installment is already paid.' });

    if (!installment.student_id.email) {
      return res.status(400).json({ message: 'Student does not have an email address on file.' });
    }

    // Fetch site settings for branding
    const settings = await Setting.findOne() || {};

    // Send email using our email service and template
    const emailHtml = generateFeeReminderTemplate(
      installment.student_id.name,
      installment.amount,
      installment.due_date,
      installment.installment_no,
      settings
    );

    const subject = `Fee Reminder: Installment #${installment.installment_no} is due soon`;
    
    await sendEmail(installment.student_id.email, subject, emailHtml);

    res.status(200).json({ message: `Reminder email sent to ${installment.student_id.email}` });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reminder', error: error.message });
  }
};


// @desc    Edit a pending or overdue installment
// @route   PUT /api/finance/installments/:id
// @access  Private/Admin
exports.editInstallment = async (req, res) => {
  try {
    const { amount, due_date } = req.body;
    const installment = await Installment.findById(req.params.id);
    
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }
    
    if (installment.status === 'Paid') {
      return res.status(400).json({ message: 'Cannot modify an installment that is already paid.' });
    }

    if (amount) installment.amount = amount;
    if (due_date) {
        const newDueDate = new Date(due_date);
        installment.due_date = newDueDate;

        // RE-CALCULATE STATUS for non-paid installments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (newDueDate < today) {
            installment.status = 'Overdue';
        } else {
            installment.status = 'Pending';
        }
    }

    await installment.save();
    
    res.status(200).json({ message: 'Installment updated successfully', installment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating installment', error: error.message });
  }
};

// @desc    Create a custom individual installment for a fee structure
// @route   POST /api/finance/installments/standalone
// @access  Private/Admin
exports.createStandaloneInstallment = async (req, res) => {
  try {
    const { student_id, fee_structure_id, amount, due_date } = req.body;
    
    if (!student_id || !fee_structure_id || !amount || !due_date) {
      return res.status(400).json({ message: 'Missing required fields for installment creation.' });
    }

    // Verify FeeStructure exists
    const fs = await FeeStructure.findById(fee_structure_id);
    if (!fs) {
      return res.status(404).json({ message: 'Fee Structure not found' });
    }

    // Determine next installment number
    const maxInstallment = await Installment.findOne({ fee_structure_id }).sort('-installment_no');
    const nextNo = maxInstallment ? maxInstallment.installment_no + 1 : 1;

    const dueDateObj = new Date(due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const status = dueDateObj < today ? 'Overdue' : 'Pending';

    const installment = new Installment({
      student_id,
      fee_structure_id,
      installment_no: nextNo,
      amount,
      due_date: dueDateObj,
      status: status
    });

    await installment.save();
    
    // Increment total installments counter
    fs.total_installments += 1;
    await fs.save();

    res.status(201).json({ message: 'Custom installment created successfully', installment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating custom installment', error: error.message });
  }
};

// @desc    Generate and stream receipt PDF for an installment
// @route   GET /api/finance/installments/:id/receipt-pdf
// @access  Private
exports.getReceiptPDF = async (req, res) => {
  try {
    const installmentId = req.params.id;

    // 1. Fetch Installment
    const installment = await Installment.findById(installmentId).populate('student_id');
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    // 2. Fetch Payment details
    const payment = await PaymentHistory.findOne({ installment_id: installmentId });

    // 3. Fetch Settings
    const settings = await Setting.findOne() || {};

    // 4. Fetch Batch Name
    const BatchStudent = require('../models/BatchStudent');
    const batchStudent = await BatchStudent.findOne({ studentId: installment.student_id?._id }).populate('batchId');
    const batchName = batchStudent?.batchId?.name || '';

    // 5. Calculate Fee Summary (total, pending, previousPaid, isSubscription)
    const allInst = await Installment.find({ student_id: installment.student_id?._id });
    const isSubscription = installment.installment_no === 99;
    const courseInstallments = allInst.filter(i => i.installment_no !== 99);
    
    const totalPaidAtTime = courseInstallments
        .filter(i => (i.status === 'Paid' || i._id.toString() === installment._id.toString()) && i.installment_no <= installment.installment_no)
        .reduce((sum, i) => sum + i.amount, 0);
    
    const totalFee = courseInstallments.reduce((sum, i) => sum + i.amount, 0);
    const previousPaid = isSubscription ? 0 : totalPaidAtTime - installment.amount;
    const pending = totalFee - (isSubscription ? 0 : totalPaidAtTime);

    const feeSummary = {
      total: totalFee,
      pending,
      previousPaid,
      isSubscription
    };

    // 6. Generate Receipt PDF
    const { generateReceiptPDF } = require('../utils/pdfGenerator');
    await generateReceiptPDF({
      installment,
      payment,
      settings,
      feeSummary,
      batchName
    }, res);

  } catch (error) {
    console.error("Failed to generate receipt PDF:", error);
    res.status(500).json({ message: 'Error generating receipt PDF', error: error.message });
  }
};
