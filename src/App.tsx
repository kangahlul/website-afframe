import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { PortfolioPage } from './pages/public/PortfolioPage';
import { ProjectDetailPage } from './pages/public/ProjectDetailPage';
import { ServicesPage } from './pages/public/ServicesPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { TermsPage } from './pages/public/TermsPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardOverview } from './pages/admin/DashboardOverview';
import { MediaLibrary } from './pages/admin/MediaLibrary';
import { BrandIdentityManager } from './pages/admin/BrandIdentityManager';
import { WebsiteSectionManager } from './pages/admin/WebsiteSectionManager';
import { NavigationPagesManager } from './pages/admin/NavigationPagesManager';
import { PortfolioManager } from './pages/admin/PortfolioManager';
import { PortfolioCategoriesManager } from './pages/admin/PortfolioCategoriesManager';
import { ServicesPackagesManager } from './pages/admin/ServicesPackagesManager';
import { InquiriesManager } from './pages/admin/InquiriesManager';
import { AboutManager } from './pages/admin/AboutManager';
import { BenefitsManager } from './pages/admin/BenefitsManager';
import { FAQManager } from './pages/admin/FAQManager';
import { TermsManager } from './pages/admin/TermsManager';
import { ServiceAreasManager } from './pages/admin/ServiceAreasManager';
import { WebsiteSettingsManager } from './pages/admin/WebsiteSettingsManager';
import { SEOSettingsManager } from './pages/admin/SEOSettingsManager';
import { AdminAccountManager } from './pages/admin/AdminAccountManager';

import { ScrollToTop } from './components/common/ScrollToTop';

export function App() {
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.removeAttribute('data-theme');
    try {
      localStorage.removeItem('afframe_theme');
    } catch {}
  }, []);

  return (
    <AuthProvider>
      <SiteProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Website Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/:slug" element={<ProjectDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Panel (Protected) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="brand" element={<BrandIdentityManager />} />
              <Route path="sections" element={<WebsiteSectionManager />} />
              <Route path="navigation" element={<NavigationPagesManager />} />
              <Route path="portfolio" element={<PortfolioManager />} />
              <Route path="categories" element={<PortfolioCategoriesManager />} />
              <Route path="services" element={<ServicesPackagesManager />} />
              <Route path="inquiries" element={<InquiriesManager />} />
              <Route path="about" element={<AboutManager />} />
              <Route path="benefits" element={<BenefitsManager />} />
              <Route path="faq" element={<FAQManager />} />
              <Route path="terms" element={<TermsManager />} />
              <Route path="service-areas" element={<ServiceAreasManager />} />
              <Route path="settings" element={<WebsiteSettingsManager />} />
              <Route path="seo" element={<SEOSettingsManager />} />
              <Route path="account" element={<AdminAccountManager />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </SiteProvider>
    </AuthProvider>
  );
}

export default App;
