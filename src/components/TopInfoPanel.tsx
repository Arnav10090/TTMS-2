import { Activity, TrendingUp, Zap } from 'lucide-react';

export const TopInfoPanel = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Running Coil Data */}
      <div className="hmi-card">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="panel-title mb-0">Running Coil Data</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Coil ID</p>
            <p className="data-value text-base">C-2547-A</p>
          </div>
          <div>
            <p className="text-muted-foreground">Width (mm)</p>
            <p className="data-value text-base">1250</p>
          </div>
          <div>
            <p className="text-muted-foreground">Thickness (mm)</p>
            <p className="data-value text-base">2.5</p>
          </div>
          <div>
            <p className="text-muted-foreground">Grade</p>
            <p className="data-value text-base">SS-304</p>
          </div>
        </div>
      </div>

      {/* Line Status/Condition */}
      <div className="hmi-card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-success" />
          <h3 className="panel-title mb-0">Line Status / Condition</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Speed (MPM)</p>
            <p className="data-value text-base text-success">45.2</p>
          </div>
          <div>
            <p className="text-muted-foreground">Prod. Rate (T/Hr)</p>
            <p className="data-value text-base">12.8</p>
          </div>
          <div>
            <p className="text-muted-foreground">Days Prod (T)</p>
            <p className="data-value text-base">256</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cum. Prod (T)</p>
            <p className="data-value text-base">15,487</p>
          </div>
        </div>
      </div>

      {/* Line Performance */}
      <div className="hmi-card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-warning" />
          <h3 className="panel-title mb-0">Line Performance</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Running Hrs (KWH)</p>
            <p className="data-value text-base">2,547</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg. Utilization</p>
            <p className="data-value text-base text-warning">87.5%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Line Speed</p>
            <p className="data-value text-base">43.8 MPM</p>
          </div>
          <div>
            <p className="text-muted-foreground">Yield</p>
            <p className="data-value text-base text-success">96.2%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
