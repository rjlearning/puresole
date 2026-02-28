import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  Heart,
  Phone,
  Users,
  MapPin,
  FileText,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

export default function SafetyPlan() {
  const [activeTab, setActiveTab] = useState('plan');
  const [warningSigns, setWarningSigns] = useState<string[]>([
    'Feeling overwhelmed',
    'Withdrawing from friends'
  ]);
  const [copingStrategies, setCopingStrategies] = useState<string[]>([
    'Deep breathing exercises',
    'Call a trusted friend'
  ]);
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: 'Best Friend', phone: '(555) 123-4567', relationship: 'Friend' }
  ]);

  const [newItem, setNewItem] = useState('');

  const handleAddItem = (list: string[], setList: Function) => {
    if (newItem.trim()) {
      setList([...list, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number, list: string[], setList: Function) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleSavePlan = async () => {
    // In production, this would save to the backend
    alert('Safety plan saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Safety Plan</h1>
              <p className="text-gray-600">Your personalized crisis response plan</p>
            </div>
          </div>

          {/* Emergency Banner */}
          <Card className="p-4 bg-red-50 border-2 border-red-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">In Crisis? Get Help Now</p>
                <div className="flex gap-4 mt-2 flex-wrap">
                  <a href="tel:988" className="text-red-700 font-medium hover:underline">
                    Call 988 (Suicide & Crisis Lifeline)
                  </a>
                  <a href="sms:988" className="text-red-700 font-medium hover:underline">
                    Text 988
                  </a>
                  <a href="/crisis-support" className="text-red-700 font-medium hover:underline">
                    View Crisis Resources
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="plan">
              <FileText className="w-4 h-4 mr-2" />
              My Plan
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Phone className="w-4 h-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Heart className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="history">
              <Users className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* My Plan Tab */}
          <TabsContent value="plan" className="space-y-6">
            {/* Warning Signs */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Warning Signs
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Signs that I might be starting to feel worse
              </p>

              <div className="space-y-2 mb-4">
                {warningSigns.map((sign, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-gray-800">{sign}</span>
                    <button
                      onClick={() => handleRemoveItem(index, warningSigns, setWarningSigns)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add a warning sign..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem(warningSigns, setWarningSigns)}
                />
                <Button
                  onClick={() => handleAddItem(warningSigns, setWarningSigns)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </Card>

            {/* Coping Strategies */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                Coping Strategies
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Things I can do to help myself feel better
              </p>

              <div className="space-y-2 mb-4">
                {copingStrategies.map((strategy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <span className="text-gray-800">{strategy}</span>
                    <button
                      onClick={() => handleRemoveItem(index, copingStrategies, setCopingStrategies)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add a coping strategy..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem(copingStrategies, setCopingStrategies)}
                />
                <Button
                  onClick={() => handleAddItem(copingStrategies, setCopingStrategies)}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSavePlan}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Safety Plan
              </Button>
            </div>
          </TabsContent>

          {/* Emergency Contacts Tab */}
          <TabsContent value="contacts">
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Emergency Contacts
              </h2>

              <div className="space-y-3 mb-6">
                {emergencyContacts.map((contact, index) => (
                  <Card key={index} className="p-4 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{contact.name}</h3>
                        <p className="text-sm text-gray-600">{contact.relationship}</p>
                        <a href={`tel:${contact.phone}`} className="text-blue-600 font-medium hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Emergency Contact
              </Button>

              {/* Professional Hotlines */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-bold text-gray-900 mb-4">24/7 Crisis Hotlines</h3>
                <div className="space-y-3">
                  <Card className="p-4 bg-red-50">
                    <h4 className="font-semibold text-gray-900">988 Suicide & Crisis Lifeline</h4>
                    <a href="tel:988" className="text-red-600 font-medium hover:underline">
                      Call or Text 988
                    </a>
                  </Card>
                  <Card className="p-4 bg-purple-50">
                    <h4 className="font-semibold text-gray-900">Crisis Text Line</h4>
                    <a href="sms:741741" className="text-purple-600 font-medium hover:underline">
                      Text HOME to 741741
                    </a>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Crisis Resources</h2>

              <div className="space-y-4">
                <Card className="p-4 bg-green-50 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="font-bold text-gray-900 mb-2">5-4-3-2-1 Grounding Exercise</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Use your senses to ground yourself in the present moment
                  </p>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Start Exercise
                  </Button>
                </Card>

                <Card className="p-4 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="font-bold text-gray-900 mb-2">4-7-8 Breathing Technique</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Calm your nervous system with controlled breathing
                  </p>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Start Exercise
                  </Button>
                </Card>

                <Card className="p-4 bg-purple-50 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="font-bold text-gray-900 mb-2">Safe Place Visualization</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Guided imagery to help you feel safe and calm
                  </p>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Start Exercise
                  </Button>
                </Card>
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="p-12 bg-white text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">No crisis events recorded</p>
              <p className="text-sm text-gray-500 mt-2">
                This section will show your crisis history and interventions
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
