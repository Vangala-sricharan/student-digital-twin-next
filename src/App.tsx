import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentTwinProvider, useStudentTwin } from './context/StudentTwinContext';
import { AIJobProvider } from './context/AIJobContext';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { AppShell } from './components/dashboard/AppShell';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ManageProfiles } from './components/dashboard/ManageProfiles';
import { SkillsView } from './components/dashboard/SkillsView';
import { ProjectsView } from './components/dashboard/ProjectsView';
import { ReadinessView } from './components/dashboard/ReadinessView';
import { AchievementsView } from './components/dashboard/AchievementsView';
import { EngineHub } from './components/engines/EngineHub';

// All 11 Phase 2 AI Engine Views
import { CareerAssistantView } from './components/engines/CareerAssistantView';
import { AIPortfolioView } from './components/engines/AIPortfolioView';
import { ProjectAuditorView } from './components/engines/ProjectAuditorView';
import { GitHubAuditView } from './components/engines/GitHubAuditView';
import { LinkedInAuditView } from './components/engines/LinkedInAuditView';
import { ResumeBuilderView } from './components/engines/ResumeBuilderView';
import { ResumeATSAnalyzerView } from './components/engines/ResumeATSAnalyzerView';
import { SyllabusPrepView } from './components/engines/SyllabusPrepView';
import { RoadmapView } from './components/engines/RoadmapView';
import { InternshipReadyView } from './components/engines/InternshipReadyView';
import { CareerSimulatorView } from './components/engines/CareerSimulatorView';
import { MyProfileView } from './components/profile/MyProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { PaymentUpgradeView } from './components/subscription/PaymentUpgradeView';

function DashboardTabContent({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardOverview onNavigateTab={setActiveTab} />;
    case 'my-profile':
      return <MyProfileView onBackToDashboard={() => setActiveTab('dashboard')} onNavigateToUpgrade={() => setActiveTab('upgrade')} />;
    case 'settings':
      return <SettingsView onBackToDashboard={() => setActiveTab('dashboard')} onNavigateToUpgrade={() => setActiveTab('upgrade')} onNavigateToProfile={() => setActiveTab('my-profile')} />;
    case 'upgrade':
      return <PaymentUpgradeView onBackToDashboard={() => setActiveTab('dashboard')} onNavigateToSettings={() => setActiveTab('settings')} />;
    case 'profiles':
      return <ManageProfiles />;
    case 'skills':
      return <SkillsView />;
    case 'projects':
      return <ProjectsView />;
    case 'readiness':
      return <ReadinessView />;
    case 'achievements':
      return <AchievementsView />;
    
    // AI Career OS: Master Hub
    case 'engines':
      return <EngineHub onSelectEngine={(engineId) => setActiveTab(`engine-${engineId}`)} />;

    // 11 Core AI Engines
    case 'engine-career-assistant':
      return <CareerAssistantView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-ai-portfolio':
      return <AIPortfolioView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-project-auditor':
      return <ProjectAuditorView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-github-audit':
      return <GitHubAuditView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-linkedin-audit':
      return <LinkedInAuditView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-resume-builder':
      return <ResumeBuilderView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-resume-ats':
      return <ResumeATSAnalyzerView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-syllabus-prep':
      return <SyllabusPrepView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-roadmap-30-60-90':
      return <RoadmapView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-internship-ready':
      return <InternshipReadyView onBackToHub={() => setActiveTab('engines')} />;
    case 'engine-career-simulator':
      return <CareerSimulatorView onBackToHub={() => setActiveTab('engines')} />;

    default:
      return <DashboardOverview onNavigateTab={setActiveTab} />;
  }
}

function MainRouter() {
  const { user, loading: authLoading } = useAuth();
  const { isDemoMode, enterDemoMode, exitDemoMode } = useStudentTwin();

  // Route state
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Synchronize browser history
  const navigateTo = (path: string) => {
    if (path.startsWith('#')) {
      const elem = document.querySelector(path);
      elem?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (path === '/demo') {
      enterDemoMode();
      setCurrentRoute('/demo');
      window.history.pushState({}, '', '/demo');
      return;
    }

    if (path === '/') {
      if (isDemoMode) {
        exitDemoMode();
      }
      setCurrentRoute('/');
      window.history.pushState({}, '', '/');
      return;
    }

    setCurrentRoute(path);
    window.history.pushState({}, '', path);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentRoute(path);
      if (path === '/demo') {
        enterDemoMode();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enterDemoMode]);

  // Handle direct access to /demo on page load
  useEffect(() => {
    if (window.location.pathname === '/demo' && !isDemoMode) {
      enterDemoMode();
    }
  }, [isDemoMode, enterDemoMode]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#02040a] text-slate-800 dark:text-white font-mono text-sm transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Loading Student Digital Twin OS...</span>
        </div>
      </div>
    );
  }

  // 1. Demo Mode Route
  if (currentRoute === '/demo' || isDemoMode) {
    return (
      <AppShell
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onNavigate={navigateTo}
      >
        <DashboardTabContent activeTab={activeTab} setActiveTab={setActiveTab} />
      </AppShell>
    );
  }

  // 2. Authenticated User Route
  if (user && (currentRoute.startsWith('/app') || currentRoute === '/dashboard')) {
    return (
      <AppShell
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onNavigate={navigateTo}
      >
        <DashboardTabContent activeTab={activeTab} setActiveTab={setActiveTab} />
      </AppShell>
    );
  }

  // 3. Login Route
  if (currentRoute === '/login') {
    return (
      <LoginPage
        onNavigate={navigateTo}
        onLoginSuccess={() => {
          navigateTo('/app/dashboard');
        }}
      />
    );
  }

  // 4. Sign Up Route
  if (currentRoute === '/signup') {
    return (
      <SignUpPage
        onNavigate={navigateTo}
        onSignUpSuccess={() => {
          navigateTo('/app/dashboard');
        }}
      />
    );
  }

  // 5. Default: Public Landing Page
  return <LandingPage onNavigate={navigateTo} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StudentTwinProvider>
          <AIJobProvider>
            <MainRouter />
          </AIJobProvider>
        </StudentTwinProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
