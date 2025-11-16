const mongoose = require('mongoose');

const connectedProviderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: String,
    enum: ['stripe', 'paypal', 'shopify', 'adyen'],
    required: true,
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'connected',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  collection: 'connectedproviders', // Explicit collection name
});

// Indexes - unique combination of userId and provider
connectedProviderSchema.index({ userId: 1, provider: 1 }, { unique: true });
connectedProviderSchema.index({ status: 1 });

module.exports = mongoose.model('ConnectedProvider', connectedProviderSchema);

