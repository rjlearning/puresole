import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MessageSquare, Book, HelpCircle, AlertCircle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupportTicket {
  subject: string;
  category: string;
  priority: string;
  description: string;
}

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketForm, setTicketForm] = useState<SupportTicket>({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: ''
  });

  // Submit ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: async (data: SupportTicket) => {
      return await apiRequest("POST", "/api/support/tickets", data);
    },
    onSuccess: () => {
      toast({
        title: "Ticket Submitted",
        description: "Your support ticket has been submitted successfully. We'll get back to you soon!",
      });
      setTicketForm({
        subject: '',
        category: 'general',
        priority: 'medium',
        description: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const knowledgeBaseArticles = [
    {
      id: "getting-started",
      title: "Getting Started with PureSoul",
      category: "General",
      description: "Learn how to set up your account and take your first mental health assessment.",
      content: `Welcome to PureSoul! Here's how to get started:

1. **Complete Your Profile**: After signing up, complete your profile information to help us provide personalized recommendations.

2. **Take Your First Assessment**: Navigate to the Assessment page and complete the PHQ-9, GAD-7, or stress assessment to understand your current mental health status.

3. **Review Your Results**: Your assessment results will be analyzed by our AI system and you'll receive personalized insights and recommendations.

4. **Access Treatment Plans**: Based on your assessment, you'll receive customized treatment plans with specific modules and exercises.

5. **Track Progress**: Use the dashboard to monitor your progress over time and see improvements in your mental health journey.

If you need help at any step, don't hesitate to submit a support ticket!`
    },
    {
      id: "assessments",
      title: "Understanding Your Mental Health Assessments",
      category: "Assessments",
      description: "Learn about the different types of assessments and how to interpret your results.",
      content: `PureSoul offers several validated mental health assessments:

**PHQ-9 (Depression Assessment)**
- Measures symptoms of depression over the past 2 weeks
- Scores range from 0-27, with higher scores indicating more severe symptoms
- Used globally by healthcare professionals for depression screening

**GAD-7 (Anxiety Assessment)**
- Evaluates generalized anxiety disorder symptoms
- Scores range from 0-21, with categories for mild, moderate, and severe anxiety
- Helps identify anxiety disorders and track treatment progress

**Stress and Burnout Assessment**
- Measures work-related stress and burnout symptoms
- Assesses emotional exhaustion, depersonalization, and personal accomplishment
- Useful for identifying workplace mental health issues

**How AI Analysis Works**
Our AI system analyzes your responses using evidence-based algorithms to:
- Identify patterns in your symptoms
- Suggest personalized treatment approaches
- Recommend specific therapeutic modules
- Detect crisis situations that need immediate attention

Remember: These assessments are screening tools and should not replace professional medical diagnosis. Always consult with qualified mental health professionals for comprehensive evaluation.`
    },
    {
      id: "crisis-support",
      title: "Crisis Support and Emergency Resources",
      category: "Crisis",
      description: "Important information about crisis intervention and emergency mental health resources.",
      content: `If you're experiencing a mental health crisis, immediate help is available:

**Immediate Crisis Resources**
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: Call 911 for immediate danger

**PureSoul Crisis Detection**
Our AI system monitors assessment responses for crisis indicators:
- Suicidal ideation
- Self-harm thoughts
- Severe depression or anxiety
- Immediate safety concerns

When crisis indicators are detected:
1. You'll immediately see crisis resources and hotlines
2. Our AI system provides immediate guidance and resources
3. Emergency contacts (if provided) may be notified
4. Local emergency services may be contacted if necessary

**Crisis Safety Planning**
Create a personal safety plan that includes:
- Warning signs to watch for
- Coping strategies that help
- People and places that provide support
- Professional contacts and crisis lines
- Making your environment safe

**Non-Crisis Support**
For non-emergency support:
- Use our support ticket system
- Access self-help resources in your treatment plan
- Review AI-recommended treatment modules
- Connect with peer support communities

Remember: You're not alone, and help is always available. Don't hesitate to reach out when you need support.`
    },
    {
      id: "privacy-security",
      title: "Privacy, Security, and HIPAA Compliance",
      category: "Privacy",
      description: "How we protect your personal health information and maintain privacy.",
      content: `Your privacy and security are our top priorities:

**HIPAA Compliance**
PureSoul is fully HIPAA-compliant, ensuring:
- All personal health information is protected
- Data transmission is encrypted
- Access controls limit who can view your information
- Audit logs track all access to your data

**Data Security Measures**
- End-to-end encryption for all communications
- Secure cloud storage with enterprise-grade security
- Regular security audits and penetration testing
- Multi-factor authentication for accounts
- Automatic logout for inactive sessions

**What Information We Collect**
- Assessment responses and mental health data
- Treatment plan progress
- Account and profile information
- Payment and billing information

**How We Use Your Information**
- Provide personalized treatment recommendations
- Track your progress over time
- Improve our AI analysis algorithms
- Ensure platform safety and security

**Your Rights**
- Access your personal health information
- Request corrections to inaccurate data
- Restrict certain uses of your information
- Request deletion of your account and data
- Export your data in a portable format

**Data Sharing**
We never sell your personal health information. We only share data:
- When required by law (court orders, etc.)
- In anonymized form for research (with your consent)
- With emergency services in crisis situations

**Contact Us**
For privacy concerns or to exercise your rights, submit a support ticket with the "Privacy" category.`
    },
    {
      id: "treatment-plans",
      title: "Understanding Your AI-Generated Treatment Plans",
      category: "Treatment",
      description: "How our AI creates personalized treatment plans and how to use them effectively.",
      content: `Your personalized treatment plan is generated using advanced AI analysis:

**How Treatment Plans Are Created**
1. **Assessment Analysis**: AI analyzes your mental health assessment responses
2. **Pattern Recognition**: Identifies specific symptoms and severity levels
3. **Evidence-Based Matching**: Matches your profile to proven therapeutic approaches
4. **Personalization**: Customizes recommendations based on your preferences and history
5. **Ongoing Adaptation**: Updates plans based on your progress and new assessments

**Treatment Plan Components**
- **Primary Interventions**: Core therapeutic approaches (CBT, mindfulness, etc.)
- **Structured Modules**: Step-by-step exercises and activities
- **Progress Tracking**: Metrics to monitor improvement
- **Crisis Prevention**: Strategies for managing difficult moments
- **Resource Library**: Educational materials and tools

**Types of Interventions**
- **Cognitive Behavioral Therapy (CBT)**: Changing negative thought patterns
- **Mindfulness and Meditation**: Present-moment awareness practices
- **Behavioral Activation**: Increasing engagement in meaningful activities
- **Stress Management**: Techniques for managing daily stressors
- **Sleep Hygiene**: Improving sleep quality and patterns
- **Social Skills Training**: Enhancing interpersonal relationships

**Following Your Treatment Plan**
1. **Start with Fundamentals**: Begin with basic modules before advanced techniques
2. **Consistent Practice**: Regular engagement leads to better outcomes
3. **Track Progress**: Use the dashboard to monitor your improvement
4. **Be Patient**: Mental health improvement takes time and consistency
5. **Seek Support**: Don't hesitate to reach out to qualified mental health professionals when needed

**Updating Your Plan**
- Retake assessments periodically to update your plan
- Provide feedback on module effectiveness
- Adjust treatment modules based on your progress
- Request specific focus areas based on your needs

Remember: Treatment plans are personalized recommendations, not medical prescriptions. Always work with qualified mental health professionals for comprehensive treatment.`
    }
  ];

  const filteredArticles = knowledgeBaseArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a support ticket.",
        variant: "destructive",
      });
      return;
    }
    submitTicketMutation.mutate(ticketForm);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-3">Support & Knowledge Base</h1>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              Find answers to your questions, learn about mental health assessments, and get help when you need it.
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="knowledge-base" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="knowledge-base" className="flex items-center gap-2" data-testid="tab-knowledge-base">
              <Book className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="support-ticket" className="flex items-center gap-2" data-testid="tab-support-ticket">
              <MessageSquare className="h-4 w-4" />
              Submit Ticket
            </TabsTrigger>
          </TabsList>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge-base" className="space-y-8">
            {/* Search */}
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search knowledge base..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-kb"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSearchTerm("getting started")}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ArrowRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Getting Started</h3>
                  <p className="text-sm text-muted-foreground">Learn the basics of using PureSoul</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSearchTerm("crisis")}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Crisis Support</h3>
                  <p className="text-sm text-muted-foreground">Emergency resources and crisis help</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSearchTerm("privacy")}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Privacy & Security</h3>
                  <p className="text-sm text-muted-foreground">How we protect your information</p>
                </CardContent>
              </Card>
            </div>

            {/* Articles */}
            <div className="max-w-4xl mx-auto space-y-4">
              {filteredArticles.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms or browse all articles.</p>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredArticles.map((article) => (
                    <AccordionItem key={article.id} value={article.id} className="border rounded-lg px-6">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-start justify-between w-full pr-4">
                          <div>
                            <h3 className="text-lg font-semibold">{article.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{article.description}</p>
                          </div>
                          <Badge variant="secondary" className="ml-4">{article.category}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-6">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {article.content.split('\n').map((paragraph, index) => (
                            <div key={index} className="mb-4">
                              {paragraph.startsWith('**') && paragraph.endsWith('**') ? (
                                <h4 className="font-semibold text-foreground">{paragraph.slice(2, -2)}</h4>
                              ) : paragraph.startsWith('- ') ? (
                                <ul className="list-disc list-inside"><li>{paragraph.slice(2)}</li></ul>
                              ) : paragraph.match(/^\d+\./) ? (
                                <ol className="list-decimal list-inside"><li>{paragraph.replace(/^\d+\.\s*/, '')}</li></ol>
                              ) : (
                                <p>{paragraph}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </TabsContent>

          {/* Support Ticket Tab */}
          <TabsContent value="support-ticket" className="space-y-8">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Submit a Support Ticket
                </CardTitle>
                <p className="text-muted-foreground">
                  Can't find what you're looking for? Submit a ticket and our team will help you out.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                      required
                      data-testid="input-ticket-subject"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={ticketForm.category} onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger data-testid="select-ticket-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Question</SelectItem>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="privacy">Privacy & Security</SelectItem>
                          <SelectItem value="assessment">Assessment Problem</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="bug">Bug Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger data-testid="select-ticket-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Please provide as much detail as possible about your issue..."
                      rows={6}
                      required
                      data-testid="textarea-ticket-description"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitTicketMutation.isPending || !user}
                    data-testid="button-submit-ticket"
                  >
                    {submitTicketMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : !user ? (
                      "Login Required to Submit Ticket"
                    ) : (
                      "Submit Ticket"
                    )}
                  </Button>

                  {!user && (
                    <p className="text-sm text-muted-foreground text-center">
                      Please log in to submit a support ticket. This helps us provide personalized assistance.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Contact Alternatives */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Other Ways to Get Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Crisis Support</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      If you're experiencing a mental health crisis, call 988 (Suicide & Crisis Lifeline) or 911 for immediate help.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}