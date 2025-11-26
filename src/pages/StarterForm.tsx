import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trackFormSubmit } from '../utils/analytics';

const StarterForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    domain: '',
    industry: '',
    paymentMethod: '',
    productType: '',
    orderValue: '',
    techStack: '',
    hosting: '',
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
          industry: formData.industry,
          paymentMethod: formData.paymentMethod,
          productType: formData.productType,
          orderValue: formData.orderValue,
          techStack: formData.techStack,
          hosting: formData.hosting,
          timeline: formData.timeline,
          packageType: 'Starter Package',
          submittedOn: new Date().toLocaleString(),
          subject: `New Starter Package Project - ${formData.company}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitStatus('success');
      trackFormSubmit('Starter Form');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        domain: '',
        industry: '',
        paymentMethod: '',
        productType: '',
        orderValue: '',
        techStack: '',
        hosting: '',
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t('forms.starterForm.title')}</h1>
          <p className="text-lg text-slate-600">{t('forms.starterForm.subtitle')}</p>
        </div>

        <div className="form-container p-8">
          {submitStatus === 'success' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Awesome! 🚀</h2>
              <p className="text-lg text-slate-600 mb-6">
                {t('forms.starterForm.success')}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium mb-2">What happens next?</p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Our team will review your requirements within 2 hours</li>
                  <li>• We'll schedule a quick call to discuss your project</li>
                  <li>• Your payment integration will be live in 3-7 days</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="https://calendly.com/fynteq/30min" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Schedule Quick Call
                </a>
                <a 
                  href="/" 
                  className="inline-flex items-center px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Explore More Services
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">{t('forms.starterForm.businessName')} *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your company name"
                  />
                </div>
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
                  className="w-full px-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="yourwebsite.com"
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">Industry *</label>
                <select
                  id="industry"
                  name="industry"
                  required
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your industry</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="saas">SaaS</option>
                  <option value="coaching">Coaching/Consulting</option>
                  <option value="education">Education</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-2">Preferred Payment Method *</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  required
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select payment method</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="both">Both Stripe & PayPal</option>
                </select>
              </div>

              <div>
                <label htmlFor="productType" className="block text-sm font-medium text-slate-700 mb-2">Product Type *</label>
                <select
                  id="productType"
                  name="productType"
                  required
                  value={formData.productType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select product type</option>
                  <option value="digital">Digital Product</option>
                  <option value="physical">Physical Product</option>
                  <option value="service">Service</option>
                  <option value="course">Online Course</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>

              <div>
                <label htmlFor="orderValue" className="block text-sm font-medium text-slate-700 mb-2">Average Order Value *</label>
                <select
                  id="orderValue"
                  name="orderValue"
                  required
                  value={formData.orderValue}
                  onChange={handleChange}
                  className="w-full px-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select order value</option>
                  <option value="under-50">Under $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-500">$100 - $500</option>
                  <option value="500-1000">$500 - $1,000</option>
                  <option value="over-1000">Over $1,000</option>
                </select>
              </div>

              <div>
                <label htmlFor="techStack" className="block text-sm font-medium text-slate-700 mb-2">Technology Stack *</label>
                <select
                  id="techStack"
                  name="techStack"
                  required
                  value={formData.techStack}
                  onChange={handleChange}
                  className="w-full px-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your tech stack</option>
                  <option value="react">React</option>
                  <option value="vue">Vue.js</option>
                  <option value="angular">Angular</option>
                  <option value="wordpress">WordPress</option>
                  <option value="shopify">Shopify</option>
                  <option value="nodejs">Node.js</option>
                  <option value="php">PHP</option>
                  <option value="python">Python</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="hosting" className="block text-sm font-medium text-slate-700 mb-2">Hosting Provider</label>
                <input
                  type="text"
                  id="hosting"
                  name="hosting"
                  value={formData.hosting}
                  onChange={handleChange}
                  className="w-full px-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Vercel, Netlify, AWS, etc."
                />
              </div>

              <div>
                <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 mb-2">Preferred Timeline *</label>
                <select
                  id="timeline"
                  name="timeline"
                  required
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 curved-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select timeline</option>
                  <option value="asap">ASAP (2-3 days)</option>
                  <option value="1-week">Within 1 week</option>
                  <option value="2-weeks">Within 2 weeks</option>
                  <option value="1-month">Within 1 month</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-8 font-medium text-lg transition-all duration-200 ${
                    isSubmitting 
                      ? 'bg-slate-400 cursor-not-allowed text-white rounded-lg' 
                      : 'button-primary'
                  }`}
                >
                {isSubmitting ? 'Submitting...' : 'Submit Project Details'}
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

export default StarterForm;
