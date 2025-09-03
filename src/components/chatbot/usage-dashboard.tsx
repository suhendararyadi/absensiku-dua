'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UsageTracker, UsageStats } from '@/lib/usage-tracker';
import { 
  Activity, 
  Clock, 
  Calendar, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UsageDashboardProps {
  className?: string;
}

export function UsageDashboard({ className }: UsageDashboardProps) {
  const [stats, setStats] = useState<UsageStats>({
    dailyRequests: 0,
    lastResetDate: new Date().toDateString(),
    totalTokensUsed: 0,
    minutelyRequests: 0,
    lastMinuteReset: Date.now()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = () => {
    setIsRefreshing(true);
    setStats(UsageTracker.getUsageStats());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    // Initial load
    refreshStats();
    
    // Auto refresh every 5 seconds
    const interval = setInterval(refreshStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const percentages = UsageTracker.getUsagePercentage();
  const remaining = UsageTracker.getRemainingRequests();
  const canMakeRequest = UsageTracker.canMakeRequest();

  const getDailyStatusColor = () => {
    if (percentages.daily >= 90) return 'text-red-600';
    if (percentages.daily >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMinuteStatusColor = () => {
    if (percentages.minute >= 80) return 'text-red-600';
    if (percentages.minute >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDailyProgressColor = () => {
    if (percentages.daily >= 90) return 'bg-red-500';
    if (percentages.daily >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMinuteProgressColor = () => {
    if (percentages.minute >= 80) return 'bg-red-500';
    if (percentages.minute >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Gemini 1.5 Flash Usage
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={canMakeRequest ? 'default' : 'destructive'}>
              {canMakeRequest ? (
                <><CheckCircle className="h-3 w-3 mr-1" />Available</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-1" />Limited</>
              )}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshStats}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Daily Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Daily Usage</span>
            </div>
            <span className={`text-sm font-bold ${getDailyStatusColor()}`}>
              {stats.dailyRequests}/1400
            </span>
          </div>
          <Progress 
            value={Math.min(percentages.daily, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Remaining: {remaining.daily} requests</span>
            <span>{percentages.daily.toFixed(1)}% used</span>
          </div>
        </div>

        {/* Minute Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Per Minute</span>
            </div>
            <span className={`text-sm font-bold ${getMinuteStatusColor()}`}>
              {stats.minutelyRequests}/10
            </span>
          </div>
          <Progress 
            value={Math.min(percentages.minute, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Remaining: {remaining.minute} requests</span>
            <span>{percentages.minute.toFixed(1)}% used</span>
          </div>
        </div>

        {/* Token Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tokens Used</span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {stats.totalTokensUsed.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Alert */}
        {!canMakeRequest && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {percentages.daily >= 100 
                ? 'Batas harian tercapai. Reset otomatis besok.' 
                : 'Batas per menit tercapai. Tunggu sebentar sebelum mengirim pesan lagi.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            <strong>Free Tier Limits:</strong> 1,500 requests/day, 15 requests/minute.
            <br />
            <strong>Current Buffer:</strong> 1,400 daily, 10 per minute untuk stabilitas.
          </AlertDescription>
        </Alert>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Debug Info
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {UsageTracker.getDebugInfo()}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export default UsageDashboard;