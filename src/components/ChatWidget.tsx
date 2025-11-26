import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ChatWidget: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`${isOpen ? 'block' : 'hidden'} absolute bottom-20 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200`}>
        <div className="bg-slate-900 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Rackz Support</h4>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-xs text-slate-300">Online now</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-sm text-slate-700">Hi! I'm here to help with your payment integration questions. How can I assist you today?</p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  const element = document.getElementById('pricing');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                  setIsOpen(false);
                }}
                className="w-full text-left p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors card"
              >
                <p className="text-sm font-semibold text-slate-900 mb-1">Get a quote for my project</p>
                <p className="text-xs text-slate-600">Get pricing in 30 seconds</p>
              </button>
              <button 
                onClick={() => {
                  window.open('https://calendly.com/fynteq/30min', '_blank');
                  setIsOpen(false);
                }}
                className="w-full text-left p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors card"
              >
                <p className="text-sm font-semibold text-slate-900 mb-1">Schedule a consultation</p>
                <p className="text-xs text-slate-600">Free 30-minute discovery call</p>
              </button>
              <button 
                onClick={() => {
                  const element = document.getElementById('contact');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                  setIsOpen(false);
                }}
                className="w-full text-left p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors card"
              >
                <p className="text-sm font-semibold text-slate-900 mb-1">Technical support</p>
                <p className="text-xs text-slate-600">Get help with existing integration</p>
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Typical response time: &lt; 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 relative"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
      </button>
    </div>
  );
};

export default ChatWidget;
