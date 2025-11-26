import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trackFormSubmit, trackConsultationClick } from '../../utils/analytics';

const ContactSection: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    company: '',
    message: ''
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
          email: formData.email,
          company: formData.company,
          message: formData.message,
          formType: 'Contact Form',
          submittedOn: new Date().toLocaleString(),
          subject: `New Contact Form - ${formData.company}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitStatus('success');
      trackFormSubmit('Contact Form');
      
      // Reset form
      setFormData({
        email: '',
        company: '',
        message: ''
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4 leading-tight">
            {t('contact.title')}
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="card p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('contact.info.title')}</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{t('contact.info.email')}</h4>
                  <p className="text-slate-600">info@rackz.com</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{t('contact.info.hours')}</h4>
                  <p className="text-slate-600">{t('contact.info.hoursValue')}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{t('contact.info.response')}</h4>
                  <p className="text-slate-600">{t('contact.info.responseValue')}</p>
                </div>
              </div>
            </div>

            <div className="card p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{t('contact.consultation.title')}</h3>
              <p className="text-slate-600 mb-6 text-sm">
                {t('contact.consultation.description')}
              </p>
              <a
                href="https://calendly.com/fynteq/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary inline-flex items-center justify-center"
                onClick={() => trackConsultationClick('Contact Section')}
              >
                {t('contact.consultation.button')}
              </a>
            </div>
          </div>

          <div className="card p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('contact.form.sendMessage')}</h3>
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-4 bg-slate-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">{t('contact.form.success')}</h4>
                <p className="text-slate-600 text-sm mb-2">
                  {t('contact.form.thankYou')}
                </p>
                <p className="text-xs text-slate-500">
                  {t('contact.form.responseTime')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('contact.form.email')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                    placeholder={t('contact.form.emailPlaceholder')}
                    aria-label="Email Address"
                    autoComplete="email"
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('contact.form.company')} *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                    placeholder={t('contact.form.companyPlaceholder')}
                    aria-label="Company Name"
                    autoComplete="organization"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all resize-none"
                    placeholder={t('contact.form.messagePlaceholder')}
                    aria-label="Message"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
                    isSubmitting 
                      ? 'bg-slate-400 cursor-not-allowed text-white' 
                      : 'button-primary'
                  }`}
                >
                  {isSubmitting ? t('contact.form.sending') : t('contact.form.sendMessage')}
                </button>

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-sm text-red-700 font-medium">
                        {t('contact.form.error')}
                      </p>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
