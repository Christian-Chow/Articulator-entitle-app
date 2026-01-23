import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  User,
  Camera,
  Bell,
  ShieldAlert,
  CreditCard,
  Globe,
  Palette,
  Info,
  Smartphone,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type ProfilePageProps = {
  user: SupabaseUser | null;
  onLogout: () => void;
};

type ProfileOption = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  desc: string;
};

type ProfileSection = {
  section: string;
  items: ProfileOption[];
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setAccountType(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setAccountType(null);
        } else {
          setAccountType(data?.role || null);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setAccountType(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  const profileOptions: ProfileSection[] = [
    {
      section: 'Account',
      items: [
        { id: 'personal', label: 'Personal Information', icon: User, desc: 'Manage your identity and details' },
        { id: 'security', label: 'Security & Privacy', icon: ShieldAlert, desc: '2FA, password, and data control' },
        { id: 'payments', label: 'Payment Methods', icon: CreditCard, desc: 'Manage your billing and cards' },
      ],
    },
    {
      section: 'Preferences',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Registry alerts and news' },
        { id: 'language', label: 'Language & Region', icon: Globe, desc: 'English (US) — New York' },
        { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'System light / Dark mode' },
      ],
    },
    {
      section: 'Support',
      items: [
        { id: 'help', label: 'Help Center', icon: Info, desc: 'Documentation and FAQ' },
        { id: 'devices', label: 'Connected Devices', icon: Smartphone, desc: 'Manage TV and AR glasses' },
      ],
    },
  ];

  return (
    <div className="gateway-enter">
      {/* Collector Card */}
      <section className="mb-10 px-1">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>

          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-white border-4 border-white shadow-xl">
              <User size={48} strokeWidth={1} />
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full border-2 border-white shadow-lg active:scale-95">
              <Camera size={14} />
            </button>
          </div>

          <h3 className="text-2xl font-serif text-slate-800 mb-6">{displayName}</h3>
          
          {accountType && (
            <div className="w-full border-t border-slate-50 pt-6">
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Account Type</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-serif text-indigo-600">
                  {accountType.toLowerCase() === 'artist' ? 'Artist' : accountType.charAt(0).toUpperCase() + accountType.slice(1).toLowerCase()}
                </p>
                {accountType.toLowerCase() === 'artist' && (
                  <div className="flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full">
                    <ShieldCheck size={12} className="text-white" strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Profile Menus */}
      {profileOptions.map((section, sIndex) => (
        <section key={sIndex} className="mb-8">
          <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-2 mb-3">{section.section}</h4>
          <div className="space-y-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className="w-full bg-white border border-slate-50 p-4 rounded-[1.8rem] shadow-sm flex items-center gap-4 group active:scale-[0.98] transition-all hover:border-slate-100 hover:shadow-md text-left"
                >
                  <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-800 tracking-wide uppercase mb-0.5">{item.label}</span>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Sign Out Button */}
      {user && (
        <button
          onClick={onLogout}
          className="w-full mt-4 bg-rose-50 text-rose-600 py-5 rounded-[2.2rem] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
        >
          <LogOut size={16} />
          Sign Out from Registry
        </button>
      )}
    </div>
  );
};

export default ProfilePage;
