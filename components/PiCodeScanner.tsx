'use client'

import React, { useRef, useEffect, useState } from 'react';
import { QrCode, X } from 'lucide-react';

type PiCodeScannerProps = {
  isScanning: boolean;
  onCancel: () => void;
  onSuccess: (decodedMessage: string) => void;
  apiBaseUrl?: string;
};

const PiCodeScanner: React.FC<PiCodeScannerProps> = ({ 
  isScanning, 
  onCancel, 
  onSuccess,
  apiBaseUrl
}) => {
  // Use environment variable or default to localhost:3001
  const apiUrl = apiBaseUrl || process.env.NEXT_PUBLIC_PICODE_API_URL || 'http://localhost:3001';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopId = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  const inflightRef = useRef(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isScanning]);

  const startCamera = async () => {
    setError('');
    setIsInitializing(true);
    inflightRef.current = false;
    isScanningRef.current = true;

    try {
      const constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Try to enable continuous autofocus if supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        try {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
        } catch (e) {
          console.log('Could not apply continuous focus');
        }
      }

      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try { 
          await videoRef.current.play(); 
        } catch (e) {
          console.error('Error playing video:', e);
        }
        
        const waitUntilReady = () => {
          if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            setIsInitializing(false);
            startAutoScan();
          } else {
            requestAnimationFrame(waitUntilReady);
          }
        };
        waitUntilReady();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
      setIsInitializing(false);
      isScanningRef.current = false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    stopAutoScan();
    isScanningRef.current = false;
  };

  const startAutoScan = () => {
    if (scanLoopId.current) {
      cancelAnimationFrame(scanLoopId.current);
    }
    scanLoopId.current = requestAnimationFrame(scanLoop);
  };

  const stopAutoScan = () => {
    if (scanLoopId.current) {
      cancelAnimationFrame(scanLoopId.current);
      scanLoopId.current = null;
    }
    inflightRef.current = false;
  };

  const scanLoop = () => {
    if (!isScanningRef.current) return;
    
    // Throttle scans to ~10 per second
    setTimeout(() => {
      if (!inflightRef.current) {
        inflightRef.current = true;
        captureAndDecode().finally(() => {
          inflightRef.current = false;
          if (isScanningRef.current) {
            scanLoopId.current = requestAnimationFrame(scanLoop);
          }
        });
      } else {
        if (isScanningRef.current) {
          scanLoopId.current = requestAnimationFrame(scanLoop);
        }
      }
    }, 100);
  };
  
  const captureAndDecode = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const minSide = Math.min(video.videoWidth, video.videoHeight);
    const side = minSide * 0.7;
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    
    // Use higher resolution for capture, at least 800px or native crop size
    const TARGET = Math.max(side, 800);

    canvas.width = TARGET;
    canvas.height = TARGET;

    if (TARGET === 0) return;

    context.drawImage(video, sx, sy, side, side, 0, 0, TARGET, TARGET);

    canvas.toBlob(async (blob) => {
      if (blob && isScanningRef.current) {
        const file = new File([blob], 'camera-capture.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('image', file);

        try {
          const response = await fetch(`${apiUrl}/api/decode`, {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();

          if (isScanningRef.current && response.ok && data.decodedMessage && !data.decodedMessage.includes('Can not detect')) {
            stopCamera();
            onSuccess(data.decodedMessage);
          }
        } catch (err) {
          // Non-critical error, just log it
          console.error('Decode loop error:', err);
        }
      }
    }, 'image/png');
  };

  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white p-8 modal-fade-in">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="p-3 bg-white/10 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="w-72 h-72 border border-white/20 rounded-[3.5rem] relative overflow-hidden bg-white/5 backdrop-blur-sm">
        <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_30px_rgba(129,140,248,0.5)] animate-scan-line" />
        <div className="absolute top-10 left-10 w-6 h-6 border-t border-l border-white/40" />
        <div className="absolute top-10 right-10 w-6 h-6 border-t border-r border-white/40" />
        <div className="absolute bottom-10 left-10 w-6 h-6 border-b border-l border-white/40" />
        <div className="absolute bottom-10 right-10 w-6 h-6 border-b border-r border-white/40" />
        
        {/* Video feed */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
          />
        </div>
        
        {/* Overlay icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <QrCode size={120} strokeWidth={0.5} />
        </div>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-serif tracking-wide">
          {isInitializing ? 'Initializing Camera...' : 'Reading PiCode...'}
        </h2>
        <p className="mt-3 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-medium max-w-[220px] mx-auto leading-relaxed">
          Align the PiCode on the physical piece within the frame
        </p>
      </div>

      {error && (
        <div className="mt-6 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        onClick={() => {
          stopCamera();
          onCancel();
        }}
        className="mt-20 px-10 py-3 bg-white/5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

export default PiCodeScanner;
