import React from 'react';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { TermsSection } from '../../components/public/TermsSection';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-16">
        <TermsSection />
      </main>

      <Footer />
    </div>
  );
};
