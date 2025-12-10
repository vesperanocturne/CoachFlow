import React from 'react';
import { Twitter, Linkedin, Github, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-white mb-6">
              <span className="bg-gradient-to-br from-primary-500 to-primary-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white">C</span>
              CoachFlow
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Master your communication skills with real-time AI coaching. 
              Elevate your pitch, ace the interview, and command the room.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Testimonials</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-600 text-sm">
            © {new Date().getFullYear()} CoachFlow AI. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Github size={20} /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Mail size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;