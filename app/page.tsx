'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Navigation, { type View } from '@/components/Navigation';
import StatusBar from '@/components/StatusBar';
import ScanningModal from '@/components/ScanningModal';
import PiCodeScanner from '@/components/PiCodeScanner';
import HomePage from '@/components/pages/HomePage';
import LoginPage from '@/components/pages/LoginPage';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import PortalPage from '@/components/pages/PortalPage';
import ProfilePage from '@/components/pages/ProfilePage';

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
    
    // For PiCode, use the actual scanner component
    // For other types, use the mock scanning modal
    if (type !== 'PiCode') {
      setTimeout(() => {
        setIsScanning(false);
        setView('home');
      }, 2500);
    }
  };

  const handlePiCodeSuccess = (decodedMessage: string) => {
    setIsScanning(false);
    // Handle the decoded message - you can navigate to artwork page or show result
    console.log('Decoded PiCode:', decodedMessage);
    // For now, navigate to home after successful scan
    setView('home');
    // TODO: Navigate to artwork detail page using decodedMessage
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
      <StatusBar />

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

      {activeScanType === 'PiCode' ? (
        <PiCodeScanner
          isScanning={isScanning}
          onCancel={() => setIsScanning(false)}
          onSuccess={handlePiCodeSuccess}
        />
      ) : (
        <ScanningModal
          isScanning={isScanning}
          activeScanType={activeScanType}
          onCancel={() => setIsScanning(false)}
        />
      )}

      {view !== 'auth' && <Navigation currentView={view} onNavigate={setView} />}
    </div>
  );
};

export default App;
