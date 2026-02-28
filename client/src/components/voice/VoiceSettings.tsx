import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader
} from 'lucide-react';

interface VoiceSettingsData {
  consent_given: boolean;
  auto_delete_audio: boolean;
  retention_days: number;
  email_notifications: boolean;
  include_in_insights: boolean;
}

export default function VoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/voice/settings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof VoiceSettingsData, value: boolean) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);
      const res = await fetch('/api/voice/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [key]: value })
      });

      if (!res.ok) throw new Error('Failed to update settings');
      setSettings({ ...settings, [key]: value });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSliderChange = async (key: string, value: number) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);
      const res = await fetch('/api/voice/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [key]: value })
      });

      if (!res.ok) throw new Error('Failed to update settings');
      setSettings({ ...settings, [key]: value });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/voice/export', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to export data');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export data');
      console.error(err);
    }
  };

  const handleDeleteData = async () => {
    if (!window.confirm('Are you sure you want to delete all voice data? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/voice/data', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to delete data');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to delete data');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Failed to load voice settings
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Voice Analysis Settings</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Settings saved successfully
        </div>
      )}

      <div className="space-y-6">
        {/* Consent Toggle */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Enable Voice Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">Allow processing of voice entries for emotional and wellness insights</p>
          </div>
          <div className="flex items-center gap-3">
            {settings.consent_given ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            )}
            <button
              onClick={() => handleToggle('consent_given', !settings.consent_given)}
              disabled={isSaving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.consent_given ? 'bg-green-600' : 'bg-gray-300'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.consent_given ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Auto-delete Audio */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Auto-Delete Audio Files</h3>
            <p className="text-sm text-gray-600 mt-1">Automatically delete audio files after analysis completes to save storage</p>
          </div>
          <button
            onClick={() => handleToggle('auto_delete_audio', !settings.auto_delete_audio)}
            disabled={isSaving}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              settings.auto_delete_audio ? 'bg-blue-600' : 'bg-gray-300'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settings.auto_delete_audio ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Retention Period Slider */}
        <div className="pb-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Audio Retention Period</h3>
          <p className="text-sm text-gray-600 mb-4">How long to keep audio files before automatic deletion</p>

          <div className="space-y-4">
            <Slider
              min={1}
              max={90}
              step={1}
              value={[settings.retention_days]}
              onValueChange={([v]) => handleSliderChange('retention_days', v)}
              disabled={isSaving}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 day</span>
              <span className="font-semibold text-gray-900 text-sm">{settings.retention_days} days</span>
              <span>90 days</span>
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-600 mt-1">Receive email summaries of your voice analysis insights</p>
          </div>
          <button
            onClick={() => handleToggle('email_notifications', !settings.email_notifications)}
            disabled={isSaving}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              settings.email_notifications ? 'bg-blue-600' : 'bg-gray-300'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settings.email_notifications ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Include in Insights */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Include in Insights</h3>
            <p className="text-sm text-gray-600 mt-1">Include voice analysis data in your wellness insights and reports</p>
          </div>
          <button
            onClick={() => handleToggle('include_in_insights', !settings.include_in_insights)}
            disabled={isSaving}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              settings.include_in_insights ? 'bg-blue-600' : 'bg-gray-300'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settings.include_in_insights ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Data Management */}
        <div className="pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Data Management</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export My Data
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteData}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Voice Data
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Exporting data may take a few moments. Deleting data is permanent and cannot be undone.
          </p>
        </div>
      </div>
    </Card>
  );
}
