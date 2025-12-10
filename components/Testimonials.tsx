import React from 'react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Sales Director @ TechCorp",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    text: "CoachFlow completely transformed my pitching style. The real-time pacing alerts helped me slow down and emphasize key points. Closed 3 major deals this month!",
    stars: 5
  },
  {
    id: 2,
    name: "David Chen",
    role: "Software Engineer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    text: "Used the Technical Interview mode to prep for FAANG interviews. The filler word detection is brutal but necessary. I got the job!",
    stars: 5
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Startup Founder",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150",
    text: "The Investor Demo mode allows me to practice my pitch deck narration without burning out my co-founders. The detailed analytics are a game changer.",
    stars: 5
  }
];

const Testimonials: React.FC = () => {
  return (
    <div className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Trusted by Professionals</h2>
          <p className="text-slate-400">Join thousands who have elevated their communication skills.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="glass-panel p-8 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -top-4 -left-4 bg-primary-500 text-white p-3 rounded-2xl shadow-lg transform -rotate-6">
                <Quote size={20} fill="currentColor" />
              </div>
              
              <div className="flex items-center gap-1 text-yellow-400 mb-6">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>

              <p className="text-slate-300 mb-8 leading-relaxed">"{t.text}"</p>

              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-700" />
                <div>
                  <h4 className="text-white font-bold text-sm">{t.name}</h4>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;