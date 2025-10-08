import { createContext, useContext, useState, ReactNode } from 'react';

interface AIAvatarContextType {
  isOpen: boolean;
  isDocked: boolean;
  prompt: string;
  generatedImage: string | null;
  referenceImages: string[];
  setIsOpen: (open: boolean) => void;
  setIsDocked: (docked: boolean) => void;
  setPrompt: (prompt: string) => void;
  setGeneratedImage: (image: string | null) => void;
  setReferenceImages: (images: string[]) => void;
  reset: () => void;
}

const AIAvatarContext = createContext<AIAvatarContextType | undefined>(undefined);

export const AIAvatarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const reset = () => {
    setIsOpen(false);
    setIsDocked(false);
    setPrompt('');
    setGeneratedImage(null);
    setReferenceImages([]);
  };

  return (
    <AIAvatarContext.Provider
      value={{
        isOpen,
        isDocked,
        prompt,
        generatedImage,
        referenceImages,
        setIsOpen,
        setIsDocked,
        setPrompt,
        setGeneratedImage,
        setReferenceImages,
        reset,
      }}
    >
      {children}
    </AIAvatarContext.Provider>
  );
};

export const useAIAvatar = () => {
  const context = useContext(AIAvatarContext);
  if (!context) {
    throw new Error('useAIAvatar must be used within AIAvatarProvider');
  }
  return context;
};
