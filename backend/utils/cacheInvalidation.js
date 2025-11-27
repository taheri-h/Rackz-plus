const StripeChargesCache = require("../models/StripeChargesCache");
const StripeSubscriptionsCache = require("../models/StripeSubscriptionsCache");
const StripeSummaryCache = require("../models/StripeSummaryCache");
const User = require("../models/User");

/**
 * Invalidate all Stripe cache for a specific user
 * @param {string|ObjectId} userId - User ID or user object
 * @param {string} reason - Reason for invalidation (for logging)
 */
async function invalidateUserStripeCache(userId, reason = "Manual invalidation") {
  try {
    const userIdStr = userId.toString ? userId.toString() : userId;
    
    // Delete all cache entries for this user
    const [chargesDeleted, subscriptionsDeleted, summaryDeleted] = await Promise.all([
      StripeChargesCache.deleteMany({ userId: userIdStr }),
      StripeSubscriptionsCache.deleteMany({ userId: userIdStr }),
      StripeSummaryCache.deleteMany({ userId: userIdStr }),
    ]);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️  Invalidated Stripe cache for user ${userIdStr} (${reason}):`, {
        charges: chargesDeleted.deletedCount,
        subscriptions: subscriptionsDeleted.deletedCount,
        summary: summaryDeleted.deletedCount,
      });
    }

    return {
      charges: chargesDeleted.deletedCount,
      subscriptions: subscriptionsDeleted.deletedCount,
      summary: summaryDeleted.deletedCount,
    };
  } catch (error) {
    console.error("Error invalidating cache:", error);
    throw error;
  }
}

/**
 * Invalidate cache for a specific Stripe account (by account ID)
 * Useful when webhook events come in for a connected account
 * @param {string} stripeAccountId - Stripe account ID (acct_xxx)
 * @param {string} reason - Reason for invalidation
 */
async function invalidateStripeAccountCache(stripeAccountId, reason = "Webhook event") {
  try {
    // Find all users with this Stripe account
    const users = await User.find({ stripeAccountId });
    
    if (users.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️  No users found for Stripe account ${stripeAccountId}`);
      }
      return { users: 0, totalDeleted: 0 };
    }

    // Invalidate cache for all users with this account
    const results = await Promise.all(
      users.map((user) => invalidateUserStripeCache(user._id, reason))
    );

    const totalDeleted = results.reduce(
      (sum, r) => sum + r.charges + r.subscriptions + r.summary,
      0
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🗑️  Invalidated cache for ${users.length} user(s) with Stripe account ${stripeAccountId}: ${totalDeleted} cache entries`
      );
    }

    return {
      users: users.length,
      totalDeleted,
    };
  } catch (error) {
    console.error("Error invalidating cache by Stripe account:", error);
    throw error;
  }
}

/**
 * Invalidate specific cache types for a user
 * @param {string|ObjectId} userId - User ID
 * @param {Object} options - Which caches to invalidate
 */
async function invalidateSpecificCache(userId, options = {}) {
  try {
    const userIdStr = userId.toString ? userId.toString() : userId;
    const {
      charges = false,
      subscriptions = false,
      summary = false,
      rangeDays = null, // If specified, only invalidate this range
    } = options;

    const deletions = {};

    if (charges) {
      const query = { userId: userIdStr };
      if (rangeDays) {
        query.rangeDays = rangeDays;
      }
      const result = await StripeChargesCache.deleteMany(query);
      deletions.charges = result.deletedCount;
    }

    if (subscriptions) {
      const result = await StripeSubscriptionsCache.deleteMany({ userId: userIdStr });
      deletions.subscriptions = result.deletedCount;
    }

    if (summary) {
      const query = { userId: userIdStr };
      if (rangeDays) {
        query.rangeDays = rangeDays;
      }
      const result = await StripeSummaryCache.deleteMany(query);
      deletions.summary = result.deletedCount;
    }

    return deletions;
  } catch (error) {
    console.error("Error invalidating specific cache:", error);
    throw error;
  }
}

module.exports = {
  invalidateUserStripeCache,
  invalidateStripeAccountCache,
  invalidateSpecificCache,
};

