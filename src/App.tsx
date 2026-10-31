import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';
import { ScrollToTop } from './components/common/ScrollToTop';

// ─── PUBLIC PAGES (lazy — split per route) ───────────────────────────────────
const HomePage          = lazy(() => import('./pages/public/HomePage').then(m => ({ default: m.HomePage })));
const PortfolioPage     = lazy(() => import('./pages/public/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const ProjectDetailPage = lazy(() => import('./pages/public/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const ServicesPage      = lazy(() => import('./pages/public/ServicesPage').then(m => ({ default: m.ServicesPage })));
const AboutPage         = lazy(() => import('./pages/public/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage       = lazy(() => import('./pages/public/ContactPage').then(m => ({ default: m.ContactPage })));
const TermsPage         = lazy(() => import('./pages/public/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage       = lazy(() => import('./pages/public/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const NotFoundPage      = lazy(() => import('./pages/public/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// ─── ADMIN PAGES (lazy — only loaded when /admin is visited) ─────────────────
const AdminLoginPage            = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminLayout               = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const DashboardOverview         = lazy(() => import('./pages/admin/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const MediaLibrary              = lazy(() => import('./pages/admin/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const BrandIdentityManager      = lazy(() => import('./pages/admin/BrandIdentityManager').then(m => ({ default: m.BrandIdentityManager })));
const WebsiteSectionManager     = lazy(() => import('./pages/admin/WebsiteSectionManager').then(m => ({ default: m.WebsiteSectionManager })));
const NavigationPagesManager    = lazy(() => import('./pages/admin/NavigationPagesManager').then(m => ({ default: m.NavigationPagesManager })));
const PortfolioManager          = lazy(() => import('./pages/admin/PortfolioManager').then(m => ({ default: m.PortfolioManager })));
const PortfolioCategoriesManager = lazy(() => import('./pages/admin/PortfolioCategoriesManager').then(m => ({ default: m.PortfolioCategoriesManager })));
const ServicesPackagesManager   = lazy(() => import('./pages/admin/ServicesPackagesManager').then(m => ({ default: m.ServicesPackagesManager })));
const InquiriesManager          = lazy(() => import('./pages/admin/InquiriesManager').then(m => ({ default: m.InquiriesManager })));
const ClientsManager            = lazy(() => import('./pages/admin/ClientsManager').then(m => ({ default: m.ClientsManager })));
const AboutManager              = lazy(() => import('./pages/admin/AboutManager').then(m => ({ default: m.AboutManager })));
const BenefitsManager           = lazy(() => import('./pages/admin/BenefitsManager').then(m => ({ default: m.BenefitsManager })));
const FAQManager                = lazy(() => import('./pages/admin/FAQManager').then(m => ({ default: m.FAQManager })));
const TermsManager              = lazy(() => import('./pages/admin/TermsManager').then(m => ({ default: m.TermsManager })));
const ServiceAreasManager       = lazy(() => import('./pages/admin/ServiceAreasManager').then(m => ({ default: m.ServiceAreasManager })));
const WebsiteSettingsManager    = lazy(() => import('./pages/admin/WebsiteSettingsManager').then(m => ({ default: m.WebsiteSettingsManager })));
const SEOSettingsManager        = lazy(() => import('./pages/admin/SEOSettingsManager').then(m => ({ default: m.SEOSettingsManager })));
const AdminAccountManager       = lazy(() => import('./pages/admin/AdminAccountManager').then(m => ({ default: m.AdminAccountManager })));

// Fallback loading minimal
const PageLoader = () => (
  <div className="fixed inset-0 bg-[#0C0C0D] flex items-center justify-center z-50">
    <div className="w-6 h-6 border-2 border-[#C5A880]/30 border-t-[#C5A880] rounded-full animate-spin" />
  </div>
);

export function App() {
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.removeAttribute('data-theme');
    try { localStorage.removeItem('afframe_theme'); } catch {}
  }, []);

  return (
    <AuthProvider>
      <SiteProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Website Routes */}
              <Route path="/"                element={<HomePage />} />
              <Route path="/portfolio"       element={<PortfolioPage />} />
              <Route path="/portfolio/:slug" element={<ProjectDetailPage />} />
              <Route path="/services"        element={<ServicesPage />} />
              <Route path="/about"           element={<AboutPage />} />
              <Route path="/contact"         element={<ContactPage />} />
              <Route path="/terms"           element={<TermsPage />} />
              <Route path="/privacy"         element={<PrivacyPage />} />

              {/* Admin Login */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Admin Panel (Protected) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index              element={<DashboardOverview />} />
                <Route path="clients"     element={<ClientsManager />} />
                <Route path="inquiries"   element={<InquiriesManager />} />
                <Route path="media"       element={<MediaLibrary />} />
                <Route path="brand"       element={<BrandIdentityManager />} />
                <Route path="sections"    element={<WebsiteSectionManager />} />
                <Route path="navigation"  element={<NavigationPagesManager />} />
                <Route path="portfolio"   element={<PortfolioManager />} />
                <Route path="categories"  element={<PortfolioCategoriesManager />} />
                <Route path="services"    element={<ServicesPackagesManager />} />
                <Route path="about"       element={<AboutManager />} />
                <Route path="benefits"    element={<BenefitsManager />} />
                <Route path="faq"         element={<FAQManager />} />
                <Route path="terms"       element={<TermsManager />} />
                <Route path="service-areas" element={<ServiceAreasManager />} />
                <Route path="settings"    element={<WebsiteSettingsManager />} />
                <Route path="seo"         element={<SEOSettingsManager />} />
                <Route path="account"     element={<AdminAccountManager />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SiteProvider>
    </AuthProvider>
  );
}

export default App;
