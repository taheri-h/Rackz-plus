const express = require('express');
const SaasPayment = require('../models/SaasPayment');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/saas
// @desc    Create a SaaS payment record
// @access  Private
router.post('/saas', auth, async (req, res) => {
  try {
    const { plan, billingCycle, amountCents, status, providerPaymentId } = req.body;

    // Validation
    if (!plan || !billingCycle || !amountCents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['starter', 'pro', 'scale'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // Create payment record
    const payment = new SaasPayment({
      userId: req.user._id,
      plan,
      billingCycle,
      amountCents,
      status: status || 'pending',
      providerPaymentId: providerPaymentId || null,
    });

    await payment.save();

    // Update user entitlements if payment succeeded
    if (payment.status === 'succeeded') {
      await User.findByIdAndUpdate(req.user._id, {
        'entitlements.saasPlan': plan,
      });
    }

    res.status(201).json({
      payment: {
        id: payment._id,
        plan: payment.plan,
        billingCycle: payment.billingCycle,
        amountCents: payment.amountCents,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Server error creating payment' });
  }
});

// @route   GET /api/payments/saas
// @desc    Get user's SaaS payments
// @access  Private
router.get('/saas', auth, async (req, res) => {
  try {
    const payments = await SaasPayment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      payments: payments.map(p => ({
        id: p._id,
        plan: p.plan,
        billingCycle: p.billingCycle,
        amountCents: p.amountCents,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Server error fetching payments' });
  }
});

module.exports = router;

