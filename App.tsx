import React, { useState } from 'react';
import { AppState, Greeting } from './types';
import { ChristmasScene } from './components/ChristmasScene';
import { UIOverlay } from './components/UIOverlay';
import { MusicControl } from './components/MusicControl';
import { PhotoView } from './components/PhotoView';
import { generateChristmasGreeting } from './services/geminiService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppState>(AppState.TREE);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<Greeting>({ line1: "MERRY", line2: "CHRISTMAS" });

  const handleSceneClick = () => {
    let nextState = (mode + 1) % 4;
    // Skip Image mode if no image is uploaded
    if (nextState === AppState.IMAGE && !uploadedImage) {
      alert('Please upload a photo first to enter Image Mode!');
      // Skip to Text mode
      nextState = AppState.TEXT;
    }
    setMode(nextState);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateWish = async (text: string) => {
    try {
      const newGreeting = await generateChristmasGreeting(text);
      setGreeting(newGreeting);
      setMode(AppState.TEXT);
    } catch (error) {
      console.error("Failed to generate wish", error);
      alert("The elves are busy! Could not generate wish.");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      <MusicControl />
      
      <ChristmasScene 
        mode={mode} 
        greetingText={greeting} 
        onSceneClick={handleSceneClick} 
      />
      
      <PhotoView 
        mode={mode} 
        imageSrc={uploadedImage} 
      />
      
      <UIOverlay 
        mode={mode} 
        hasImage={!!uploadedImage}
        onImageUpload={handleImageUpload}
        onGenerateWish={handleGenerateWish}
      />
    </div>
  );
};

export default App;