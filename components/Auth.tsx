
import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  initialView?: 'login' | 'signup';
  onBack?: () => void;
}

// Fallback hash for non-secure contexts (where crypto.subtle is unavailable)
const simpleHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Robust hashing helper
const hashPassword = async (text: string): Promise<string> => {
  try {
    // Check if Secure Context and API is available
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for non-HTTPS/dev environments
    return simpleHash(text);
  } catch (e) {
    console.warn("Crypto API failed, using fallback:", e);
    return simpleHash(text);
  }
};

const Auth: React.FC<AuthProps> = ({ onLogin, initialView = 'login', onBack }) => {
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    if (!isLogin) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
      }
      if (!name) {
        setError("Please enter your name.");
        setIsLoading(false);
        return;
      }
    }
    
    // Normalize email to ensure case-insensitive matching
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      const hashedPassword = await hashPassword(password);

      // Simulate network delay
      setTimeout(() => {
        try {
          const storedUsers = localStorage.getItem('coachflow_db_users');
          const users = storedUsers ? JSON.parse(storedUsers) : [];

          if (isLogin) {
            // Login Logic
            const foundUser = users.find((u: any) => 
              u.email === normalizedEmail && (u.password === hashedPassword || u.password === password)
            );
            
            if (foundUser) {
              // Auto-migrate legacy passwords to hash
              if (foundUser.password === password && foundUser.password !== hashedPassword) {
                foundUser.password = hashedPassword;
                const userIndex = users.findIndex((u: any) => u.id === foundUser.id);
                if (userIndex !== -1) {
                  users[userIndex] = foundUser;
                  localStorage.setItem('coachflow_db_users', JSON.stringify(users));
                }
              }

              onLogin({
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                isPremium: foundUser.isPremium || false,
                achievements: foundUser.achievements || [],
                avatarUrl: foundUser.avatarUrl,
                provider: 'email'
              });
            } else {
              setError('Invalid email or password.');
              setIsLoading(false);
            }
          } else {
            // Signup Logic
            const existingUser = users.find((u: any) => u.email === normalizedEmail);
            
            if (existingUser) {
              setError('Account already exists with this email.');
              setIsLoading(false);
              return;
            }

            const newUser = {
              id: 'user-' + Date.now(),
              name,
              email: normalizedEmail,
              password: hashedPassword,
              isPremium: false,
              achievements: [],
              provider: 'email'
            };

            users.push(newUser);
            localStorage.setItem('coachflow_db_users', JSON.stringify(users));
            
            onLogin({
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              isPremium: false,
              achievements: [],
              provider: 'email'
            });
          }
        } catch (err) {
          console.error("Auth Logic Error:", err);
          setError('An unexpected error occurred. Please try again.');
          setIsLoading(false);
        }
      }, 800);
    } catch (err) {
      console.error("Hashing error:", err);
      setError('A security error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors">
            <ArrowLeft size={18} />
          </div>
          <span className="font-medium">Back</span>
        </button>
      )}

      <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
         <span className="bg-primary-600 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-900/40">C</span>
         <h1 className="text-4xl font-bold text-white tracking-tight">CoachFlow</h1>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="mb-8 text-center relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-400">
            {isLogin 
              ? 'Enter your details to access your dashboard' 
              : 'Join thousands of professionals improving daily'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {!isLogin && (
            <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in">
              <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
             <div className="flex justify-between items-center px-1">
                <label className="text-sm font-medium text-slate-300">Password</label>
                {isLogin && (
                  <button type="button" className="text-xs text-primary-400 hover:text-primary-300 transition-colors" onClick={() => alert("This is a demo. Try signing up properly if you forgot!")}>
                    Forgot password?
                  </button>
                )}
             </div>
             <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-12 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isLogin && password.length > 0 && password.length < 6 && (
               <p className="text-xs text-amber-500 mt-1 ml-1 flex items-center gap-1">
                 <AlertCircle size={10} /> Password must be at least 6 characters
               </p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in">
              <label className="text-sm font-medium text-slate-300 ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required={!isLogin}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${
                    confirmPassword && confirmPassword !== password ? 'border-red-500/50' : 'border-slate-800'
                  }`}
                  placeholder="••••••••"
                />
                 {confirmPassword && confirmPassword === password && (
                  <div className="absolute right-3 top-3.5 text-green-500 animate-in zoom-in duration-200">
                    <CheckCircle2 size={18} />
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-3.5 rounded-xl mt-2 transition-all transform active:scale-[0.98] shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center relative z-10">
          <p className="text-slate-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors ml-1"
            >
              {isLogin ? 'Sign up for free' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
