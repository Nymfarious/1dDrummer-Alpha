/**
 * Security monitoring dashboard component (for development/admin use)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Activity, Clock, User, FileText } from 'lucide-react';
import { securityLogger } from '@/lib/securityLogger';
import { csrfProtection } from '@/lib/csrfProtection';

export const SecurityMonitor = () => {
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    loadSecurityEvents();
    setCsrfToken(csrfProtection.getToken());
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadSecurityEvents();
      setCsrfToken(csrfProtection.getToken());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadSecurityEvents = () => {
    const events = securityLogger.getRecentEvents(50);
    setSecurityEvents(events);
  };

  const clearLogs = () => {
    securityLogger.clearOldLogs(0); // Clear all logs
    loadSecurityEvents();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'auth_success':
      case 'auth_failure':
      case 'auth_logout':
        return <User className="h-4 w-4" />;
      case 'file_upload':
      case 'file_delete':
        return <FileText className="h-4 w-4" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const eventStats = securityEvents.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1;
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Monitor
        </h2>
        <div className="flex gap-2">
          <Button onClick={loadSecurityEvents} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={clearLogs} variant="destructive" size="sm">
            Clear Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityEvents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical/Error Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {(eventStats.critical || 0) + (eventStats.error || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CSRF Token</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono bg-muted p-2 rounded truncate">
              {csrfToken}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {securityEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No security events recorded
                  </p>
                ) : (
                  securityEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getEventIcon(event.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.eventType}</span>
                            <Badge variant={getSeverityColor(event.severity) as any}>
                              {event.severity}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.email && <span>Email: {event.email}</span>}
                            {event.userId && <span> | User: {event.userId.slice(0, 8)}...</span>}
                          </div>
                          {event.details && Object.keys(event.details).length > 0 && (
                            <div className="mt-2 text-xs bg-muted p-2 rounded">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(event.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Events by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['critical', 'error', 'warning', 'info'].map(severity => (
                    <div key={severity} className="flex justify-between">
                      <span className="capitalize">{severity}</span>
                      <Badge variant={getSeverityColor(severity) as any}>
                        {eventStats[severity] || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(eventStats)
                    .filter(([key]) => !['critical', 'error', 'warning', 'info'].includes(key))
                    .map(([eventType, count]) => (
                      <div key={eventType} className="flex justify-between">
                        <span className="text-sm">{eventType}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};