import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, Activity, Smartphone, Watch, Cloud, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_frequency: string;
  connected_at: string;
}

const AVAILABLE_INTEGRATIONS = [
  { id: 'google_fit', name: 'Google Fit', icon: Watch, description: 'Connect fitness and wellness metrics' },
  { id: 'strava', name: 'Strava', icon: Activity, description: 'Connect your workouts and activities' }
];

export default function IntegrationHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, syncFrequency: 'daily' })
      });

      if (res.ok) {
        loadIntegrations();
      } else {
        alert('Failed to connect integration');
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      alert('Failed to connect integration');
    }
  };

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId);
    try {
      const res = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Synced ${data.recordsSynced} records successfully!`);
        loadIntegrations();
      } else {
        alert('Failed to calibrate');
      }
    } catch (error) {
      console.error('Error calibrating:', error);
      alert('Failed to calibrate');
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;

    try {
      const res = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        loadIntegrations();
      } else {
        alert('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect');
    }
  };

  const getIntegrationStatus = (provider: string) => {
    return integrations.find(i => i.provider === provider);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Integration Hub</h1>
          <p className="text-gray-600">Connect your health and fitness apps to track correlations with your mood</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected Apps</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.is_active).length}
                </p>
              </div>
              <Link className="w-8 h-8 text-cyan-600" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Calibrated</p>
                <p className="text-lg font-semibold text-gray-900">
                  {integrations.length > 0 && integrations[0].last_sync_at
                    ? formatDate(integrations[0].last_sync_at)
                    : 'Never'}
                </p>
              </div>
              <Cloud className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto-Calibration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.is_active).length > 0 ? 'Enabled' : 'Off'}
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Available Integrations */}
        <Card className="p-6 bg-white mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Integrations</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_INTEGRATIONS.map((integration) => {
              const connected = getIntegrationStatus(integration.id);
              const Icon = integration.icon;

              return (
                <Card key={integration.id} className="p-5 border-2 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{integration.name}</h3>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>

                    {connected ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>

                  {connected ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last calibrated:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(connected.last_sync_at)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sync frequency:</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {connected.sync_frequency}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleSync(connected.id)}
                          disabled={syncing === connected.id}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                        >
                          {syncing === connected.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Sync Now
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnect(connected.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleConnect(integration.id)}
                      className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
          <h3 className="text-xl font-bold mb-2">💡 Why Connect Your Apps?</h3>
          <p className="opacity-90">
            By connecting your health and fitness apps, PURESOUL can calibrate correlations between your
            physical activity, sleep patterns, and mental wellness to provide personalized insights.
          </p>
        </Card>
      </div >
    </div >
  );
}
