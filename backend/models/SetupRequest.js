const mongoose = require('mongoose');

const setupRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  packageName: {
    type: String,
    enum: ['checkout', 'subscriptions', 'crm', 'marketplace'],
    required: true,
  },
  fullPriceCents: {
    type: Number,
    required: true,
  },
  upfrontPaidCents: {
    type: Number,
    default: 0,
  },
  remainingCents: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['initiated', 'upfront_paid', 'in_progress', 'delivered', 'completed', 'cancelled'],
    default: 'initiated',
  },
  contactMethod: {
    type: String,
    enum: ['email', 'phone', 'whatsapp'],
    required: true,
  },
  details: {
    company: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    industry: {
      type: String,
      default: null,
    },
    businessType: {
      type: String,
      default: null,
    },
    monthlyRevenue: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    currentPaymentProvider: {
      type: String,
      default: null,
    },
    platform: {
      type: String,
      default: null,
    },
    crm: {
      type: String,
      default: null,
    },
    additionalRequirements: {
      type: String,
      default: null,
    },
    timeline: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
}, {
  timestamps: true,
  collection: 'setuprequests', // Explicit collection name
});

// Indexes
setupRequestSchema.index({ userId: 1, createdAt: -1 });
setupRequestSchema.index({ status: 1 });

module.exports = mongoose.model('SetupRequest', setupRequestSchema);

