import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import HeroSection from '../components/sections/HeroSection';
import MetricsCardsSection from '../components/sections/MetricsCardsSection';
import PainPointsSection from '../components/sections/PainPointsSection';
import ServicesSection from '../components/sections/ServicesSection';
import ProcessSection from '../components/sections/ProcessSection';
import ComparisonTableSection from '../components/sections/ComparisonTableSection';
import PricingSection from '../components/sections/PricingSection';
import FAQSection from '../components/sections/FAQSection';
import ContactSection from '../components/sections/ContactSection';

const Home: React.FC = () => {
  const { t } = useTranslation();
  // Ensure English language
  React.useEffect(() => {
    i18n.changeLanguage('en');
  }, []);

  // Handle hash navigation - only on hash change, not on initial load
  React.useEffect(() => {
    const hash = window.location.hash;
    
    // If there's a hash in the URL (coming from another page), scroll to it after a short delay
    if (hash) {
      const elementId = hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // If no hash, scroll to top on initial load (prevent auto-scroll to hash on refresh)
      window.scrollTo(0, 0);
    }

    const scrollToHash = () => {
      const currentHash = window.location.hash;
      if (!currentHash) return;
      
      const elementId = currentHash.substring(1);
      const element = document.getElementById(elementId);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Listen for hash changes (user clicking navigation)
    window.addEventListener('hashchange', scrollToHash);
    
    return () => {
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);
  
  return (
    <div>
      <Helmet>
        <title>{t('home.meta.title')}</title>
        <meta name="description" content={t('home.meta.description')} />
        <meta name="keywords" content="stripe monitoring, payment monitoring, stripe failed payments, checkout monitoring, subscription monitoring, payment health, stripe connect, paypal monitoring" />
        <meta property="og:title" content={t('home.meta.title')} />
        <meta property="og:description" content={t('home.meta.description')} />
        <meta property="og:url" content="https://getrackz.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('home.meta.title')} />
        <meta name="twitter:description" content={t('home.meta.description')} />
        <link rel="canonical" href="https://getrackz.com" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": t('home.meta.title'),
            "description": t('home.meta.description'),
            "url": "https://getrackz.com",
            "mainEntity": {
              "@type": "Organization",
              "name": "Rackz",
              "url": "https://getrackz.com",
              "description": t('home.meta.description')
            }
          })}
        </script>
      </Helmet>
      <HeroSection />
      <MetricsCardsSection />
      <PainPointsSection />
      <ServicesSection />
      <ProcessSection />
      <ComparisonTableSection />
      <PricingSection />
      <FAQSection />
      <ContactSection />
    </div>
  );
};

export default Home;
