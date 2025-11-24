import { useEffect, useState } from 'react';

interface TankVisualProps {
  tankNumber: number;
  level: number;
  color?: 'magenta' | 'cyan' | 'orange' | 'green';
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const TankVisual = ({ 
  tankNumber, 
  level, 
  color = 'magenta', 
  showDetails = true,
  size = 'medium' 
}: TankVisualProps) => {
  const [animatedLevel, setAnimatedLevel] = useState(0);

  useEffect(() => {
    setTimeout(() => setAnimatedLevel(level), 100);
  }, [level]);

  const colorClasses = {
    magenta: 'from-secondary/80 to-secondary',
    cyan: 'from-primary/80 to-primary',
    orange: 'from-accent/80 to-accent',
    green: 'from-success/80 to-success',
  };

  const sizeClasses = {
    small: 'h-24 w-16',
    medium: 'h-32 w-20',
    large: 'h-40 w-24',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-semibold text-muted-foreground">Tank #{tankNumber}</div>
      
      <div className={`${sizeClasses[size]} relative border-2 border-border rounded-b-lg overflow-hidden bg-card/30`}>
        {/* Level indicators */}
        <div className="absolute top-0 left-0 right-0 flex justify-between px-1 text-[8px] text-muted-foreground z-10">
          <span>HH</span>
          <span>H</span>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-between px-1 text-[8px] text-muted-foreground z-10">
          <span>L</span>
          <span>LL</span>
        </div>

        {/* Liquid fill */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${colorClasses[color]} transition-all duration-1000 ease-out animate-liquid`}
          style={{ height: `${animatedLevel}%` }}
        >
          <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        </div>

        {/* Level percentage */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="data-value text-sm text-white drop-shadow-lg">{level}%</span>
        </div>
      </div>

      {showDetails && (
        <div className="text-center space-y-1">
          <div className="text-xs text-muted-foreground">Level: <span className="text-foreground font-mono">999.9 L</span></div>
          <div className="text-xs text-muted-foreground">Density: <span className="text-foreground font-mono">1.25</span></div>
        </div>
      )}
    </div>
  );
};
