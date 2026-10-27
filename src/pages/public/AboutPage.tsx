import React from 'react';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { AboutSection } from '../../components/public/AboutSection';
import { WhyUsSection } from '../../components/public/WhyUsSection';
import { PublicationSection } from '../../components/public/PublicationSection';
import { ServiceAreasSection } from '../../components/public/ServiceAreasSection';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
              Dedikasi & Filosofi
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl text-[#F8F6F0] font-light">
              Mengenal AFFRAME
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light font-sans">
              Layanan content creator & dokumentasi momen yang mendedikasikan kepekaan artistik dan ketelitian teknis untuk mengabadikan setiap detik berarti.
            </p>
          </div>
        </div>

        <AboutSection />
        <WhyUsSection />
        <PublicationSection />
        <ServiceAreasSection />
      </main>

      <Footer />
    </div>
  );
};
