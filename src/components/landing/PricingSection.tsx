import React from 'react';
import { Check, ArrowRight, Sparkles, Building2, UserCheck, Shield } from 'lucide-react';

interface PricingSectionProps {
  onNavigate: (route: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onNavigate }) => {
  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      period: '/ forever',
      description: 'Essential digital replica foundation for individual student engineers.',
      badge: 'Free Tier',
      popular: false,
      cta: 'Start Free Twin',
      route: '/signup',
      features: [
        'Single Student Digital Twin profile',
        'Living skill graph & proficiency index',
        'Repository proof-of-work link tracking',
        'Basic career readiness scoring',
        'Public verifiable twin portfolio preview',
        'Standard community support',
      ],
    },
    {
      name: 'Student Pro',
      price: '₹1,499',
      period: '/ year',
      description: 'Advanced placement calibration & multi-vector AI diagnostics suite.',
      badge: 'Most Popular',
      popular: true,
      cta: 'Build Pro Twin',
      route: '/signup',
      features: [
        'Everything in Free Plan',
        'Deep AST Code & Proof Health Auditor',
        'Tier-1 Job Spec ontology calibration',
        'Predictive skill gap remediation plans',
        'Multi-vector readiness telemetry reports',
        'Early access to Phase 2 AI engine suite',
        'Priority verification badge',
      ],
    },
    {
      name: 'Campus / Institutional',
      price: '₹12,999',
      period: '/ cohort / year',
      description: 'Comprehensive cohort readiness management for universities & departments.',
      badge: 'For Universities',
      popular: false,
      cta: 'Inquire for Campus',
      route: '#contact',
      features: [
        'Everything in Student Pro',
        'Full department cohort telemetry dashboard',
        'Accreditation & NAAC/ABET syllabus mapping',
        'Batch student readiness analytics & export',
        'Placement cell recruiter sharing portals',
        'Dedicated institutional success manager',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-white dark:bg-[#02040a] border-b border-slate-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Plans for Students and Universities
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Transparent pricing in Indian Rupees (₹). Start free forever or calibrate your readiness for top-tier placement.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col justify-between p-8 rounded-[2rem] transition-all duration-300 ${
                plan.popular
                  ? 'bg-slate-50 dark:bg-[#0d1117] border-2 border-blue-500 shadow-xl lg:-translate-y-2'
                  : 'bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold font-mono uppercase tracking-widest shadow-md">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  {!plan.popular && (
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-white/5 border border-slate-300/80 dark:border-white/10 text-slate-700 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {plan.period}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {plan.description}
                </p>

                <div className="pt-4 border-t border-slate-200 dark:border-white/5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Included Capabilities
                  </div>
                  {plan.features.map((feat, fi) => (
                    <div key={fi} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onNavigate(plan.route)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)]'
                      : 'bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 shadow-sm'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Note on payment processing */}
        <div className="mt-8 text-center text-xs text-slate-500">
          * All accounts begin with the Free Foundation tier (₹0). Academic institutional discounts available upon request.
        </div>

      </div>
    </section>
  );
};

