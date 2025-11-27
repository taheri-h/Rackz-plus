const mongoose = require('mongoose');

const stripeSubscriptionsCacheSchema = new mongoose.Schema({
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
  subscriptions: {
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

// Unique index per user
stripeSubscriptionsCacheSchema.index({ userId: 1 }, { unique: true });

// TTL index - auto-delete documents older than 1 hour
stripeSubscriptionsCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('StripeSubscriptionsCache', stripeSubscriptionsCacheSchema);

