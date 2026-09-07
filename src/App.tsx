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
import { StudentOnboardingModal } from './components/onboarding/StudentOnboardingModal';
import { CircularEngineLoading } from './components/common/CircularEngineLoading';

function DashboardTabContent({ activeTab, setActiveTab, onNavigate }: { activeTab: string; setActiveTab: (tab: string) => void; onNavigate?: (path: string) => void }) {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardOverview onNavigateTab={setActiveTab} />;
    case 'my-profile':
      return <MyProfileView onBackToDashboard={() => setActiveTab('dashboard')} onNavigateToUpgrade={() => setActiveTab('upgrade')} />;
    case 'settings':
      return <SettingsView onBackToDashboard={() => setActiveTab('dashboard')} onNavigateToUpgrade={() => setActiveTab('upgrade')} onNavigateToProfile={() => setActiveTab('my-profile')} onNavigate={onNavigate} />;
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
      return <AIPortfolioView onBackToHub={() => setActiveTab('engines')} onNavigateTab={setActiveTab} />;
    case 'engine-project-auditor':
      return <ProjectAuditorView onBackToHub={() => setActiveTab('engines')} onNavigateTab={setActiveTab} />;
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

const KNOWN_DASHBOARD_TABS = [
  'dashboard',
  'my-profile',
  'profiles',
  'skills',
  'projects',
  'readiness',
  'achievements',
  'engines',
  'upgrade',
  'settings',
  'engine-career-assistant',
  'engine-ai-portfolio',
  'engine-project-auditor',
  'engine-github-audit',
  'engine-linkedin-audit',
  'engine-resume-builder',
  'engine-resume-ats',
  'engine-syllabus-prep',
  'engine-roadmap-30-60-90',
  'engine-internship-ready',
  'engine-career-simulator',
];

function getTabFromPath(pathname: string): string | null {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  if (cleanPath === '/app' || cleanPath === '/dashboard') return 'dashboard';
  if (cleanPath.startsWith('/app/')) {
    const sub = cleanPath.replace('/app/', '');
    if (sub === 'profile') return 'my-profile';
    return sub || 'dashboard';
  }
  const rootSub = cleanPath.replace(/^\//, '');
  if (rootSub === 'profile') return 'my-profile';
  if (KNOWN_DASHBOARD_TABS.includes(rootSub)) return rootSub;
  return null;
}

function MainRouter() {
  const { user, isAuthChecking, isProfileHydrating } = useAuth();
  const {
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    activeProfile,
    allProfiles,
    isTwinHydrating,
    isTwinReady,
  } = useStudentTwin();

  // Route state
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Active dashboard tab initialized from pathname if available
  const [activeTab, setActiveTab] = useState<string>(() => {
    return getTabFromPath(window.location.pathname) || 'dashboard';
  });

  // Clean hash token after successful Supabase OAuth redirect to keep URL clean
  useEffect(() => {
    if (user && window.location.hash && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [user]);

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

    const matchedTab = getTabFromPath(path);
    if (matchedTab) {
      setActiveTab(matchedTab);
    }

    setCurrentRoute(path);
    window.history.pushState({}, '', path);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentRoute(path);
      const matchedTab = getTabFromPath(path);
      if (matchedTab) {
        setActiveTab(matchedTab);
      }
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

  // Session hydration latch: ensures the full circular AI Career OS loading animation
  // appears ONLY for genuine initial application startup / authentication hydration.
  // Once the session has initialized, it NEVER re-triggers during active session navigation,
  // tab changes, profile edits, project saves, or background cloud synchronization.
  const [hasSessionHydrated, setHasSessionHydrated] = useState<boolean>(() => {
    return window.location.pathname === '/demo';
  });

  useEffect(() => {
    if (isDemoMode) {
      setHasSessionHydrated(true);
      return;
    }

    // Only set ready based on REAL application state (no artificial delays/timers)
    if (!isAuthChecking) {
      if (!user) {
        // Visitor/guest authentication check complete
        setHasSessionHydrated(true);
      } else if (isTwinReady) {
        // Authenticated user's Student Twin is initialized & ready
        setHasSessionHydrated(true);
      }
    }
  }, [isAuthChecking, user, isTwinReady, isDemoMode]);

  // Synchronize unauthenticated state: if user signs out and not in demo mode, ensure route returns to '/'
  useEffect(() => {
    if (!user && !isAuthChecking && !isDemoMode) {
      if (
        currentRoute.startsWith('/app') ||
        currentRoute === '/dashboard' ||
        getTabFromPath(currentRoute) !== null
      ) {
        setCurrentRoute('/');
        window.history.replaceState({}, '', '/');
      }
    }
  }, [user, isAuthChecking, isDemoMode, currentRoute]);

  // 1. Initial Application Startup & Authentication Hydration Guard
  // Real-state controlled: hides immediately as soon as essential state is ready.
  // Never shown on navigation, route changes, sidebar clicks, component re-renders,
  // engine switches, profile updates, or background data refreshes.
  const isInitialStartupLoading =
    !hasSessionHydrated &&
    (isAuthChecking || (Boolean(user) && !isTwinReady));

  if (isInitialStartupLoading) {
    return <CircularEngineLoading />;
  }

  // 2. Demo Mode Route
  if (currentRoute === '/demo' || isDemoMode) {
    return (
      <AppShell
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onNavigate={navigateTo}
      >
        <DashboardTabContent activeTab={activeTab} setActiveTab={setActiveTab} onNavigate={navigateTo} />
      </AppShell>
    );
  }

  // 3. Authenticated User Route (matches /app, /app/*, /dashboard, or direct tab routes)
  const isAuthDashboardRoute =
    currentRoute.startsWith('/app') ||
    currentRoute === '/dashboard' ||
    getTabFromPath(currentRoute) !== null;

  // Determine if authenticated user genuinely needs first-time student twin calibration
  // Only evaluated AFTER twin hydration has fully resolved!
  const hasAcademicCredentials =
    Boolean(activeProfile.university && (activeProfile.degree || activeProfile.targetRole)) ||
    activeProfile.isOnboarded === true ||
    (allProfiles.length > 0 && allProfiles.some((p) => Boolean(p.university && (p.degree || p.targetRole))));

  const needsOnboarding =
    !isDemoMode &&
    user !== null &&
    isTwinReady &&
    !hasAcademicCredentials;

  if (user && isAuthDashboardRoute) {
    return (
      <>
        <AppShell
          currentTab={activeTab}
          onTabChange={setActiveTab}
          onNavigate={navigateTo}
        >
          <DashboardTabContent activeTab={activeTab} setActiveTab={setActiveTab} onNavigate={navigateTo} />
        </AppShell>
        {needsOnboarding && <StudentOnboardingModal />}
      </>
    );
  }

  // 3. Login Route
  if (currentRoute === '/login') {
    if (user) {
      return (
        <>
          <AppShell
            currentTab={activeTab}
            onTabChange={setActiveTab}
            onNavigate={navigateTo}
          >
            <DashboardTabContent activeTab={activeTab} setActiveTab={setActiveTab} />
          </AppShell>
          {needsOnboarding && <StudentOnboardingModal />}
        </>
      );
    }
    return (
      <LoginPage
        onNavigate={navigateTo}
        onLoginSuccess={() => {
          navigateTo('/app');
        }}
      />
    );
  }

  // 4. Sign Up Route
  if (currentRoute === '/signup') {
    if (user) {
      return (
        <>
          <AppShell
            currentTab={activeTab}
            onTabChange={setActiveTab}
            onNavigate={navigateTo}
          >
            <DashboardTabContent activeTab={activeTab} setActiveTab={setActiveTab} />
          </AppShell>
          {needsOnboarding && <StudentOnboardingModal />}
        </>
      );
    }
    return (
      <SignUpPage
        onNavigate={navigateTo}
        onSignUpSuccess={() => {
          navigateTo('/app');
        }}
      />
    );
  }

  // 5. Default: Public Landing Page (or redirect logged-in user if on root)
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
