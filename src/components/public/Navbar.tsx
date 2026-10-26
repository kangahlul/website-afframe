import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowUpRight, MessageCircle } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { BrandLogo } from '../common/BrandLogo';

export const Navbar: React.FC = () => {
  const { settings, navigation } = useSite();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();
  const isClickingRef = useRef(false);

  // Scroll detection for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Default fallback navigation links
  const defaultNavItems = [
    { id: 'portfolio', label: 'Portofolio', hashId: 'portfolio', url: '/#portfolio' },
    { id: 'about', label: 'Tentang Kami', hashId: 'about', url: '/#about' },
    { id: 'why_us', label: 'Kenapa Kami', hashId: 'why_us', url: '/#why_us' },
    { id: 'packages', label: 'Paket & Harga', hashId: 'packages', url: '/#packages' },
    { id: 'service_areas', label: 'Coverage', hashId: 'service_areas', url: '/#service_areas' },
    { id: 'faq', label: 'FAQ', hashId: 'faq', url: '/#faq' },
    { id: 'terms', label: 'S&K', hashId: 'terms', url: '/#terms' },
  ];

  // Derive navItems dynamically from CMS navigation, syncing renames/additions/order
  const headerNav = navigation?.filter(n => n.location === 'header' && n.is_visible) || [];
  const navItems = headerNav.length > 0
    ? headerNav.map(n => {
        let hash = '';
        if (n.url.includes('#')) {
          hash = n.url.split('#')[1];
        } else if (n.url.includes('portfolio')) {
          hash = 'portfolio';
        } else if (n.url.includes('service') || n.url.includes('packages')) {
          hash = 'packages';
        } else if (n.url.includes('term')) {
          hash = 'terms';
        } else if (n.url.includes('about')) {
          hash = 'about';
        } else if (n.url.includes('why')) {
          hash = 'why_us';
        } else if (n.url.includes('faq')) {
          hash = 'faq';
        } else if (n.url.includes('contact') || n.url.includes('book')) {
          hash = 'booking';
        }
        const id = hash || n.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return {
          id,
          label: n.label,
          hashId: hash || id,
          url: n.url,
          target: n.target || '_self'
        };
      })
    : defaultNavItems;

  // Helper for pixel-perfect smooth scroll accounting for glass header height
  const scrollToTarget = (hashId: string) => {
    const el =
      document.getElementById(hashId) ||
      (hashId === 'portfolio' ? document.getElementById('selected_works') : null) ||
      (hashId === 'booking' ? document.getElementById('booking-form') : null);

    if (el) {
      const headerOffset = 58;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      window.history.pushState(null, '', `#${hashId}`);
    }
  };

  // Synchronize activeId on route or initial hash change
  useEffect(() => {
    setMobileMenuOpen(false);

    if (location.pathname === '/') {
      if (location.hash) {
        const h = location.hash.replace('#', '');
        setActiveId(h);
      } else if (window.scrollY < 260) {
        setActiveId('');
      }
    } else {
      setActiveId('');
    }
  }, [location.pathname, location.hash]);

  // ScrollSpy observer on homepage: highlights the current section as user scrolls
  useEffect(() => {
    if (location.pathname !== '/') return;

    // Track sections dynamically based on navItems
    const sectionsToTrack = navItems.map(item => item.hashId);

    const handleScrollSpy = () => {
      // Ignore scroll spy immediately after a manual click to prevent jitter
      if (isClickingRef.current) return;

      const scrollPos = window.scrollY + 220;

      // If near top of homepage (hero)
      if (window.scrollY < 260) {
        if (!location.hash) {
          setActiveId('');
        }
        return;
      }

      // Check which section is currently on screen
      let currentSection = '';
      for (const sId of sectionsToTrack) {
        const el =
          document.getElementById(sId) ||
          (sId === 'portfolio' ? document.getElementById('selected_works') : null);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            currentSection = sId;
            break;
          }
        }
      }

      if (currentSection) {
        setActiveId(currentSection);
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [location.pathname, location.hash]);

  const handleNavClick = (
    e: React.MouseEvent,
    item: (typeof navItems)[0]
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    // Instantly stick the active indicator ("nempel langsung")
    setActiveId(item.id);
    isClickingRef.current = true;
    setTimeout(() => {
      isClickingRef.current = false;
    }, 950);

    if (location.pathname === '/') {
      scrollToTarget(item.hashId);
    } else {
      // If currently on an inner page, navigate to homepage with hash
      navigate(`/#${item.hashId}`);
    }
  };

  const handleBookingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveId('');
    if (location.pathname === '/') {
      scrollToTarget('booking');
    } else {
      navigate('/#booking');
    }
  };

  const whatsappPhone = settings.whatsapp_number || '085755152579';
  const whatsappUrl =
    settings.whatsapp_url || `https://wa.me/62${whatsappPhone.replace(/^0/, '')}`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#09090D]/78 border-b border-white/[0.12] py-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.65)]'
          : 'bg-[#0B0B0F]/55 border-b border-white/[0.08] py-4.5 shadow-[0_4px_24px_rgba(0,0,0,0.35)]'
      }`}
      style={{
        WebkitBackdropFilter: 'blur(20px) saturate(190%)',
        backdropFilter: 'blur(20px) saturate(190%)',
        boxShadow: scrolled
          ? '0 12px 36px rgba(0,0,0,0.65), inset 0 1px 0 0 rgba(255,255,255,0.14), inset 0 -1px 0 0 rgba(255,255,255,0.04)'
          : '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 0 rgba(255,255,255,0.1), inset 0 -1px 0 0 rgba(255,255,255,0.02)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <Link
            to="/"
            onClick={e => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActiveId('');
                window.history.pushState(null, '', '/');
              }
            }}
            className="flex items-center gap-3 group"
          >
            <BrandLogo size="md" />
          </Link>

          {/* Desktop Navigation Links with Sticky Active Underline Indicator */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
            {navItems.map(item => {
              const isItemActive = activeId === item.id;

              return (
                <a
                  key={item.id}
                  href={`/#${item.hashId}`}
                  onClick={e => handleNavClick(e, item)}
                  className={`text-[12px] tracking-wider uppercase font-semibold transition-all duration-200 relative py-2 cursor-pointer group ${
                    isItemActive
                      ? 'text-[#C5A880]'
                      : 'text-zinc-300 hover:text-[#C5A880] hover:-translate-y-0.5'
                  }`}
                >
                  <span>{item.label}</span>
                  
                  {/* Active Indicator Underline */}
                  {isItemActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#C5A880] via-[#E2D2BC] to-[#C5A880] rounded-full shadow-[0_0_12px_rgba(197,168,128,0.85)] animate-fadeIn" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action Buttons (Strictly No CMS Link) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Direct WhatsApp Quick Chat */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#C5A880] text-zinc-300 hover:text-white transition-all text-xs shadow-sm cursor-pointer"
              title="Konsultasi Cepat via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline text-[11px] font-medium">WhatsApp</span>
            </a>

            {/* Primary Booking Button */}
            <a
              href="/#booking"
              onClick={handleBookingClick}
              className="inline-flex items-center gap-1.5 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] px-4 py-2 rounded-sm text-xs font-semibold tracking-wider uppercase transition-all duration-200 shadow-md hover:shadow-[#C5A880]/30 cursor-pointer"
            >
              <span>Booking Sesi</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Right Controls: Menu Button */}
          <div className="flex sm:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-sm text-zinc-300 hover:text-white hover:bg-white/10 focus:outline-none transition-colors cursor-pointer"
              aria-label="Buka Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#C5A880]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop/Tablet Menu Hamburger Button (Hidden on Mobile) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="hidden sm:inline-flex lg:hidden p-2 rounded-sm text-zinc-300 hover:text-white hover:bg-white/10 focus:outline-none transition-colors cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#C5A880]" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer with Frosted Glass Effect */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden bg-[#0A0A0E]/95 border-b border-white/10 px-6 pt-5 pb-7 space-y-2 shadow-2xl animate-fadeIn"
          style={{
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            backdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {navItems.map(item => {
            const isItemActive = activeId === item.id;

            return (
              <a
                key={item.id}
                href={`/#${item.hashId}`}
                onClick={e => handleNavClick(e, item)}
                className={`flex items-center justify-between py-2.5 text-sm uppercase tracking-wider font-semibold border-b border-[#1E1E26]/80 transition-colors ${
                  isItemActive ? 'text-[#C5A880]' : 'text-zinc-200 hover:text-[#C5A880]'
                }`}
              >
                <span>{item.label}</span>
                {isItemActive && (
                  <span className="w-2 h-2 rounded-full bg-[#C5A880] shadow-[0_0_8px_rgba(197,168,128,0.8)]" />
                )}
              </a>
            );
          })}

          {/* Mobile Action Buttons */}
          <div className="pt-4 flex flex-col gap-2.5">
            <a
              href="/#booking"
              onClick={handleBookingClick}
              className="w-full text-center bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] py-3 rounded-sm text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
            >
              <span>Booking Sesi Sekarang</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center border border-zinc-700 hover:border-[#C5A880] bg-[#121216]/90 text-zinc-200 hover:text-white py-2.5 rounded-sm text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Chat WhatsApp Studio</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
