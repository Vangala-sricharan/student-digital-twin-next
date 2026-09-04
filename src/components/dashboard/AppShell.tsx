import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { SDTLogo } from '../common/SDTLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { DemoBanner } from '../common/DemoBanner';
import {
  LayoutDashboard,
  UserCheck,
  Cpu,
  FolderGit2,
  TrendingUp,
  Award,
  Layers,
  LogOut,
  Sparkles,
  Menu,
  X,
  Bot,
  Code2,
  Github,
  Share2,
  FileText,
  FileSearch,
  BookOpen,
  Milestone,
  Briefcase,
  Compass,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings,
  CreditCard,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface AppShellProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  onNavigate,
  children,
}) => {
  const { user, signOut } = useAuth();
  const { profile, isDemoMode, exitDemoMode, subscription } = useStudentTwin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [enginesExpanded, setEnginesExpanded] = useState(true);

  // Desktop Collapsible Sidebar State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sdt_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sdt_sidebar_collapsed', String(next));
      return next;
    });
  };

  const twinNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-profile', label: 'My Foundation', icon: User, badge: 'Core' },
    { id: 'profiles', label: 'Student Twins', icon: UserCheck },
    { id: 'skills', label: 'Skills & DSA', icon: Cpu },
    { id: 'projects', label: 'Projects & Work', icon: FolderGit2 },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'readiness', label: 'Career Goals', icon: TrendingUp },
  ];

  const aiEngineItems = [
    { id: 'engines', label: 'AI Engines Hub', icon: Layers, badge: '11 Active' },
    { id: 'engine-career-assistant', label: 'Career Assistant', icon: Bot },
    { id: 'engine-ai-portfolio', label: 'AI Portfolio', icon: Sparkles },
    { id: 'engine-project-auditor', label: 'Project Auditor', icon: Code2 },
    { id: 'engine-github-audit', label: 'GitHub Audit', icon: Github },
    { id: 'engine-linkedin-audit', label: 'LinkedIn Audit', icon: Share2 },
    { id: 'engine-resume-builder', label: 'Resume Builder', icon: FileText },
    { id: 'engine-resume-ats', label: 'Resume & ATS Analyzer', icon: FileSearch },
    { id: 'engine-syllabus-prep', label: 'Syllabus Prep', icon: BookOpen, badge: 'PDF/PPT' },
    { id: 'engine-roadmap-30-60-90', label: '30–60–90 Roadmap', icon: Milestone },
    { id: 'engine-internship-ready', label: 'Internship Ready', icon: Briefcase },
    { id: 'engine-career-simulator', label: 'Career Simulator', icon: Compass },
  ];

  const accountNavItems = [
    { id: 'upgrade', label: 'Upgrade Plan', icon: CreditCard, badge: subscription.tier === 'free' ? '₹299/mo' : 'Active' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOutOrExit = async () => {
    if (isDemoMode) {
      exitDemoMode();
      onNavigate('/');
    } else {
      await signOut();
      onNavigate('/');
    }
  };

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const initials = (profile?.fullName || profile?.name || 'S')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#02040a] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Demo Banner if in Demo Mode */}
      {isDemoMode && (
        <DemoBanner
          onExitDemo={handleSignOutOrExit}
          onCreateAccount={() => {
            exitDemoMode();
            onNavigate('/signup');
          }}
        />
      )}

      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-[#02040a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-sm transition-colors">
        <div className="px-4 sm:px-8 lg:px-10 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div onClick={() => onNavigate('/')} className="cursor-pointer">
              <SDTLogo size="sm" />
            </div>
          </div>

          {/* Right Header Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* Upgrade Button */}
            <button
              onClick={() => handleTabSelect('upgrade')}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                subscription.tier === 'free'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm hover:opacity-90'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{subscription.tier === 'free' ? 'Upgrade (₹299)' : subscription.planName}</span>
            </button>

            {/* Settings Quick Icon */}
            <button
              onClick={() => handleTabSelect('settings')}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border-slate-200 dark:border-white/10'
              }`}
              title="Account & Workspace Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Profile Avatar / Indicator (clickable to open My Profile) */}
            <div
              onClick={() => handleTabSelect('my-profile')}
              className="flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer hover:border-blue-400 transition-all group"
              title="Open Student Profile"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName || 'Student Avatar'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-md object-cover border border-slate-300 dark:border-white/20 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>
              )}
              
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px] group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {profile?.fullName || user?.email?.split('@')[0] || 'Student'}
                </div>
                <div className="text-[10px] text-blue-600 dark:text-cyan-400 font-mono font-medium">
                  {isDemoMode ? 'Demo Scholar' : subscription.planName}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOutOrExit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isDemoMode ? 'Exit Demo' : 'Sign Out'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden lg:block shrink-0 transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-64'
          } space-y-4`}
        >
          {/* Collapse/Expand Toggle Header */}
          <div className="flex items-center justify-between px-2">
            {!isCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Navigation
              </span>
            )}
            <button
              onClick={toggleSidebarCollapse}
              className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Twin Status Summary Card (Full or Compact) */}
          <div className={`rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl transition-all ${
            isCollapsed ? 'p-3.5 text-center' : 'p-5 space-y-3.5'
          }`}>
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-1" title={`Readiness: ${profile?.readinessScore || 0}%`}>
                <span className="font-bold text-blue-600 dark:text-cyan-400 font-mono text-xs">
                  {profile?.readinessScore || 0}%
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Twin</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Readiness Index</span>
                  <span className="font-bold text-blue-600 dark:text-cyan-400 font-mono text-sm">
                    {profile?.readinessScore || 0}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${profile?.readinessScore || 0}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug truncate">
                  {profile?.targetRole || 'Target Career'} @ <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.university || 'University'}</span>
                </div>
              </>
            )}
          </div>

          {/* Navigation Links */}
          <nav className={`rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl transition-all ${
            isCollapsed ? 'p-2 space-y-3' : 'p-3.5 space-y-4'
          }`}>
            
            {/* Section 1: Twin Core */}
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Student Twin Core
                </div>
              )}
              {twinNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'
                    } rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 ${
                        isActive ? 'bg-blue-700 text-cyan-200' : 'bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Section 2: AI Career OS */}
            <div className="space-y-1 pt-2.5 border-t border-slate-100 dark:border-white/5">
              {!isCollapsed ? (
                <div
                  onClick={() => setEnginesExpanded(!enginesExpanded)}
                  className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <span>AI Career OS (11)</span>
                  {enginesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              ) : (
                <div
                  onClick={() => handleTabSelect('engines')}
                  className="flex justify-center py-1 cursor-pointer"
                  title="AI Career OS Engines"
                >
                  <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                </div>
              )}

              {(enginesExpanded || isCollapsed) && (
                <div className={`space-y-0.5 pt-1 ${isCollapsed ? '' : 'max-h-[320px] overflow-y-auto no-scrollbar'}`}>
                  {aiEngineItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full flex items-center ${
                          isCollapsed ? 'justify-center px-2 py-1.5' : 'justify-between px-3 py-1.5'
                        } rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              isActive
                                ? 'bg-blue-700 text-cyan-200'
                                : 'bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Workspace & Settings */}
            <div className="space-y-1 pt-2.5 border-t border-slate-100 dark:border-white/5">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Account & Settings
                </div>
              )}

              {accountNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'
                    } rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-md font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </nav>

          {/* Verification Badge in Sidebar (Expanded only) */}
          {!isCollapsed && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 space-y-1 transition-colors shadow-sm dark:shadow-xl">
              <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-cyan-400 text-[11px] font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phase 2 OS Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                11 AI engines executing deterministic Student Twin intelligence.
              </p>
            </div>
          )}

        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="w-72 h-full bg-white dark:bg-[#0d1117] rounded-r-2xl border-r border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <SDTLogo size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Core Nav */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1 font-bold">
                  Student Twin Core
                </div>
                {twinNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* AI Career OS */}
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="text-[10px] font-mono uppercase text-blue-600 dark:text-cyan-400 px-2 py-1 font-bold">
                  AI Career OS (11)
                </div>
                {aiEngineItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Workspace & Settings */}
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1 font-bold">
                  Account & Workspace
                </div>
                {accountNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  onClick={handleSignOutOrExit}
                  className="w-full py-2.5 px-3 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isDemoMode ? 'Exit Demo' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content View */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>

    </div>
  );
};


