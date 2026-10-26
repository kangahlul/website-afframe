import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { HeroSection } from '../../components/public/HeroSection';
import { SelectedWorksSection } from '../../components/public/SelectedWorksSection';
import { AboutSection } from '../../components/public/AboutSection';
import { WhyUsSection } from '../../components/public/WhyUsSection';
import { ServicesSection } from '../../components/public/ServicesSection';
import { PublicationSection } from '../../components/public/PublicationSection';
import { ServiceAreasSection } from '../../components/public/ServiceAreasSection';
import { FAQSection } from '../../components/public/FAQSection';
import { TermsSection } from '../../components/public/TermsSection';
import { BookingFormSection } from '../../components/public/BookingFormSection';

export const HomePage: React.FC = () => {
  const { sections, isLoading } = useSite();
  const location = useLocation();
  const [selectedPackageInfo, setSelectedPackageInfo] = useState<{
    serviceId: number;
    packageId: number;
    serviceName: string;
    packageName: string;
  } | null>(null);

  // Smooth scroll to hash anchor on page load or hash change
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname]);

  const handleSelectPackage = (serviceId: number, packageId: number, serviceName: string, packageName: string) => {
    setSelectedPackageInfo({ serviceId, packageId, serviceName, packageName });
  };

  // Find section by key helper
  const getSection = (key: string) => sections.find(s => s.section_key === key);

  // Default section sequence if custom ordering is active or fallback
  const visibleSections = sections.length > 0 ? sections : [];

  // Render component according to section_key
  const renderSectionComponent = (secKey: string, keyIdx: number) => {
    const sec = getSection(secKey);
    switch (secKey) {
      case 'hero':
        return <HeroSection key={keyIdx} section={sec} />;
      case 'selected_works':
      case 'featured_portfolio':
        return <SelectedWorksSection key={keyIdx} section={sec} />;
      case 'about':
        return <AboutSection key={keyIdx} section={sec} />;
      case 'why_us':
      case 'benefits':
        return <WhyUsSection key={keyIdx} section={sec} />;
      case 'packages':
        return <ServicesSection key={keyIdx} section={sec} onSelectPackage={handleSelectPackage} />;
      case 'services':
        // Handled unified under packages section to avoid duplicate rendering
        return null;
      case 'publication':
        return <PublicationSection key={keyIdx} section={sec} />;
      case 'service_areas':
        return <ServiceAreasSection key={keyIdx} section={sec} />;
      case 'faq':
        return <FAQSection key={keyIdx} section={sec} />;
      case 'terms':
        return <TermsSection key={keyIdx} section={sec} />;
      case 'booking_cta':
      case 'booking_form':
        return <BookingFormSection key={keyIdx} section={sec} selectedPackageInfo={selectedPackageInfo} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {visibleSections.length > 0 ? (
          visibleSections.map((sec, idx) => {
            if (!sec.is_visible) return null;
            return renderSectionComponent(sec.section_key, idx);
          })
        ) : (
          <>
            <HeroSection section={getSection('hero')} />
            <SelectedWorksSection section={getSection('selected_works')} />
            <AboutSection section={getSection('about')} />
            <WhyUsSection section={getSection('why_us')} />
            <ServicesSection section={getSection('packages')} onSelectPackage={handleSelectPackage} />
            <PublicationSection section={getSection('publication')} />
            <ServiceAreasSection section={getSection('service_areas')} />
            <FAQSection section={getSection('faq')} />
            <TermsSection />
            <BookingFormSection section={getSection('booking_cta')} selectedPackageInfo={selectedPackageInfo} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};
