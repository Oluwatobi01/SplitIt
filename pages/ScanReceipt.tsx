import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeReceipt } from '../services/gemini';

const ScanReceipt: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // 1. Try specifically for the rear camera (environment)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.warn("Environment camera failed or not found, trying fallback:", err);
        try {
            // 2. Fallback: Try any available video source
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasPermission(true);
        } catch (fallbackErr) {
            console.error("All camera attempts failed:", fallbackErr);
            setHasPermission(false);
        }
      }
    };

    startCamera();

    return () => {
      // Cleanup stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleAnalysisResult = (result: any) => {
    navigate('/split-bill', { 
        state: { scannedData: result } 
    });
  };

  const processImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
        const result = await analyzeReceipt(base64Image);
        handleAnalysisResult(result);
    } catch (error) {
        console.error("Analysis failed", error);
        alert("Could not analyze receipt. Please try again or enter details manually.");
        setIsAnalyzing(false);
    }
  };

  const captureAndAnalyze = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
          alert("Camera not ready yet");
          return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to Base64 (remove prefix)
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      await processImage(base64Image);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const result = reader.result as string;
          const base64Image = result.split(',')[1];
          processImage(base64Image);
      };
      reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="relative h-screen w-full bg-black flex flex-col font-display">
        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
        />

        {/* Camera View */}
        <div className="relative flex-1 overflow-hidden bg-zinc-900">
            {hasPermission === false ? (
                <div className="flex h-full flex-col items-center justify-center text-white p-6 text-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-white/50">no_photography</span>
                    <p className="max-w-xs text-white/80">Camera not available or permission denied.</p>
                    <button 
                        onClick={triggerFileUpload}
                        className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-colors"
                    >
                        Upload Image Instead
                    </button>
                </div>
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 h-full w-full object-cover"
                />
            )}
            
            {/* Overlay UI */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 z-10 pointer-events-none">
                <div className="flex justify-between items-center pointer-events-auto">
                    <button onClick={() => navigate(-1)} className="p-2 bg-black/40 rounded-full backdrop-blur-md text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <div className="px-4 py-1 bg-black/40 rounded-full backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                        {isAnalyzing ? 'Analyzing...' : 'Scan Receipt'}
                    </div>
                    <button className="p-2 bg-black/40 rounded-full backdrop-blur-md text-white opacity-0">
                        <span className="material-symbols-outlined">flash_on</span>
                    </button>
                </div>

                {/* Scanner Frame */}
                {!isAnalyzing && hasPermission !== false && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-96 border-2 border-white/30 rounded-3xl transition-opacity duration-300">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                    </div>
                )}

                {/* Loading State */}
                {isAnalyzing && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 pointer-events-auto">
                        <div className="size-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-white font-medium text-lg animate-pulse">Processing with Gemini...</p>
                    </div>
                )}
            </div>
        </div>

        {/* Controls */}
        <div className="h-36 bg-black flex items-center justify-center gap-12 pb-8">
            <button 
                onClick={triggerFileUpload}
                disabled={isAnalyzing}
                className="size-12 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
                <span className="material-symbols-outlined">image</span>
            </button>
            
            {hasPermission !== false ? (
                <button 
                    onClick={captureAndAnalyze}
                    disabled={isAnalyzing}
                    className={`size-20 rounded-full border-4 border-white flex items-center justify-center p-1 transition-transform ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                >
                    <div className="w-full h-full bg-white rounded-full"></div>
                </button>
            ) : (
                <div className="size-20 rounded-full border-4 border-zinc-700 flex items-center justify-center">
                    <div className="w-full h-full bg-zinc-800 rounded-full"></div>
                </div>
            )}
            
             <button className="size-12 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors">
                <span className="material-symbols-outlined">help</span>
            </button>
        </div>
    </div>
  );
};

export default ScanReceipt;
