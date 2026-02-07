
import React, { useRef, useEffect, useState } from 'react';

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

interface BarcodeScannerProps {
  onScan: (scannedCode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    const startScan = async () => {
      if (!('BarcodeDetector' in window)) {
        setError('Barcode Detector is not supported by this browser.');
        setIsInitializing(false);
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported by this browser.');
        setIsInitializing(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsInitializing(false);
        }

        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39', 'code_128', 'qr_code']
        });
        
        const detect = async () => {
          try {
            if (videoRef.current && !videoRef.current.paused) {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                    onScan(barcodes[0].rawValue);
                } else {
                    animationFrameId = requestAnimationFrame(detect);
                }
            }
          } catch (err) {
            console.error('Barcode detection failed:', err);
            setError('Could not detect barcode. Please try again.');
          }
        };
        
        detect();

      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera permission was denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('No camera found. Please ensure a camera is connected and enabled.');
            } else {
                setError('An error occurred while accessing the camera.');
            }
        }
        setIsInitializing(false);
      }
    };

    startScan();

    return () => {
      // Cleanup
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="relative w-full aspect-video flex items-center justify-center bg-black rounded-lg overflow-hidden">
      {isInitializing && (
          <p className="text-white">Initializing Camera...</p>
      )}
      {error ? (
        <div className="p-4 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={onClose} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Close</button>
        </div>
      ) : (
        <>
            <video
                ref={videoRef}
                playsInline
                className={`w-full h-full object-cover ${isInitializing ? 'hidden' : ''}`}
                aria-label="Camera feed for barcode scanning"
            />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-4 border-primary-dark border-dashed rounded-lg opacity-75"></div>
            </div>
        </>
      )}
    </div>
  );
};

export default BarcodeScanner;