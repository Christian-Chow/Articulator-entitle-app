'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cpu, QrCode } from 'lucide-react';
import jsQR from 'jsqr';
import { BACKEND_API_URL } from '@/lib/urls';

type ScanningModalProps = {
  isScanning: boolean;
  activeScanType: string;
  onCancel: () => void;
  onCapture?: (file: File) => void;
  onQRDecode?: (data: string) => void;
};

const ScanningModal: React.FC<ScanningModalProps> = ({ isScanning, activeScanType, onCancel, onCapture, onQRDecode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopId = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  const inflightRef = useRef(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);

  // URL detection helper
  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Check camera permission state
  const checkCameraPermission = useCallback(async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
    try {
      // Check if Permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return result.state as 'granted' | 'denied' | 'prompt';
      }
    } catch (e) {
      // Permissions API might not be supported or camera permission name might not be supported
      console.log('Permission API not available or not supported:', e);
    }
    return 'unknown';
  }, []);

  // Stop auto-scanning
  const stopAutoScan = useCallback(() => {
    setIsAutoScanning(false);
    isScanningRef.current = false;
    if (scanLoopId.current !== null) {
      cancelAnimationFrame(scanLoopId.current);
      scanLoopId.current = null;
    }
    inflightRef.current = false;
  }, []);

  // Capture frame and decode (PiCode via backend, QR Code via jsQR)
  const captureAndDecode = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
        return resolve();
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        return resolve();
      }

      const minSide = Math.min(video.videoWidth, video.videoHeight);
      const side = minSide * 0.7; // 70% of smaller dimension
      const sx = (video.videoWidth - side) / 2; // Center X
      const sy = (video.videoHeight - side) / 2; // Center Y
      
      // Use higher resolution for capture, at least 800px or native crop size
      const TARGET = Math.max(side, 800);

      canvas.width = TARGET;
      canvas.height = TARGET;

      if (TARGET === 0) return resolve();

      context.drawImage(video, sx, sy, side, side, 0, 0, TARGET, TARGET);

      // QR Code: decode client-side with jsQR
      if (activeScanType === 'QR Code') {
        const imageData = context.getImageData(0, 0, TARGET, TARGET);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data && isScanningRef.current) {
          const decodedData = code.data.trim();
          // Handle URL redirects
          if (isUrl(decodedData)) {
            stopAutoScan();
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            window.location.href = decodedData;
            return resolve();
          }
          // Freeze frame before stopping camera
          if (videoRef.current) {
            try {
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = videoRef.current.videoWidth;
              tempCanvas.height = videoRef.current.videoHeight;
              const tempCtx = tempCanvas.getContext('2d');
              if (tempCtx) {
                tempCtx.drawImage(videoRef.current, 0, 0);
                setFrozenFrame(tempCanvas.toDataURL());
              }
            } catch (e) {
              console.error('Failed to capture freeze frame:', e);
            }
          }
          stopAutoScan();
          if (onQRDecode) {
            onQRDecode(decodedData);
          }
        }
        return resolve();
      }

      // PiCode: decode via backend
      canvas.toBlob(async (blob) => {
        if (blob && isScanningRef.current) {
          const file = new File([blob], 'camera-capture.png', { type: 'image/png' });
          const formData = new FormData();
          formData.append('image', file);

          try {
            const response = await fetch(`${BACKEND_API_URL}/api/decode`, {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();

            // Handle successful decode
            if (isScanningRef.current && 
                response.ok && 
                data.decodedMessage && 
                !data.decodedMessage.includes('Can not detect')) {
              
              // Handle URL redirects
              if (isUrl(data.decodedMessage)) {
                stopAutoScan();
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop());
                  streamRef.current = null;
                }
                window.location.href = data.decodedMessage;
                return;
              }

              // Freeze frame before stopping camera
              if (videoRef.current) {
                try {
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = videoRef.current.videoWidth;
                  tempCanvas.height = videoRef.current.videoHeight;
                  const tempCtx = tempCanvas.getContext('2d');
                  if (tempCtx) {
                    tempCtx.drawImage(videoRef.current, 0, 0);
                    setFrozenFrame(tempCanvas.toDataURL());
                  }
                } catch (e) {
                  console.error('Failed to capture freeze frame:', e);
                }
              }
              
              // Stop scanning and call onCapture callback
              stopAutoScan();
              if (onCapture) {
                onCapture(file);
              }
            }
          } catch (err) {
            // Non-critical error, just log it
            console.error('Decode loop error:', err);
          }
        }
        resolve();
      }, 'image/png');
    });
  }, [activeScanType, onCapture, onQRDecode, stopAutoScan]);

  // Scanning loop
  const scanLoop = useCallback(() => {
    if (!isScanningRef.current) return;
    
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
  }, [captureAndDecode]);

  // Start auto-scanning
  const startAutoScan = useCallback(() => {
    setIsAutoScanning(true);
    isScanningRef.current = true;
    scanLoopId.current = requestAnimationFrame(scanLoop);
  }, [scanLoop]);

  // Extract camera start logic into a reusable function
  // This will always attempt to request camera permission, prompting the user every time
  // Supports both mobile (back camera) and laptop/desktop (front/default camera)
  const startCamera = useCallback(async () => {
    // Reset state and cleanup
    setFrozenFrame(null);
    if (scanLoopId.current !== null) {
      cancelAnimationFrame(scanLoopId.current);
      scanLoopId.current = null;
    }
    setError(null);
    setIsAutoScanning(false);
    isScanningRef.current = false;
    inflightRef.current = false;

    try {
      // Request camera access with exact constraints from spec
      // Try back camera first (for mobile devices), fallback to front/default if needed
      let mediaStream: MediaStream | null = null;
      
      try {
        const constraints = { 
          video: { 
            facingMode: 'environment', // Back camera on mobile devices
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (envError: any) {
        // If back camera fails (e.g., on laptop), try front/default camera
        try {
          const constraints = { 
            video: { 
              facingMode: 'user', // Front camera or default camera
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          };
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (userError: any) {
          // If that also fails, try without facingMode constraint (let browser choose)
          const constraints = { 
            video: { 
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          };
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      }
      
      if (!mediaStream) {
        throw new Error('Failed to access camera');
      }
      
      // Try to enable continuous autofocus if supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      const focusModes = (capabilities as any).focusMode;
      if (focusModes && Array.isArray(focusModes) && focusModes.includes('continuous')) {
        try {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
        } catch (e) {
          console.log('Could not apply continuous focus');
        }
      }

      streamRef.current = mediaStream;
      setError(null);
      inflightRef.current = false;
      
      // Use setTimeout with 50ms delay before attaching stream
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try { 
            await videoRef.current.play(); 
          } catch (_) {}
          
          // Wait for video to be ready
          const waitUntilReady = () => {
            if (videoRef.current && 
                videoRef.current.videoWidth > 0 && 
                videoRef.current.videoHeight > 0) {
              startAutoScan();
            } else {
              requestAnimationFrame(waitUntilReady);
            }
          };
          waitUntilReady();
        }
      }, 50);
    } catch (err: any) {
      console.error('Camera error:', err);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += 'Please check your browser settings and allow camera access.';
      }
      
      setError(errorMessage);
    }
  }, [startAutoScan]);

  useEffect(() => {
    if (!isScanning) {
      // Stop camera when modal closes and reset error state
      stopAutoScan();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setError(null); // Reset error so it tries again next time
      setFrozenFrame(null);
      return;
    }

    // Start camera for PiCode and QR Code scanning
    if (activeScanType === 'PiCode' || activeScanType === 'QR Code') {
      startCamera();
    }

    return () => {
      // Cleanup on unmount
      stopAutoScan();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isScanning, activeScanType, startCamera, stopAutoScan]);

  if (!isScanning) return null;

  const showCamera = (activeScanType === 'PiCode' || activeScanType === 'QR Code') && !error;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white p-8 modal-fade-in">
      <div className="w-72 h-72 border border-white/20 rounded-[3.5rem] relative overflow-hidden bg-white/5 backdrop-blur-sm">
        {showCamera ? (
          <>
            {frozenFrame ? (
              <img 
                src={frozenFrame} 
                alt="Captured frame" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Overlay guide - centered square */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white/40 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
            </div>
          </>
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
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-serif tracking-wide">
          {error 
            ? 'Camera Permission Required' 
            : activeScanType === 'NFC' 
            ? 'Awaiting Tag...' 
            : isAutoScanning 
            ? `Scanning ${activeScanType}...` 
            : `Reading ${activeScanType}...`}
        </h2>
        <p className="mt-3 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-medium max-w-[280px] mx-auto leading-relaxed">
          {error 
            ? (error.includes('denied') || error.includes('Permission'))
              ? 'Please allow camera access in your browser settings, then try again.'
              : error
            : activeScanType === 'NFC'
            ? 'Hold your device near the piece identifier'
            : isAutoScanning
            ? activeScanType === 'QR Code'
              ? 'Align the QR code within the frame'
              : 'Align the PiCode within the frame'
            : 'Initializing camera...'}
        </p>
      </div>
      {error && (
        <button
          onClick={async () => {
            // Stop any existing stream first
            stopAutoScan();
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
            
            // Clear error state temporarily
            setError(null);
            
            // Check permission state if API is available
            const permissionState = await checkCameraPermission();
            
            // Small delay to ensure cleanup is complete before retrying
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Attempt camera access again
            if (activeScanType === 'PiCode' || activeScanType === 'QR Code') {
              try {
                // Force a fresh permission request by calling getUserMedia directly
                // This ensures we attempt even if permission was previously denied
                const constraints = { 
                  video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                  }
                };
                
                let mediaStream: MediaStream | null = null;
                
                try {
                  mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (envError: any) {
                  // Try front camera
                  try {
                    const userConstraints = { 
                      video: { 
                        facingMode: 'user',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                      }
                    };
                    mediaStream = await navigator.mediaDevices.getUserMedia(userConstraints);
                  } catch (userError: any) {
                    // Try without facingMode
                    const fallbackConstraints = { 
                      video: { 
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                      }
                    };
                    mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                  }
                }
                
                if (mediaStream) {
                  // Success! Now call startCamera to set everything up properly
                  // But first attach the stream we already have
                  streamRef.current = mediaStream;
                  
                  // Try to enable continuous autofocus if supported
                  const track = mediaStream.getVideoTracks()[0];
                  const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                  const focusModes = (capabilities as any).focusMode;
                  if (focusModes && Array.isArray(focusModes) && focusModes.includes('continuous')) {
                    try {
                      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
                    } catch (e) {
                      console.log('Could not apply continuous focus');
                    }
                  }
                  
                  setError(null);
                  inflightRef.current = false;
                  
                  // Attach to video element
                  setTimeout(async () => {
                    if (videoRef.current) {
                      videoRef.current.srcObject = mediaStream;
                      try { 
                        await videoRef.current.play(); 
                      } catch (_) {}
                      
                      // Wait for video to be ready
                      const waitUntilReady = () => {
                        if (videoRef.current && 
                            videoRef.current.videoWidth > 0 && 
                            videoRef.current.videoHeight > 0) {
                          startAutoScan();
                        } else {
                          requestAnimationFrame(waitUntilReady);
                        }
                      };
                      waitUntilReady();
                    }
                  }, 50);
                } else {
                  throw new Error('Failed to access camera');
                }
              } catch (err: any) {
                console.error('Failed to restart camera:', err);
                
                // Set appropriate error message
                let errorMessage = 'Unable to access camera. ';
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                  if (permissionState === 'denied') {
                    errorMessage += 'Camera permission is still denied. Please enable it in your browser settings and try again.';
                  } else {
                    errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
                  }
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                  errorMessage += 'No camera found on this device.';
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                  errorMessage += 'Camera is already in use by another application.';
                } else {
                  errorMessage += 'Please check your browser settings and allow camera access.';
                }
                setError(errorMessage);
              }
            }
          }}
          className="mb-4 px-8 py-2.5 bg-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors backdrop-blur-sm shadow-lg"
        >
          Try Again
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
