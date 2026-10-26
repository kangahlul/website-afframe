import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteSettings, WebsiteSection, NavigationItem } from '../types';
import { api } from '../lib/api';

interface SiteContextType {
  settings: SiteSettings;
  sections: WebsiteSection[];
  navigation: NavigationItem[];
  isLoading: boolean;
  refreshSiteData: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  brand_name: 'AF Frame',
  tagline: 'Capturing Meaningful Moments.',
  brand_description: 'AF Frame adalah layanan content creator dan dokumentasi moment yang berfokus pada mengabadikan momen spesial dalam bentuk foto, video cinematic, dan konten media sosial.',
  whatsapp_number: '085755152579',
  whatsapp_url: 'https://wa.me/6285755152579',
  instagram_handle: '@_afframe',
  instagram_url: 'https://www.instagram.com/_afframe/',
  email: 'afframe.production@gmail.com',
  address: 'Lamongan, Gresik, Surabaya & Sekitarnya, Jawa Timur',
  primary_color: '#C5A880',
  bg_color: '#0C0C0D',
  accent_color: '#E2D2BC',
  heading_font: 'Cormorant Garamond',
  body_font: 'Plus Jakarta Sans',
  logo_primary: '',
  logo_light: '',
  logo_dark: '',
  logo_monogram: '',
  favicon_url: '/favicon.svg',
  og_image: '',
  seo_title: 'AF Frame — Capturing Meaningful Moments | Photography & Cinematic Production',
  seo_description: 'Dokumentasi Foto & Video Cinematic Profesional: Corporate, Graduation, Wedding, Creative Content, Personal Branding & Tour Travel.',
  footer_copyright: '© 2026 AF Frame. All rights reserved. Capturing Meaningful Moments.',
};

const SiteContext = createContext<SiteContextType | undefined>(undefined);

const getCachedSettings = (): SiteSettings => {
  try {
    const raw = localStorage.getItem('afframe_site_settings');
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return defaultSettings;
};

const getCachedSections = (): WebsiteSection[] => {
  try {
    const raw = localStorage.getItem('afframe_site_sections');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

const getCachedNavigation = (): NavigationItem[] => {
  try {
    const raw = localStorage.getItem('afframe_site_nav');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(getCachedSettings);
  const [sections, setSections] = useState<WebsiteSection[]>(getCachedSections);
  const [navigation, setNavigation] = useState<NavigationItem[]>(getCachedNavigation);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If cached settings already exist, do not block or show loading skeleton
    return !localStorage.getItem('afframe_site_settings');
  });

  const fetchSiteData = useCallback(async () => {
    try {
      const [settingsRes, sectionsRes, navRes] = await Promise.all([
        api.get<{ settings: SiteSettings }>('/settings'),
        api.get<{ sections: WebsiteSection[] }>('/sections'),
        api.get<{ items: NavigationItem[] }>('/content/navigation'),
      ]);

      if (settingsRes.settings) {
        const merged = { ...defaultSettings, ...settingsRes.settings };
        setSettings(merged);
        try {
          localStorage.setItem('afframe_site_settings', JSON.stringify(merged));
        } catch (e) {}
      }
      if (sectionsRes.sections) {
        setSections(sectionsRes.sections);
        try {
          localStorage.setItem('afframe_site_sections', JSON.stringify(sectionsRes.sections));
        } catch (e) {}
      }
      if (navRes.items) {
        setNavigation(navRes.items);
        try {
          localStorage.setItem('afframe_site_nav', JSON.stringify(navRes.items));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to load site data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSiteData();

    // Debounced focus sync (minimum 15 seconds between focus refreshes to avoid spam)
    let lastFocus = Date.now();
    const handleFocus = () => {
      if (Date.now() - lastFocus > 15000) {
        lastFocus = Date.now();
        fetchSiteData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchSiteData]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    await api.put('/settings', newSettings);
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('afframe_site_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <SiteContext.Provider
      value={{
        settings,
        sections,
        navigation,
        isLoading,
        refreshSiteData: fetchSiteData,
        updateSettings,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};
