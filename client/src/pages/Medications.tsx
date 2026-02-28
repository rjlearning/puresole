import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pill,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Bell
} from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribed_by: string;
  start_date: string;
  is_active: boolean;
  remaining_quantity: number | null;
  total_quantity: number | null;
}

interface MedicationLog {
  id: string;
  taken_at: string;
  was_taken: boolean;
  skip_reason: string | null;
  mood_before: number | null;
  mood_after: number | null;
}

interface SideEffect {
  id: string;
  symptom: string;
  severity: number;
  occurred_at: string;
  duration_minutes: number | null;
}

export default function Medications() {
  const [activeTab, setActiveTab] = useState('medications');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<Map<string, MedicationLog[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    prescribedBy: '',
    startDate: new Date().toISOString().split('T')[0],
    totalQuantity: ''
  });

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/medications?activeOnly=true');
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications || []);

        // Load today's logs for each medication
        const today = new Date().toISOString().split('T')[0];
        const logsMap = new Map();

        for (const med of data.medications || []) {
          const logsRes = await fetch(
            `/api/medications/${med.id}/logs?startDate=${today}T00:00:00&endDate=${today}T23:59:59`
          );
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            logsMap.set(med.id, logsData.logs || []);
          }
        }

        setTodayLogs(logsMap);
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMedication.name,
          dosage: newMedication.dosage,
          frequency: newMedication.frequency,
          prescribedBy: newMedication.prescribedBy,
          startDate: newMedication.startDate,
          totalQuantity: newMedication.totalQuantity ? parseInt(newMedication.totalQuantity) : null
        })
      });

      if (res.ok) {
        setShowAddForm(false);
        setNewMedication({
          name: '',
          dosage: '',
          frequency: '',
          prescribedBy: '',
          startDate: new Date().toISOString().split('T')[0],
          totalQuantity: ''
        });
        loadMedications();
      } else {
        alert('Failed to add medication');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Failed to add medication');
    }
  };

  const handleLogMedication = async (medicationId: string, wasTaken: boolean) => {
    try {
      const res = await fetch(`/api/medications/${medicationId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          takenAt: new Date().toISOString(),
          wasTaken
        })
      });

      if (res.ok) {
        loadMedications();
      } else {
        alert('Failed to log medication');
      }
    } catch (error) {
      console.error('Error logging medication:', error);
      alert('Failed to log medication');
    }
  };

  const getTakenToday = (medicationId: string): boolean => {
    const logs = todayLogs.get(medicationId) || [];
    return logs.some(log => log.was_taken);
  };

  const getSkippedToday = (medicationId: string): boolean => {
    const logs = todayLogs.get(medicationId) || [];
    return logs.some(log => !log.was_taken);
  };

  const activeMedications = medications.filter(m => m.is_active);
  const lowSupplyMeds = medications.filter(m =>
    m.remaining_quantity !== null &&
    m.total_quantity !== null &&
    m.remaining_quantity < (m.total_quantity * 0.25)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Medication Tracker
              </h1>
              <p className="text-gray-600">
                Track your medications, doses, and side effects
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Medications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeMedications.length}
                  </p>
                </div>
                <Pill className="w-8 h-8 text-purple-600" />
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taken Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeMedications.filter(m => getTakenToday(m.id)).length} / {activeMedications.length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Supply</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {lowSupplyMeds.length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reminders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeMedications.length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Add Medication Form */}
        {showAddForm && (
          <Card className="p-6 bg-white mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Medication</h2>
            <form onSubmit={handleAddMedication} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                    placeholder="e.g., 10mg, 2 tablets"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                    placeholder="e.g., Once daily, Twice daily"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prescribed By
                  </label>
                  <input
                    type="text"
                    value={newMedication.prescribedBy}
                    onChange={(e) => setNewMedication({ ...newMedication, prescribedBy: e.target.value })}
                    placeholder="Doctor's name"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newMedication.startDate}
                    onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Quantity (optional)
                  </label>
                  <input
                    type="number"
                    value={newMedication.totalQuantity}
                    onChange={(e) => setNewMedication({ ...newMedication, totalQuantity: e.target.value })}
                    placeholder="Number of pills"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Add Medication
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="medications">
              <Pill className="w-4 h-4 mr-2" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <Calendar className="w-4 h-4 mr-2" />
              Daily Log
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <div className="space-y-4">
              {activeMedications.length === 0 ? (
                <Card className="p-12 bg-white text-center">
                  <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-600 mb-4">No medications added yet</p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Medication
                  </Button>
                </Card>
              ) : (
                activeMedications.map((med) => {
                  const takenToday = getTakenToday(med.id);
                  const skippedToday = getSkippedToday(med.id);
                  const lowSupply = med.remaining_quantity !== null &&
                    med.total_quantity !== null &&
                    med.remaining_quantity < (med.total_quantity * 0.25);

                  return (
                    <Card key={med.id} className="p-6 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{med.name}</h3>
                            {takenToday && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Taken Today
                              </Badge>
                            )}
                            {skippedToday && !takenToday && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Skipped
                              </Badge>
                            )}
                            {lowSupply && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Supply
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Dosage</p>
                              <p className="font-medium text-gray-900">{med.dosage || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Frequency</p>
                              <p className="font-medium text-gray-900">{med.frequency || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Prescribed By</p>
                              <p className="font-medium text-gray-900">{med.prescribed_by || 'Not specified'}</p>
                            </div>
                            {med.remaining_quantity !== null && (
                              <div>
                                <p className="text-gray-600">Remaining</p>
                                <p className="font-medium text-gray-900">
                                  {med.remaining_quantity} / {med.total_quantity}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          {!takenToday && (
                            <Button
                              onClick={() => handleLogMedication(med.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Taken
                            </Button>
                          )}
                          {!skippedToday && (
                            <Button
                              onClick={() => handleLogMedication(med.id, false)}
                              variant="outline"
                            >
                              Skip
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Daily Log Tab */}
          <TabsContent value="tracking">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Medication Log</h2>

              <div className="space-y-3">
                {activeMedications.map((med) => {
                  const logs = todayLogs.get(med.id) || [];
                  const takenLog = logs.find(log => log.was_taken);
                  const skippedLog = logs.find(log => !log.was_taken);

                  return (
                    <div
                      key={med.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">{med.name}</h3>
                        <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        {takenLog && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">Taken</p>
                            <p className="text-xs text-gray-500">
                              {new Date(takenLog.taken_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                        {skippedLog && !takenLog && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-yellow-600">Skipped</p>
                            <p className="text-xs text-gray-500">
                              {skippedLog.skip_reason || 'No reason provided'}
                            </p>
                          </div>
                        )}
                        {!takenLog && !skippedLog && (
                          <Badge className="bg-gray-100 text-gray-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}

                {activeMedications.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No medications to log</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Medication Insights</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Adherence Rate</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-3xl font-bold text-purple-600">
                      {activeMedications.length > 0
                        ? Math.round((activeMedications.filter(m => getTakenToday(m.id)).length / activeMedications.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Today's adherence</p>
                  </div>
                </div>

                {lowSupplyMeds.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Refill Reminders</h3>
                    <div className="space-y-2">
                      {lowSupplyMeds.map((med) => (
                        <div key={med.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="font-medium text-gray-900">{med.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Only {med.remaining_quantity} doses remaining
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>More insights will appear as you log your medications</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
