import { NavLink, Outlet } from 'react-router-dom';
import { TopInfoPanel } from '@/components/TopInfoPanel';

const linkBase = 'px-4 py-2 rounded-md text-sm font-medium transition-colors border';

const HMI01Tabs = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <TopInfoPanel />

      <div className="flex items-center gap-2">
        <NavLink
          to="tank"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'}`
          }
        >
          Tank Section
        </NavLink>
        <NavLink
          to="pickling"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'}`
          }
        >
          Pickling Section
        </NavLink>
        <NavLink
          to="legends"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'}`
          }
        >
          Legends
        </NavLink>
      </div>

      <div className="glass-panel p-6 min-h-[900px]">
        <Outlet />
      </div>
    </div>
  );
};

export default HMI01Tabs;
