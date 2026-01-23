import React, { useState, useEffect } from 'react';
import { Cpu, QrCode, Zap } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import Header from './components/Header';
import Navigation, { type View } from './components/Navigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PlaceholderPage from './pages/PlaceholderPage';
import PortalPage from './pages/PortalPage';
import ProfilePage from './pages/ProfilePage';

const App = () => {
  const [view, setView] = useState<View>('auth');
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanType, setActiveScanType] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setIsLoggedIn(true);
        setView('portal');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setIsLoggedIn(true);
        if (view === 'auth') {
          setView('portal');
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setView('auth');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    setView('portal');
  };

  const triggerScan = (type: string) => {
    setActiveScanType(type);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setView('home');
    }, 2500);
  };

  const headerSubtitle = 
    view === 'portal' ? 'Registry Access' : 
    view === 'profile' ? 'Registry Member' : 
    'Authenticated Collector';
  const headerTitle = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Welcome Guest';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32 font-sans text-slate-900 overflow-x-hidden">
      {/* Status bar */}
      <div className="h-10 flex items-center justify-between px-6 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-2">
          <span>9:41</span>
          <Zap size={10} fill="currentColor" className="text-slate-200" />
        </div>
        <div className="w-5 h-2.5 border border-slate-200 rounded-sm" />
      </div>

      <Header
        subtitle={headerSubtitle}
        title={headerTitle}
        isLoggedIn={isLoggedIn}
        onLoginToggle={() => {
          if (isLoggedIn) {
            handleLogout();
          } else {
            setView('auth');
          }
        }}
        onLogoClick={() => setView('portal')}
        isAuthView={view === 'auth'}
        onBack={() => setView('portal')}
      />

      <main className="px-6">
        {view === 'portal' && <PortalPage onScan={triggerScan} />}
        {view === 'home' && <HomePage isLoggedIn={isLoggedIn} />}
        {view === 'auth' && <LoginPage onSuccess={() => {}} />}
        {view === 'archive' && <PlaceholderPage label="Archive" />}
        {view === 'guide' && <PlaceholderPage label="Guide" />}
        {view === 'profile' && <ProfilePage user={user} onLogout={handleLogout} />}
      </main>

      {/* Scanning modal */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white p-8 modal-fade-in">
          <div className="w-72 h-72 border border-white/20 rounded-[3.5rem] relative overflow-hidden bg-white/5 backdrop-blur-sm">
            <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_30px_rgba(129,140,248,0.5)] animate-scan-line" />
            <div className="absolute top-10 left-10 w-6 h-6 border-t border-l border-white/40" />
            <div className="absolute top-10 right-10 w-6 h-6 border-t border-r border-white/40" />
            <div className="absolute bottom-10 left-10 w-6 h-6 border-b border-l border-white/40" />
            <div className="absolute bottom-10 right-10 w-6 h-6 border-b border-r border-white/40" />
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              {activeScanType === 'NFC' ? (
                <Cpu size={120} strokeWidth={0.5} />
              ) : (
                <QrCode size={120} strokeWidth={0.5} />
              )}
            </div>
          </div>
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-serif tracking-wide">
              {activeScanType === 'NFC' ? 'Awaiting Tag...' : `Reading ${activeScanType}...`}
            </h2>
            <p className="mt-3 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-medium max-w-[220px] mx-auto leading-relaxed">
              {activeScanType === 'NFC'
                ? 'Hold your device near the piece identifier'
                : `Align the ${activeScanType} on the physical piece within the frame`}
            </p>
          </div>
          <button
            onClick={() => setIsScanning(false)}
            className="mt-20 px-10 py-3 bg-white/5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {view !== 'auth' && <Navigation currentView={view} onNavigate={setView} />}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-fade-in { animation: fadeIn 0.3s ease-out; }
        .gateway-enter { animation: fadeIn 0.5s ease-out; }
        .home-enter { animation: fadeIn 0.4s ease-out; }
        .auth-enter { animation: fadeIn 0.5s ease-out; }
      `}} />
    </div>
  );
};

export default App;
