import React, { useState } from 'react';
import { trackConsultationClick, trackButtonClick } from '../../utils/analytics';

const FAQ_ITEMS: Array<{ question: string; answer: string }> = [
    {
      question: 'Do you see card data?',
      answer: 'No. Rackz has read-only access. No card numbers or sensitive data.'
    },
    {
      question: 'Will Rackz change or break my checkout?',
      answer: 'No. Rackz is non-invasive and your checkout flow stays the same.'
    },
    {
      question: 'Do I need a developer to set this up?',
      answer: 'No. Setup takes less than a minute.'
    },
    {
      question: 'Does Rackz work with Shopify?',
      answer: 'Yes. Rackz monitors Shopify, Stripe, and PayPal together.'
    },
    {
      question: 'Can Rackz fix issues automatically?',
      answer: 'Rackz gives you the exact fix and the right link. Full automation is on the roadmap.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. We follow strict security practices, encrypt data, and use read-only access. You can disconnect at any time.'
    },
    {
      question: 'Do you support Stripe Connect for marketplaces?',
      answer: 'Yes. Rackz monitors payouts, vendor status, and KYC issues for Stripe Connect.'
    }
  ];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4 leading-tight">
            FAQ
          </h2>
        </div>

        <div className="space-y-3 mb-16">
          {FAQ_ITEMS.map((faq, index) => (
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

        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900 mb-4">
            Ready to stop losing revenue to silent failures?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Start monitoring in minutes or book a call to see how Rackz fits your stack.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#pricing"
              className="button-primary"
              onClick={() => trackButtonClick('Start now', 'FAQ Section')}
            >
              Start Monitoring
            </a>
            <a
              href="https://calendly.com/fynteq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary"
              onClick={() => trackConsultationClick('FAQ Section')}
            >
              Book a Call
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
