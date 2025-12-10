import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  initialView?: 'login' | 'signup';
  onBack?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

// Helper to generate a random salt
const generateSalt = (): string => {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(n => n.toString(16)).join('');
  }
  // Fallback salt generation
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Fallback hash (DJB2 variant) for non-secure contexts
const simpleHash = (text: string, salt: string): string => {
  const combined = text + salt;
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i); /* hash * 33 + c */
  }
  return (hash >>> 0).toString(16);
};

// Secure hash using SHA-256 with Salt
const hashPassword = async (password: string, salt: string): Promise<string> => {
  const combined = password + salt;
  try {
    // Check if Secure Context and API is available
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for non-HTTPS/dev environments
    return simpleHash(password, salt);
  } catch (e) {
    console.warn("Crypto API failed, using fallback:", e);
    return simpleHash(password, salt);
  }
};

const Auth: React.FC<AuthProps> = ({ onLogin, initialView = 'login', onBack, addToast }) => {
  const [mode, setMode] = useState<AuthMode>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    // Basic Validation
    if (!email) {
      setError("Please enter your email.");
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    // Normalize email to ensure case-insensitive matching
    const normalizedEmail = email.toLowerCase().trim();

    // Mode Specific Validation
    if (mode === 'signup' || mode === 'forgot') {
        if (!password || password.length < 6) {
            setError("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }
    }

    if (mode === 'signup') {
        if (!name) {
            setError("Please enter your name.");
            setIsLoading(false);
            return;
        }
        // IP/Device Restriction Simulation
        const hasRegistered = localStorage.getItem('coachflow_device_registered');
        if (hasRegistered) {
            setError("Access restricted: Only one account can be created from this device.");
            setIsLoading(false);
            return;
        }
    }
    
    try {
      // Simulate network delay for realism
      setTimeout(async () => {
        try {
          const storedUsers = localStorage.getItem('coachflow_db_users');
          const users = storedUsers ? JSON.parse(storedUsers) : [];

          if (mode === 'login') {
            // --- LOGIN LOGIC ---
            const foundUser = users.find((u: any) => u.email === normalizedEmail);
            
            if (foundUser) {
              let isValid = false;
              let needsMigration = false;

              if (foundUser.salt) {
                // Modern Salted Check
                const attemptHash = await hashPassword(password, foundUser.salt);
                if (attemptHash === foundUser.password) {
                  isValid = true;
                }
              } else {
                // Legacy Checks
                const legacyHash = await hashPassword(password, "");
                if (foundUser.password === legacyHash || foundUser.password === password) {
                  isValid = true;
                  needsMigration = true;
                }
              }

              if (isValid) {
                if (needsMigration) {
                  const newSalt = generateSalt();
                  const newHash = await hashPassword(password, newSalt);
                  foundUser.password = newHash;
                  foundUser.salt = newSalt;
                  
                  const userIndex = users.findIndex((u: any) => u.id === foundUser.id);
                  if (userIndex !== -1) {
                    users[userIndex] = foundUser;
                    localStorage.setItem('coachflow_db_users', JSON.stringify(users));
                  }
                }

                onLogin(foundUser);
              } else {
                setError('Invalid email or password.');
              }
            } else {
              setError('Invalid email or password.');
            }
          } 
          else if (mode === 'signup') {
            // --- SIGNUP LOGIC ---
            const existingUser = users.find((u: any) => u.email === normalizedEmail);
            
            if (existingUser) {
              setError('Account already exists with this email.');
            } else {
                const salt = generateSalt();
                const hashedPassword = await hashPassword(password, salt);

                const newUser = {
                id: 'user-' + Date.now(),
                name,
                email: normalizedEmail,
                password: hashedPassword,
                salt: salt,
                isPremium: false,
                achievements: [] as string[],
                provider: 'email' as const
                };

                users.push(newUser);
                localStorage.setItem('coachflow_db_users', JSON.stringify(users));
                localStorage.setItem('coachflow_device_registered', 'true');
                
                onLogin(newUser);
            }
          }
          else if (mode === 'forgot') {
            // --- RESET PASSWORD LOGIC ---
            const userIndex = users.findIndex((u: any) => u.email === normalizedEmail);
            
            if (userIndex !== -1) {
                const salt = generateSalt();
                const hashedPassword = await hashPassword(password, salt);
                
                users[userIndex].password = hashedPassword;
                users[userIndex].salt = salt;
                
                localStorage.setItem('coachflow_db_users', JSON.stringify(users));
                
                setSuccessMessage("Password reset successfully! Redirecting to login...");
                if(addToast) addToast('success', 'Password reset successfully!');
                setTimeout(() => {
                    setMode('login');
                    setSuccessMessage(null);
                    setPassword('');
                    setConfirmPassword('');
                }, 2000);
            } else {
                // For security, usually we don't say if email exists, but for this demo app it's helpful
                setError('No account found with this email address.');
            }
          }
        } catch (err) {
          console.error("Auth Logic Error:", err);
          setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
      }, 800);
    } catch (err) {
      console.error("Hashing error:", err);
      setError('A security error occurred. Please try again.');
      setIsLoading(false);
    }
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
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset Password'}
          </h2>
          <p className="text-slate-400">
            {mode === 'login' ? 'Enter your details to access your dashboard' : 
             mode === 'signup' ? 'Join thousands of professionals improving daily' :
             'Enter your email and new password'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-400 text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={18} className="shrink-0" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {mode === 'signup' && (
            <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in">
              <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  required
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

          {(mode !== 'forgot') && (
             <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    {mode === 'login' && (
                    <button 
                        type="button" 
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors" 
                        onClick={() => {
                            setMode('forgot');
                            setError(null);
                            setSuccessMessage(null);
                        }}
                    >
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
                {mode === 'signup' && password.length > 0 && password.length < 6 && (
                <p className="text-xs text-amber-500 mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Password must be at least 6 characters
                </p>
                )}
            </div>
          )}

          {/* Reset Password View additional fields */}
          {mode === 'forgot' && (
             <>
                <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in">
                    <label className="text-sm font-medium text-slate-300 ml-1">New Password</label>
                    <div className="relative group">
                        <KeyRound className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-12 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            placeholder="New password"
                        />
                         <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in">
                    <label className="text-sm font-medium text-slate-300 ml-1">Confirm New Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${
                            confirmPassword && confirmPassword !== password ? 'border-red-500/50' : 'border-slate-800'
                            }`}
                            placeholder="Confirm new password"
                        />
                    </div>
                </div>
             </>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in">
              <label className="text-sm font-medium text-slate-300 ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
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
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center relative z-10">
          <p className="text-slate-400 text-sm">
            {mode === 'login' && (
                <>
                    Don't have an account? 
                    <button
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="text-primary-400 hover:text-primary-300 font-semibold transition-colors ml-1"
                    >
                    Sign up for free
                    </button>
                </>
            )}
            {mode === 'signup' && (
                <>
                    Already have an account? 
                    <button
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-primary-400 hover:text-primary-300 font-semibold transition-colors ml-1"
                    >
                    Log in
                    </button>
                </>
            )}
            {mode === 'forgot' && (
                <button
                onClick={() => { setMode('login'); setError(null); }}
                className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                >
                Back to Login
                </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;