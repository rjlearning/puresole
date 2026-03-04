import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Download,
  Trash2,
  Save,
  Check,
  PlayCircle,
  CreditCard,
  MessageSquare,
  Crown,
  ExternalLink,
  ReceiptText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { restartOnboarding } from '@/components/OnboardingManager';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const { data: subscription } = useQuery<any>({ queryKey: ['/api/subscription'] });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="data">
              <Download className="w-4 h-4 mr-2" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Billing / Payment Center Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {/* Current Plan */}
              <Card className="p-6 bg-white">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown className="w-6 h-6" /> Payment Center
                </h2>
                {subscription ? (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                      <div>
                        <p className="text-sm text-gray-500">Current Plan</p>
                        <p className="text-lg font-bold text-gray-900">{subscription.plan?.name || 'Active Plan'}</p>
                        <p className="text-sm text-gray-500 capitalize">{subscription.status}</p>
                      </div>
                      <Link href="/subscribe">
                        <button className="flex items-center gap-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl font-semibold transition-colors">
                          Change Plan <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-indigo-800 text-sm font-medium">No active subscription</p>
                    <Link href="/subscribe">
                      <button className="mt-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
                        Start 14-Day Free Trial
                      </button>
                    </Link>
                  </div>
                )}
              </Card>

              {/* Quick Links */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: CreditCard, label: 'Billing Details', sub: 'View invoices, payment method', href: '/billing' },
                  { icon: ReceiptText, label: 'Billing History', sub: 'Past payments and receipts', href: '/billing' },
                  { icon: MessageSquare, label: 'Contact Support', sub: 'Questions about your plan', href: '/contact' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} href={item.href}>
                      <div className="flex items-start gap-3 p-4 bg-white rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>UTC-08:00 Pacific Time</option>
                    <option>UTC-05:00 Eastern Time</option>
                    <option>UTC+00:00 GMT</option>
                  </select>
                </div>

                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {saved ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                {/* Onboarding Tour Section */}
                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">Onboarding Tour</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Want to see the guided tour again? Restart the onboarding to learn about all features.
                  </p>
                  <Button
                    onClick={restartOnboarding}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Restart Onboarding Tour
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Medication Reminders</h3>
                    <p className="text-sm text-gray-600">Get notified when it's time to take medication</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Daily Check-in Reminders</h3>
                    <p className="text-sm text-gray-600">Reminder to complete your daily journal entry</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Community Activity</h3>
                    <p className="text-sm text-gray-600">Notifications from support groups and events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Weekly Summary Reports</h3>
                    <p className="text-sm text-gray-600">Receive weekly wellness progress reports</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy & Security</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Profile Visibility</h3>
                  <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Private - Only me</option>
                    <option>Friends - My connections only</option>
                    <option>Public - Everyone can see</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Not Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Anonymous Mode</h3>
                    <p className="text-sm text-gray-600">Post in community groups anonymously</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Appearance</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="p-4 border-2 border-blue-500 rounded-lg bg-white">
                      <div className="w-full h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded mb-2"></div>
                      <p className="text-sm font-medium">Light</p>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300">
                      <div className="w-full h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded mb-2"></div>
                      <p className="text-sm font-medium">Dark</p>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300">
                      <div className="w-full h-12 bg-gradient-to-br from-blue-100 to-gray-800 rounded mb-2"></div>
                      <p className="text-sm font-medium">Auto</p>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Font Size</h3>
                  <input type="range" min="12" max="18" defaultValue="14" className="w-full" />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Small</span>
                    <span>Medium</span>
                    <span>Large</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Management</h2>

              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Export Your Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download a copy of all your data including journal entries, mood logs, and activity history
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Data Retention</h3>
                  <p className="text-sm text-gray-600">
                    Your data is securely stored and encrypted. We keep your data for as long as your account is active.
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
