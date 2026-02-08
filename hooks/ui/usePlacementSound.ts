import { useCallback } from 'react';
import { useSession } from 'next-auth/react';

type SoundType = 'click' | 'correct' | 'wrong' | 'start' | 'victory' | 'pop' | 'countdown';

export const usePlacementSound = () => {
  const { data: session } = useSession();
  
  // Default to true if undefined
  const isEnabled = session?.user?.preferences?.soundEffectsEnabled ?? true;

  const playSound = useCallback((type: SoundType) => {
    if (!isEnabled) return;

    const audio = new Audio(`/sounds/${type}.mp3`);
    // Reset time to 0 to allow rapid replay
    audio.currentTime = 0;
    audio.play().catch(err => {
        // Ignore auto-play policy errors or file not found
        // console.warn("Audio play failed", err);
    });
  }, [isEnabled]);

  return { playSound };
};
