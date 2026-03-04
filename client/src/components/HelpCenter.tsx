import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  ChevronRight,
  X,
  Mic,
  Bot,
  Activity,
  Pill,
  Calendar,
  Users,
  Shield,
  TrendingUp,
  Settings,
  BarChart3
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  content: string;
  tags: string[];
}

const helpArticles: HelpArticle[] = [
  {
    id: 'voice-journal',
    title: 'Using Voice Journal',
    category: 'Core Features',
    icon: <Mic className="w-5 h-5 text-blue-600" />,
    content: `Voice Journal allows you to track your mood and emotions through audio recordings or text entries.

**How to use:**
1. Click the "Record" button to start voice recording
2. Or use the text input to write your thoughts
3. Select your current mood (1-5 scale)
4. Add tags to categorize your entry
5. Click "Save" to store your journal entry

**Tips:**
- Record daily for best mood tracking results
- Be honest about your emotions
- Review past entries to identify patterns
- Use tags like #anxious, #happy, #therapy for easy filtering`,
    tags: ['journal', 'mood', 'recording', 'tracking']
  },
  {
    id: 'ai-companion',
    title: 'AI Mental Health Companion',
    category: 'Core Features',
    icon: <Bot className="w-5 h-5 text-purple-600" />,
    content: `Your AI Companion is a compassionate mental health assistant available 24/7.

**Features:**
- Real-time emotion detection
- Personalized coping strategies
- Crisis support guidance
- Mood pattern analysis

**Best Practices:**
- Share openly about your feelings
- Ask for coping strategies when stressed
- Let the AI know if you're in crisis
- Use it between therapy sessions for support

**Privacy:**
All conversations are encrypted and confidential.`,
    tags: ['ai', 'chat', 'support', 'companion']
  },
  {
    id: 'medications',
    title: 'Medication Tracker',
    category: 'Health Management',
    icon: <Pill className="w-5 h-5 text-orange-600" />,
    content: `Track your medications, doses, and side effects all in one place.

**Features:**
- Add medications with dosage and frequency
- Log when you take medications
- Track side effects
- Set up reminders

**How to add a medication:**
1. Go to Medications page
2. Click "Add Medication"
3. Enter name, dosage, and frequency
4. Set reminder times
5. Click "Save"

**Logging doses:**
- Click "Log Dose" next to any medication
- Confirm the time and dosage
- Add notes about side effects if needed`,
    tags: ['medication', 'pills', 'tracking', 'reminders']
  },
  {
    id: 'activities',
    title: 'Wellness Activities',
    category: 'Self-Care',
    icon: <Activity className="w-5 h-5 text-green-600" />,
    content: `Track activities that support your mental wellness.

**Activity Types:**
- Exercise: Physical activities
- Social: Time with friends/family
- Creative: Art, music, writing
- Mindfulness: Meditation, breathing
- Sleep: Rest and recovery
- Therapy: Professional sessions

**Tips for success:**
- Schedule activities daily
- Try different types to find what works
- Track how activities affect your mood
- Build consistent routines`,
    tags: ['activities', 'exercise', 'wellness', 'self-care']
  },
  {
    id: 'analytics',
    title: 'Understanding Analytics',
    category: 'Insights',
    icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
    content: `The Analytics dashboard shows trends and patterns in your mental health data.

**Available Reports:**
- Mood Trends: 7-day, 30-day, 90-day views
- Activity Correlation: How activities affect mood
- Medication Effectiveness: Track medication impact
- Stress Patterns: Identify triggers
- Progress Over Time: Weekly/monthly summaries

**How to use insights:**
1. Check your dashboard weekly
2. Look for patterns in mood changes
3. Identify activities that improve mood
4. Share reports with your therapist
5. Adjust routines based on data`,
    tags: ['analytics', 'reports', 'trends', 'insights', 'data']
  },
  {
    id: 'community',
    title: 'Support Groups & Community',
    category: 'Social Support',
    icon: <Users className="w-5 h-5 text-purple-600" />,
    content: `Connect with others who understand your journey.

**Features:**
- Join support groups by topic
- Share experiences anonymously (optional)
- Attend virtual events and workshops
- Connect with peers
- Access group resources

**Community Guidelines:**
- Be respectful and supportive
- No medical advice
- Respect privacy
- Report concerning content
- Use anonymous mode if preferred

**Finding groups:**
Browse groups by category: anxiety, depression, PTSD, addiction recovery, and more.`,
    tags: ['community', 'groups', 'support', 'social', 'events']
  },
  {
    id: 'safety-plan',
    title: 'Creating a Safety Plan',
    category: 'Crisis Support',
    icon: <Shield className="w-5 h-5 text-red-600" />,
    content: `A safety plan is your personalized guide for managing crisis moments.

**What to include:**
1. Warning signs that a crisis may be developing
2. Internal coping strategies (self-calming)
3. Social contacts for distraction
4. People who can help in a crisis
5. Professional contacts (therapist, doctor)
6. Emergency services (988, 911)
7. Making the environment safe

**When to use:**
- When feeling suicidal or in crisis
- When experiencing severe symptoms
- When normal coping isn't working
- When you need immediate support

**Important:**
Always call 988 (Suicide & Crisis Lifeline) if in immediate danger.`,
    tags: ['safety', 'crisis', 'emergency', 'plan', 'support']
  },
  {
    id: 'therapist-portal',
    title: 'Therapist Collaboration',
    category: 'Professional Care',
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    content: `Share your progress with your therapist for better care coordination.

**Features:**
- Share mood data and journal entries
- Track therapy sessions
- Set treatment goals
- Complete homework assignments
- Receive session notes

**Connecting with your therapist:**
1. Ask your therapist for their PureSoul ID
2. Send a connection request
3. Set privacy preferences for what to share
4. Your therapist can view shared data

**Privacy:**
You control what data your therapist sees. You can:
- Share specific journal entries
- Share mood trends
- Hide sensitive information
- Disconnect at any time`,
    tags: ['therapist', 'sessions', 'professional', 'collaboration']
  },
  {
    id: 'notifications',
    title: 'Managing Notifications',
    category: 'Settings',
    icon: <Settings className="w-5 h-5 text-gray-600" />,
    content: `Customize your notification preferences to stay informed without feeling overwhelmed.

**Notification Types:**
- Medication reminders
- Daily check-in prompts
- Appointment reminders
- Achievement celebrations
- Crisis alerts
- Community activity

**Managing notifications:**
1. Go to Settings > Notifications
2. Toggle each notification type
3. Set quiet hours (optional)
4. Choose notification method (app, email, SMS)

**Tips:**
- Enable medication reminders for consistency
- Set check-in reminders at a regular time
- Disable community notifications if overwhelming`,
    tags: ['notifications', 'settings', 'reminders', 'preferences']
  },
  {
    id: 'privacy',
    title: 'Privacy & Data Security',
    category: 'Security',
    icon: <Shield className="w-5 h-5 text-green-600" />,
    content: `Your privacy and data security are our top priorities.

**How we protect your data:**
- End-to-end encryption for all data
- HIPAA compliant infrastructure
- No data sharing without consent
- Secure cloud storage
- Regular security audits

**Your privacy controls:**
- Set profile visibility (private, friends, public)
- Control therapist data sharing
- Use anonymous mode in community
- Export or delete your data anytime

**Data retention:**
- Your data is kept as long as your account is active
- You can delete your account anytime
- Deleted data is permanently removed within 30 days

**Questions?**
Review our full Privacy Policy in Settings > Privacy.`,
    tags: ['privacy', 'security', 'data', 'hipaa', 'encryption']
  }
];

