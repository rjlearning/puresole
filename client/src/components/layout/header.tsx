import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Brain, Menu, User, Settings, LogOut, Shield, CreditCard, Crown, HelpCircle, AlertCircle, BarChart3, FileText, Activity, MessageSquare } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useState } from "react";
import { FeedbackModal } from "../FeedbackModal";
// import logo from "..."

// ... (imports)

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleLogin = () => setLocation("/auth");
  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  return (
    <header className="border-b border-black/5 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300" data-testid="header">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-105 shadow-lg shadow-primary/10">
                <span className="text-white font-bold text-xl">PS</span>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent tracking-tight">
                PureSoul
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5" data-testid="nav-dashboard">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/activities">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5" data-testid="nav-activities">
                  <Activity className="w-4 h-4 mr-2" />
                  Activities
                </Button>
              </Link>
              <Link href="/assessment">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5" data-testid="nav-assessment">
                  <Brain className="w-4 h-4 mr-2" />
                  Reflection
                </Button>
              </Link>
              <Link href="/voice-journal">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5" data-testid="nav-voice-journal">
                  Journal
                </Button>
              </Link>
              {user?.isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5" data-testid="nav-admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-8">
            </div>
          )}

          <div className="flex items-center space-x-4">

            {/* User Menu / Auth Buttons */}
            {isLoading ? (
              <div className="w-8 h-8 bg-black/5 rounded-full animate-pulse"></div>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/10 hover:ring-primary/30 transition-all" data-testid="user-menu">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profileImageUrl} alt={`${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white/90 backdrop-blur-xl border-black/5 text-foreground shadow-xl overflow-y-auto max-h-[85vh]" align="end" forceMount>
                  <div className="flex items-center space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl} alt={`${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-black/5" />

                  {/* Mobile Navigation Items */}
                  <div className="md:hidden">
                    <Link href="/dashboard">
                      <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="mobile-nav-dashboard">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/activities">
                      <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="mobile-nav-activities">
                        <Activity className="h-4 w-4 mr-2" />
                        Activities
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/assessment">
                      <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="mobile-nav-assessment">
                        <Brain className="h-4 w-4 mr-2" />
                        Self-Reflection
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/voice-journal">
                      <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="mobile-nav-voice-journal">
                        <FileText className="h-4 w-4 mr-2" />
                        Voice Journal
                      </DropdownMenuItem>
                    </Link>
                    {user?.isAdmin && (
                      <Link href="/admin">
                        <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="mobile-nav-admin">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem onClick={() => setFeedbackOpen(true)} className="focus:bg-primary/5 focus:text-primary">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Provide Feedback
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-black/5" />
                  </div>

                  <Link href="/subscribe">
                    <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="menu-subscription">
                      <Crown className="h-4 w-4 mr-2" />
                      Subscription
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/billing">
                    <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="menu-billing">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Billing
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/support">
                    <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="menu-support">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Support & Help
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => setFeedbackOpen(true)} className="focus:bg-primary/5 focus:text-primary">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Provide Feedback
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="focus:bg-primary/5 focus:text-primary opacity-50" data-testid="menu-profile">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <Link href="/settings">
                    <DropdownMenuItem className="focus:bg-primary/5 focus:text-primary" data-testid="menu-settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-black/5" />
                  <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-50 focus:text-red-600" data-testid="menu-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={handleLogin} className="hover:bg-primary/5 hover:text-primary" data-testid="button-signin">
                  Sign In
                </Button>
                <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20" data-testid="button-get-started">
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu button for non-authenticated users */}
            {!isAuthenticated && (
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/5 hover:text-primary" data-testid="mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </nav>
      </div>
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </header>
  );
}
