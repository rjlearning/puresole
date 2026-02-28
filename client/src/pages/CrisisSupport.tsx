import { useEffect, useState } from 'react';
import { AlertCircle, Phone, MessageSquare, Globe, Shield, Heart } from 'lucide-react';

interface CrisisResource {
  id: string;
  name: string;
  description: string;
  phone?: string;
  sms_number?: string;
  website_url?: string;
  chat_url?: string;
  available_24_7: boolean;
  languages: string[];
  resource_type: string;
}

interface SafetyPlan {
  id: string;
  warning_signs?: string[];
  coping_strategies?: string[];
  distraction_activities?: string[];
  support_contacts?: Array<{ name: string; phone: string; relationship: string }>;
  professional_contacts?: Array<{ name: string; phone: string; type: string }>;
  safe_environment_steps?: string[];
  reasons_to_live?: string[];
  created_at: string;
  updated_at: string;
}

export default function CrisisSupport() {
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllResources, setShowAllResources] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');

  useEffect(() => {
    loadCrisisResources();
    loadSafetyPlan();
  }, [selectedCountry]);

  const loadCrisisResources = async () => {
    try {
      const response = await fetch(`/api/crisis/resources?country=${selectedCountry}`);
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to load crisis resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSafetyPlan = async () => {
    try {
      const response = await fetch('/api/crisis/safety-plan');
      const data = await response.json();
      setSafetyPlan(data.safetyPlan);
    } catch (error) {
      console.error('Failed to load safety plan:', error);
    }
  };

  const emergencyResources = resources.filter(r => r.resource_type === 'emergency');
  const hotlineResources = resources.filter(r => r.resource_type === 'hotline');
  const textResources = resources.filter(r => r.resource_type === 'text');
  const chatResources = resources.filter(r => r.resource_type === 'chat');

  const displayedHotlines = showAllResources ? hotlineResources : hotlineResources.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-12 h-12 mr-3" />
            <h1 className="text-4xl font-bold">Crisis Support & Resources</h1>
          </div>
          <p className="text-xl text-blue-100">You're not alone. Help is available 24/7.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Emergency Banner */}
        {emergencyResources.length > 0 && (
          <div className="bg-red-600 text-white rounded-lg shadow-lg p-6 border-4 border-red-700">
            <div className="flex items-start">
              <AlertCircle className="w-8 h-8 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-2">🚨 IMMEDIATE DANGER</h2>
                <p className="text-lg mb-4">
                  If you're in immediate danger or having a medical emergency, call emergency services:
                </p>
                {emergencyResources.map((resource) => (
                  <a
                    key={resource.id}
                    href={`tel:${resource.phone}`}
                    className="inline-block bg-white text-red-600 font-bold text-2xl px-8 py-4 rounded-lg hover:bg-red-50 transition-all mr-4 mb-2"
                  >
                    📞 {resource.phone} - {resource.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Country Selector */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select your country:
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="US">🇺🇸 United States</option>
            <option value="CA">🇨🇦 Canada</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="AU">🇦🇺 Australia</option>
            <option value="IN">🇮🇳 India</option>
            <option value="NZ">🇳🇿 New Zealand</option>
          </select>
        </div>

        {/* Crisis Hotlines */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Phone className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-800">🆘 Crisis Hotlines</h2>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading resources...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedHotlines.map((resource) => (
                <div
                  key={resource.id}
                  className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{resource.name}</h3>
                  <p className="text-gray-600 mb-4">{resource.description}</p>

                  <div className="flex flex-wrap gap-3 mb-3">
                    {resource.phone && (
                      <a
                        href={`tel:${resource.phone}`}
                        className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Phone className="w-5 h-5 mr-2" />
                        Call: {resource.phone}
                      </a>
                    )}

                    {resource.sms_number && (
                      <a
                        href={`sms:${resource.sms_number}`}
                        className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Text: {resource.sms_number}
                      </a>
                    )}

                    {resource.website_url && (
                      <a
                        href={resource.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                      >
                        <Globe className="w-5 h-5 mr-2" />
                        Visit Website
                      </a>
                    )}

                    {resource.chat_url && (
                      <a
                        href={resource.chat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Start Chat
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    {resource.available_24_7 && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                        ✓ Available 24/7
                      </span>
                    )}
                    {resource.languages && resource.languages.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        Languages: {resource.languages.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {hotlineResources.length > 3 && (
                <button
                  onClick={() => setShowAllResources(!showAllResources)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  {showAllResources ? '↑ Show Less' : `↓ Show ${hotlineResources.length - 3} More Resources`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Text & Chat Resources */}
        {(textResources.length > 0 || chatResources.length > 0) && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-8 h-8 text-green-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-800">💬 Text & Chat Support</h2>
            </div>

            <div className="space-y-4">
              {[...textResources, ...chatResources].map((resource) => (
                <div
                  key={resource.id}
                  className="border-2 border-green-200 rounded-lg p-6 hover:border-green-400 hover:shadow-md transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{resource.name}</h3>
                  <p className="text-gray-600 mb-4">{resource.description}</p>

                  <div className="flex flex-wrap gap-3">
                    {resource.sms_number && (
                      <a
                        href={`sms:${resource.sms_number}`}
                        className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Text: {resource.sms_number}
                      </a>
                    )}

                    {resource.chat_url && (
                      <a
                        href={resource.chat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Start Chat
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Plan */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-8 h-8 text-emerald-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-800">🛡️ My Safety Plan</h2>
          </div>

          {safetyPlan ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <p className="text-emerald-800 font-medium">
                  ✅ Safety plan created on {new Date(safetyPlan.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/safety-plan'}
                  className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  📋 View My Plan
                </button>
                <button
                  onClick={() => window.location.href = '/safety-plan/edit'}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  ✏️ Edit Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 mb-4">
                  A safety plan is a personalized tool that helps you identify warning signs and coping strategies
                  for when you're struggling. It includes your support network and reasons for living.
                </p>
                <button
                  onClick={() => window.location.href = '/safety-plan/create'}
                  className="w-full bg-emerald-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-emerald-700 transition-colors"
                >
                  + Create My Safety Plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Professional Help */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🏥 Find Professional Help</h2>
          <div className="space-y-3">
            <a
              href="/find-therapist"
              className="block bg-white border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 hover:shadow transition-all"
            >
              <div className="font-semibold text-gray-800">→ Find a Therapist Near You</div>
              <div className="text-sm text-gray-600">Search for licensed therapists in your area</div>
            </a>
            <a
              href="https://www.psychologytoday.com/us/therapists"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 hover:shadow transition-all"
            >
              <div className="font-semibold text-gray-800">→ Psychology Today Therapist Directory</div>
              <div className="text-sm text-gray-600">Comprehensive therapist search and filtering</div>
            </a>
            <a
              href="https://www.nami.org/Support-Education/Support-Groups"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 hover:shadow transition-all"
            >
              <div className="font-semibold text-gray-800">→ Support Groups</div>
              <div className="text-sm text-gray-600">Find peer support groups in your community</div>
            </a>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg mb-2">
            Remember: Reaching out for help is a sign of strength, not weakness.
          </p>
          <p className="text-gray-500">
            These resources are confidential and available anytime you need support.
          </p>
        </div>
      </div>
    </div>
  );
}
