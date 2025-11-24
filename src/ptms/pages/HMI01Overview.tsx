import { TankVisual } from '@/components/TankVisual';
import { ArrowRight, Droplet } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { TopInfoPanel } from '@/components/TopInfoPanel';

const HMI01Overview = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <TopInfoPanel />

      {/* Pickling Tanks Section */}
      <div className="hmi-card">
        <h2 className="panel-title">Pickling Tanks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((num) => (
            <div key={num} className="glass-panel-hover p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-semibold text-primary">Pickling Tank #{num}</h3>
                <Droplet className="w-4 h-4 text-secondary" />
              </div>
              
              <div className="flex justify-center mb-4">
                <TankVisual tankNumber={num} level={75 - num * 5} color="magenta" size="large" showDetails={false} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Density:</span>
                    <span className="font-mono">1.25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cond.:</span>
                    <span className="font-mono">450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FeCl2:</span>
                    <span className="font-mono">125</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total HCL:</span>
                    <span className="font-mono">18.5%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temp:</span>
                    <span className="font-mono text-warning">85°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HCL-PV:</span>
                    <span className="font-mono">148</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HCL-SV:</span>
                    <span className="font-mono">150</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-mono text-success">{75 - num * 5}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Tanks Section */}
      <div className="hmi-card">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="panel-title mb-0">Acid Storage Tanks</h2>
          <ArrowRight className="w-4 h-4 text-primary animate-flow" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="glass-panel p-4 flex justify-center">
              <TankVisual tankNumber={num} level={85} color="magenta" size="medium" />
            </div>
          ))}
        </div>
      </div>

      {/* Spray Rinse Tanks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hmi-card">
          <h2 className="panel-title">Spray Rinse Tanks</h2>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="glass-panel p-3 flex flex-col items-center gap-2">
                <TankVisual tankNumber={num} level={num === 4 ? 60 : 45} color="cyan" size="small" showDetails={false} />
                {num === 4 && (
                  <div className="text-xs text-center space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">pH:</span>
                      <span className="font-mono">7.2</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Temp:</span>
                      <span className="font-mono">45°C</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="hmi-card">
          <h2 className="panel-title">Rinse Water Tanks</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">Rinse Water Storage</h3>
              <TankVisual tankNumber={1} level={90} color="cyan" size="medium" showDetails={false} />
              <div className="mt-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level-PV:</span>
                  <span className="font-mono">999.9 L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level-SV:</span>
                  <span className="font-mono">1000 L</span>
                </div>
              </div>
            </div>
            
            <div className="glass-panel p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">Hot Rinse Tank</h3>
              <TankVisual tankNumber={2} level={70} color="orange" size="medium" showDetails={false} />
              <div className="mt-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level-PV:</span>
                  <span className="font-mono">750 L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temp-PV:</span>
                  <span className="font-mono text-warning">65°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HMI01Overview;
