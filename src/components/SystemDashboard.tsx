import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  Car, 
  Gauge, 
  Power, 
  Settings, 
  Zap,
  Volume2,
  Eye,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';

interface SystemStatus {
  isRunning: boolean;
  currentSpeed: number;
  speedLimit: number;
  obstacleDetected: boolean;
  batteryLevel: number;
  alerts: string[];
}

export const SystemDashboard = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isRunning: false,
    currentSpeed: 0,
    speedLimit: 60,
    obstacleDetected: false,
    batteryLevel: 85,
    alerts: []
  });

  const [module1Active, setModule1Active] = useState(true);
  const [module2Active, setModule2Active] = useState(true);
  const [module3Active, setModule3Active] = useState(true);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (systemStatus.isRunning) {
        setSystemStatus(prev => ({
          ...prev,
          currentSpeed: Math.max(0, prev.currentSpeed + (Math.random() - 0.5) * 10),
          obstacleDetected: Math.random() < 0.1,
          batteryLevel: Math.max(0, prev.batteryLevel - 0.01),
          alerts: prev.obstacleDetected ? ['Obstacle Detected - Reducing Speed'] : []
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [systemStatus.isRunning]);

  const toggleSystem = () => {
    setSystemStatus(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
      currentSpeed: !prev.isRunning ? 25 : 0
    }));
  };

  const getSpeedStatus = () => {
    if (systemStatus.currentSpeed > systemStatus.speedLimit) return 'error';
    if (systemStatus.currentSpeed > systemStatus.speedLimit * 0.8) return 'warning';
    return 'active';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Adaptive Speed Monitoring & Control System
        </h1>
        <p className="text-muted-foreground text-lg">
          Real-time vehicle safety monitoring with adaptive speed control
        </p>
      </div>

      {/* System Control */}
      <Card className="mb-6 border-electric/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            System Control
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant={systemStatus.isRunning ? "danger" : "electric"}
              onClick={toggleSystem}
              className="flex items-center gap-2"
            >
              {systemStatus.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {systemStatus.isRunning ? 'Stop System' : 'Start System'}
            </Button>
            <Badge 
              variant={systemStatus.isRunning ? "default" : "secondary"}
              className={systemStatus.isRunning ? "bg-system animate-pulse-system" : ""}
            >
              {systemStatus.isRunning ? 'ACTIVE' : 'STANDBY'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              <span className="font-mono text-sm">Battery: {systemStatus.batteryLevel.toFixed(1)}%</span>
            </div>
            <Progress value={systemStatus.batteryLevel} className="w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {systemStatus.alerts.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systemStatus.alerts.map((alert, index) => (
              <div key={index} className="flex items-center gap-2 text-warning">
                <Volume2 className="h-4 w-4" />
                <span>{alert}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module 1: Speed Measurement & Display */}
        <Card className={`border-electric/20 transition-all duration-300 ${module1Active ? 'bg-card/50 backdrop-blur' : 'opacity-60'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-electric">
                <Gauge className="h-5 w-5" />
                Module 1: Speed Measurement
              </CardTitle>
              <Badge variant={module1Active ? "default" : "secondary"} className={module1Active ? "bg-electric" : ""}>
                {module1Active ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Speed Display */}
            <div className="bg-display-bg border border-display-border rounded-lg p-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-display-text mb-2">
                  {systemStatus.currentSpeed.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">km/h</div>
              </div>
            </div>

            {/* Components Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Hall Effect Sensor</span>
                <Badge variant="default" className="bg-system text-xs">ACTIVE</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">ESP32 Controller</span>
                <Badge variant="default" className="bg-system text-xs">CONNECTED</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">LCD Display (16x2)</span>
                <Badge variant="default" className="bg-system text-xs">READY</Badge>
              </div>
            </div>

            <Button variant="electric" className="w-full" size="sm">
              <Settings className="h-4 w-4" />
              Calibrate Sensor
            </Button>
          </CardContent>
        </Card>

        {/* Module 2: Speed Detection & Alerts */}
        <Card className={`border-system/20 transition-all duration-300 ${module2Active ? 'bg-card/50 backdrop-blur' : 'opacity-60'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-system">
                <Eye className="h-5 w-5" />
                Module 2: Detection & Alerts
              </CardTitle>
              <Badge variant={module2Active ? "default" : "secondary"} className={module2Active ? "bg-system" : ""}>
                {module2Active ? 'MONITORING' : 'STANDBY'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Speed Status */}
            <div className="bg-display-bg border border-display-border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Speed Status</span>
                <Badge 
                  variant={getSpeedStatus() === 'error' ? 'destructive' : 'default'}
                  className={
                    getSpeedStatus() === 'active' ? 'bg-system' :
                    getSpeedStatus() === 'warning' ? 'bg-warning' : ''
                  }
                >
                  {getSpeedStatus() === 'active' ? 'NORMAL' :
                   getSpeedStatus() === 'warning' ? 'WARNING' : 'OVERSPEED'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono text-display-text">
                  Limit: {systemStatus.speedLimit} km/h
                </div>
              </div>
            </div>

            {/* Obstacle Detection */}
            <div className="bg-display-bg border border-display-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Obstacle Detection</span>
                <div className={`w-3 h-3 rounded-full ${systemStatus.obstacleDetected ? 'bg-danger animate-pulse' : 'bg-system'}`} />
              </div>
              <div className="text-center mt-2">
                <span className="font-mono text-display-text">
                  {systemStatus.obstacleDetected ? 'OBSTACLE DETECTED' : 'CLEAR PATH'}
                </span>
              </div>
            </div>

            {/* Components */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ultrasonic Sensor</span>
                <Badge variant="default" className="bg-system text-xs">SCANNING</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">DF Player + Speaker</span>
                <Badge variant="default" className="bg-system text-xs">READY</Badge>
              </div>
            </div>

            <Button variant="system" className="w-full" size="sm">
              <Volume2 className="h-4 w-4" />
              Test Audio Alert
            </Button>
          </CardContent>
        </Card>

        {/* Module 3: Speed Control Unit */}
        <Card className={`border-warning/20 transition-all duration-300 ${module3Active ? 'bg-card/50 backdrop-blur' : 'opacity-60'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-warning">
                <Car className="h-5 w-5" />
                Module 3: Speed Control
              </CardTitle>
              <Badge variant={module3Active ? "default" : "secondary"} className={module3Active ? "bg-warning" : ""}>
                {module3Active ? 'CONTROL' : 'MANUAL'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Motor Status */}
            <div className="bg-display-bg border border-display-border rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-display-text mb-2">
                  {systemStatus.isRunning ? 'AUTO' : 'MANUAL'}
                </div>
                <div className="text-sm text-muted-foreground">Control Mode</div>
              </div>
            </div>

            {/* Speed Control */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Target Speed</span>
                <span className="font-mono">{systemStatus.speedLimit} km/h</span>
              </div>
              <Progress 
                value={(systemStatus.currentSpeed / systemStatus.speedLimit) * 100} 
                className="h-2"
              />
            </div>

            {/* Components Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Motor Driver (TB6612)</span>
                <Badge variant="default" className="bg-warning text-xs">ACTIVE</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">DC Motor & Wheels</span>
                <Badge variant="default" className="bg-warning text-xs">RUNNING</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">ESP32 Control</span>
                <Badge variant="default" className="bg-warning text-xs">CONNECTED</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="warning" className="flex-1" size="sm">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button variant="display" className="flex-1" size="sm">
                <Settings className="h-4 w-4" />
                Manual
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Flow Indicator */}
      <Card className="mt-6 border-muted/20 bg-card/30 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Data Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="w-12 h-12 bg-electric rounded-full flex items-center justify-center mb-2 animate-pulse-electric">
                <Gauge className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm">Speed Input</span>
            </div>
            <div className="flex-1 relative mx-4">
              <div className="h-1 bg-muted rounded-full">
                <div className="h-full bg-electric rounded-full w-full animate-data-flow"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-system rounded-full flex items-center justify-center mb-2 animate-pulse-system">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm">Processing</span>
            </div>
            <div className="flex-1 relative mx-4">
              <div className="h-1 bg-muted rounded-full">
                <div className="h-full bg-system rounded-full w-full animate-data-flow"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-warning rounded-full flex items-center justify-center mb-2">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm">Control Output</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};