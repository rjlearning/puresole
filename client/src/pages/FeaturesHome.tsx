import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Activity,
  Moon,
  FileText,
  BarChart3,
  MessageCircle,
  Users,
  Pill,
  Link as LinkIcon,
  Shield,
  Phone,
  Sparkles,
  TrendingUp,
  Heart,
  Clock,
  Calendar
} from 'lucide-react';

export default function FeaturesHome() {
  const coreFeatures = [
    {
      name: 'Voice Journal',
      description: 'Express your thoughts and feelings through voice',
      icon: MessageCircle,
      href: '/voice-journal',
      color: 'from-blue-500 to-cyan-500',
      badge: 'Core'
    },
    {
      name: 'Wellness Activities',
      description: 'Track activities and their impact on your mood',
      icon: Activity,
      href: '/activities',
      color: 'from-green-500 to-emerald-500',
      badge: 'Core'
    },
    {
      name: 'Sleep Tracking',
      description: 'Monitor your sleep patterns and quality',
      icon: Moon,
      href: '/sleep',
      color: 'from-indigo-500 to-purple-500',
      badge: 'Core'
    },
    {
      name: 'Analytics Dashboard',
      description: 'Visualize your mental wellness trends',
      icon: BarChart3,
      href: '/analytics',
      color: 'from-purple-500 to-pink-500',
      badge: 'Core'
    },
    {
      name: 'Wellness Reports',
      description: 'Generate comprehensive wellness reports',
      icon: FileText,
      href: '/reports',
      color: 'from-orange-500 to-red-500',
      badge: 'Core'
    },
  ];

  const advancedFeatures = [
    {
      name: 'AI Companion',
      description: 'Chat with an empathetic AI mental health companion',
      icon: MessageCircle,
      href: '/ai-companion',
      color: 'from-blue-600 to-cyan-600',
      badge: 'AI-Powered',
      highlights: ['GPT-4', 'Emotion Detection', 'Crisis Monitoring']
    },
    /* {
      name: 'Therapist Portal',
      description: 'Professional care with client management and session tracking',
      icon: Users,
      href: '/therapist-portal',
      color: 'from-indigo-600 to-purple-600',
      badge: 'Professional',
      highlights: ['Client Management', 'Session Notes', 'Treatment Goals']
    }, */
    {
      name: 'Medication Tracker',
      description: 'Manage medications, track adherence, and monitor side effects',
      icon: Pill,
      href: '/medications',
      color: 'from-purple-600 to-pink-600',
      badge: 'Health',
      highlights: ['Dose Reminders', 'Side Effects', 'Effectiveness']
    },
    {
      name: 'Integration Hub',
      description: 'Connect wearables and health apps for deeper insights',
      icon: LinkIcon,
      href: '/integrations',
      color: 'from-cyan-600 to-blue-600',
      badge: 'Connected',
      highlights: ['Fitbit', 'Apple Health', 'Google Fit']
    },
    {
      name: 'Community',
      description: 'Join support groups and connect with others',
      icon: Users,
      href: '/community',
      color: 'from-pink-600 to-rose-600',
      badge: 'Social',
      highlights: ['Support Groups', 'Events', 'Peer Support']
    },
    {
      name: 'Safety Plan',
      description: 'Create your personalized crisis response plan',
      icon: Shield,
      href: '/safety-plan',
      color: 'from-red-600 to-orange-600',
      badge: 'Crisis Support',
      highlights: ['Warning Signs', 'Coping Strategies', 'Emergency Contacts']
    },
  ];

  const stats = [
    { label: 'Total Features', value: '11+', icon: Sparkles },
    { label: 'AI-Powered', value: 'Yes', icon: Brain },
    { label: 'Professional Care', value: 'Enabled', icon: Users },
    { label: '24/7 Support', value: 'Active', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Welcome to PURESOUL</h1>
            <p className="text-xl text-blue-100 mb-8">
              Your comprehensive mental wellness platform
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  <Brain className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/ai-companion">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with AI
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-4 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-blue-100">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Core Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Core Features</h2>
          <p className="text-gray-600 mb-8">Essential tools for daily mental wellness tracking</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.name} href={feature.href}>
                  <Card className="p-6 hover:shadow-xl transition-all cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="bg-gray-100 text-gray-800">{feature.badge}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.name}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Advanced Features */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Advanced Features</h2>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              New
            </Badge>
          </div>
          <p className="text-gray-600 mb-8">
            Powerful tools for professional care, community support, and crisis management
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.name} href={feature.href}>
                  <Card className="p-6 hover:shadow-xl transition-all cursor-pointer h-full border-2 border-purple-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                        {feature.badge}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{feature.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Crisis Support Banner */}
        <Card className="mt-12 p-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Need Immediate Help?</h3>
                <p className="text-gray-600">24/7 crisis support and emergency resources available</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/crisis-support">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Phone className="w-4 h-4 mr-2" />
                  Crisis Support
                </Button>
              </Link>
              <Link href="/safety-plan">
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                  <Shield className="w-4 h-4 mr-2" />
                  Safety Plan
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <Clock className="w-10 h-10 mb-3" />
            <h3 className="text-lg font-bold mb-2">Daily Check-in</h3>
            <p className="text-sm text-blue-100 mb-4">Track your mood and activities</p>
            <Link href="/voice-journal">
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                Start Journal
              </Button>
            </Link>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <TrendingUp className="w-10 h-10 mb-3" />
            <h3 className="text-lg font-bold mb-2">View Progress</h3>
            <p className="text-sm text-purple-100 mb-4">See your wellness trends</p>
            <Link href="/analytics">
              <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
                View Analytics
              </Button>
            </Link>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <Heart className="w-10 h-10 mb-3" />
            <h3 className="text-lg font-bold mb-2">Get Support</h3>
            <p className="text-sm text-green-100 mb-4">Connect with AI or community</p>
            <Link href="/ai-companion">
              <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                Chat Now
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
