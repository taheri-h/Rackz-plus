const mongoose = require('mongoose');

const setupPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  setupRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SetupRequest',
    required: true,
  },
  chargeType: {
    type: String,
    enum: ['upfront', 'final'],
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
  collection: 'setuppayments', // Explicit collection name
});

// Indexes
setupPaymentSchema.index({ setupRequestId: 1, chargeType: 1 });
setupPaymentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SetupPayment', setupPaymentSchema);

