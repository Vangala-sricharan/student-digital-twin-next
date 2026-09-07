import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { SubscriptionTier } from '../../types';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onNavigateToUpgrade?: () => void;
}

export const UpgradeProModal: React.FC<UpgradeProModalProps> = ({
  isOpen,
  onClose,
  featureName = 'AI Portfolio Builder',
  onNavigateToUpgrade,
}) => {
  const { upgradeSubscription } = useStudentTwin();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro_monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSimulateUpgrade = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      await upgradeSubscription(selectedTier);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 900);
  };

  const handleSuccessClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div
      id="upgrade-pro-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="upgrade-pro-modal-card"
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-blue-500/30 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-white transition-all transform animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="btn-close-upgrade-modal"
          type="button"
          onClick={isSuccess ? handleSuccessClose : onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center space-y-4 py-3 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Pro Plan Activated!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You now have full access to <strong className="font-semibold text-slate-900 dark:text-white">{featureName}</strong> and all premium career features.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs font-mono text-left space-y-1 text-blue-900 dark:text-cyan-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Plan: {selectedTier === 'pro_annual' ? 'Pro Annual (₹1,499/yr)' : 'Pro Monthly (₹299/mo)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>AI Portfolio Generation & Code ZIP Downloads Unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Status: Active & Verified</span>
              </div>
            </div>

            <button
              id="btn-confirm-pro-continue"
              type="button"
              onClick={handleSuccessClose}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              Continue to Workspace
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
                <Lock className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-cyan-400 text-[10px] font-mono font-bold tracking-wider uppercase">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  PRO FEATURE
                </div>
                <h2 id="upgrade-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Upgrade to Pro
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {featureName} is available exclusively with the Pro plan.
                </p>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Unlock with Pro:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>AI-powered portfolio generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>Personal portfolio preview</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>Downloadable portfolio ZIP (HTML / CSS / JS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>Advanced career presentation</span>
                </li>
              </ul>
            </div>

            {/* Plan Choice Selector */}
            <div className="space-y-2.5">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Choose Plan:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pro Monthly */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('pro_monthly')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTier === 'pro_monthly'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      Pro Monthly
                    </span>
                    <span className="text-xs font-extrabold font-mono text-blue-600 dark:text-cyan-400">
                      ₹299
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Billed monthly • Cancel anytime
                  </div>
                </button>

                {/* Pro Annual */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('pro_annual')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                    selectedTier === 'pro_annual'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300'
                  }`}
                >
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[9px] font-bold">
                    SAVE 60%
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      Pro Annual
                    </span>
                    <span className="text-xs font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      ₹1,499
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    ₹1,499 / year • Best value
                  </div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                id="btn-modal-confirm-upgrade"
                type="button"
                onClick={handleSimulateUpgrade}
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-mono font-bold shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Activating Pro Plan...'
                    : `Upgrade to Pro (${selectedTier === 'pro_annual' ? '₹1,499/yr' : '₹299/mo'})`}
                </span>
              </button>

              {onNavigateToUpgrade && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToUpgrade();
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Full Comparison & Payment Options</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
