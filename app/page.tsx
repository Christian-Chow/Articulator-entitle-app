'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Navigation, { type View } from '@/components/Navigation';
import ScanningModal from '@/components/ScanningModal';
import MenuOption from '@/components/pages/MenuOption';
import LoginPage from '@/components/pages/LoginPage';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import PortalPage from '@/components/pages/PortalPage';
import NfcPage from '@/components/pages/NfcPage';
import NfcEncodePage from '@/components/pages/NfcEncodePage';
import NfcReadPage from '@/components/pages/NfcReadPage';
import ProfilePage from '@/components/pages/ProfilePage';
import ForgotPasswordPage from '@/components/pages/ForgotPasswordPage';
import { decodeImage } from '@/lib/api';
import { extractArtworkId } from '@/lib/utils';

const App = () => {
  const router = useRouter();
  const [view, setView] = useState<View>('auth');
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanType, setActiveScanType] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [decoding, setDecoding] = useState(false);
  const [decodeResult, setDecodeResult] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    // Set a timeout to ensure loading doesn't hang forever
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout, proceeding without auth');
        setLoading(false);
        setView('auth');
      }
    }, 3000);

    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      // Supabase not configured, skip auth and go straight to auth view
      console.warn('Supabase not configured, skipping authentication');
      setLoading(false);
      setView('auth');
      clearTimeout(timeout);
      return;
    }

    // Check initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session) {
          setUser(session.user);
          setIsLoggedIn(true);
          setView('portal');
        } else {
          setView('auth');
        }
        setLoading(false);
        clearTimeout(timeout);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Failed to get session:', error);
        setLoading(false);
        setView('auth');
        clearTimeout(timeout);
      });

    // Listen for auth changes
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        
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
        clearTimeout(timeout);
      });
      subscription = authSubscription;
    } catch (error) {
      console.error('Failed to set up auth listener:', error);
      setLoading(false);
      setView('auth');
      clearTimeout(timeout);
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
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
    setDecodeResult(null);
    setDecodeError(null);
  };

  const handleImageUpload = async (file: File) => {
    setDecoding(true);
    setDecodeResult(null);
    setDecodeError(null);
    setIsScanning(false);

    try {
      const result = await decodeImage(file);
      if (result.error) {
        setDecodeError(result.error + (result.details ? `: ${result.details}` : ''));
      } else if (result.decodedMessage) {
        const artworkId = extractArtworkId(result.decodedMessage);
        if (artworkId) {
          setDecodeResult(`Found artwork: ${artworkId}`);
          // Navigate to artwork page
          setTimeout(() => {
            router.push(`/artworks/${artworkId}`);
          }, 1000);
        } else {
          setDecodeResult(result.decodedMessage);
          setDecodeError('Could not extract artwork ID from decoded message');
        }
      }
    } catch (error) {
      setDecodeError(error instanceof Error ? error.message : 'Failed to decode image');
    } finally {
      setDecoding(false);
    }
  };

  const handleQRDecode = (data: string) => {
    setIsScanning(false);
    const artworkId = extractArtworkId(data);
    if (artworkId) {
      setDecodeResult(`Found artwork: ${artworkId}`);
      setTimeout(() => {
        router.push(`/artworks/${artworkId}`);
      }, 1000);
    } else {
      setDecodeResult(data);
    }
  };

  const handleCameraCapture = async (file: File) => {
    setDecoding(true);
    setDecodeResult(null);
    setDecodeError(null);
    setIsScanning(false);

    try {
      const result = await decodeImage(file);
      if (result.error) {
        setDecodeError(result.error + (result.details ? `: ${result.details}` : ''));
      } else if (result.decodedMessage) {
        const artworkId = extractArtworkId(result.decodedMessage);
        if (artworkId) {
          setDecodeResult(`Found artwork: ${artworkId}`);
          setTimeout(() => {
            router.push(`/artworks/${artworkId}`);
          }, 1000);
        } else {
          setDecodeResult(result.decodedMessage);
          setDecodeError('Could not extract artwork ID from decoded message');
        }
      }
    } catch (error) {
      setDecodeError(error instanceof Error ? error.message : 'Failed to decode image');
    } finally {
      setDecoding(false);
    }
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
        isAuthView={view === 'auth' || view === 'forgot-password'}
        showBack={view === 'nfc' || view === 'nfc-encode' || view === 'nfc-read'}
        onBack={() => {
          if (view === 'forgot-password') {
            setView('auth');
          } else if (view === 'nfc-read') {
            setView('nfc');
          } else if (view === 'nfc-encode') {
            setView('nfc');
          } else if (view === 'nfc') {
            setView('portal');
          } else {
            setView('portal');
          }
        }}
      />

      <main className="px-6">
        {view === 'portal' && (
          <PortalPage
            onScan={(type) => (type === 'NFC' ? setView('nfc') : triggerScan(type))}
            onUploadImage={handleImageUpload}
          />
        )}
        {view === 'nfc' && (
          <NfcPage
            onNfcRead={() => setView('nfc-encode')}
            onNfcWrite={() => setView('nfc-read')}
          />
        )}
        {view === 'nfc-encode' && (
          <NfcEncodePage
            onEncode={(type, value) => {
              // TODO: call NFC encode API / native
              console.log('NFC encode', type, value);
            }}
          />
        )}
        {view === 'nfc-read' && <NfcReadPage />}
        {view === 'home' && <MenuOption isLoggedIn={isLoggedIn} />}
        {view === 'auth' && <LoginPage onSuccess={() => {}} onForgotPassword={() => setView('forgot-password')} />}
        {view === 'forgot-password' && <ForgotPasswordPage onBack={() => setView('auth')} />}
        {view === 'archive' && <PlaceholderPage label="Archive" />}
        {view === 'guide' && <PlaceholderPage label="Guide" />}
        {view === 'profile' && <ProfilePage user={user} onLogout={handleLogout} />}
      </main>

      {decodeError && (
        <div className="fixed bottom-24 left-6 right-6 z-50">
          <div className="rounded-2xl p-4 shadow-lg bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-900">
              {decodeError}
            </p>
            <button
              onClick={() => setDecodeError(null)}
              className="mt-2 text-xs text-slate-600 hover:text-slate-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {decoding && (
        <div className="fixed inset-0 z-[99] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-slate-900 font-medium">Decoding image...</p>
          </div>
        </div>
      )}

      <ScanningModal
        isScanning={isScanning}
        activeScanType={activeScanType}
        onCancel={() => setIsScanning(false)}
        onCapture={activeScanType === 'PiCode' ? handleCameraCapture : undefined}
        onQRDecode={activeScanType === 'QR Code' ? handleQRDecode : undefined}
      />

      {view !== 'auth' && <Navigation currentView={view} onNavigate={setView} />}
    </div>
  );
};

export default App;
