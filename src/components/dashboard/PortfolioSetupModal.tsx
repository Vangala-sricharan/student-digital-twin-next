import React, { useState } from 'react';
import { Sparkles, Link as LinkIcon, ExternalLink, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface PortfolioSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildWithTwin: () => void;
  onOpenUpgrade: () => void;
  onConnectExisting: (url: string) => Promise<void> | void;
  isPro: boolean;
  existingUrl?: string;
}

export const PortfolioSetupModal: React.FC<PortfolioSetupModalProps> = ({
  isOpen,
  onClose,
  onBuildWithTwin,
  onOpenUpgrade,
  onConnectExisting,
  isPro,
  existingUrl = '',
}) => {
  const [urlInput, setUrlInput] = useState(existingUrl);
  const [urlError, setUrlError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const validateUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    let formatted = urlInput.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }

    if (!validateUrl(formatted)) {
      setUrlError('Please enter a valid website URL (e.g. https://yourportfolio.com)');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConnectExisting(formatted);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setUrlError('Failed to save portfolio URL. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuildClick = () => {
    if (!isPro) {
      onOpenUpgrade();
    } else {
      onBuildWithTwin();
    }
  };

  return (
    <div
      id="portfolio-setup-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="portfolio-setup-modal-card"
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-blue-500/30 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-white transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="btn-close-portfolio-modal"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-cyan-400 text-[10px] font-mono font-bold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Portfolio Ownership
          </div>
          <h2 id="portfolio-setup-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Set Up Your Portfolio
          </h2>
          <p id="portfolio-setup-subtitle" className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Build a professional portfolio using your Student Twin data, or connect your existing portfolio.
          </p>
        </div>

        {/* Two Options Container */}
        <div className="space-y-4 pt-1">
          
          {/* OPTION A: Build with Student Digital Twin */}
          <div
            id="portfolio-option-a"
            className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Build with Student Digital Twin
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                      PRO
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generate a professional portfolio automatically from your verified projects, skills, achievements and Student Twin profile.
            </p>

            <button
              id="btn-build-portfolio-pro"
              type="button"
              onClick={handleBuildClick}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Build Portfolio</span>
              {!isPro && <span className="text-[10px] opacity-90 font-mono">(Upgrade Required)</span>}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-white/10 w-full" />
            <span className="bg-white dark:bg-[#0d1117] px-3 text-[11px] font-mono uppercase tracking-wider text-slate-400 shrink-0">
              OR
            </span>
          </div>

          {/* OPTION B: Add Existing Portfolio */}
          <div
            id="portfolio-option-b"
            className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-all space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <LinkIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Add Existing Portfolio
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Already have a portfolio? Connect it to your Student Twin.
            </p>

            <form onSubmit={handleConnect} className="space-y-3 pt-1">
              <div className="relative">
                <input
                  id="input-portfolio-url"
                  type="text"
                  placeholder="https://yourportfolio.com"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={isSubmitting || isSuccess}
                />
              </div>

              {urlError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{urlError}</span>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Portfolio connected successfully!</span>
                </div>
              )}

              <button
                id="btn-connect-portfolio"
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Connected ✓</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Connect Portfolio</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
