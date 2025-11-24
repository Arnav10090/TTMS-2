interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'warning' | 'info';
  label?: string;
  pulse?: boolean;
}

export const StatusBadge = ({ status, label, pulse = false }: StatusBadgeProps) => {
  const statusClasses = {
    running: 'status-running',
    stopped: 'status-stopped',
    warning: 'status-warning',
    info: 'status-info',
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 ${statusClasses[status]} ${pulse ? 'animate-pulse-glow' : ''}`}>
      <div className={`w-2 h-2 rounded-full ${pulse ? 'animate-pulse' : ''}`} 
           style={{ backgroundColor: 'currentColor' }}></div>
      {label || status.toUpperCase()}
    </div>
  );
};
