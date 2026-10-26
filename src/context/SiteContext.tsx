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

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSiteData = useCallback(async () => {
    try {
      const [settingsRes, sectionsRes, navRes] = await Promise.all([
        api.get<{ settings: SiteSettings }>('/settings'),
        api.get<{ sections: WebsiteSection[] }>('/sections'),
        api.get<{ items: NavigationItem[] }>('/content/navigation'),
      ]);

      if (settingsRes.settings) {
        setSettings({ ...defaultSettings, ...settingsRes.settings });
      }
      if (sectionsRes.sections) {
        setSections(sectionsRes.sections);
      }
      if (navRes.items) {
        setNavigation(navRes.items);
      }
    } catch (err) {
      console.error('Failed to load initial site data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSiteData();

    // Auto-refresh data whenever the tab gains focus (e.g. after editing in Admin)
    const handleFocus = () => {
      fetchSiteData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchSiteData]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    await api.put('/settings', newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
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
