import { TopInfoPanel } from '@/components/TopInfoPanel';
import { TankVisual } from '@/components/TankVisual';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const HMI02Pickling = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <TopInfoPanel />

      {/* Process Flow Diagram */}
      <div className="hmi-card min-h-[600px]">
        <h2 className="panel-title">Process Flow Visualization</h2>
        
        <div className="relative bg-card/20 rounded-lg p-8 border border-border/30">
          {/* Flow Direction Labels */}
          <div className="absolute top-4 left-4 flex items-center gap-2 text-sm font-semibold text-success">
            <ArrowLeft className="w-5 h-5 animate-flow" />
            <span>TO ARP</span>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <span>FROM ARP</span>
            <ArrowRight className="w-5 h-5 animate-flow" />
          </div>

          {/* Left Side Components */}
          <div className="absolute left-8 top-20 space-y-6">
            <div className="glass-panel p-3 w-32">
              <div className="text-xs font-semibold text-center text-muted-foreground">Indent Water</div>
              <div className="mt-2 h-16 border-2 border-primary/30 rounded bg-primary/10 flex items-center justify-center">
                <TankVisual tankNumber={0} level={80} color="cyan" size="small" showDetails={false} />
              </div>
            </div>

            <div className="glass-panel p-3 w-32">
              <div className="text-xs font-semibold text-center text-muted-foreground">Fume Scrub</div>
              <div className="mt-2 h-16 border-2 border-accent/30 rounded bg-accent/10"></div>
            </div>

            <div className="glass-panel p-3 w-32">
              <div className="text-xs font-semibold text-center text-muted-foreground">Waste Acid Pit</div>
              <TankVisual tankNumber={0} level={45} color="orange" size="small" showDetails={false} />
            </div>

            <div className="glass-panel p-3 w-32">
              <div className="text-xs font-semibold text-center text-muted-foreground mb-2">Waste Water Treatment</div>
            </div>
          </div>

          {/* Center - Rinse Tanks */}
          <div className="flex justify-center items-center gap-8 mb-12">
            <div className="glass-panel p-4">
              <div className="text-xs font-semibold text-center text-muted-foreground mb-2">Hot Rinse Tank</div>
              <TankVisual tankNumber={0} level={75} color="orange" size="medium" showDetails={false} />
              <div className="text-center mt-2 text-sm font-mono text-warning">999.9 L</div>
            </div>

            <ArrowRight className="w-6 h-6 text-primary animate-flow" />

            <div className="glass-panel p-4">
              <div className="text-xs font-semibold text-center text-muted-foreground mb-2">Rinse Waste Tank</div>
              <TankVisual tankNumber={0} level={60} color="cyan" size="medium" showDetails={false} />
              <div className="text-center mt-2 text-sm font-mono text-primary">850.5 L</div>
            </div>

            <ArrowRight className="w-6 h-6 text-primary animate-flow" />

            {/* Spray Rinse Sequence */}
            <div className="flex gap-4">
              {[4, 3, 2, 1].map((num) => (
                <div key={num} className="glass-panel p-3">
                  <div className="text-xs font-semibold text-center text-muted-foreground mb-2">SR#{num}</div>
                  <TankVisual tankNumber={num} level={65} color="cyan" size="small" showDetails={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom - Main Pickling and Storage Tanks */}
          <div className="mt-16">
            <div className="flex justify-center items-end gap-8">
              {/* Pickling Tanks */}
              <div>
                <div className="text-sm font-semibold text-center mb-4 text-secondary">Pickling Tanks</div>
                <div className="flex gap-4">
                  {[4, 3, 2, 1].map((num) => (
                    <div key={num} className="glass-panel p-4 bg-secondary/5">
                      <div className="text-xs font-semibold text-center text-muted-foreground mb-2">No.{num}</div>
                      <TankVisual tankNumber={num} level={70 + num * 2} color="magenta" size="large" showDetails={false} />
                      <div className="text-center mt-2 text-sm font-mono text-secondary">999.9 L</div>
                      <div className="mt-2 p-2 bg-card/40 rounded text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Temp:</span>
                          <span className="font-mono">85°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">HCl:</span>
                          <span className="font-mono">148 g/l</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ArrowRight className="w-8 h-8 text-secondary animate-flow mb-12" />

              {/* Acid Storage Tanks */}
              <div>
                <div className="text-sm font-semibold text-center mb-4 text-secondary">Acid Storage Tanks</div>
                <div className="flex gap-4">
                  {[4, 3, 2, 1].map((num) => (
                    <div key={num} className="glass-panel p-4 bg-secondary/5">
                      <div className="text-xs font-semibold text-center text-muted-foreground mb-2">No.{num}</div>
                      <TankVisual tankNumber={num} level={85} color="magenta" size="medium" showDetails={false} />
                      <div className="text-center mt-2 text-sm font-mono text-secondary">999.9 L</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Flow Diagram Image */}
      <div className="hmi-card">
        <h2 className="panel-title">Process Flow Diagram</h2>
        <div className="w-full overflow-auto">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F6495670efba34e5e9d1b6e43dcd63ffa%2F0845e386ddc44d748cfd542ee0913649?format=webp&width=800"
            alt="Pickling Section Process Flow Diagram"
            className="block mx-auto max-w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default HMI02Pickling;
