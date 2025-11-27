const getRecentPayments = async (stripe, stripeAccountId, options = {}) => {
  const {
    limit = 100,
    createdGte,
    createdLte,
  } = options;

  const createdFilter = {};
  if (createdGte) {
    createdFilter.gte = createdGte;
  }
  if (createdLte) {
    createdFilter.lte = createdLte;
  }

  // Helper: normalize a payment intent into our internal payment shape
  const normalizeFromPaymentIntent = (pi) => {
    const lastError = pi.last_payment_error || {};
    const latestCharge =
      (pi.charges && pi.charges.data && pi.charges.data[0]) || null;

    const amount = pi.amount || latestCharge?.amount || 0;
    const currency = pi.currency || latestCharge?.currency || null;

    const customerEmail =
      pi.receipt_email ||
      pi.customer_details?.email ||
      latestCharge?.billing_details?.email ||
      latestCharge?.receipt_email ||
      null;

    return {
      id: pi.id,
      source: "payment_intent",
      amount,
      currency,
      created: pi.created,
      status: pi.status,
      paid: pi.status === "succeeded",
      customer: customerEmail,
      failure_code:
        lastError.code ||
        latestCharge?.failure_code ||
        latestCharge?.outcome?.reason ||
        null,
      failure_message:
        lastError.message ||
        latestCharge?.failure_message ||
        latestCharge?.outcome?.seller_message ||
        null,
    };
  };

  // Helper: normalize a charge into our internal payment shape
  const normalizeFromCharge = (charge) => ({
    id: charge.id,
    source: "charge",
    amount: charge.amount,
    currency: charge.currency,
    created: charge.created,
    status: charge.status,
    paid: charge.paid && charge.status === "succeeded",
    customer:
      charge.billing_details?.email || charge.receipt_email || null,
    failure_code: charge.failure_code || charge.outcome?.reason || null,
    failure_message:
      charge.failure_message ||
      charge.outcome?.seller_message ||
      null,
  });

  // 1) Try payment_intents first
  try {
    const piList = await stripe.paymentIntents.list(
      {
        limit,
        ...(Object.keys(createdFilter).length
          ? { created: createdFilter }
          : {}),
        expand: ["data.charges"],
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    if (piList && piList.data && piList.data.length > 0) {
      const payments = piList.data.map(normalizeFromPaymentIntent);
      return { payments, usedSource: "payment_intents" };
    }
  } catch (err) {
    console.error("Error fetching payment_intents, falling back to charges:", err);
  }

  // 2) Fallback to charges
  const chargesList = await stripe.charges.list(
    {
      limit,
      ...(Object.keys(createdFilter).length
        ? { created: createdFilter }
        : {}),
    },
    {
      stripeAccount: stripeAccountId,
    }
  );

  const payments = (chargesList.data || []).map(normalizeFromCharge);
  return { payments, usedSource: "charges" };
};

module.exports = {
  getRecentPayments,
};


