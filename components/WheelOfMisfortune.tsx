import React, { useState, useEffect } from 'react';

interface WheelProps {
  candidates: { name: string; id: string }[];
  onSpinComplete: (winnerId: string) => void;
  canSpin?: boolean;
}

const WheelOfMisfortune: React.FC<WheelProps> = ({ candidates, onSpinComplete, canSpin = true }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  const spin = () => {
    if (spinning || candidates.length === 0 || !canSpin) return;

    setSpinning(true);
    setWinner(null);

    // Random spins (5-10 full rotations) + random segment
    const segmentAngle = 360 / candidates.length;
    const randomSegment = Math.floor(Math.random() * candidates.length);
    const extraDegrees = 360 * 5 + (360 - (randomSegment * segmentAngle)); 
    
    const newRotation = rotation + extraDegrees;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const winningCandidate = candidates[randomSegment];
      setWinner(winningCandidate.name);
      onSpinComplete(winningCandidate.id);
    }, 5000); // Animation duration matches CSS
  };

  // Determine colors
  const colors = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#3B82F6', '#A855F7'];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h3 className="text-xl font-bold text-ea-red mb-4 uppercase tracking-widest animate-pulse">
        Tie Detected! Spin the Wheel!
      </h3>
      
      <div className="relative w-64 h-64 mb-8">
        {/* Arrow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-md"></div>

        {/* Wheel */}
        <div 
          className="w-full h-full rounded-full border-4 border-gray-700 overflow-hidden relative transition-transform cubic-bezier(0.25, 0.1, 0.25, 1)"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionDuration: '5s'
          }}
        >
          {candidates.map((c, i) => {
            const angle = 360 / candidates.length;
            const skewY = 90 - angle;
            return (
              <div 
                key={c.id}
                className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left border-l border-b border-black/20"
                style={{
                  transform: `rotate(${i * angle}deg) skewY(-${skewY}deg)`,
                  background: colors[i % colors.length]
                }}
              >
                <span 
                  className="absolute left-[20%] bottom-[20%] text-xs font-bold text-white transform"
                  style={{
                      transform: `skewY(${skewY}deg) rotate(${angle/2}deg)`
                  }}
                >
                  {c.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {winner ? (
        <div className="text-2xl font-black text-white bg-red-600 px-6 py-2 rounded-lg shadow-lg transform scale-110 transition-all">
          {winner} IS THE WORST!
        </div>
      ) : (
        <button 
          onClick={spin}
          disabled={spinning || !canSpin}
          className="bg-white text-black font-bold py-3 px-8 rounded-full shadow-lg active:scale-95 disabled:opacity-50"
        >
          {canSpin ? (spinning ? "PRAYING..." : "SPIN FOR SHAME") : "Host will spin"}
        </button>
      )}
    </div>
  );
};

export default WheelOfMisfortune;
