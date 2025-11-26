import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ScaleForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    domain: '',
    marketplaceType: '',
    vendorCount: '',
    transactionVolume: '',
    commissionStructure: '',
    vendorOnboarding: false,
    kyc: false,
    taxReporting: false,
    compliance: '',
    expectedRevenue: '',
    timeline: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('https://formsubmit.co/ajax/info@rackz.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          domain: formData.domain,
          marketplaceType: formData.marketplaceType,
          vendorCount: formData.vendorCount,
          transactionVolume: formData.transactionVolume,
          commissionStructure: formData.commissionStructure,
          expectedRevenue: formData.expectedRevenue,
          compliance: formData.compliance,
          timeline: formData.timeline,
          vendorOnboarding: formData.vendorOnboarding,
          kyc: formData.kyc,
          taxReporting: formData.taxReporting,
          packageType: 'Scale Package',
          submittedOn: new Date().toLocaleString(),
          subject: `New Scale Package Marketplace - ${formData.company}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitStatus('success');
      // trackFormSubmit('Scale Form');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        domain: '',
        marketplaceType: '',
        vendorCount: '',
        transactionVolume: '',
        commissionStructure: '',
        vendorOnboarding: false,
        kyc: false,
        taxReporting: false,
        compliance: '',
        expectedRevenue: '',
        timeline: ''
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t('forms.scaleForm.title')}</h1>
          <p className="text-lg text-slate-600">{t('forms.scaleForm.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {submitStatus === 'success' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Thank You!</h2>
              <p className="text-lg text-slate-600 mb-6">
                Your marketplace details have been submitted successfully.
              </p>
              <p className="text-slate-500">
                We will contact you within 24 hours to start your multi-vendor payment integration.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-slate-700 mb-2">Website Domain *</label>
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  required
                  value={formData.domain}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="yourmarketplace.com"
                />
              </div>

              <div>
                <label htmlFor="marketplaceType" className="block text-sm font-medium text-slate-700 mb-2">Marketplace Type *</label>
                <select
                  id="marketplaceType"
                  name="marketplaceType"
                  required
                  value={formData.marketplaceType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select marketplace type</option>
                  <option value="ecommerce">E-commerce Marketplace</option>
                  <option value="services">Services Marketplace</option>
                  <option value="digital">Digital Products</option>
                  <option value="rental">Rental/Booking Platform</option>
                  <option value="freelance">Freelance Platform</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="vendorCount" className="block text-sm font-medium text-slate-700 mb-2">Expected Vendor Count *</label>
                <select
                  id="vendorCount"
                  name="vendorCount"
                  required
                  value={formData.vendorCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select vendor count</option>
                  <option value="under-10">Under 10 vendors</option>
                  <option value="10-50">10 - 50 vendors</option>
                  <option value="50-100">50 - 100 vendors</option>
                  <option value="100-500">100 - 500 vendors</option>
                  <option value="over-500">Over 500 vendors</option>
                </select>
              </div>

              <div>
                <label htmlFor="transactionVolume" className="block text-sm font-medium text-slate-700 mb-2">Expected Monthly Transaction Volume *</label>
                <select
                  id="transactionVolume"
                  name="transactionVolume"
                  required
                  value={formData.transactionVolume}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select transaction volume</option>
                  <option value="under-1k">Under $1,000</option>
                  <option value="1k-10k">$1,000 - $10,000</option>
                  <option value="10k-50k">$10,000 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="over-100k">Over $100,000</option>
                </select>
              </div>

              <div>
                <label htmlFor="commissionStructure" className="block text-sm font-medium text-slate-700 mb-2">Commission Structure *</label>
                <select
                  id="commissionStructure"
                  name="commissionStructure"
                  required
                  value={formData.commissionStructure}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select commission structure</option>
                  <option value="fixed">Fixed percentage (e.g., 5%)</option>
                  <option value="tiered">Tiered percentage</option>
                  <option value="flat-fee">Flat fee per transaction</option>
                  <option value="subscription">Monthly subscription fee</option>
                  <option value="hybrid">Hybrid model</option>
                </select>
              </div>

              <div>
                <label htmlFor="expectedRevenue" className="block text-sm font-medium text-slate-700 mb-2">Expected Monthly Revenue</label>
                <select
                  id="expectedRevenue"
                  name="expectedRevenue"
                  value={formData.expectedRevenue}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select expected revenue</option>
                  <option value="under-5k">Under $5,000</option>
                  <option value="5k-25k">$5,000 - $25,000</option>
                  <option value="25k-100k">$25,000 - $100,000</option>
                  <option value="100k-500k">$100,000 - $500,000</option>
                  <option value="over-500k">Over $500,000</option>
                </select>
              </div>

              <div>
                <label htmlFor="compliance" className="block text-sm font-medium text-slate-700 mb-2">Compliance Requirements</label>
                <select
                  id="compliance"
                  name="compliance"
                  value={formData.compliance}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select compliance needs</option>
                  <option value="basic">Basic (PCI DSS)</option>
                  <option value="gdpr">GDPR compliance</option>
                  <option value="ccpa">CCPA compliance</option>
                  <option value="sox">SOX compliance</option>
                  <option value="multiple">Multiple regulations</option>
                </select>
              </div>

              <div>
                <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 mb-2">Preferred Timeline *</label>
                <select
                  id="timeline"
                  name="timeline"
                  required
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select timeline</option>
                  <option value="asap">ASAP (10-14 days)</option>
                  <option value="1-month">Within 1 month</option>
                  <option value="2-months">Within 2 months</option>
                  <option value="3-months">Within 3 months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Required Features</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="vendorOnboarding"
                    checked={formData.vendorOnboarding}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-slate-700">Vendor onboarding flow</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="kyc"
                    checked={formData.kyc}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-slate-700">KYC (Know Your Customer) verification</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="taxReporting"
                    checked={formData.taxReporting}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-slate-700">Tax reporting and 1099 generation</span>
                </label>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-8 rounded-lg font-medium text-lg shadow-lg transition-all duration-200 ${
                  isSubmitting 
                    ? 'bg-slate-400 cursor-not-allowed text-white' 
                    : 'button-primary text-white hover:shadow-xl'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Marketplace Details'}
              </button>


              {submitStatus === 'error' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-red-700 font-medium">
                      There was an error submitting your form. Please email us directly at info@rackz.com
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScaleForm;
