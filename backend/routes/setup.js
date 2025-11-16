const express = require('express');
const SetupRequest = require('../models/SetupRequest');
const SetupPayment = require('../models/SetupPayment');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Package prices in cents
const PACKAGE_PRICES = {
  checkout: 29900,      // €299
  subscriptions: 74900, // €749
  crm: 149900,          // €1499
  marketplace: 199900,  // from €1999
};

// @route   POST /api/setup/request
// @desc    Create a setup request
// @access  Private
router.post('/request', auth, async (req, res) => {
  try {
    const { 
      packageName, 
      contactMethod, 
      // Form details
      company,
      website,
      phone,
      industry,
      businessType,
      monthlyRevenue,
      country,
      currentPaymentProvider,
      platform,
      crm,
      additionalRequirements,
      timeline,
      timezone,
      notes
    } = req.body;

    // Validation
    if (!packageName || !contactMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['checkout', 'subscriptions', 'crm', 'marketplace'].includes(packageName)) {
      return res.status(400).json({ error: 'Invalid package name' });
    }

    if (!['email', 'phone', 'whatsapp'].includes(contactMethod)) {
      return res.status(400).json({ error: 'Invalid contact method' });
    }

    const fullPriceCents = PACKAGE_PRICES[packageName];
    const upfrontPaidCents = Math.ceil(fullPriceCents / 2);
    const remainingCents = fullPriceCents - upfrontPaidCents;

    // Sanitize string inputs
    const sanitizeString = (str) => str ? String(str).trim().substring(0, 500) : null;

    // Create setup request with all form details (sanitized)
    const setupRequest = new SetupRequest({
      userId: req.user._id,
      packageName,
      fullPriceCents,
      upfrontPaidCents: 0, // Will be updated after payment
      remainingCents,
      status: 'initiated',
      contactMethod,
      details: {
        company: sanitizeString(company),
        website: sanitizeString(website),
        phone: sanitizeString(phone),
        industry: sanitizeString(industry),
        businessType: sanitizeString(businessType),
        monthlyRevenue: sanitizeString(monthlyRevenue),
        country: sanitizeString(country),
        currentPaymentProvider: sanitizeString(currentPaymentProvider),
        platform: sanitizeString(platform),
        crm: sanitizeString(crm),
        additionalRequirements: sanitizeString(additionalRequirements),
        timeline: sanitizeString(timeline),
        timezone: sanitizeString(timezone),
        notes: sanitizeString(notes),
      },
    });

    await setupRequest.save();

    // Update user entitlements
    await User.findByIdAndUpdate(req.user._id, {
      'entitlements.setupEligible': true,
    });

    res.status(201).json({
      setupRequest: {
        id: setupRequest._id,
        packageName: setupRequest.packageName,
        fullPriceCents: setupRequest.fullPriceCents,
        upfrontPaidCents: setupRequest.upfrontPaidCents,
        remainingCents: setupRequest.remainingCents,
        status: setupRequest.status,
        contactMethod: setupRequest.contactMethod,
        details: setupRequest.details,
        createdAt: setupRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Create setup request error:', error);
    res.status(500).json({ error: 'Server error creating setup request' });
  }
});

// @route   POST /api/setup/payment
// @desc    Create a setup payment (upfront or final)
// @access  Private
router.post('/payment', auth, async (req, res) => {
  try {
    const { setupRequestId, chargeType, amountCents, status, providerPaymentId } = req.body;

    // Validation
    if (!setupRequestId || !chargeType || !amountCents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate setupRequestId is a valid ObjectId
    if (!setupRequestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid setup request ID' });
    }

    if (!['upfront', 'final'].includes(chargeType)) {
      return res.status(400).json({ error: 'Invalid charge type' });
    }

    // Validate amountCents is a positive number
    const amount = parseInt(amountCents, 10);
    if (isNaN(amount) || amount <= 0 || amount > 100000000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Find setup request (userId ensures user isolation)
    const setupRequest = await SetupRequest.findOne({
      _id: setupRequestId,
      userId: req.user._id,
    });

    if (!setupRequest) {
      return res.status(404).json({ error: 'Setup request not found' });
    }

    // Create payment record
    const payment = new SetupPayment({
      userId: req.user._id,
      setupRequestId,
      chargeType,
      amountCents: amount,
      status: status && ['pending', 'succeeded', 'failed', 'refunded'].includes(status) ? status : 'pending',
      provider: 'stripe',
      providerPaymentId: providerPaymentId ? String(providerPaymentId).trim().substring(0, 200) : null,
    });

    await payment.save();

    // Update setup request if payment succeeded
    if (payment.status === 'succeeded') {
      if (chargeType === 'upfront') {
        setupRequest.upfrontPaidCents = amountCents;
        setupRequest.remainingCents = setupRequest.fullPriceCents - amountCents;
        setupRequest.status = 'upfront_paid';
      } else if (chargeType === 'final') {
        setupRequest.remainingCents = Math.max(0, setupRequest.remainingCents - amountCents);
        if (setupRequest.remainingCents === 0) {
          setupRequest.status = 'completed';
        }
      }
      await setupRequest.save();
    }

    res.status(201).json({
      payment: {
        id: payment._id,
        setupRequestId: payment.setupRequestId,
        chargeType: payment.chargeType,
        amountCents: payment.amountCents,
        status: payment.status,
        createdAt: payment.createdAt,
      },
      setupRequest: {
        id: setupRequest._id,
        status: setupRequest.status,
        upfrontPaidCents: setupRequest.upfrontPaidCents,
        remainingCents: setupRequest.remainingCents,
      },
    });
  } catch (error) {
    console.error('Create setup payment error:', error);
    res.status(500).json({ error: 'Server error creating setup payment' });
  }
});

// @route   GET /api/setup/requests
// @desc    Get user's setup requests
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await SetupRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map(r => ({
        id: r._id,
        packageName: r.packageName,
        fullPriceCents: r.fullPriceCents,
        upfrontPaidCents: r.upfrontPaidCents,
        remainingCents: r.remainingCents,
        status: r.status,
        contactMethod: r.contactMethod,
        details: r.details || {},
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get setup requests error:', error);
    res.status(500).json({ error: 'Server error fetching setup requests' });
  }
});

// @route   GET /api/setup/status/:requestId
// @desc    Get setup request status
// @access  Private
router.get('/status/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Validate requestId is a valid ObjectId
    if (!requestId || !requestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const setupRequest = await SetupRequest.findOne({
      _id: requestId,
      userId: req.user._id,
    });

    if (!setupRequest) {
      return res.status(404).json({ error: 'Setup request not found' });
    }

    // Get payments for this request
    const payments = await SetupPayment.find({ setupRequestId: requestId })
      .sort({ createdAt: -1 });

    res.json({
      setupRequest: {
        id: setupRequest._id,
        packageName: setupRequest.packageName,
        fullPriceCents: setupRequest.fullPriceCents,
        upfrontPaidCents: setupRequest.upfrontPaidCents,
        remainingCents: setupRequest.remainingCents,
        status: setupRequest.status,
        contactMethod: setupRequest.contactMethod,
        details: setupRequest.details,
        createdAt: setupRequest.createdAt,
        updatedAt: setupRequest.updatedAt,
      },
      payments: payments.map(p => ({
        id: p._id,
        chargeType: p.chargeType,
        amountCents: p.amountCents,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get setup status error:', error);
    res.status(500).json({ error: 'Server error fetching setup status' });
  }
});

module.exports = router;

