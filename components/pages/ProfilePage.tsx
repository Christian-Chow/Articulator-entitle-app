'use client'

import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type ProfilePageProps = {
  user: SupabaseUser | null;
  onLogout: () => void;
};

type ProfileOption = {
  id: string;
  label: string;
  icon: typeof User;
  desc: string;
};

type ProfileSection = {
  section: string;
  items: ProfileOption[];
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown' | 'checking'>('unknown');
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [lastKnownPermission, setLastKnownPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown' | null>(null);
  
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';

  // Check camera permission status
  // On mobile browsers, Permissions API is unreliable, so we use getUserMedia as source of truth
  const checkCameraPermission = useCallback(async (skipPrompt = false): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
    // Try Permissions API first (works on some browsers)
    let permissionsApiState: 'granted' | 'denied' | 'prompt' | null = null;
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          permissionsApiState = result.state as 'granted' | 'denied' | 'prompt';
        } catch (e) {
          // Permissions API not supported or failed
        }
      }
    } catch (e) {
      // Permissions API not available
    }

    // If we have a last known state and Permissions API conflicts, trust last known for denied
    // This helps with mobile browsers where Permissions API is unreliable
    if (lastKnownPermission === 'denied' && permissionsApiState === 'prompt') {
      // Permissions API says prompt but we know it's denied - trust our knowledge
      return 'denied';
    }

    // If Permissions API says granted, verify it
    if (permissionsApiState === 'granted') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return 'granted';
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          return 'denied'; // Actually denied
        }
      }
    }

    // If Permissions API says denied, verify it (but trust it if confirmed)
    if (permissionsApiState === 'denied') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return 'granted'; // Actually granted, API was wrong
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          return 'denied'; // Confirmed denied
        }
      }
      return 'denied'; // Trust API if we can't verify
    }

    // If Permissions API says prompt or is unavailable
    // On mobile, "prompt" often means "denied" - test with getUserMedia
    // But if skipPrompt is true and we don't have lastKnownPermission, return prompt to avoid triggering
    if (skipPrompt && permissionsApiState === 'prompt' && !lastKnownPermission) {
      return 'prompt';
    }

    // Use getUserMedia to get actual state (this is most reliable on mobile)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'denied';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        return 'unknown';
      } else {
        // Other error - could be prompt or device issue
        return permissionsApiState || 'prompt';
      }
    }
  }, [lastKnownPermission]);

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    try {
      setCameraPermission('checking');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Permission granted - stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      const status = 'granted';
      setLastKnownPermission(status);
      setCameraPermission(status);
    } catch (err: any) {
      console.error('Camera permission request failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        const status = 'denied';
        setLastKnownPermission(status);
        setCameraPermission(status);
      } else {
        // For other errors, check again to get accurate state
        const newStatus = await checkCameraPermission(false);
        setLastKnownPermission(newStatus);
        setCameraPermission(newStatus);
      }
    }
  }, [checkCameraPermission]);

  // Check permission on mount and when settings are shown
  useEffect(() => {
    if (showCameraSettings) {
      checkCameraPermission(true).then((status) => {
        setCameraPermission(status);
        // Update last known if we got a definitive answer
        if (status === 'granted' || status === 'denied') {
          setLastKnownPermission(status);
        }
      });
    }
  }, [showCameraSettings, checkCameraPermission]);

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
        { id: 'camera', label: 'Camera Permission', icon: Camera, desc: 'Manage camera access for scanning' },
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

          <h3 className="text-2xl font-medium text-slate-800 mb-6">{displayName}</h3>
          
          {accountType && (
            <div className="w-full border-t border-slate-50 pt-6">
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Account Type</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-medium text-indigo-600">
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
              const isCamera = item.id === 'camera';
              
              return (
                <div key={item.id}>
                  <button
                    onClick={() => isCamera && setShowCameraSettings(!showCameraSettings)}
                    className="w-full bg-white border border-slate-50 p-4 rounded-[1.8rem] shadow-sm flex items-center gap-4 group active:scale-[0.98] transition-all hover:border-slate-100 hover:shadow-md text-left"
                  >
                    <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-slate-800 tracking-wide uppercase mb-0.5">{item.label}</span>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {isCamera && cameraPermission !== 'unknown' 
                          ? cameraPermission === 'granted' 
                            ? 'Camera access granted' 
                            : cameraPermission === 'denied'
                            ? 'Camera access denied'
                            : 'Click to check status'
                          : item.desc}
                      </p>
                    </div>
                    {isCamera && cameraPermission !== 'unknown' && (
                      <div className="shrink-0">
                        {cameraPermission === 'granted' ? (
                          <CheckCircle size={18} className="text-emerald-500" />
                        ) : cameraPermission === 'denied' ? (
                          <XCircle size={18} className="text-rose-500" />
                        ) : (
                          <AlertCircle size={18} className="text-amber-500" />
                        )}
                      </div>
                    )}
                    <ChevronRight 
                      size={16} 
                      className={`text-slate-200 group-hover:text-slate-400 transition-all ${isCamera && showCameraSettings ? 'rotate-90' : ''}`} 
                    />
                  </button>
                  
                  {/* Camera Permission Settings Panel */}
                  {isCamera && showCameraSettings && (
                    <div className="mt-2 ml-4 mr-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-800 mb-1">Current Status</p>
                          <div className="flex items-center gap-2">
                            {cameraPermission === 'granted' ? (
                              <>
                                <CheckCircle size={16} className="text-emerald-500" />
                                <span className="text-[10px] text-emerald-600 font-medium">Granted</span>
                              </>
                            ) : cameraPermission === 'denied' ? (
                              <>
                                <XCircle size={16} className="text-rose-500" />
                                <span className="text-[10px] text-rose-600 font-medium">Denied</span>
                              </>
                            ) : cameraPermission === 'prompt' ? (
                              <>
                                <AlertCircle size={16} className="text-amber-500" />
                                <span className="text-[10px] text-amber-600 font-medium">Not Set</span>
                              </>
                            ) : cameraPermission === 'checking' ? (
                              <>
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-slate-600 font-medium">Checking...</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={16} className="text-slate-400" />
                                <span className="text-[10px] text-slate-500 font-medium">Unknown</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setCameraPermission('checking');
                            const status = await checkCameraPermission(true);
                            setCameraPermission(status);
                            // Update last known if we got a definitive answer
                            if (status === 'granted' || status === 'denied') {
                              setLastKnownPermission(status);
                            }
                          }}
                          className="text-[10px] text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                      
                      {cameraPermission === 'denied' && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                          <p className="text-[10px] text-rose-800 font-medium mb-2">Permission Denied</p>
                          <p className="text-[9px] text-rose-600 leading-relaxed mb-3">
                            To enable camera access, please go to your browser settings and allow camera permission for this site.
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              requestCameraPermission();
                            }}
                            className="w-full px-4 py-2 bg-rose-600 text-white text-[10px] font-medium rounded-lg hover:bg-rose-700 transition-colors"
                          >
                            Request Permission
                          </button>
                        </div>
                      )}
                      
                      {cameraPermission === 'prompt' && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <p className="text-[10px] text-amber-800 font-medium mb-2">Permission Not Set</p>
                          <p className="text-[9px] text-amber-600 leading-relaxed mb-3">
                            Click the button below to request camera access. You'll be prompted to allow or deny.
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              requestCameraPermission();
                            }}
                            className="w-full px-4 py-2 bg-amber-600 text-white text-[10px] font-medium rounded-lg hover:bg-amber-700 transition-colors"
                          >
                            Request Permission
                          </button>
                        </div>
                      )}
                      
                      {cameraPermission === 'granted' && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                          <p className="text-[10px] text-emerald-800 font-medium mb-2">Permission Granted</p>
                          <p className="text-[9px] text-emerald-600 leading-relaxed">
                            Camera access is enabled. You can use the scanning features.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Sign Out Button */}
      {user && (
        <button
          onClick={onLogout}
          className="w-full mt-4 bg-rose-50 text-rose-600 py-5 rounded-[2.2rem] text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
        >
          <LogOut size={16} />
          Sign Out from Registry
        </button>
      )}
    </div>
  );
};

export default ProfilePage;
