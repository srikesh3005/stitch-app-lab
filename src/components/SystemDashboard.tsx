import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { writeVehicleData, listenVehicleData, VehicleData } from '@/lib/firebaseService';
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
  Pause,
  TrendingUp,
  Shield,
  Cpu,
  Wifi,
  Battery,
  Clock,
  Target,
  BarChart3,
  ChevronRight
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

  // Firebase state for vehicle data
  const [vehicleDataHistory, setVehicleDataHistory] = useState<Record<string, VehicleData>>({});
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  const [module1Active, setModule1Active] = useState(true);
  const [module2Active, setModule2Active] = useState(true);
  const [module3Active, setModule3Active] = useState(true);
  const [playAlerts, setPlayAlerts] = useState(false); // 🔊 toggle for audio alerts
  const [lastAlertTime, setLastAlertTime] = useState(0); // Track last alert time
  const [lastOverspeedTime, setLastOverspeedTime] = useState(0); // Track last overspeed alert time
  const [lastObstacleTime, setLastObstacleTime] = useState(0); // Track last obstacle alert time
  const [isSpeaking, setIsSpeaking] = useState(false); // Prevent overlapping speech

  // Play sound with overlap prevention
  const playObstacleDetectedAudio = useCallback(() => {
    if (isSpeaking) return; // Prevent overlapping speech
    
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance('Obstacle detected');
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Audio not supported in this browser. Message: Obstacle detected');
    }
  }, [isSpeaking]);

  // Play overspeed alert with overlap prevention
  const playOverspeedAudio = useCallback(() => {
    if (isSpeaking) return; // Prevent overlapping speech
    
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance('Overspeed');
      utterance.rate = 1.2;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Audio not supported in this browser. Message: Overspeed');
    }
  }, [isSpeaking]);

  // Firebase real-time listener for vehicle data
  useEffect(() => {
    const unsubscribe = listenVehicleData((data) => {
      if (data) {
        setVehicleDataHistory(data);
        setIsFirebaseConnected(true);
        setFirebaseError(null);
      } else {
        setVehicleDataHistory({});
      }
    });

    // Handle connection errors
    const handleError = (error: any) => {
      console.error('Firebase connection error:', error);
      setFirebaseError('Failed to connect to Firebase');
      setIsFirebaseConnected(false);
    };

    return () => {
      unsubscribe();
    };
  }, []);

  // Function to save current simulated data to Firebase
  const saveVehicleDataToFirebase = useCallback(async (speed: number, obstacleDistance: number) => {
    try {
      const timestamp = Date.now().toString();
      const vehicleData: VehicleData = {
        speed,
        obstacleDistance,
        timestamp
      };
      await writeVehicleData(vehicleData);
      setFirebaseError(null);
    } catch (error) {
      console.error('Error writing to Firebase:', error);
      setFirebaseError('Failed to save data to Firebase');
    }
  }, []);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (systemStatus.isRunning) {
        const currentTime = Date.now();
        const timeSinceLastAlert = currentTime - lastAlertTime;
        const timeSinceLastOverspeed = currentTime - lastOverspeedTime;
        const timeSinceLastObstacle = currentTime - lastObstacleTime;
        const minAlertInterval = 3000; // Minimum 3 seconds between general alerts
        const minOverspeedInterval = 6000; // Minimum 6 seconds between overspeed alerts
        const minObstacleInterval = 8000; // Minimum 8 seconds between obstacle alerts

        // Obstacle detection - trigger every 8+ seconds
        const shouldTriggerObstacle = timeSinceLastObstacle > minObstacleInterval;
        const newObstacleDetected = shouldTriggerObstacle && Math.random() < 0.8; // 80% chance when interval is met

        setSystemStatus(prev => {
          // Simulate speed changes with reduction after overspeed
          let speedChange;
          const timeSinceOverspeed = currentTime - lastOverspeedTime;
          const recentlyOverspeed = timeSinceOverspeed < 10000; // Within 10 seconds of last overspeed
          
          if (prev.currentSpeed < 50) {
            // Gradual acceleration
            speedChange = Math.random() * 4 + 1; // 1-5 km/h increase
          } else if (prev.currentSpeed < 70) {
            if (recentlyOverspeed) {
              // Reduce speed after overspeed alert
              speedChange = -Math.random() * 6 - 2; // 2-8 km/h decrease
            } else {
              // Moderate changes when approaching speed limit
              speedChange = (Math.random() - 0.3) * 8; // Slight bias towards increase
            }
          } else {
            if (recentlyOverspeed) {
              // More aggressive reduction when recently overspeed
              speedChange = -Math.random() * 8 - 3; // 3-11 km/h decrease
            } else {
              // More random when already high speed
              speedChange = (Math.random() - 0.5) * 6;
            }
          }
          
          const newSpeed = Math.max(0, prev.currentSpeed + speedChange);
          const isOverspeed = newSpeed > 60;

          // 🟢 Only play obstacle alerts if enabled, not speaking, and enough time has passed (8 seconds)
          if (newObstacleDetected && playAlerts && !isSpeaking && timeSinceLastObstacle > minObstacleInterval) {
            playObstacleDetectedAudio();
            setLastAlertTime(currentTime);
            setLastObstacleTime(currentTime);
          }

          // 🔊 Play overspeed alert if speed exceeds 60 km/h (with 6-second interval)
          if (isOverspeed && playAlerts && !isSpeaking && timeSinceLastOverspeed > minOverspeedInterval) {
            playOverspeedAudio();
            setLastAlertTime(currentTime);
            setLastOverspeedTime(currentTime);
          }

          const newUpdatedStatus = {
            ...prev,
            currentSpeed: newSpeed,
            obstacleDetected: newObstacleDetected,
            batteryLevel: Math.max(0, prev.batteryLevel - 0.01),
            alerts: newObstacleDetected ? ['Obstacle Detected - Reducing Speed'] : 
                   isOverspeed ? ['Overspeed Alert - Speed Limit Exceeded'] : []
          };

          // Save simulated data to Firebase every 5 seconds (to avoid too frequent writes)
          if (currentTime % 5000 < 1000) {
            const obstacleDistance = newObstacleDetected ? Math.floor(Math.random() * 80) + 20 : Math.floor(Math.random() * 150) + 100;
            saveVehicleDataToFirebase(newSpeed, obstacleDistance);
          }

          return newUpdatedStatus;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [systemStatus.isRunning, playAlerts, lastAlertTime, lastOverspeedTime, lastObstacleTime, isSpeaking, playObstacleDetectedAudio, playOverspeedAudio, saveVehicleDataToFirebase]);

  const toggleSystem = () => {
    setSystemStatus(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
      currentSpeed: !prev.isRunning ? 45 : 0 // Start at 45 km/h to make overspeed more likely
    }));
  };

  const getSpeedStatus = () => {
    if (systemStatus.currentSpeed > systemStatus.speedLimit) return 'error';
    if (systemStatus.currentSpeed > systemStatus.speedLimit * 0.8) return 'warning';
    return 'active';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-electric/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-system/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-warning/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-electric to-system bg-clip-text text-transparent mb-3">
              Adaptive Speed Monitoring & Control System
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Real-time vehicle safety monitoring with adaptive speed control
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">System Status</div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.isRunning ? 'bg-system animate-pulse' : 'bg-muted-foreground'}`}></div>
                <span className="font-semibold">{systemStatus.isRunning ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-muted-foreground">
                  Firebase {isFirebaseConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Control */}
      <Card className="mb-8 border-electric/30 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-2xl shadow-electric/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-electric/20">
              <Power className="h-6 w-6 text-electric" />
            </div>
            System Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button 
                variant={systemStatus.isRunning ? "destructive" : "default"}
                onClick={toggleSystem}
                className={`flex items-center gap-3 px-6 lg:px-8 py-4 text-base lg:text-lg font-semibold transition-all duration-300 ${
                  systemStatus.isRunning 
                    ? 'bg-gradient-to-r from-danger to-danger/80 hover:from-danger/90 hover:to-danger/70 shadow-lg shadow-danger/25' 
                    : 'bg-gradient-to-r from-electric to-electric/80 hover:from-electric/90 hover:to-electric/70 shadow-lg shadow-electric/25'
                }`}
              >
                {systemStatus.isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                <span className="hidden sm:inline">{systemStatus.isRunning ? 'Stop System' : 'Start System'}</span>
                <span className="sm:hidden">{systemStatus.isRunning ? 'Stop' : 'Start'}</span>
              </Button>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Badge 
                  variant={systemStatus.isRunning ? "default" : "secondary"}
                  className={`px-4 py-2 text-sm font-semibold ${
                    systemStatus.isRunning 
                      ? 'bg-gradient-to-r from-system to-system/80 text-white animate-pulse' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {systemStatus.isRunning ? 'ACTIVE' : 'STANDBY'}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Runtime: {systemStatus.isRunning ? 'Active' : '0h 0m'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="h-5 w-5 text-warning" />
                  <span className="font-mono text-lg font-semibold">{systemStatus.batteryLevel.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={systemStatus.batteryLevel} 
                  className="w-32 lg:w-40 h-3 bg-muted/50"
                />
                <div className="text-xs text-muted-foreground mt-1">Battery Level</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-electric" />
                  <span className="font-mono text-lg font-semibold">{systemStatus.speedLimit} km/h</span>
                </div>
                <div className="text-xs text-muted-foreground">Speed Limit</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Firebase Error Display */}
      {firebaseError && (
        <Card className="mb-8 border-red-500/50 bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/20 backdrop-blur-xl shadow-2xl shadow-red-500/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-red-500 text-xl">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              Firebase Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <span className="font-semibold text-red-500">{firebaseError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {systemStatus.alerts.length > 0 && (
        <Card className="mb-8 border-warning/50 bg-gradient-to-r from-warning/20 via-warning/10 to-warning/20 backdrop-blur-xl shadow-2xl shadow-warning/20 animate-pulse">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-warning text-xl">
              <div className="p-2 rounded-lg bg-warning/20 animate-pulse">
                <AlertTriangle className="h-6 w-6" />
              </div>
              System Alerts
              <Badge variant="destructive" className="ml-auto animate-bounce">
                {systemStatus.alerts.length} Alert{systemStatus.alerts.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemStatus.alerts.map((alert, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg border border-warning/30">
                <div className="p-2 rounded-full bg-warning/20">
                  <Volume2 className="h-5 w-5 text-warning animate-pulse" />
                </div>
                <span className="font-semibold text-warning">{alert}</span>
                <div className="ml-auto">
                  <Badge variant="destructive" className="animate-pulse">
                    URGENT
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Module 1: Speed Measurement & Display */}
        <Card className={`border-electric/30 transition-all duration-500 hover:scale-105 ${module1Active ? 'bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-2xl shadow-electric/10' : 'opacity-60 bg-muted/20'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-electric text-xl">
                <div className="p-2 rounded-lg bg-electric/20">
                  <Gauge className="h-6 w-6" />
                </div>
                Speed Measurement
              </CardTitle>
              <Badge 
                variant={module1Active ? "default" : "secondary"} 
                className={`px-3 py-1 text-sm font-semibold ${
                  module1Active 
                    ? 'bg-gradient-to-r from-electric to-electric/80 text-white animate-pulse' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {module1Active ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced Speed Display */}
            <div className="relative bg-gradient-to-br from-display-bg via-display-bg/80 to-display-bg border-2 border-electric/30 rounded-2xl p-6 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-electric/5 to-transparent rounded-2xl"></div>
              <div className="relative text-center">
                <div className="text-6xl font-mono font-bold bg-gradient-to-r from-electric via-electric/80 to-system bg-clip-text text-transparent mb-2 animate-pulse">
                  {systemStatus.currentSpeed.toFixed(1)}
                </div>
                <div className="text-lg text-muted-foreground font-semibold">km/h</div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4 text-system" />
                  <span className="text-sm text-muted-foreground">Real-time Speed</span>
                </div>
              </div>
            </div>

            {/* Speed Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Speed Progress</span>
                <span className="font-mono font-semibold">
                  {((systemStatus.currentSpeed / systemStatus.speedLimit) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={(systemStatus.currentSpeed / systemStatus.speedLimit) * 100} 
                className="h-3 bg-muted/50"
              />
            </div>

            {/* Components Status */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground mb-3">Component Status</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-electric" />
                    <span className="text-sm">Hall Effect Sensor</span>
                  </div>
                  <Badge variant="default" className="bg-system text-xs px-2 py-1">ACTIVE</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-electric" />
                    <span className="text-sm">ESP32 Controller</span>
                  </div>
                  <Badge variant="default" className="bg-system text-xs px-2 py-1">CONNECTED</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-electric" />
                    <span className="text-sm">LCD Display (16x2)</span>
                  </div>
                  <Badge variant="default" className="bg-system text-xs px-2 py-1">READY</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module 2: Speed Detection & Alerts */}
        <Card className={`border-system/30 transition-all duration-500 hover:scale-105 ${module2Active ? 'bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-2xl shadow-system/10' : 'opacity-60 bg-muted/20'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-system text-xl">
                <div className="p-2 rounded-lg bg-system/20">
                  <Eye className="h-6 w-6" />
                </div>
                Detection & Alerts
              </CardTitle>
              <Badge 
                variant={module2Active ? "default" : "secondary"} 
                className={`px-3 py-1 text-sm font-semibold ${
                  module2Active 
                    ? 'bg-gradient-to-r from-system to-system/80 text-white animate-pulse' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {module2Active ? 'MONITORING' : 'STANDBY'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced Speed Status */}
            <div className="relative bg-gradient-to-br from-display-bg via-display-bg/80 to-display-bg border-2 border-system/30 rounded-2xl p-6 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-system/5 to-transparent rounded-2xl"></div>
              <div className="relative">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-muted-foreground">Speed Status</span>
                  <Badge 
                    variant={getSpeedStatus() === 'error' ? 'destructive' : 'default'}
                    className={`px-3 py-1 text-sm font-semibold ${
                      getSpeedStatus() === 'active' ? 'bg-gradient-to-r from-system to-system/80' :
                      getSpeedStatus() === 'warning' ? 'bg-gradient-to-r from-warning to-warning/80' : 
                      'bg-gradient-to-r from-danger to-danger/80'
                    }`}
                  >
                    {getSpeedStatus() === 'active' ? 'NORMAL' :
                     getSpeedStatus() === 'warning' ? 'WARNING' : 'OVERSPEED'}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-display-text mb-2">
                    Limit: {systemStatus.speedLimit} km/h
                  </div>
                  <div className="text-sm text-muted-foreground">Current: {systemStatus.currentSpeed.toFixed(1)} km/h</div>
                </div>
              </div>
            </div>

            {/* Enhanced Obstacle Detection */}
            <div className="relative bg-gradient-to-br from-display-bg via-display-bg/80 to-display-bg border-2 border-system/30 rounded-2xl p-6 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-system/5 to-transparent rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-muted-foreground">Obstacle Detection</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${systemStatus.obstacleDetected ? 'bg-danger animate-pulse shadow-lg shadow-danger/50' : 'bg-system shadow-lg shadow-system/50'}`} />
                    <Shield className={`h-4 w-4 ${systemStatus.obstacleDetected ? 'text-danger' : 'text-system'}`} />
                  </div>
                </div>
                <div className="text-center">
                  <span className={`font-mono text-lg font-bold ${
                    systemStatus.obstacleDetected ? 'text-danger animate-pulse' : 'text-system'
                  }`}>
                    {systemStatus.obstacleDetected ? 'OBSTACLE DETECTED' : 'CLEAR PATH'}
                  </span>
                </div>
              </div>
            </div>

            {/* Components Status */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground mb-3">Sensor Status</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-system" />
                    <span className="text-sm">Ultrasonic Sensor</span>
                  </div>
                  <Badge variant="default" className="bg-system text-xs px-2 py-1 animate-pulse">SCANNING</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-system" />
                    <span className="text-sm">DF Player + Speaker</span>
                  </div>
                  <Badge variant="default" className="bg-system text-xs px-2 py-1">READY</Badge>
                </div>
              </div>
            </div>

            {/* Enhanced Audio Alerts Toggle */}
            <Button
              variant={playAlerts ? "default" : "secondary"}
              className={`w-full py-4 text-sm font-semibold transition-all duration-300 ${
                playAlerts 
                  ? 'bg-gradient-to-r from-system to-system/80 hover:from-system/90 hover:to-system/70 shadow-lg shadow-system/25' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
              onClick={() => setPlayAlerts(!playAlerts)}
            >
              <Volume2 className="h-4 w-4" />
              {playAlerts ? 'Disable Audio Alerts' : 'Enable Audio Alerts'}
            </Button>
          </CardContent>
        </Card>

        {/* Module 3: Speed Control Unit */}
        <Card className={`border-warning/30 transition-all duration-500 hover:scale-105 ${module3Active ? 'bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-2xl shadow-warning/10' : 'opacity-60 bg-muted/20'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-warning text-xl">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Car className="h-6 w-6" />
                </div>
                Speed Control
              </CardTitle>
              <Badge 
                variant={module3Active ? "default" : "secondary"} 
                className={`px-3 py-1 text-sm font-semibold ${
                  module3Active 
                    ? 'bg-gradient-to-r from-warning to-warning/80 text-white animate-pulse' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {module3Active ? 'CONTROL' : 'MANUAL'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced Motor Status */}
            <div className="relative bg-gradient-to-br from-display-bg via-display-bg/80 to-display-bg border-2 border-warning/30 rounded-2xl p-6 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent rounded-2xl"></div>
              <div className="relative text-center">
                <div className="text-4xl font-mono font-bold bg-gradient-to-r from-warning via-warning/80 to-warning/60 bg-clip-text text-transparent mb-2">
                  {systemStatus.isRunning ? 'AUTO' : 'MANUAL'}
                </div>
                <div className="text-sm text-muted-foreground font-semibold">Control Mode</div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Settings className="h-4 w-4 text-warning" />
                  <span className="text-sm text-muted-foreground">Motor Control System</span>
                </div>
              </div>
            </div>

            {/* Enhanced Speed Control */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-muted-foreground">Target Speed</span>
                <span className="font-mono text-lg font-bold text-warning">{systemStatus.speedLimit} km/h</span>
              </div>
              <div className="space-y-2">
                <Progress 
                  value={(systemStatus.currentSpeed / systemStatus.speedLimit) * 100} 
                  className="h-4 bg-muted/50"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 km/h</span>
                  <span className="font-semibold">Current: {systemStatus.currentSpeed.toFixed(1)} km/h</span>
                  <span>{systemStatus.speedLimit} km/h</span>
                </div>
              </div>
            </div>

            {/* Components Status */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground mb-3">Control Components</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-warning" />
                    <span className="text-sm">Motor Driver (TB6612)</span>
                  </div>
                  <Badge variant="default" className="bg-warning text-xs px-2 py-1">ACTIVE</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-warning" />
                    <span className="text-sm">DC Motor & Wheels</span>
                  </div>
                  <Badge variant="default" className="bg-warning text-xs px-2 py-1 animate-pulse">RUNNING</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-warning" />
                    <span className="text-sm">ESP32 Control</span>
                  </div>
                  <Badge variant="default" className="bg-warning text-xs px-2 py-1">CONNECTED</Badge>
                </div>
              </div>
            </div>

            {/* Enhanced Control Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="default" 
                className="flex-1 py-3 bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 shadow-lg shadow-warning/25"
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 py-3 bg-gradient-to-r from-muted to-muted/80 hover:from-muted/90 hover:to-muted/70"
                size="sm"
              >
                <Settings className="h-4 w-4" />
                Manual
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced System Flow Indicator */}
      <Card className="mt-8 border-muted/30 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-2xl shadow-muted/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-electric/20">
              <Activity className="h-6 w-6 text-electric" />
            </div>
            System Data Flow
            <Badge variant="default" className="ml-auto bg-gradient-to-r from-electric to-electric/80 text-white animate-pulse">
              LIVE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 md:py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
            {/* Speed Input */}
            <div className="text-center group">
              <div className="relative w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-electric to-electric/80 rounded-full flex items-center justify-center mb-3 shadow-2xl shadow-electric/25 group-hover:scale-110 transition-all duration-300">
                <Gauge className="h-6 w-6 md:h-8 md:w-8 text-white" />
                <div className="absolute inset-0 bg-electric/20 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">Speed Input</span>
              <div className="text-xs text-muted-foreground mt-1">Hall Sensor</div>
            </div>
            
            {/* Flow Arrow 1 */}
            <div className="flex-1 relative mx-2 lg:mx-6">
              <div className="h-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-electric via-electric/80 to-electric rounded-full w-full animate-data-flow shadow-lg shadow-electric/25" style={{animationDelay: '0s', animationDuration: '4s'}}></div>
              </div>
              <ChevronRight className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-electric animate-pulse" style={{animationDelay: '0s'}} />
            </div>
            
            {/* Processing */}
            <div className="text-center group">
              <div className="relative w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-system to-system/80 rounded-full flex items-center justify-center mb-3 shadow-2xl shadow-system/25 group-hover:scale-110 transition-all duration-300">
                <Eye className="h-6 w-6 md:h-8 md:w-8 text-white" />
                <div className="absolute inset-0 bg-system/20 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">Processing</span>
              <div className="text-xs text-muted-foreground mt-1">ESP32 Core</div>
            </div>
            
            {/* Flow Arrow 2 */}
            <div className="flex-1 relative mx-2 lg:mx-6">
              <div className="h-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-system via-system/80 to-system rounded-full w-full animate-data-flow shadow-lg shadow-system/25" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
              </div>
              <ChevronRight className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-system animate-pulse" style={{animationDelay: '2s'}} />
            </div>
            
            {/* Control Output */}
            <div className="text-center group">
              <div className="relative w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-warning to-warning/80 rounded-full flex items-center justify-center mb-3 shadow-2xl shadow-warning/25 group-hover:scale-110 transition-all duration-300">
                <Car className="h-6 w-6 md:h-8 md:w-8 text-white" />
                <div className="absolute inset-0 bg-warning/20 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">Control Output</span>
              <div className="text-xs text-muted-foreground mt-1">Motor Control</div>
            </div>
          </div>
          
          {/* Flow Status */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric/10 via-system/10 to-warning/10 rounded-full border border-electric/20">
              <div className="w-2 h-2 bg-system rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-muted-foreground">Data Flow Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
