const mongoose = require('mongoose');

const stripeChargesCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  stripeAccountId: {
    type: String,
    required: true,
    index: true,
  },
  rangeDays: {
    type: Number,
    required: true,
    enum: [7, 30, 90, 180, 365],
  },
  charges: {
    type: Array,
    default: [],
  },
  cachedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for fast lookups
stripeChargesCacheSchema.index({ userId: 1, rangeDays: 1 }, { unique: true });

// TTL index - auto-delete documents older than 1 hour
stripeChargesCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('StripeChargesCache', stripeChargesCacheSchema);

