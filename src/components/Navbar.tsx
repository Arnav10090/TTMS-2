import { Activity } from 'lucide-react';
import { Tank as TankIcon } from '@/components/icons/Tank';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useLastStatsUpdate } from '@/lib/lastUpdate';
import { formatDateTimeDisplay } from '@/lib/datetime';
import { useEffect, useState, useRef } from 'react';

interface NavbarProps {
  isCollapsed: boolean;
}

const DEFAULT_HEADER_HEIGHT = 64;

export const Navbar = ({ isCollapsed }: NavbarProps) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ResizeObserver to track header height and update CSS custom property
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    // Set initial height
    const initialHeight = headerEl.getBoundingClientRect().height || DEFAULT_HEADER_HEIGHT;
    document.documentElement.style.setProperty('--header-height', `${initialHeight}px`);

    // Check if ResizeObserver is available
    if (typeof ResizeObserver === 'undefined') {
      console.warn('ResizeObserver is not available. Using default header height.');
      return;
    }

    // Observe size changes
    const observer = new ResizeObserver((entries) => {
      try {
        const height = entries[0].contentRect.height || DEFAULT_HEADER_HEIGHT;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      } catch (error) {
        console.error('Error updating header height:', error);
        // Fallback to default height on error
        document.documentElement.style.setProperty('--header-height', `${DEFAULT_HEADER_HEIGHT}px`);
      }
    });

    observer.observe(headerEl);
    return () => observer.disconnect();
  }, []);

  const LastUpdatedText = () => {
    // When the tooltip opens the content mounts — capture a static snapshot
    // so seconds don't keep moving while hovered.
    const [snapshot, setSnapshot] = useState<Date | null>(null);

    useEffect(() => {
      setSnapshot(new Date());
      return () => setSnapshot(null);
      // run once on mount/unmount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ts = snapshot ?? now;
    // time with seconds for the tooltip but frozen after mount
    const nowStr = formatDateTimeDisplay(ts);

    return <div>Stats last updated at ({nowStr})</div>;
  };

  return (
    <header
      ref={headerRef}
      className={`w-full h-16 glass-panel border-b border-border/50 flex items-center justify-between px-6`}
      style={{
        // Use transform instead of left/right for better performance
        transform: isCollapsed ? 'translateX(5rem)' : 'translateX(16rem)',
        transition: 'transform 300ms ease-in-out',
        width: isCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 16rem)',
      }}
    >
      <div className="flex items-center gap-3">
        <TankIcon className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-lg font-bold">Pickling Tank Monitoring System</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/20 border border-success/30 cursor-default">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-xs font-semibold text-success">SYSTEM ONLINE</span>
              </div>
            </TooltipTrigger>

            <TooltipContent sideOffset={6}>
              <LastUpdatedText />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="text-sm font-mono text-muted-foreground">{formatDateTimeDisplay(now)}</div>

        <ThemeToggle />
      </div>
    </header>
  );
};
