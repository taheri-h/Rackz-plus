import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { trackButtonClick, trackConsultationClick } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSetupClick = (packageName: string) => {
    // Route directly to signup with redirect to setup form
    navigate(`/signup?redirect=/setup-form/${packageName}`);
  };

  const faqs = [
    {
      question: 'Do you see card data?',
      answer: 'No. We use secure collaborator access. No sensitive data is visible.'
    },
    {
      question: 'Will this break my current checkout?',
      answer: 'No. We test everything safely before going live.'
    },
    {
      question: 'Do I need a developer?',
      answer: 'No. We handle the full setup end-to-end.'
    },
    {
      question: 'Does this work with Shopify, WordPress, Webflow?',
      answer: 'Yes, all major platforms are supported.'
    },
    {
      question: 'Can you fix existing issues?',
      answer: 'Yes. Fynteq Pulse detects errors, and our team can resolve them.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Done-for-you Stripe & PayPal Setup | Fynteq</title>
        <meta name="description" content="Professional setup for checkouts, subscriptions, CRM integrations, and marketplaces. Fast, fixed-price, and fully compliant. Go live in days, not weeks." />
        <meta name="keywords" content="stripe setup, stripe integration service, paypal integration, stripe billing setup, stripe checkout setup, stripe developer europe, stripe consultant, payment setup service, stripe connect setup, salesforce stripe integration" />
        <link rel="canonical" href="https://fynteq.com/setup" />
        <meta property="og:title" content="Done-for-you Stripe & PayPal Setup | Fynteq" />
        <meta property="og:description" content="Professional setup for checkouts, subscriptions, CRM integrations, and marketplaces. Fast, fixed-price, and fully compliant." />
        <meta property="og:url" content="https://fynteq.com/setup" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4 leading-tight">
              Done-for-you Stripe & PayPal Setup
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto mb-6">
              Professional setup for checkouts, subscriptions, CRM integrations, and marketplaces. Fast, fixed-price, and fully compliant.
            </p>
            <p className="text-base text-slate-700 font-medium mb-8">
              Go live in days, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://calendly.com/fynteq/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary"
                onClick={() => trackConsultationClick('Setup Page')}
              >
                Book a Setup Call
              </a>
              <a
                href="#packages"
                className="button-secondary"
                onClick={() => {
                  const element = document.getElementById('packages');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                View Packages
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Fynteq Setup */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-8 text-center">Why Fynteq Setup?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">Fast delivery</div>
              <div className="text-sm text-slate-600">2–10 days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">Fixed pricing</div>
              <div className="text-sm text-slate-600">No surprises</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">PCI-aware</div>
              <div className="text-sm text-slate-600">Secure implementation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">All platforms</div>
              <div className="text-sm text-slate-600">Creators, SaaS, e-commerce</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">Pulse ready</div>
              <div className="text-sm text-slate-600">Works with monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Packages */}
      <section id="packages" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Our Setup Packages (Fixed Price)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Package 1 */}
            <div className="card p-8 pb-2.5 flex flex-col h-full">
              <div className="flex flex-col flex-grow gap-6">
                <div className="flex-grow">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-2">Stripe Checkout Setup - €299</h3>
                  <p className="text-xs text-slate-500 mb-2 text-left">50% upfront, 50% after delivery.</p>
                  <p className="text-slate-600 mb-4">Get paid online in 2–3 days.</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Stripe Checkout or Payment Element</li>
                    <li>• Apple Pay & Google Pay setup</li>
                    <li>• Success/cancel pages + branded receipts</li>
                    <li>• Webhook setup + 1 live test payment</li>
                  </ul>
                  <p className="mt-4 text-sm font-medium text-slate-700">Outcome: faster checkout, fewer drop-offs.</p>
                </div>
                <button
                  onClick={() => handleSetupClick('checkout')}
                  className="button-primary w-full text-center mt-auto"
                >
                  Start Checkout Setup
                </button>
              </div>
            </div>

            {/* Package 2 */}
            <div className="card p-8 pb-2.5 flex flex-col h-full">
              <div className="flex flex-col flex-grow gap-6">
                <div className="flex-grow">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-2">Subscriptions Setup - €749</h3>
                  <p className="text-xs text-slate-500 mb-2 text-left">50% upfront, 50% after delivery.</p>
                  <p className="text-slate-600 mb-4">Turn one-time buyers into recurring revenue.</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Stripe Billing configuration</li>
                    <li>• Plans, trials, coupons, upgrades/downgrades</li>
                    <li>• Smart dunning + retry logic</li>
                    <li>• Customer Portal setup</li>
                    <li>• 1 live subscription test</li>
                  </ul>
                  <p className="mt-4 text-sm font-medium text-slate-700">Outcome: predictable revenue with fewer failed renewals.</p>
                </div>
                <button
                  onClick={() => handleSetupClick('subscriptions')}
                  className="button-primary w-full text-center mt-auto"
                >
                  Launch Subscriptions
                </button>
              </div>
            </div>

            {/* Package 3 */}
            <div className="card p-8 pb-2.5 flex flex-col h-full">
              <div className="flex flex-col flex-grow gap-6">
                <div className="flex-grow">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-2">CRM Integration (Salesforce / HubSpot) - €1499</h3>
                  <p className="text-xs text-slate-500 mb-2 text-left">50% upfront, 50% after delivery.</p>
                  <p className="text-slate-600 mb-4">Connect payments with your CRM in 7–10 days.</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Install & configure Stripe connector</li>
                    <li>• Sync customers, invoices, subscriptions</li>
                    <li>• Webhooks → CRM alerts</li>
                    <li>• Reconciliation mapping</li>
                    <li>• Ops handover documentation</li>
                  </ul>
                  <p className="mt-4 text-sm font-medium text-slate-700">Outcome: one source of truth for Sales, Finance, and Ops.</p>
                </div>
                <button
                  onClick={() => handleSetupClick('crm')}
                  className="button-primary w-full text-center mt-auto"
                >
                  Integrate My CRM
                </button>
              </div>
            </div>

            {/* Package 4 */}
            <div className="card p-8 pb-2.5 flex flex-col h-full">
              <div className="flex flex-col flex-grow gap-6">
                <div className="flex-grow">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-2">Marketplace Setup (Stripe Connect) - from €1999</h3>
                  <p className="text-xs text-slate-500 mb-2 text-left">50% upfront, 50% after delivery.</p>
                  <p className="text-slate-600 mb-4">Build your platform like Etsy or Airbnb.</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Connect Express onboarding</li>
                    <li>• Vendor KYC & payout automation</li>
                    <li>• Application fees and split payouts</li>
                    <li>• 1 vendor test + operations runbook</li>
                  </ul>
                  <p className="mt-4 text-sm font-medium text-slate-700">Outcome: compliant vendor onboarding & smooth payouts.</p>
                </div>
                <button
                  onClick={() => handleSetupClick('marketplace')}
                  className="button-primary w-full text-center mt-auto"
                >
                  Build My Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-12 text-center">Who This Is For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Coaches & creators', 'Small e-commerce brands', 'SaaS & membership platforms', 'Marketplaces', 'Agencies', 'Startups needing fast, reliable payment setup'].map((item, index) => (
              <div key={index} className="card p-6 text-center">
                <p className="text-base font-medium text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Setup Works */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-12 text-center">How Setup Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a package</h3>
              <p className="text-sm text-slate-600">Pick the setup that fits your business.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">We configure & test everything</h3>
              <p className="text-sm text-slate-600">Stripe, PayPal, Connect, webhooks, subscriptions. Fully verified.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">You go live with confidence</h3>
              <p className="text-sm text-slate-600">Documentation + 30-day support included.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-12 text-center">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="card overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-50/50 transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="font-medium text-slate-900 pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-500 transition-transform duration-200 flex-shrink-0 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Ready to get set up?</h2>
          <p className="text-lg text-slate-600 mb-8">Let's build your Stripe & PayPal foundation the right way.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://calendly.com/fynteq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary"
              onClick={() => trackConsultationClick('Setup Page CTA')}
            >
              Book a Setup Call
            </a>
            <a
              href="#packages"
              className="button-secondary"
              onClick={() => {
                const element = document.getElementById('packages');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              View Packages
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Setup;

