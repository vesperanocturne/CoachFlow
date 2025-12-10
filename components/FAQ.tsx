import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    question: "Is CoachFlow really free?",
    answer: "Yes! Our Starter plan includes 3 practice sessions per month with basic metrics completely free. No credit card required."
  },
  {
    question: "How does the AI analysis work?",
    answer: "We use Google's Gemini 3.0 multimodal models to process video frames and audio in real-time. It detects facial expressions, analyzes speech patterns, and evaluates content relevance instantly."
  },
  {
    question: "Is my session data private?",
    answer: "Absolutely. Video streams are processed in real-time and are not stored unless you explicitly save a session. Saved data is encrypted and accessible only by you."
  },
  {
    question: "Can I use this for technical interviews?",
    answer: "Yes! We have a dedicated 'Technical Interview' mode that includes a code editor environment and AI feedback focused on your technical explanation skills."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="py-24 max-w-4xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <p className="text-slate-400">Everything you need to know about CoachFlow.</p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, index) => (
          <div 
            key={index} 
            className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-slate-900/80 border-primary-500/30' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}
          >
            <button 
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-8 py-6 flex items-center justify-between text-left"
            >
              <span className="font-bold text-white text-lg">{faq.question}</span>
              {openIndex === index ? <ChevronUp className="text-primary-400" /> : <ChevronDown className="text-slate-500" />}
            </button>
            <div 
              className={`px-8 transition-all duration-300 overflow-hidden ${openIndex === index ? 'pb-8 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;