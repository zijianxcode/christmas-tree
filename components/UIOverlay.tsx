import React, { useState, useRef } from 'react';
import { AppState } from '../types';
import { Sparkles, Upload, Loader2 } from 'lucide-react';

interface UIOverlayProps {
  mode: AppState;
  hasImage: boolean;
  onImageUpload: (file: File) => void;
  onGenerateWish: (text: string) => Promise<void>;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ mode, hasImage, onImageUpload, onGenerateWish }) => {
  const [showModal, setShowModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusText = () => {
    switch (mode) {
      case AppState.TREE: return "🎄 TREE MODE";
      case AppState.EXPLODE: return "✨ MAGIC ATMOSPHERE";
      case AppState.IMAGE: return "🖼️ PHOTO MEMORY";
      case AppState.TEXT: return "🎅 GREETINGS";
      default: return "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleGenerateClick = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    await onGenerateWish(prompt);
    setIsGenerating(false);
    setShowModal(false);
    setPrompt("");
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between items-center py-10 z-20">
      
      {/* Header */}
      <div className={`transition-opacity duration-500 flex flex-col items-center ${mode === AppState.IMAGE ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-4xl md:text-6xl font-bold tracking-[5px] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] text-center px-4">
          Merry Christmas
        </h1>
        <div className="mt-8 px-8 py-2 rounded-full border border-[#FFD700]/30 bg-white/10 backdrop-blur-md text-white font-serif tracking-widest text-lg shadow-lg">
          {getStatusText()}
        </div>
      </div>

      {/* Controls */}
      <div className={`transition-opacity duration-500 flex flex-col items-center gap-4 mb-5 pointer-events-auto ${mode === AppState.IMAGE ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group relative px-6 py-3 rounded-full bg-gradient-to-r from-[#FFD700] to-[#DAA520] text-[#2a1a00] font-serif font-bold uppercase shadow-[0_0_15px_rgba(255,215,0,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] flex items-center gap-2"
          >
            <Upload size={18} />
            {hasImage ? "Change Photo" : "Upload Photo"}
          </button>

          <button 
            onClick={() => setShowModal(true)}
            className="group relative px-6 py-3 rounded-full bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-[#002a3a] font-serif font-bold uppercase border border-white/40 shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(0,242,254,0.6)] flex items-center gap-2"
          >
            <Sparkles size={18} />
            AI Greeting
          </button>
        </div>
        <p className="text-white/60 text-sm mt-2">Click background to switch modes</p>
      </div>

      {/* AI Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50">
          <div className="bg-black/90 border-2 border-[#FFD700] rounded-2xl p-8 w-[90%] max-w-md flex flex-col gap-6 shadow-[0_0_50px_rgba(255,215,0,0.2)]">
            <h3 className="text-[#FFD700] text-2xl text-center font-serif">Who is this greeting for?</h3>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Mom, Bestie, The World..." 
              maxLength={20}
              className="w-full bg-white/10 border border-[#FFD700]/50 rounded-lg p-4 text-white text-center text-xl focus:outline-none focus:border-[#FFD700] placeholder:text-white/30"
              autoFocus
            />
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleGenerateClick}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3 rounded-full bg-[#FFD700] text-[#2a1a00] font-bold uppercase hover:bg-[#FFEA00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
              >
                {isGenerating ? <><Loader2 className="animate-spin" /> Generating Magic...</> : "Generate Magic Wish ✨"}
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/50 hover:text-white text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};