/**
 * Two-Factor Authentication Setup Component
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, Smartphone, Key, Download, RefreshCw, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { twoFactorAuth, TwoFactorSettings } from '@/lib/twoFactorAuth';
import { deviceTracker, DeviceSession } from '@/lib/deviceTracker';

export const TwoFactorSetup = () => {
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSettings();
      loadDevices();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const userSettings = await twoFactorAuth.getUserSettings(user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load 2FA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    if (!user) return;
    
    try {
      const userDevices = await deviceTracker.getUserDevices(user.id);
      setDevices(userDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const startSetup = async () => {
    if (!user?.email) return;

    try {
      const newSecret = twoFactorAuth.generateSecret();
      const qr = await twoFactorAuth.generateQRCode(newSecret, user.email);
      
      setSecret(newSecret);
      setQrCode(qr);
      setSetupMode(true);
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to generate 2FA setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmSetup = async () => {
    if (!user || !secret || !verificationCode) return;

    setLoading(true);
    try {
      const result = await twoFactorAuth.enable2FA(user.id, secret, verificationCode);
      
      if (result.success) {
        setBackupCodes(result.backupCodes || []);
        setShowBackupCodes(true);
        setSetupMode(false);
        await loadSettings();
        
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been successfully enabled.",
        });
      } else {
        toast({
          title: "Setup Failed",
          description: result.error || "Failed to enable 2FA.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Setup Failed", 
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setVerificationCode('');
    }
  };

  const disable2FA = async () => {
    if (!user || !verificationCode) return;

    setLoading(true);
    try {
      const result = await twoFactorAuth.disable2FA(user.id, verificationCode);
      
      if (result.success) {
        await loadSettings();
        setVerificationCode('');
        
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled.",
        });
      } else {
        toast({
          title: "Failed to Disable",
          description: result.error || "Failed to disable 2FA.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (!user || !verificationCode) return;

    setLoading(true);
    try {
      const result = await twoFactorAuth.regenerateBackupCodes(user.id, verificationCode);
      
      if (result.success) {
        setBackupCodes(result.backupCodes || []);
        setShowBackupCodes(true);
        setVerificationCode('');
        
        toast({
          title: "Backup Codes Regenerated",
          description: "New backup codes have been generated.",
        });
      } else {
        toast({
          title: "Failed to Regenerate",
          description: result.error || "Failed to regenerate backup codes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const trustDevice = async (deviceId: string) => {
    if (!user) return;

    try {
      const result = await deviceTracker.trustDevice(user.id, deviceId);
      
      if (result.success) {
        await loadDevices();
        toast({
          title: "Device Trusted",
          description: "Device has been marked as trusted.",
        });
      } else {
        toast({
          title: "Failed to Trust Device",
          description: result.error || "Failed to trust device.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const revokeDevice = async (deviceId: string) => {
    if (!user) return;

    try {
      const result = await deviceTracker.revokeDevice(user.id, deviceId);
      
      if (result.success) {
        await loadDevices();
        toast({
          title: "Device Revoked",
          description: "Device access has been revoked.",
        });
      } else {
        toast({
          title: "Failed to Revoke Device", 
          description: result.error || "Failed to revoke device.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ddrummer-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Security Settings</h2>
      </div>

      <Tabs defaultValue="2fa" className="w-full">
        <TabsList>
          <TabsTrigger value="2fa">Two-Factor Auth</TabsTrigger>
          <TabsTrigger value="devices">Trusted Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="2fa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
                {settings?.two_factor_enabled && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!settings?.two_factor_enabled ? (
                // Setup 2FA
                <div className="space-y-4">
                  {!setupMode ? (
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button onClick={startSetup} className="w-full">
                        <Shield className="h-4 w-4 mr-2" />
                        Enable Two-Factor Authentication
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold mb-2">Set up your authenticator app</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                        {qrCode && (
                          <div className="flex justify-center mb-4">
                            <img src={qrCode} alt="QR Code" className="border rounded-lg" />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono break-all">
                          {secret}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verification-code">Enter verification code</Label>
                        <Input
                          id="verification-code"
                          type="text"
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={confirmSetup} 
                          disabled={verificationCode.length !== 6 || loading}
                          className="flex-1"
                        >
                          {loading ? 'Verifying...' : 'Verify & Enable'}
                        </Button>
                        <Button variant="outline" onClick={() => setSetupMode(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Manage 2FA
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Two-factor authentication is enabled</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate Backup Codes
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Regenerate Backup Codes</AlertDialogTitle>
                          <AlertDialogDescription>
                            Enter your current 2FA code to regenerate backup codes. This will invalidate all existing backup codes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="regen-code">Verification Code</Label>
                          <Input
                            id="regen-code"
                            type="text"
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                          />
                        </div>
                        <AlertDialogFooter>
                          <Button variant="outline" onClick={() => setVerificationCode('')}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={regenerateBackupCodes}
                            disabled={verificationCode.length !== 6 || loading}
                          >
                            {loading ? 'Generating...' : 'Regenerate'}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Disable 2FA
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the extra security layer from your account. Enter your 2FA code to confirm.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="disable-code">Verification Code</Label>
                          <Input
                            id="disable-code"
                            type="text"
                            placeholder="000000 or backup code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.slice(0, 8).toUpperCase())}
                            maxLength={8}
                          />
                        </div>
                        <AlertDialogFooter>
                          <Button variant="outline" onClick={() => setVerificationCode('')}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={disable2FA}
                            disabled={verificationCode.length < 6 || loading}
                          >
                            {loading ? 'Disabling...' : 'Disable 2FA'}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup Codes Display */}
          {showBackupCodes && backupCodes.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Key className="h-5 w-5" />
                  Backup Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded border border-orange-200">
                  <p className="text-sm text-orange-600 mb-3">
                    Save these backup codes in a secure location. Each code can only be used once.
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-muted p-2 rounded text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Codes
                  </Button>
                  <Button 
                    onClick={() => setShowBackupCodes(false)} 
                    variant="outline"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trusted Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No devices found
                  </p>
                ) : (
                  devices.map((device) => (
                    <div 
                      key={device.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{device.device_name || 'Unknown Device'}</span>
                          {device.is_trusted && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Trusted
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Type: {device.device_type || 'Unknown'}</div>
                          <div>Last seen: {new Date(device.last_seen).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!device.is_trusted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => trustDevice(device.id)}
                          >
                            Trust
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => revokeDevice(device.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};