import React, { useState } from 'react';
import { trackConsultationClick, trackButtonClick } from '../../utils/analytics';

const FAQ_ITEMS: Array<{ question: string; answer: string }> = [
    {
      question: 'Do you see card data?',
      answer: 'No. Rackz has read-only access. No card numbers or sensitive data.'
    },
    {
      question: 'Will Pulse break my current checkout?',
      answer: 'No. Rackz is non-invasive and uses OAuth. Your checkout stays unchanged.'
    },
    {
      question: 'Do I need a developer to use Pulse?',
      answer: 'No. Anyone can set it up in under a minute.'
    },
    {
      question: 'Does Pulse work with Shopify?',
      answer: 'Yes. Rackz monitors Shopify + Stripe + PayPal checkouts.'
    },
    {
      question: 'Can Pulse fix issues automatically?',
      answer: 'Pulse provides exact fixes with direct links. Automation is coming soon.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes — SOC2, encrypted, read-only, disconnect anytime.'
    },
    {
      question: 'Do you support Stripe Connect for marketplaces?',
      answer: 'Yes — we monitor payouts, KYC, and vendor issues 24/7.'
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
