import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  // Step 1: Personal Information
  name: string;
  email: string;
  phone: string;
  company: string;
  
  // Step 2: Business Information
  industry: string;
  businessType: string;
  website: string;
  monthlyRevenue: string;
  country: string;
  
  // Step 3: Technical Requirements
  currentPaymentProvider: string;
  platform: string;
  crm: string;
  additionalRequirements: string;
  
  // Step 4: Project Details
  timeline: string;
  preferredContactMethod: string;
  timezone: string;
}

const SetupForm: React.FC = () => {
  const { packageName } = useParams<{ packageName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const packageInfo: Record<string, { name: string; price: string; description: string }> = {
    'checkout': { name: 'Stripe Checkout Setup', price: '$299', description: 'Get paid online in 2–3 days' },
    'subscriptions': { name: 'Subscriptions Setup', price: '$749', description: 'Turn one-time buyers into recurring revenue' },
    'crm': { name: 'CRM Integration', price: '$1499', description: 'Connect payments with your CRM in 7–10 days' },
    'marketplace': { name: 'Marketplace Setup', price: 'from $1999', description: 'Build your platform like Etsy or Airbnb' }
  };

  const currentPackage = packageInfo[packageName || 'checkout'] || packageInfo['checkout'];

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    businessType: '',
    website: '',
    monthlyRevenue: '',
    country: '',
    currentPaymentProvider: '',
    platform: '',
    crm: '',
    additionalRequirements: '',
    timeline: '',
    preferredContactMethod: 'email',
    timezone: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!packageName || !packageInfo[packageName]) {
      navigate('/setup');
    }
  }, [packageName, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.email && formData.phone && formData.company);
      case 2:
        return !!(formData.industry && formData.businessType && formData.country);
      case 3:
        return !!(formData.currentPaymentProvider && formData.platform);
      case 4:
        return !!(formData.timeline && formData.preferredContactMethod);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!user) {
          setError('Please sign in to continue');
          navigate('/signin');
          return;
        }

        try {
          // Store form data in user-specific sessionStorage
          const setupData = {
            ...formData,
            email: user.email,
            userId: user.id,
            package: packageName,
            packageName: currentPackage.name,
            price: currentPackage.price
          };

          const userFormKey = `setupFormData_${user.id}`;
          sessionStorage.setItem(userFormKey, JSON.stringify(setupData));

          // Redirect to payment page
          navigate(`/setup-payment/${packageName}`);
        } catch (err) {
          setError('Failed to submit form. Please try again.');
          console.error('Form submission error:', err);
        } finally {
          setIsSubmitting(false);
        }
      };

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white py-12">
      <Helmet>
        <title>{currentPackage.name} - Setup Form | Rackz</title>
        <meta name="description" content={`Complete the setup form for ${currentPackage.name}. ${currentPackage.description}`} />
      </Helmet>

      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">{currentPackage.name}</h1>
          <p className="text-slate-600 mb-4">{currentPackage.description}</p>
          
          {/* Package Price */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 inline-block">
            <div className="text-sm text-slate-600 mb-1">Fixed Price</div>
            <div className="text-3xl font-bold text-slate-900">{currentPackage.price}</div>
            <p className="text-xs text-slate-500 mt-2 text-left">50% upfront, 50% after delivery.</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm font-medium text-slate-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-slate-900 rounded-full h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Personal Information</h2>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="Your Company"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Business Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Business Information</h2>
                
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
                    Industry *
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    required
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="">Select industry</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="saas">SaaS</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="coaching">Coaching & Education</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="real-estate">Real Estate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-slate-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    required
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="">Select business type</option>
                    <option value="b2c">B2C (Business to Consumer)</option>
                    <option value="b2b">B2B (Business to Business)</option>
                    <option value="b2b2c">B2B2C (Business to Business to Consumer)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Revenue
                  </label>
                  <select
                    id="monthlyRevenue"
                    name="monthlyRevenue"
                    value={formData.monthlyRevenue}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="">Select range</option>
                    <option value="0-1k">$0 - $1,000</option>
                    <option value="1k-10k">$1,000 - $10,000</option>
                    <option value="10k-50k">$10,000 - $50,000</option>
                    <option value="50k-100k">$50,000 - $100,000</option>
                    <option value="100k+">$100,000+</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="Germany"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Technical Requirements */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Technical Requirements</h2>
                
                <div>
                  <label htmlFor="currentPaymentProvider" className="block text-sm font-medium text-slate-700 mb-2">
                    Current Payment Provider *
                  </label>
                  <select
                    id="currentPaymentProvider"
                    name="currentPaymentProvider"
                    required
                    value={formData.currentPaymentProvider}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="">Select provider</option>
                    <option value="none">None (New setup)</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="adyen">Adyen</option>
                    <option value="square">Square</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-slate-700 mb-2">
                    Platform / Technology *
                  </label>
                  <select
                    id="platform"
                    name="platform"
                    required
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="">Select platform</option>
                    <option value="custom">Custom (React, Vue, Angular, etc.)</option>
                    <option value="shopify">Shopify</option>
                    <option value="woocommerce">WooCommerce</option>
                    <option value="wordpress">WordPress</option>
                    <option value="webflow">Webflow</option>
                    <option value="nextjs">Next.js</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {(packageName === 'crm' || packageName === 'marketplace') && (
                  <div>
                    <label htmlFor="crm" className="block text-sm font-medium text-slate-700 mb-2">
                      CRM System {packageName === 'crm' && '*'}
                    </label>
                    <select
                      id="crm"
                      name="crm"
                      required={packageName === 'crm'}
                      value={formData.crm}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    >
                      <option value="">Select CRM</option>
                      <option value="salesforce">Salesforce</option>
                      <option value="hubspot">HubSpot</option>
                      <option value="pipedrive">Pipedrive</option>
                      <option value="zoho">Zoho</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="additionalRequirements" className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Requirements
                  </label>
                  <textarea
                    id="additionalRequirements"
                    name="additionalRequirements"
                    rows={4}
                    value={formData.additionalRequirements}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="Any specific requirements or features you need..."
                  />
                </div>
              </div>
            )}

            {/* Step 4: Project Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Project Details</h2>
                
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Timeline *
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    required
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="">Select timeline</option>
                    <option value="asap">As soon as possible</option>
                    <option value="1-2weeks">1-2 weeks</option>
                    <option value="2-4weeks">2-4 weeks</option>
                    <option value="1-2months">1-2 months</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Contact Method *
                  </label>
                  <select
                    id="preferredContactMethod"
                    name="preferredContactMethod"
                    required
                    value={formData.preferredContactMethod}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="slack">Slack</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-2">
                    Timezone
                  </label>
                  <input
                    type="text"
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="UTC+1 (Berlin)"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-6 py-3 button-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`ml-auto px-6 py-3 rounded-xl font-medium transition-all ${
                    isSubmitting
                      ? 'bg-slate-400 cursor-not-allowed text-white'
                      : 'button-primary'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Continue to Payment'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupForm;

