import React, { useState, useEffect } from 'react';

interface TimerProps {
  endTime: { seconds: number; nanoseconds: number } | Date | string; // Firestore Timestamp-like
  onFinish?: () => void;
}

const Timer: React.FC<TimerProps> = ({ endTime, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Convert Firestore timestamp to Date if needed
      let target = new Date();
      if (endTime && typeof endTime === 'object' && 'seconds' in endTime) {
        target = new Date(endTime.seconds * 1000);
      } else if (endTime) {
        target = new Date(endTime as any);
      }

      const now = new Date();
      const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        if (onFinish) onFinish();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onFinish]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`text-4xl font-mono font-bold tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

export default Timer;