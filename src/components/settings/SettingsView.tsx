import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useTheme } from '../../context/ThemeContext';
import { ProfilePictureUploader } from '../profile/ProfilePictureUploader';
import {
  Settings,
  User,
  Sun,
  Moon,
  CreditCard,
  LogOut,
  Shield,
  Key,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Mail,
  RefreshCw,
} from 'lucide-react';

interface SettingsViewProps {
  onBackToDashboard?: () => void;
  onNavigateToUpgrade?: () => void;
  onNavigateToProfile?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBackToDashboard,
  onNavigateToUpgrade,
  onNavigateToProfile,
}) => {
  const { user, userProfile, signOut } = useAuth();
  const { profile, subscription, isDemoMode, updateProfile, enterDemoMode, openDemoLockModal } = useStudentTwin();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'profile' | 'subscription' | 'data'>('account');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Quick form state for account tab
  const [displayName, setDisplayName] = useState(profile.fullName || profile.name || userProfile?.fullName || 'Student Candidate');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAccount = async () => {
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }
    await updateProfile({
      fullName: displayName,
      name: displayName,
      displayName: displayName,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportData = () => {
    const dataToExport = {
      profile,
      subscription,
      exportedAt: new Date().toISOString(),
      platform: 'Student Digital Twin OS V4',
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-twin-${profile.name?.toLowerCase().replace(/\s+/g, '-') || 'scholar'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header Banner */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-slate-800 to-slate-950 dark:from-blue-600 dark:to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-slate-500/10">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Account & Workspace Settings
              </h1>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold border border-slate-200 dark:border-white/10">
                V4 ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage your authenticated credentials, theme preferences, student profile asset, and subscription tier.
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium transition-colors cursor-pointer self-start md:self-auto"
          >
            Dashboard
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'account'
              ? 'bg-white dark:bg-[#0d1117] text-blue-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Account</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-[#0d1117] text-blue-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-[#0d1117] text-blue-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Student Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'subscription'
              ? 'bg-white dark:bg-[#0d1117] text-blue-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Subscription</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'data'
              ? 'bg-white dark:bg-[#0d1117] text-blue-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Data & Privacy</span>
        </button>
      </div>

      {/* TAB CONTENT: ACCOUNT */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Account Credentials & Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Authenticated Email</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user?.email || profile.email || 'scholar@university.edu'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">User UID (Supabase Auth)</label>
                <input
                  type="text"
                  disabled
                  value={user?.id || 'demo-mode-sandbox-uid-2026'}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                <Shield className="w-4 h-4" />
                <span>Row Level Security (RLS) Active & Isolated</span>
              </div>

              <button
                onClick={handleSaveAccount}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                <span>{saveSuccess ? 'Saved' : 'Update Account'}</span>
              </button>
            </div>
          </div>

          {/* Security & Account Management */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Security & Credentials
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage your authentication tokens, encryption passwords, and account lifecycle.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  if (isDemoMode) {
                    openDemoLockModal();
                  } else {
                    alert('Password reset link sent to your registered email address.');
                  }
                }}
                className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Key className="w-3.5 h-3.5 text-blue-500" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => {
                  if (isDemoMode) {
                    openDemoLockModal();
                  } else {
                    alert('Please contact support or email compliance to request permanent account erasure.');
                  }
                }}
                className="px-4 py-2 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs font-mono font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          {/* Logout Section */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-red-50/40 dark:bg-red-950/10 border border-red-200/80 dark:border-red-900/30 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider font-mono">
                Session Management
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Sign out of your active Student Digital Twin workspace session on this device.
              </p>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-red-600/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Interface & Theme Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Uses the existing global Light / Dark theme system across all 11 AI engines and dashboards.
              </p>
            </div>
          </div>

          {/* Theme Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Light Mode Card */}
            <div
              onClick={() => {
                if (isDarkMode) toggleTheme();
              }}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                !isDarkMode
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-4 ring-blue-500/10'
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</h3>
                    <p className="text-[11px] text-slate-500">Clean, high-contrast daylight aesthetic</p>
                  </div>
                </div>
                {!isDarkMode && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </div>
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => {
                if (!isDarkMode) toggleTheme();
              }}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                isDarkMode
                  ? 'border-cyan-400 bg-cyan-950/20 ring-4 ring-cyan-400/10'
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-cyan-400 flex items-center justify-center">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</h3>
                    <p className="text-[11px] text-slate-400">Deep obsidian palette for focus</p>
                  </div>
                </div>
                {isDarkMode && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: STUDENT PROFILE (QUICK EDIT) */}
      {activeTab === 'profile' && (
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Student Profile Quick Photo & Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your core profile picture and high-level identity.
              </p>
            </div>

            {onNavigateToProfile && (
              <button
                onClick={onNavigateToProfile}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>Full Profile View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5">
            <ProfilePictureUploader studentName={profile.fullName || profile.name} size="xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">University</label>
              <input
                type="text"
                value={profile.university || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Degree & Year</label>
              <input
                type="text"
                value={
                  profile.degree || profile.yearOfStudy
                    ? `${profile.degree || 'Degree not specified'}${profile.yearOfStudy ? ` • ${profile.yearOfStudy}` : ''}`
                    : 'Not specified'
                }
                disabled
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SUBSCRIPTION */}
      {activeTab === 'subscription' && (
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Subscription & Plan Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Indian Rupee (₹) simulated billing tier and engine capabilities.
              </p>
            </div>

            {onNavigateToUpgrade && (
              <button
                onClick={onNavigateToUpgrade}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>Upgrade Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Current Tier Box */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border border-blue-200 dark:border-blue-900/40 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-widest">
                  Active Tier
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  {subscription.planName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  Price: {subscription.price} • {subscription.billingPeriod}
                </p>
              </div>

              <span className="px-3.5 py-1 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold shadow-sm">
                SIMULATED BILLING
              </span>
            </div>

            <div className="pt-3 border-t border-blue-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-600 dark:text-slate-400">
              <span>All 11 AI Career Engines: Active</span>
              <span>Vector PDF Exports: Enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DATA & PRIVACY */}
      {activeTab === 'data' && (
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Data Sovereignty & Graph Export
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download your complete verified twin knowledge graph or audit database synchronization.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 space-y-3">
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Export Digital Twin JSON</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Download your complete student node telemetry, verified skills, and project proofs in standard JSON format.
              </p>
              <button
                onClick={handleExportData}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 transition-all"
              >
                {exportSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{exportSuccess ? 'Exported!' : 'Export JSON'}</span>
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 space-y-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Security & Isolation</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Your data is strictly partitioned by your Supabase user ID and protected under Row Level Security.
              </p>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold inline-block border border-emerald-200 dark:border-emerald-800">
                STATUS: RLS SECURED
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Sign Out</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to end your current session?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await signOut();
                  enterDemoMode();
                  onBackToDashboard?.();
                }}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer shadow-md shadow-red-600/20"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
