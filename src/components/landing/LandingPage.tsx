import React from 'react';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { Hero } from './Hero';
import { WhatIsSDT } from './WhatIsSDT';
import { CoreBenefits } from './CoreBenefits';
import { AiCareerEngine } from './AiCareerEngine';
import { ReadinessDiagnostics } from './ReadinessDiagnostics';
import { PricingSection } from './PricingSection';
import { AboutFounder } from './AboutFounder';
import { ContactSection } from './ContactSection';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#02040a] text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      <Header onNavigate={onNavigate} activeRoute="/" />
      
      <main className="flex-1">
        <Hero onNavigate={onNavigate} />
        <WhatIsSDT />
        <CoreBenefits />
        <AiCareerEngine />
        <ReadinessDiagnostics />
        <PricingSection onNavigate={onNavigate} />
        <AboutFounder />
        <ContactSection />
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};


