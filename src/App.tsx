import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { initGA, trackPageView } from './utils/analytics';
import './i18n';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import CookieConsent from './components/CookieConsent';
import LanguageAwareRoutes from './components/LanguageAwareRoutes';
import ScrollToTop from './components/ScrollToTop';

// Component to track page views
const PageTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};


function App() {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LanguageProvider>
          <AuthProvider>
            <div className="App">
              <ScrollToTop />
              <PageTracker />
              <Header />
              <main>
                <LanguageAwareRoutes />
              </main>
              <Footer />
              <ChatWidget />
              <CookieConsent />
            </div>
          </AuthProvider>
        </LanguageProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
