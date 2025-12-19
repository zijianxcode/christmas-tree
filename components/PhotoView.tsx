import React, { useState, useEffect, useRef } from 'react';
import { AppState } from '../types';

interface PhotoViewProps {
  mode: AppState;
  imageSrc: string | null;
}

export const PhotoView: React.FC<PhotoViewProps> = ({ mode, imageSrc }) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, rx: 0, ry: 0, scale: 1 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    if (mode !== AppState.IMAGE) {
      setTransform({ x: 0, y: 0, rx: 0, ry: 0, scale: 1 });
    }
  }, [mode]);

  if (mode !== AppState.IMAGE || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 2) return;
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    
    // Right click rotates, left click moves
    if (e.buttons === 2) {
      setTransform(prev => ({
        ...prev,
        ry: prev.ry + dx * 0.2,
        rx: prev.rx - dy * 0.2
      }));
    } else {
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.001;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale + delta))
    }));
  };

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full z-10 flex justify-center items-center overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className="relative shadow-[0_0_30px_rgba(0,0,0,0.8)] border-2 border-[#FFD700] cursor-grab active:cursor-grabbing origin-center transition-transform duration-75"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotateX(${transform.rx}deg) rotateY(${transform.ry}deg) scale(${transform.scale})`
        }}
      >
        <img 
          src={imageSrc} 
          alt="Memory" 
          className="max-w-[60vw] max-h-[60vh] object-contain block select-none pointer-events-none"
        />
      </div>
    </div>
  );
};