const faqs = [
  {
    question: 'Is PureSoul a replacement for therapy?',
    answer: 'No, PureSoul is designed to complement professional mental health care, not replace it. We encourage working with licensed therapists and using PureSoul as a supportive tool between sessions.'
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Yes, all data is encrypted and HIPAA compliant. We never share your data without explicit consent. You control what information is shared with therapists or the community.'
  },
  {
    question: 'How much does PureSoul cost?',
    answer: 'Basic features are free to try. Premium extended limits (like 100 voice analyses, 50 hours of companion chat, and advanced analytics) are available with a subscription starting at $9.99/month.'
  },
  {
    question: 'Can I use PureSoul without a therapist?',
    answer: 'Yes! PureSoul is valuable for self-guided wellness tracking. The therapist collaboration features are optional.'
  },
  {
    question: 'What should I do in a mental health crisis?',
    answer: 'If you\'re in immediate danger, call 911 or go to the nearest emergency room. For crisis support, call 988 (Suicide & Crisis Lifeline) available 24/7. PureSoul includes crisis resources but is not for emergency situations.'
  },
  {
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Data > Delete Account. Your data will be permanently removed within 30 days. You can export your data before deletion if needed.'
  },
  {
    question: 'Can I use PureSoul on multiple devices?',
    answer: 'Yes, your account syncs across all devices. Log in with your credentials on any device to access your data.'
  },
  {
    question: 'How often should I log my mood?',
    answer: 'We recommend daily check-ins for the best insights. Even brief entries help identify patterns over time.'
  }
];

