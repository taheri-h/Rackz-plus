import React from 'react';
import { useTranslation } from 'react-i18next';
import { trackButtonClick, trackConsultationClick } from '../../utils/analytics';
import TypingEffect from '../TypingEffect';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
            Stop losing revenue to silent payment failures.
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-6 max-w-2xl mx-auto">
            Rackz monitors your Stripe & PayPal checkouts, renewals, and payouts 24/7 — and alerts you before customers complain.
          </p>
          <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
            Instant alerts. Clear fixes. Accept payments reliably in days, not weeks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <a 
              href="#pricing" 
              className="button-primary"
              onClick={() => trackButtonClick('Start Monitoring', 'Hero Section')}
              aria-label="Start Monitoring - View Pricing"
            >
              Start Monitoring
            </a>
            <a 
              href="https://calendly.com/fynteq/30min" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="button-secondary"
              onClick={() => trackConsultationClick('Hero CTA')}
              aria-label="Book a consultation call"
            >
              Book a Call
            </a>
          </div>

          {/* Payment Provider Logos - Black and White */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 sm:gap-x-8 sm:gap-y-4">
            <div className="h-7 flex items-center justify-center">
              <img 
                src="/images/brands/stripe-logo-AQEyPRPODaTM3Ern.png.avif" 
                alt="Stripe" 
                className="h-7 w-auto object-contain object-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                loading="lazy"
                style={{ maxHeight: '28px' }}
              />
            </div>
            <div className="h-7 flex items-center justify-center">
              <img 
                src="/images/brands/pngimg.com---paypal_png7-mePvDEDJbQCke023.png.avif" 
                alt="PayPal" 
                className="h-7 w-auto object-contain object-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                loading="lazy"
                style={{ maxHeight: '28px' }}
              />
            </div>
            <div className="h-7 flex items-center justify-center">
              <span className="text-slate-400 text-sm font-medium leading-none whitespace-nowrap" style={{ fontSize: '14px', lineHeight: '28px' }}>Shopify</span>
            </div>
            <div className="h-7 flex items-center justify-center">
              <img 
                src="/images/brands/apple-pay-YNqy00r26ZHwegXw.png.avif" 
                alt="Apple Pay" 
                className="h-3.5 w-auto object-contain object-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                loading="lazy"
                style={{ maxHeight: '14px' }}
              />
            </div>
            <div className="h-7 flex items-center justify-center">
              <span className="text-slate-400 text-sm font-medium leading-none whitespace-nowrap" style={{ fontSize: '14px', lineHeight: '28px' }}>Google Pay</span>
            </div>
            <div className="h-7 flex items-center justify-center">
              <img 
                src="/images/brands/adyen-logo.wine-ALpn44GDnBuzVR05.png.avif" 
                alt="Adyen" 
                className="h-7 w-auto object-contain object-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                loading="lazy"
                style={{ maxHeight: '28px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
