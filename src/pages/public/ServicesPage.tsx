import React, { useState } from 'react';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { ServicesSection } from '../../components/public/ServicesSection';
import { TermsSection } from '../../components/public/TermsSection';
import { FAQSection } from '../../components/public/FAQSection';
import { BookingFormSection } from '../../components/public/BookingFormSection';

export const ServicesPage: React.FC = () => {
  const [selectedPackageInfo, setSelectedPackageInfo] = useState<{
    serviceId: number;
    packageId: number;
    serviceName: string;
    packageName: string;
  } | null>(null);

  const handleSelectPackage = (serviceId: number, packageId: number, serviceName: string, packageName: string) => {
    setSelectedPackageInfo({ serviceId, packageId, serviceName, packageName });
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
              Katalog Lengkap
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl text-[#F8F6F0] font-light">
              Layanan & Pilihan Paket Dokumentasi
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light font-sans">
              Pilihan paket komprehensif mulai dari Graduation, Wedding, Creative Content, Personal Branding, Corporate Event, hingga Tour & Travel.
            </p>
          </div>
        </div>

        <ServicesSection onSelectPackage={handleSelectPackage} />
        <TermsSection />
        <FAQSection />
        <BookingFormSection selectedPackageInfo={selectedPackageInfo} />
      </main>

      <Footer />
    </div>
  );
};
