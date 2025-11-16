const express = require('express');
const ConnectedProvider = require('../models/ConnectedProvider');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/providers/connect
// @desc    Connect a payment provider
// @access  Private
router.post('/connect', auth, async (req, res) => {
  try {
    const { provider, metadata } = req.body;

    // Validation
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    if (!['stripe', 'paypal', 'shopify', 'adyen'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Check if already connected
    const existing = await ConnectedProvider.findOne({
      userId: req.user._id,
      provider,
    });

    if (existing) {
      // Update existing connection
      existing.status = 'connected';
      existing.metadata = metadata || {};
      await existing.save();

      return res.json({
        provider: {
          id: existing._id,
          provider: existing.provider,
          status: existing.status,
          metadata: existing.metadata,
        },
      });
    }

    // Create new connection
    const connectedProvider = new ConnectedProvider({
      userId: req.user._id,
      provider,
      status: 'connected',
      metadata: metadata || {},
    });

    await connectedProvider.save();

    res.status(201).json({
      provider: {
        id: connectedProvider._id,
        provider: connectedProvider.provider,
        status: connectedProvider.status,
        metadata: connectedProvider.metadata,
      },
    });
  } catch (error) {
    console.error('Connect provider error:', error);
    res.status(500).json({ error: 'Server error connecting provider' });
  }
});

// @route   DELETE /api/providers/:provider
// @desc    Disconnect a payment provider
// @access  Private
router.delete('/:provider', auth, async (req, res) => {
  try {
    const { provider } = req.params;

    if (!['stripe', 'paypal', 'shopify', 'adyen'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const connectedProvider = await ConnectedProvider.findOneAndUpdate(
      {
        userId: req.user._id,
        provider,
      },
      {
        status: 'disconnected',
      },
      {
        new: true,
      }
    );

    if (!connectedProvider) {
      return res.status(404).json({ error: 'Provider connection not found' });
    }

    res.json({
      message: 'Provider disconnected',
      provider: {
        id: connectedProvider._id,
        provider: connectedProvider.provider,
        status: connectedProvider.status,
      },
    });
  } catch (error) {
    console.error('Disconnect provider error:', error);
    res.status(500).json({ error: 'Server error disconnecting provider' });
  }
});

// @route   GET /api/providers
// @desc    Get user's connected providers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const providers = await ConnectedProvider.find({
      userId: req.user._id,
      status: 'connected',
    });

    res.json({
      providers: providers.map(p => ({
        id: p._id,
        provider: p.provider,
        status: p.status,
        metadata: p.metadata,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Server error fetching providers' });
  }
});

module.exports = router;

