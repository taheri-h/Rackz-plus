import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trackFormSubmit } from '../utils/analytics';

const GrowthForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    domain: '',
    subscriptionModel: '',
    billingFrequency: '',
    pricingTiers: '',
    freeTrial: '',
    proration: false,
    coupons: false,
    dunning: false,
    authSystem: '',
    expectedUsers: '',
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
          subscriptionModel: formData.subscriptionModel,
          billingFrequency: formData.billingFrequency,
          pricingTiers: formData.pricingTiers,
          freeTrial: formData.freeTrial,
          expectedUsers: formData.expectedUsers,
          authSystem: formData.authSystem,
          timeline: formData.timeline,
          proration: formData.proration,
          coupons: formData.coupons,
          dunning: formData.dunning,
          packageType: 'Growth Package',
          submittedOn: new Date().toLocaleString(),
          subject: `New Growth Package Subscription - ${formData.company}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitStatus('success');
      trackFormSubmit('Growth Form');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        domain: '',
        subscriptionModel: '',
        billingFrequency: '',
        pricingTiers: '',
        freeTrial: '',
        proration: false,
        coupons: false,
        dunning: false,
        authSystem: '',
        expectedUsers: '',
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t('forms.growthForm.title')}</h1>
          <p className="text-lg text-slate-600">{t('forms.growthForm.subtitle')}</p>
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
                Your subscription details have been submitted successfully.
              </p>
              <p className="text-slate-500">
                We will contact you within 24 hours to start your recurring payment integration.
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="yourwebsite.com"
                />
              </div>

              <div>
                <label htmlFor="subscriptionModel" className="block text-sm font-medium text-slate-700 mb-2">Subscription Model *</label>
                <select
                  id="subscriptionModel"
                  name="subscriptionModel"
                  required
                  value={formData.subscriptionModel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select subscription model</option>
                  <option value="saas">SaaS Product</option>
                  <option value="membership">Membership Site</option>
                  <option value="course">Online Course</option>
                  <option value="coaching">Coaching Program</option>
                  <option value="content">Content Subscription</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="billingFrequency" className="block text-sm font-medium text-slate-700 mb-2">Billing Frequency *</label>
                <select
                  id="billingFrequency"
                  name="billingFrequency"
                  required
                  value={formData.billingFrequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select billing frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="both">Both Monthly & Yearly</option>
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label htmlFor="pricingTiers" className="block text-sm font-medium text-slate-700 mb-2">Pricing Tiers *</label>
                <select
                  id="pricingTiers"
                  name="pricingTiers"
                  required
                  value={formData.pricingTiers}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select pricing structure</option>
                  <option value="single">Single Plan</option>
                  <option value="tiered">Tiered Plans (2-3 tiers)</option>
                  <option value="usage">Usage-based</option>
                  <option value="per-seat">Per-seat pricing</option>
                  <option value="custom">Custom pricing</option>
                </select>
              </div>

              <div>
                <label htmlFor="freeTrial" className="block text-sm font-medium text-slate-700 mb-2">Free Trial Period</label>
                <select
                  id="freeTrial"
                  name="freeTrial"
                  value={formData.freeTrial}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">No free trial</option>
                  <option value="7-days">7 days</option>
                  <option value="14-days">14 days</option>
                  <option value="30-days">30 days</option>
                  <option value="custom">Custom period</option>
                </select>
              </div>

              <div>
                <label htmlFor="expectedUsers" className="block text-sm font-medium text-slate-700 mb-2">Expected Subscribers</label>
                <select
                  id="expectedUsers"
                  name="expectedUsers"
                  value={formData.expectedUsers}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select expected users</option>
                  <option value="under-100">Under 100</option>
                  <option value="100-500">100 - 500</option>
                  <option value="500-1000">500 - 1,000</option>
                  <option value="1000-5000">1,000 - 5,000</option>
                  <option value="over-5000">Over 5,000</option>
                </select>
              </div>

              <div>
                <label htmlFor="authSystem" className="block text-sm font-medium text-slate-700 mb-2">Authentication System</label>
                <select
                  id="authSystem"
                  name="authSystem"
                  value={formData.authSystem}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select auth system</option>
                  <option value="custom">Custom authentication</option>
                  <option value="firebase">Firebase Auth</option>
                  <option value="auth0">Auth0</option>
                  <option value="cognito">AWS Cognito</option>
                  <option value="none">No existing auth</option>
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select timeline</option>
                  <option value="asap">ASAP (5-7 days)</option>
                  <option value="2-weeks">Within 2 weeks</option>
                  <option value="1-month">Within 1 month</option>
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
                    name="proration"
                    checked={formData.proration}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <span className="text-slate-700">Proration (upgrade/downgrade billing)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="coupons"
                    checked={formData.coupons}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <span className="text-slate-700">Coupon/Discount codes</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="dunning"
                    checked={formData.dunning}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <span className="text-slate-700">Dunning management (failed payment retry)</span>
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
                {isSubmitting ? 'Submitting...' : 'Submit Subscription Details'}
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

export default GrowthForm;
