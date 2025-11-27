const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    account: {
      type: String,
      default: null,
      index: true,
    },
    apiVersion: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      required: true,
      index: true,
    },
    livemode: {
      type: Boolean,
      default: false,
    },
    requestId: {
      type: String,
      default: null,
    },
    relatedObjectId: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["received", "processed", "failed"],
      default: "received",
      index: true,
    },
    raw: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);


