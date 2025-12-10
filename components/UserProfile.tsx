import React, { useState, useRef } from 'react';
import { User } from '../types';
import { User as UserIcon, Mail, Crown, Camera, Save, LogOut, Trash2, Calendar, Zap, Award } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
  onOpenPricing: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser, onLogout, onOpenPricing }) => {
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateUser({ name });
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const stats = [
    { label: 'Day Streak', value: user.streakDays || 0, icon: <Zap size={20} className="text-orange-400" /> },
    { label: 'Achievements', value: user.achievements?.length || 0, icon: <Award size={20} className="text-purple-400" /> },
    { label: 'Joined', value: 'Oct 2023', icon: <Calendar size={20} className="text-blue-400" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-20">
      <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Identity Card */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center h-fit">
          <div className="relative group mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-xl relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <UserIcon size={48} />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white shadow-lg hover:bg-primary-500 transition-colors"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2 mb-1 w-full max-w-[200px]">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-white text-center w-full focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <button onClick={handleSave} className="p-1.5 bg-green-600 rounded-lg text-white hover:bg-green-500">
                <Save size={16} />
              </button>
            </div>
          ) : (
            <h2 
              className="text-2xl font-bold text-white mb-1 cursor-pointer hover:text-primary-400 transition-colors flex items-center gap-2"
              onClick={() => setIsEditing(true)}
              title="Click to edit name"
            >
              {user.name}
            </h2>
          )}
          
          <p className="text-slate-500 text-sm mb-6">{user.email}</p>

          <div className="w-full space-y-3">
             {user.isPremium ? (
               <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 p-3 rounded-xl flex items-center justify-center gap-2 text-amber-400 font-bold">
                 <Crown size={18} fill="currentColor" /> Pro Member
               </div>
             ) : (
               <button 
                onClick={onOpenPricing}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors"
               >
                 Upgrade to Pro
               </button>
             )}
          </div>
        </div>

        {/* Right Column: Stats & Details */}
        <div className="md:col-span-2 space-y-6">
           {/* Stats Grid */}
           <div className="grid grid-cols-3 gap-4">
             {stats.map((stat, i) => (
               <div key={i} className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                 <div className="p-2 bg-slate-900 rounded-full">{stat.icon}</div>
                 <span className="text-2xl font-bold text-white">{stat.value}</span>
                 <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{stat.label}</span>
               </div>
             ))}
           </div>

           {/* Personal Details Form */}
           <div className="glass-panel p-8 rounded-3xl">
              <h3 className="text-lg font-bold text-white mb-6">Personal Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase">Display Name</label>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/5 text-slate-300">
                       <UserIcon size={18} className="text-slate-500" />
                       {user.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase">Email Address</label>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/5 text-slate-300">
                       <Mail size={18} className="text-slate-500" />
                       {user.email}
                    </div>
                  </div>
                </div>
              </div>
           </div>

           {/* Danger Zone */}
           <div className="glass-panel p-8 rounded-3xl border-red-500/10">
              <h3 className="text-lg font-bold text-white mb-6">Account Actions</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                >
                  <LogOut size={18} /> Sign Out
                </button>
                <button 
                  onClick={() => alert("This feature simulates account deletion.")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-medium transition-colors"
                >
                  <Trash2 size={18} /> Delete Account
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;