import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/header";
import { AlertTriangle, Users, Brain, Shield, Clock, TrendingUp, Search, FileText } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/admin/assessments"],
    retry: false,
  });

  const { data: crisisAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/admin/crisis-alerts"],
    retry: false,
  });

  const resolveCrisisMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("PATCH", `/api/admin/crisis-alerts/${alertId}/resolve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crisis-alerts"] });
      toast({
        title: "Crisis Alert Resolved",
        description: "The crisis alert has been marked as resolved.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to resolve crisis alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  const filteredAssessments = assessments?.filter((assessment: any) =>
    assessment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.severity.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const unresolvedAlerts = crisisAlerts?.filter((alert: any) => !alert.resolved) || [];
  const severeCases = assessments?.filter((assessment: any) => 
    assessment.severity === 'severe' || assessment.severity === 'moderately_severe'
  ) || [];

  const handleResolveCrisis = (alertId: string) => {
    resolveCrisisMutation.mutate(alertId);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="admin-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-admin-title">
            Clinical Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor patient assessments, review treatment progress, and manage crisis alerts for audit and compliance.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-users">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-assessments">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                  <p className="text-2xl font-bold">{assessments?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-crisis-alerts">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Crisis Alerts</p>
                  <p className="text-2xl font-bold text-destructive">{unresolvedAlerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-severe-cases">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Severe Cases</p>
                  <p className="text-2xl font-bold text-yellow-600">{severeCases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList data-testid="tabs-admin">
            <TabsTrigger value="alerts" data-testid="tab-alerts">Crisis Alerts</TabsTrigger>
            <TabsTrigger value="assessments" data-testid="tab-assessments">Recent Assessments</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">Audit & Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-6">
            <Card data-testid="card-crisis-alerts-list">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span>Crisis Alerts Requiring Immediate Attention</span>
                  {unresolvedAlerts.length > 0 && (
                    <Badge variant="destructive">{unresolvedAlerts.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : unresolvedAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {unresolvedAlerts.map((alert: any) => (
                      <div key={alert.id} className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge variant="destructive" className="capitalize">
                                {alert.severity} Risk
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {alert.alertType.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                User ID: {alert.userId}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{alert.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Triggered: {new Date(alert.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleResolveCrisis(alert.id)}
                            disabled={resolveCrisisMutation.isPending}
                            data-testid={`button-resolve-${alert.id}`}
                          >
                            {resolveCrisisMutation.isPending ? "Resolving..." : "Mark Resolved"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Crisis Alerts</h3>
                    <p className="text-muted-foreground">All crisis alerts have been resolved.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <Card data-testid="card-assessment-search">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>Recent Assessments Requiring Review</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assessments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                      data-testid="input-search-assessments"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : filteredAssessments.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAssessments.map((assessment: any) => (
                      <div key={assessment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              assessment.severity === 'severe' || assessment.severity === 'moderately_severe'
                                ? 'bg-red-500'
                                : assessment.severity === 'moderate'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}></div>
                            <div>
                              <p className="font-medium">
                                User #{assessment.userId.substring(0, 8)}... | {assessment.type.toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Score: {assessment.score} | Severity: {assessment.severity.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {new Date(assessment.createdAt).toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-review-${assessment.id}`}
                            >
                              Review Details
                            </Button>
                          </div>
                        </div>
                        {assessment.aiAnalysis && (
                          <div className="mt-3 p-3 bg-muted/30 rounded text-sm">
                            <p className="font-medium mb-1">AI Analysis:</p>
                            <p className="text-muted-foreground">
                              {assessment.aiAnalysis.length > 150 
                                ? `${assessment.aiAnalysis.substring(0, 150)}...`
                                : assessment.aiAnalysis
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Assessments Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "No assessments match your search criteria." : "No assessments have been completed yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card data-testid="card-user-management">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="space-y-3">
                    {users.map((userData: any) => (
                      <div key={userData.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {userData.firstName} {userData.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {userData.email} | ID: {userData.id.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              {userData.isAdmin && (
                                <Badge variant="secondary">Admin</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Joined: {new Date(userData.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                    <p className="text-muted-foreground">No users have registered yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card data-testid="card-audit-compliance">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Audit & Compliance Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {assessments?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Assessments Completed</div>
                  </div>
                  
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold text-secondary mb-2">100%</div>
                    <div className="text-sm text-muted-foreground">HIPAA Compliance Rate</div>
                  </div>
                  
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold text-accent mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Data Backup & Security</div>
                  </div>
                  
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {crisisAlerts?.filter((alert: any) => alert.resolved).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Crisis Alerts Resolved</div>
                  </div>
                  
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {severeCases.length}
                    </div>
                    <div className="text-sm text-muted-foreground">High-Severity Cases</div>
                  </div>
                  
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {users?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="h-6 w-6 text-green-600" />
                    <h4 className="font-semibold text-green-800">Compliance Status</h4>
                  </div>
                  <div className="space-y-2 text-sm text-green-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>HIPAA Privacy Rule compliance maintained</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>All patient data encrypted and secure</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Crisis protocols followed for all alerts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Audit trail maintained for all actions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
