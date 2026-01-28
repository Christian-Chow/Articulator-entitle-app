'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Cpu, QrCode, Camera } from 'lucide-react';

type ScanningModalProps = {
  isScanning: boolean;
  activeScanType: string;
  onCancel: () => void;
  onCapture?: (file: File) => void;
};

const ScanningModal: React.FC<ScanningModalProps> = ({ isScanning, activeScanType, onCancel, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isScanning) {
      // Stop camera when modal closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    // Only start camera for PiCode scanning
    if (activeScanType === 'PiCode' && videoRef.current) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'environment', // Use back camera on mobile
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setError(null);
        } catch (err) {
          console.error('Error accessing camera:', err);
          setError('Unable to access camera. Please check permissions.');
        }
      };

      startCamera();
    }

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isScanning, activeScanType]);

  const capturePhoto = () => {
    if (!videoRef.current || !onCapture || isCapturing) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
          onCapture(file);
        }
        setIsCapturing(false);
      }, 'image/png');
    } else {
      setIsCapturing(false);
    }
  };

  if (!isScanning) return null;

  const showCamera = activeScanType === 'PiCode' && !error;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white p-8 modal-fade-in">
      <div className="w-72 h-72 border border-white/20 rounded-[3.5rem] relative overflow-hidden bg-white/5 backdrop-blur-sm">
        {showCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
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
          </>
        )}
      </div>
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-serif tracking-wide">
          {error ? 'Camera Error' : activeScanType === 'NFC' ? 'Awaiting Tag...' : `Reading ${activeScanType}...`}
        </h2>
        <p className="mt-3 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-medium max-w-[220px] mx-auto leading-relaxed">
          {error 
            ? error
            : activeScanType === 'NFC'
            ? 'Hold your device near the piece identifier'
            : `Align the ${activeScanType} on the physical piece within the frame`}
        </p>
      </div>
      {showCamera && onCapture && (
        <button
          onClick={capturePhoto}
          disabled={isCapturing}
          className="mt-8 px-10 py-3 bg-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Camera size={16} />
          {isCapturing ? 'Processing...' : 'Capture'}
        </button>
      )}
      <button
        onClick={onCancel}
        className="mt-4 px-10 py-3 bg-white/5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

export default ScanningModal;
