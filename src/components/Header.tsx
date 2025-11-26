import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userPackage, setUserPackage] = useState<string>('');
  const [hasSetupPackages, setHasSetupPackages] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load user's package for dashboard link
  useEffect(() => {
    if (user) {
      // Check for SaaS packages (starter, pro, scale)
      const userPackageKey = `userPackage_${user.id}`;
      const storedPackage = localStorage.getItem(userPackageKey);
      if (storedPackage && ['starter', 'pro', 'scale'].includes(storedPackage)) {
        setUserPackage(storedPackage);
        setHasSetupPackages(false);
      } else {
        // Check for setup packages (checkout, subscriptions, crm, marketplace)
        const userSetupKey = `userSetupRequests_${user.id}`;
        const setupRequests = localStorage.getItem(userSetupKey);
        if (setupRequests) {
          try {
            const requests = JSON.parse(setupRequests);
            // Check if user has any setup requests with payment completed
            const hasPaidSetup = requests.some((req: any) => 
              req.paymentStatus === 'completed' && 
              ['checkout', 'subscriptions', 'crm', 'marketplace'].includes(req.package)
            );
            if (hasPaidSetup) {
              setHasSetupPackages(true);
              setUserPackage('');
            }
          } catch (e) {
            // If parsing fails, check sessionStorage for recent setup payment
            const userPaymentKey = `setupPaymentData_${user.id}`;
            const setupPayment = sessionStorage.getItem(userPaymentKey);
            if (setupPayment) {
              try {
                const payment = JSON.parse(setupPayment);
                if (payment.paymentStatus === 'completed' && 
                    ['checkout', 'subscriptions', 'crm', 'marketplace'].includes(payment.package)) {
                  setHasSetupPackages(true);
                  setUserPackage('');
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        } else {
          // Also check sessionStorage for recent setup payment
          const userPaymentKey = `setupPaymentData_${user.id}`;
          const setupPayment = sessionStorage.getItem(userPaymentKey);
          if (setupPayment) {
            try {
              const payment = JSON.parse(setupPayment);
              if (payment.paymentStatus === 'completed' && 
                  ['checkout', 'subscriptions', 'crm', 'marketplace'].includes(payment.package)) {
                setHasSetupPackages(true);
                setUserPackage('');
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    }
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserMenuOpen && !target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSectionClick = (sectionId: string) => {
    if (location.pathname === '/') {
      // If on home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        // Update URL hash without triggering scroll on page load
        window.history.pushState(null, '', `#${sectionId}`);
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on other pages, navigate to home with hash
      // Use window.location.href to ensure hash is preserved
      window.location.href = `/#${sectionId}`;
    }
    closeMobileMenu();
  };

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      // If already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Clear any hash from URL
      window.history.pushState(null, '', '/');
    }
    closeMobileMenu();
  };

  const handleSignout = () => {
    signout();
    navigate('/');
    closeMobileMenu();
    setIsUserMenuOpen(false);
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDashboardUrl = () => {
    // If user has setup packages, route to setup dashboard
    if (hasSetupPackages) {
      return '/setup-dashboard';
    }
    // If user has a SaaS package, include it in the URL
    if (userPackage) {
      return `/dashboard?package=${userPackage}`;
    }
    // Default to dashboard without package (will load from localStorage)
    return '/dashboard';
  };

  return (
    <nav className={`bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 ${isScrolled ? 'shadow-sm bg-white/98' : ''}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={handleLogoClick}>
              <img src="/rackz-logo.png" alt="Rackz Logo" className="h-8 w-auto cursor-pointer" />
            </Link>
          </div>
          <div className="hidden lg:flex items-center space-x-8">
            <button onClick={() => handleSectionClick('services')} className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">{t('nav.services')}</button>
            <button onClick={() => handleSectionClick('pricing')} className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">{t('nav.pricing')}</button>
            <Link to="/setup" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors" onClick={closeMobileMenu}>Setup</Link>
            <button onClick={() => handleSectionClick('faq')} className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">{t('nav.faq')}</button>
            <button onClick={() => handleSectionClick('contact')} className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">{t('nav.contact')}</button>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  aria-label="User menu"
                >
                  {getInitials()}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardUrl()}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignout}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/signin" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
                  Sign in
                </Link>
                <button onClick={() => handleSectionClick('pricing')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Start now
                </button>
              </>
            )}
          </div>

          <button id="mobile-menu-button" className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors" onClick={toggleMobileMenu}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div id="mobile-menu" className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-white border-t border-slate-200`}>
          <div className="px-6 py-4 space-y-4">
            <button onClick={() => handleSectionClick('services')} className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors w-full text-left">{t('nav.services')}</button>
            <button onClick={() => handleSectionClick('pricing')} className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors w-full text-left">{t('nav.pricing')}</button>
            <Link to="/setup" className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors" onClick={closeMobileMenu}>Setup</Link>
            <button onClick={() => handleSectionClick('faq')} className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors w-full text-left">{t('nav.faq')}</button>
            <button onClick={() => handleSectionClick('contact')} className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors w-full text-left">{t('nav.contact')}</button>
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-center gap-3 py-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-medium">
                      {getInitials()}
                    </div>
                    <div className="text-left">
                      <p className="text-slate-900 text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-slate-500 text-xs truncate max-w-[200px]">{user?.email}</p>
                    </div>
                  </div>
                  <Link to={getDashboardUrl()} className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors text-center" onClick={closeMobileMenu}>Dashboard</Link>
                  <button onClick={handleSignout} className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors block text-center">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/signin" className="block text-slate-600 hover:text-slate-900 text-sm font-medium py-2 transition-colors text-center" onClick={closeMobileMenu}>Sign in</Link>
                  <button onClick={() => {
                    handleSectionClick('pricing');
                    closeMobileMenu();
                  }} className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors block text-center">Start now</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;