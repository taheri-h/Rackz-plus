const mongoose = require('mongoose');

const saasPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['starter', 'pro', 'scale'],
    required: true,
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
  },
  amountCents: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'EUR',
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending',
  },
  provider: {
    type: String,
    enum: ['stripe', 'manual'],
    default: 'stripe',
  },
  providerPaymentId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  collection: 'saaspayments', // Explicit collection name
});

// Indexes
saasPaymentSchema.index({ userId: 1, createdAt: -1 });
saasPaymentSchema.index({ status: 1 });

module.exports = mongoose.model('SaasPayment', saasPaymentSchema);

