import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStudentTwin, SUBSCRIPTION_PLANS } from '../../context/StudentTwinContext';
import { SubscriptionTier } from '../../types';
import {
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  AlertCircle,
  QrCode,
  Smartphone,
  Copy,
  Mail,
  Send,
} from 'lucide-react';

const OFFICIAL_UPI_ID = '8520981574@ybl';

interface PaymentUpgradeViewProps {
  onBackToDashboard?: () => void;
  onNavigateToSettings?: () => void;
}

export const PaymentUpgradeView: React.FC<PaymentUpgradeViewProps> = ({
  onBackToDashboard,
  onNavigateToSettings,
}) => {
  const { subscription, upgradeSubscription } = useStudentTwin();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    collegeName: '',
    contactPerson: '',
    email: '',
    phone: '',
    studentCount: '100 - 500 students',
    requirements: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradeComplete, setUpgradeComplete] = useState(false);

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(OFFICIAL_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const individualPlans = [
    {
      tier: 'free' as SubscriptionTier,
      name: 'Free Foundation',
      price: '₹0',
      period: 'Forever Free',
      tagline: 'Essential Student Twin Graph & Proof Verification',
      features: [
        'Single Personal Student Digital Twin',
        '3 Verified Proof-of-Work Project Repositories',
        'Standard ATS Resume Builder (1 Template)',
        'Core GitHub & LinkedIn Diagnostic Audits',
        'Basic DSA Readiness Vector Score',
        'Community Knowledge Base Access',
      ],
      popular: false,
    },
    {
      tier: 'pro_monthly' as SubscriptionTier,
      name: 'Pro Monthly',
      price: '₹299',
      period: 'per month',
      tagline: 'High-Velocity Placement Intelligence for Active Job Seekers',
      features: [
        'Unlimited Project Proof AST Deep Analysis',
        'All 11 AI Career Engines Full Suite',
        'Modern Executive & ATS Resume Templates with Photo',
        'Live Responsive AI Portfolio Suite (HTML/CSS/JS export)',
        'Unlimited Mock Interview Question Generation',
        'Instant Cold Email & Outreach Architect',
        '30-60-90 Day Adaptive Placement Roadmap',
        'Priority AI Job Pipeline Execution',
      ],
      popular: false,
    },
    {
      tier: 'pro_annual' as SubscriptionTier,
      name: 'Pro Annual',
      price: '₹1,499',
      period: 'per year',
      tagline: 'Best Value • Complete 4-Year Engineering Career OS',
      features: [
        'Everything in Pro Monthly + 60% Annual Savings',
        'Multi-Profile Management (Switch between Specializations)',
        'Unlimited High-Definition Vector PDF Report Exports',
        'Executive Recruiter Intelligence Simulator',
        'Custom Domain Binding for AI Portfolio',
        'Continuous GitHub Commit AST Telemetry Tracking',
        'Direct Placement Cell Integration Export',
        'Dedicated Career Acceleration Support',
      ],
      popular: true,
      savings: 'SAVE 60% ANNUALLY',
    },
  ];

  const handleOpenUpgrade = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setUpgradeComplete(false);
    setIsModalOpen(true);
  };

  const handleSimulatePayment = async () => {
    if (!selectedTier) return;
    setIsProcessing(true);

    // Simulate payment transaction latency
    setTimeout(async () => {
      await upgradeSubscription(selectedTier);
      setIsProcessing(false);
      setUpgradeComplete(true);
    }, 1200);
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnquirySubmitted(true);
  };

  const activePlanData = individualPlans.find((p) => p.tier === selectedTier) || individualPlans[1];

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>TRANSPARENT VALUE • NO HIDDEN FEES</span>
            </span>
            <span className="text-xs font-mono text-slate-400">INR (₹) PRICING</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-2.5 tracking-tight">
            Upgrade Your Student Twin Plan
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Accelerate your engineering placement readiness with unrestricted access to all 11 AI intelligence engines, high-definition portfolio compilation, and ATS resume verification.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Current Plan Indicator Strip */}
      <div className="p-6 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold font-mono text-base">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Current Active Plan:</span>
              <span className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase">
                {subscription.planName} ({subscription.price})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {subscription.tier === 'free'
                ? 'You are on the Free Foundation tier. Upgrade anytime to unlock all AI engines.'
                : `Active subscription renewed in Sandbox mode • ${subscription.billingPeriod}`}
            </p>
          </div>
        </div>

        {subscription.tier !== 'free' && (
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ACTIVE STATUS</span>
          </span>
        )}
      </div>

      {/* 4 Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Individual Plans */}
        {individualPlans.map((p) => {
          const isCurrent = subscription.tier === p.tier;

          return (
            <div
              key={p.tier}
              className={`relative rounded-[2.5rem] p-7 flex flex-col justify-between transition-all duration-300 ${
                p.popular
                  ? 'bg-white dark:bg-[#0d1117] border-2 border-blue-500 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/10'
                  : 'bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl'
              }`}
            >
              {/* Popular Badge */}
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                  MOST POPULAR
                </div>
              )}

              {p.savings && (
                <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {p.savings}
                </div>
              )}

              {/* Plan Header */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {p.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 min-h-[32px] leading-snug">
                  {p.tagline}
                </p>

                {/* Price Display */}
                <div className="mt-4 pb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                      {p.price}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      /{p.period}
                    </span>
                  </div>
                </div>

                {/* Feature List */}
                <ul className="space-y-2.5 my-6 text-[11px] text-slate-600 dark:text-slate-300">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-xs font-bold font-mono text-center cursor-default"
                  >
                    Current Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenUpgrade(p.tier)}
                    className={`w-full py-3 rounded-full text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      p.popular
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white/10 dark:hover:bg-white/20 dark:text-white'
                    }`}
                  >
                    <span>{p.tier === 'free' ? 'Switch to Free' : `Upgrade to ${p.name}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* 4th Card: Institutional / Campus (Strictly NO pricing amount, NO ₹12,999, NO UPI/QR payment) */}
        <div className="relative rounded-[2.5rem] p-7 flex flex-col justify-between bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-xl transition-all duration-300 hover:border-blue-500/40">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-800 mb-2">
              <Building2 className="w-3 h-3" />
              <span>ACADEMIC INSTITUTIONS</span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Institutional / Campus
            </h3>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 mt-0.5">
              Custom institutional solution
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 min-h-[32px] leading-snug">
              Contact our team for institutional deployment and requirements.
            </p>

            {/* Custom Solution Badge */}
            <div className="mt-4 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  Custom Solution
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Tailored campus deployment
              </span>
            </div>

            {/* Feature List */}
            <ul className="space-y-2.5 my-6 text-[11px] text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Up to 500+ Verified Student Digital Twin Nodes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Centralized Placement Officer Dashboard & Telemetry</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Batch AST Code Authenticity & Anti-Slop Auditing</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Custom Campus Branding & Verification Badges</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Departmental Cohort Performance Analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Dedicated SLA & On-Campus Training Workshops</span>
              </li>
            </ul>
          </div>

          {/* Action Button: ENQUIRE NOW */}
          <div className="pt-2">
            <button
              onClick={() => {
                setEnquirySubmitted(false);
                setIsEnquiryOpen(true);
              }}
              className="w-full py-3 rounded-full text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
            >
              <span>ENQUIRE NOW</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trust & Guarantee Badges */}
      <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-cyan-400/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Encrypted & Isolated</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Row Level Security ensures your digital twin proofs are private.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-cyan-400/10 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Instant Engine Unlock</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Immediate access to all 11 AI engines and portfolio generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-cyan-400/10 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">University Alignment</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Curriculum & placement benchmarks calibrated for Indian engineering tiers.
            </p>
          </div>
        </div>
      </div>

      {/* INSTITUTIONAL ENQUIRY MODAL */}
      {isEnquiryOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 rounded-2xl sm:rounded-[2.5rem] max-w-lg w-full p-5 sm:p-8 shadow-2xl relative space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsEnquiryOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {enquirySubmitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Enquiry Received
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Thank you for reaching out. Our academic partnerships team will contact you within 24 business hours to discuss custom institutional deployment for your campus.
                  </p>
                </div>

                <button
                  onClick={() => setIsEnquiryOpen(false)}
                  className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-md shadow-blue-600/25"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                      INSTITUTIONAL PARTNERSHIPS
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                    Institutional & Campus Enquiry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Deploy the Student Digital Twin OS across your college or department.
                  </p>
                </div>

                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                      College / University Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. National Institute of Technology"
                      value={enquiryForm.collegeName}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, collegeName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161b22] border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Dr. Rajesh Kumar"
                        value={enquiryForm.contactPerson}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, contactPerson: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161b22] border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                        Official Institutional Email *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="placement@university.edu"
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161b22] border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={enquiryForm.phone}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161b22] border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                        Expected Student Batch
                      </label>
                      <select
                        value={enquiryForm.studentCount}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, studentCount: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161b22] border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                      >
                        <option>100 - 300 students</option>
                        <option>300 - 1,000 students</option>
                        <option>1,000 - 5,000 students</option>
                        <option>5,000+ Campus-Wide</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1">
                      Requirements & Timeline
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Specify departments, placement goals, or preferred demo timeline..."
                      value={enquiryForm.requirements}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, requirements: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161b22] border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Institutional Enquiry</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* SIMULATED PAYMENT MODAL FOR INDIVIDUAL PRO PLANS */}
      {isModalOpen && selectedTier && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 rounded-2xl sm:rounded-[2rem] max-w-lg w-full p-5 sm:p-7 shadow-2xl relative space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {upgradeComplete ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Upgrade Successful!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Your account has been upgraded to <strong className="text-slate-900 dark:text-white font-mono">{activePlanData.name}</strong> ({activePlanData.price}).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] font-mono text-blue-700 dark:text-cyan-300 text-left space-y-1">
                  <div>✓ Plan: {activePlanData.name}</div>
                  <div>✓ Transaction Status: SIMULATED PAYMENT COMPLETE</div>
                  <div>✓ Engine Access: Unrestricted (11/11 Active)</div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-md shadow-blue-600/25"
                >
                  Continue to Workspace
                </button>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                      SIMULATED PAYMENT (SANDBOX MODE)
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                    Checkout: {activePlanData.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Amount: <strong className="text-slate-900 dark:text-white font-mono">{activePlanData.price}</strong> ({activePlanData.period})
                  </p>
                </div>

                {/* Simulated Payment Notice */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    <strong>Notice:</strong> This is a <strong>SIMULATED PAYMENT</strong> for demonstration purposes. No real money or bank account will be charged.
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Select Payment Method (Simulation)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-cyan-400 shadow-sm'
                          : 'border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-cyan-400 shadow-sm'
                          : 'border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-3 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'netbanking'
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-cyan-400 shadow-sm'
                          : 'border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Net Banking</span>
                    </button>
                  </div>
                </div>

                {/* Method Details (Simulation Inputs) */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-2.5 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center text-center space-y-2.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                        <QrCode className="w-3 h-3" />
                        <span>Scan to Pay</span>
                      </div>

                      {/* Pure white background card for QR so scanner contrast is crisp in light & dark modes */}
                      <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-white/10 inline-block">
                        <QRCodeSVG
                          value={`upi://pay?pa=${OFFICIAL_UPI_ID}&pn=Student%20Digital%20Twin&am=${activePlanData.price.replace(/[^0-9]/g, '')}&cu=INR&tn=${encodeURIComponent(activePlanData.name + ' Plan')}`}
                          size={135}
                          level="M"
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                          includeMargin={false}
                        />
                      </div>

                      {/* UPI ID Details */}
                      <div className="space-y-1 w-full pt-0.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                          UPI ID
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#0d1117] px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 select-all">
                            {OFFICIAL_UPI_ID}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpiId}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                              copiedUpi
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                            title="Copy UPI ID to clipboard"
                          >
                            {copiedUpi ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy UPI ID</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 pt-0.5">
                        <span>Google Pay</span>
                        <span>•</span>
                        <span>PhonePe</span>
                        <span>•</span>
                        <span>Paytm</span>
                        <span>•</span>
                        <span>BHIM / CRED</span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Simulated Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none transition-colors"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        defaultValue="12 / 28"
                        className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none transition-colors"
                        placeholder="MM / YY"
                      />
                      <input
                        type="password"
                        defaultValue="•••"
                        className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none transition-colors"
                        placeholder="CVV"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Select Bank (Simulation)
                    </label>
                    <select className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none font-mono transition-colors">
                      <option>HDFC Bank</option>
                      <option>State Bank of India (SBI)</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl sm:rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50 shrink-0 mt-2"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    {isProcessing
                      ? 'Simulating Transaction...'
                      : `Confirm Payment (${activePlanData.price})`}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
