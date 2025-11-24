import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Power, TrendingUp, Bell, FileText, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tank as TankIcon } from '@/components/icons/Tank';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

const navItems = [
  { path: '/hmi-01', icon: LayoutDashboard, label: 'Overview' },
  { path: '/pump-operation', icon: Power, label: 'Pump Operation' },
  { path: '/trends', icon: TrendingUp, label: 'Trends/Graphs' },
  { path: '/alarms', icon: Bell, label: 'Alarms/Alerts' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/historical', icon: Database, label: 'Historical Data' },
];

interface HMISidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const HMISidebar = ({ isCollapsed, onToggle }: HMISidebarProps) => {
  return (
    <aside 
      className={`fixed left-0 top-0 h-screen glass-panel border-r border-border/50 flex flex-col py-6 z-50 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="mb-8 px-4 flex items-center justify-center">
        <div className={`rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center transition-all duration-300 ${
          isCollapsed ? 'w-12 h-12' : 'w-full h-12'
        }`}>
          {isCollapsed ? (
            <TankIcon className="w-7 h-7 text-white" />
          ) : (
            <span className="text-white font-bold text-xs text-center w-full">PTMS : Pickling Tank Monitoring System</span>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="px-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={`w-full justify-center hover:bg-primary/20 ${
            isCollapsed ? '' : 'justify-end'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-warning text-warning-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-popover border border-border rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                <p className="text-sm font-medium">{item.label}</p>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={`mt-auto px-4 ${isCollapsed ? 'flex justify-center' : ''}`} />
    </aside>
  );
};
