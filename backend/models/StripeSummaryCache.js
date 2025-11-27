const mongoose = require('mongoose');

const stripeSummaryCacheSchema = new mongoose.Schema({
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
  offsetDays: {
    type: Number,
    default: 0,
  },
  summary: {
    totalVolume: Number,
    currency: String,
    totalCount: Number,
    failedCount: Number,
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
stripeSummaryCacheSchema.index({ userId: 1, rangeDays: 1, offsetDays: 1 }, { unique: true });

// TTL index - auto-delete documents older than 1 hour
stripeSummaryCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('StripeSummaryCache', stripeSummaryCacheSchema);

