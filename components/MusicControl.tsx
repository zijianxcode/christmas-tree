import React, { useState, useEffect, useRef } from 'react';
import { Music, VolumeX } from 'lucide-react';

export const MusicControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("https://upload.wikimedia.org/wikipedia/commons/e/e6/Jingle_Bells_-_Kevin_MacLeod.ogg");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    // Auto-play attempt on first interaction
    const handleFirstInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => console.log("Autoplay prevented"));
      }
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error(e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <button
      onClick={toggleMusic}
      className={`fixed top-5 right-5 z-50 w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110 ${
        isPlaying 
          ? 'bg-[#FFD700] border-[#FFD700] text-black' 
          : 'bg-black/50 border-[#FFD700] text-[#FFD700]'
      }`}
      title="Toggle Music"
    >
      {isPlaying ? <Music size={20} /> : <VolumeX size={20} />}
    </button>
  );
};