export default function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'faq'>('articles');

  const filteredArticles = helpArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Core Features':
        return <BookOpen className="w-4 h-4" />;
      case 'Health Management':
        return <Pill className="w-4 h-4" />;
      case 'Self-Care':
        return <Activity className="w-4 h-4" />;
      case 'Insights':
        return <BarChart3 className="w-4 h-4" />;
      case 'Social Support':
        return <Users className="w-4 h-4" />;
      case 'Crisis Support':
        return <Shield className="w-4 h-4" />;
      case 'Professional Care':
        return <Calendar className="w-4 h-4" />;
      case 'Settings':
        return <Settings className="w-4 h-4" />;
      case 'Security':
        return <Shield className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all"
        aria-label="Help & Documentation"
      >
        <HelpCircle className="w-5 h-5 text-gray-400" />
      </button>

      {/* Help Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[380px] sm:w-[480px] max-w-lg bg-slate-900 rounded-lg shadow-2xl border border-slate-800 z-50 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">Help Center</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setActiveTab('articles')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'articles'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                    }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Articles
                </button>
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'faq'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                    }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  FAQ
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'articles' && !selectedArticle && (
                <div className="space-y-3">
                  {filteredArticles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                      <p>No articles found</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">{article.icon}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white mb-1">
                              {article.title}
                            </h4>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="text-xs bg-slate-700 text-gray-400 border-slate-600">
                                {getCategoryIcon(article.category)}
                                <span className="ml-1">{article.category}</span>
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'articles' && selectedArticle && (
                <div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-purple-400 hover:text-purple-300 font-medium mb-4 flex items-center"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                    Back to articles
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    {selectedArticle.icon}
                    <h4 className="text-xl font-bold text-white">
                      {selectedArticle.title}
                    </h4>
                  </div>
                  <Badge variant="outline" className="mb-4 bg-slate-800 text-gray-400 border-slate-700">
                    {getCategoryIcon(selectedArticle.category)}
                    <span className="ml-1">{selectedArticle.category}</span>
                  </Badge>
                  <div className="prose prose-sm max-w-none">
                    {selectedArticle.content.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-2 text-gray-400 whitespace-pre-wrap">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-sm text-gray-500 mb-2">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.tags.map((tag) => (
                        <Badge key={tag} className="text-xs bg-slate-800 text-gray-400 border-slate-700">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-4">
                  {filteredFaqs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                      <p>No FAQs found</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    filteredFaqs.map((faq, idx) => (
                      <Card key={idx} className="p-4 bg-slate-800 border-slate-700">
                        <h4 className="font-semibold text-white mb-2">
                          {faq.question}
                        </h4>
                        <p className="text-sm text-gray-400">{faq.answer}</p>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-800">
              <p className="text-sm text-gray-400 text-center">
                Need more help?{' '}
                <a href="/crisis-support" className="text-purple-400 hover:text-purple-300 hover:underline">
                  View Crisis Resources
                </a>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
