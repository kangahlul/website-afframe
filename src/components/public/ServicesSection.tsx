import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Check,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  Video,
  Building2,
  Plane,
  Layers,
  MessageSquare,
  Tag
} from 'lucide-react';
import { Service, ServicePackage, WebsiteSection } from '../../types';
import { api } from '../../lib/api';
import { useSite } from '../../context/SiteContext';

interface ServicesSectionProps {
  section?: WebsiteSection;
  onSelectPackage?: (serviceId: number, packageId: number, serviceName: string, packageName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ section, onSelectPackage }) => {
  const { settings } = useSite();
  const [services, setServices] = useState<Service[]>([]);
  // Default to first service id so it's clean and not showing all at once
  const [selectedFilter, setSelectedFilter] = useState<'all' | number | null>(null);
  const [loading, setLoading] = useState(true);

  // Slider scroll state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse drag-to-scroll refs
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const loadServices = useCallback(async () => {
    try {
      const res = await api.get<{ services: Service[] }>('/services');
      const svcList = res.services || [];
      setServices(svcList);
      setSelectedFilter(prev => {
        // Keep existing selected service if still valid, otherwise default to first service
        if (prev === null) {
          return svcList.length > 0 ? svcList[0].id : null;
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to load services & packages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Update arrow buttons visibility based on scroll position
  const checkScrollBounds = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScrollBounds();
    window.addEventListener('resize', checkScrollBounds);
    return () => window.removeEventListener('resize', checkScrollBounds);
  }, [services, checkScrollBounds]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  // Mouse drag handlers for desktop smooth scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
    checkScrollBounds();
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    // Debounce resetting hasDragged so click handler can inspect it
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  const handleSelectFilter = (id: 'all' | number, e?: React.MouseEvent) => {
    if (hasDraggedRef.current) return;
    setSelectedFilter(id);

    // Auto center clicked tab button
    if (e?.currentTarget) {
      (e.currentTarget as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  if (section && !section.is_visible) return null;

  const formatRupiah = (val: number) => {
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  const handleChoose = (service: Service, pkg: ServicePackage) => {
    if (onSelectPackage) {
      onSelectPackage(service.id, pkg.id, service.name, pkg.package_name);
    }
    const formElement = document.getElementById('booking-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper icons per category
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('graduat') || name.includes('wisuda')) {
      return <GraduationCap className="w-4 h-4" />;
    }
    if (name.includes('wed') || name.includes('nikah') || name.includes('engagement') || name.includes('lamaran')) {
      return <Heart className="w-4 h-4" />;
    }
    if (name.includes('creative') || name.includes('cinematic') || name.includes('film')) {
      return <Video className="w-4 h-4" />;
    }
    if (name.includes('personal') || name.includes('branding')) {
      return <Sparkles className="w-4 h-4" />;
    }
    if (name.includes('corp') || name.includes('perusahaan') || name.includes('gala')) {
      return <Building2 className="w-4 h-4" />;
    }
    if (name.includes('tour') || name.includes('travel') || name.includes('wisata')) {
      return <Plane className="w-4 h-4" />;
    }
    return <Layers className="w-4 h-4" />;
  };

  const getCleanName = (fullName: string) => {
    return fullName
      .replace(' Photography & Videography', '')
      .replace(' Documentation Profesional', '')
      .replace(' Content', '');
  };

  // Total packages count across all services
  const totalPackagesCount = services.reduce((acc, s) => acc + (s.packages?.length || 0), 0);

  // Filtered services to display
  const displayedServices =
    selectedFilter === 'all'
      ? services
      : services.filter(s => s.id === selectedFilter);

  const whatsappPhone = settings?.whatsapp_number || '085755152579';

  return (
    <section id="packages" className="pt-14 pb-20 bg-[#09090A] relative border-t border-[#24242A]/60 scroll-mt-14">
      <div id="services" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
            {section?.subtitle || 'Katalog Resmi AFFRAME'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light">
            {section?.title || 'Pilihan Paket & Investasi'}
          </h2>
          <p className="text-sm text-zinc-400 font-sans leading-relaxed">
            {section?.description ||
              'Daftar paket resmi yang transparan dan terstruktur. Jelajahi seluruh layanan di bawah ini atau gunakan filter kategori untuk fokus pada kebutuhan dokumentasi Anda.'}
          </p>
        </div>

        {/* Interactive Scrollable Category Navigation with Prev/Next Controls */}
        <div className="relative max-w-5xl mx-auto mb-14">
          
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            aria-label="Geser ke kiri"
            className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#141418] border border-[#2A2A32] flex items-center justify-center text-zinc-300 transition-all shadow-xl hover:bg-[#C5A880] hover:text-[#0C0C0D] hover:border-[#C5A880] disabled:opacity-0 disabled:pointer-events-none cursor-pointer`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            aria-label="Geser ke kanan"
            className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#141418] border border-[#2A2A32] flex items-center justify-center text-zinc-300 transition-all shadow-xl hover:bg-[#C5A880] hover:text-[#0C0C0D] hover:border-[#C5A880] disabled:opacity-0 disabled:pointer-events-none cursor-pointer`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Left & Right Visual Fades */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#09090A] to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#09090A] to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Horizontal Pills Slider */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollBounds}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex items-center gap-2.5 overflow-x-auto py-2 px-6 sm:px-8 select-none cursor-grab active:cursor-grabbing scroll-smooth"
          >
            {/* "Semua Paket" Tab */}
            <button
              type="button"
              onClick={e => handleSelectFilter('all', e)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-[#C5A880] text-[#0C0C0D] shadow-lg shadow-[#C5A880]/25 scale-105 font-bold'
                  : 'bg-[#141417] text-zinc-400 hover:text-white border border-[#25252C] hover:border-zinc-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Paket</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedFilter === 'all' ? 'bg-[#0C0C0D]/20 text-[#0C0C0D]' : 'bg-[#1F1F26] text-zinc-400'
                }`}
              >
                {totalPackagesCount}
              </span>
            </button>

            {/* Individual Category Tabs */}
            {services.map(svc => {
              const isSelected = selectedFilter === svc.id;
              const pkgCount = svc.packages?.length || 0;

              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={e => handleSelectFilter(svc.id, e)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#C5A880] text-[#0C0C0D] shadow-lg shadow-[#C5A880]/25 scale-105 font-bold'
                      : 'bg-[#141417] text-zinc-400 hover:text-white border border-[#25252C] hover:border-zinc-700'
                  }`}
                >
                  <span className={isSelected ? 'text-[#0C0C0D]' : 'text-[#C5A880]'}>
                    {getCategoryIcon(svc.name)}
                  </span>
                  <span>{getCleanName(svc.name)}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-[#0C0C0D]/20 text-[#0C0C0D]' : 'bg-[#1F1F26] text-zinc-400'
                    }`}
                  >
                    {pkgCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category counter indicator */}
          <div className="flex items-center justify-center text-[11px] text-zinc-500 mt-2 px-6">
            <span>
              {selectedFilter === 'all'
                ? `Menampilkan seluruh ${services.length} kategori (${totalPackagesCount} pilihan paket)`
                : `Kategori terpilih: ${services.find(s => s.id === selectedFilter)?.name || ''}`}
            </span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-12 max-w-5xl mx-auto">
            <div className="h-40 bg-zinc-900/60 animate-pulse rounded-sm border border-zinc-800" />
            <div className="h-40 bg-zinc-900/60 animate-pulse rounded-sm border border-zinc-800" />
          </div>
        )}

        {/* Grouped Services List */}
        {!loading && (
          <div className="space-y-16 max-w-5xl mx-auto">
            {/* Banner when viewing all categories */}
            {selectedFilter === 'all' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-sm bg-[#141418] border border-[#C5A880]/40 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880] shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-zinc-200">
                    Menampilkan katalog lengkap: <strong>{services.length} Kategori</strong> ({totalPackagesCount} Pilihan Paket)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFilter(services[0]?.id || null)}
                  className="text-xs text-[#C5A880] hover:underline font-semibold cursor-pointer shrink-0"
                >
                  ✕ Ciutkan ke Tampilan Per Kategori
                </button>
              </div>
            )}

            {displayedServices.map((service, sIdx) => {
              const pkgs = service.packages || [];
              if (pkgs.length === 0) return null;

              return (
                <div
                  key={service.id}
                  id={`service-group-${service.id}`}
                  className="space-y-8 scroll-mt-28"
                >
                  {/* Category Group Header Banner */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#24242C]">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#17171C] border border-[#2A2A34] text-[11px] uppercase tracking-wider text-[#C5A880] font-semibold mb-2">
                        {getCategoryIcon(service.name)}
                        <span>{getCleanName(service.name)}</span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl text-[#F8F6F0] font-light">
                        {service.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                        {service.short_description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-zinc-400 block font-mono">Tersedia {pkgs.length} Pilihan Paket</span>
                    </div>
                  </div>

                  {/* Package Cards for this Group */}
                  <div
                    className={`grid gap-6 items-stretch ${
                      pkgs.length === 1
                        ? 'grid-cols-1 max-w-xl mx-auto'
                        : pkgs.length === 2
                        ? 'grid-cols-1 md:grid-cols-2'
                        : 'grid-cols-1 md:grid-cols-3'
                    }`}
                  >
                    {pkgs.map(pkg => {
                      const hasPromo =
                        pkg.promotional_price > 0 && pkg.promotional_price < pkg.regular_price;
                      const discountPercent = hasPromo
                        ? Math.round(((pkg.regular_price - pkg.promotional_price) / pkg.regular_price) * 100)
                        : 0;

                      return (
                        <div
                          key={pkg.id}
                          className={`flex flex-col justify-between p-7 sm:p-8 rounded-sm relative transition-all duration-300 ${
                            pkg.is_featured
                              ? 'bg-[#151519] border-2 border-[#C5A880] shadow-2xl shadow-[#C5A880]/10 transform -translate-y-1'
                              : 'bg-[#121215] border border-[#232329] hover:border-zinc-700'
                          }`}
                        >
                          {/* Featured / Most Popular Badge */}
                          {pkg.is_featured === 1 && (
                            <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A880] text-[#0C0C0D] text-[10px] uppercase tracking-widest font-bold rounded-full shadow-md">
                                <Sparkles className="w-3 h-3" />
                                Paling Favorit
                              </span>
                            </div>
                          )}

                          {/* Card Content Top */}
                          <div>
                            {/* Header row: Package category tag + Duration */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#C5A880]">
                                {service.name.split(' ')[0]} Edition
                              </span>
                              {pkg.duration && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-[#1A1A1E] px-2.5 py-1 rounded border border-[#26262E]">
                                  <Clock className="w-3 h-3 text-[#C5A880]" />
                                  {pkg.duration}
                                </span>
                              )}
                            </div>

                            {/* Package Name */}
                            <h4 className="font-serif text-3xl font-light text-[#F8F6F0] tracking-wide mb-4">
                              {pkg.package_name}{' '}
                              <span className="font-sans text-xs text-zinc-400 block sm:inline">Package</span>
                            </h4>

                            {/* Price Section */}
                            <div className="mb-6 pb-6 border-b border-[#25252C]">
                              {pkg.is_quotation_based ? (
                                <div>
                                  <div className="font-serif text-2xl text-[#F8F6F0]">By Quotation</div>
                                  <p className="text-[11px] text-zinc-400 mt-1">
                                    Disesuaikan dengan scope acara & spesifikasi teknis
                                  </p>
                                </div>
                              ) : pkg.is_price_hidden ? (
                                <div className="text-sm text-zinc-400 italic">Hubungi Admin untuk Harga</div>
                              ) : (
                                <div>
                                  <div className="flex items-baseline flex-wrap gap-2.5">
                                    {hasPromo ? (
                                      <>
                                        <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#E2D2BC]">
                                          {formatRupiah(pkg.promotional_price)}
                                        </span>
                                        <span className="text-xs sm:text-sm text-zinc-500 line-through">
                                          {formatRupiah(pkg.regular_price)}
                                        </span>
                                        {discountPercent > 0 && (
                                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold">
                                            <Tag className="w-2.5 h-2.5" />
                                            Hemat {discountPercent}%
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="font-serif text-3xl sm:text-4xl text-[#F8F6F0] font-semibold">
                                        {formatRupiah(pkg.regular_price)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-zinc-500 mt-1.5">
                                    *Harga promo spesial sesuai katalog resmi AFFRAME
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Deliverables List */}
                            <div className="space-y-3 mb-8">
                              <span className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
                                Rincian & Fasilitas:
                              </span>
                              <ul className="space-y-2.5">
                                {pkg.deliverables.map((item, dIdx) => (
                                  <li
                                    key={dIdx}
                                    className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed"
                                  >
                                    <div className="w-4 h-4 rounded-full bg-[#C5A880]/15 flex items-center justify-center shrink-0 mt-0.5">
                                      <Check className="w-3 h-3 text-[#C5A880]" />
                                    </div>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="space-y-2.5 pt-4 border-t border-[#25252C]">
                            <button
                              type="button"
                              onClick={() => handleChoose(service, pkg)}
                              className={`w-full py-3.5 px-4 rounded-sm text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                pkg.is_featured
                                  ? 'bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] shadow-lg shadow-[#C5A880]/25 font-bold'
                                  : 'bg-[#1D1D23] hover:bg-[#C5A880] hover:text-[#0C0C0D] text-[#F8F6F0] border border-[#2D2D36]'
                              }`}
                            >
                              <span>Pilih Paket {pkg.package_name}</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>

                            <a
                              href={`https://wa.me/62${whatsappPhone.replace(/^0/, '')}?text=${encodeURIComponent(
                                `Halo AFFRAME, saya tertarik ingin berkonsultasi mengenai Paket ${pkg.package_name} untuk ${service.name}. Mohon informasi ketersediaan jadwalnya.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 text-center text-[11px] text-zinc-400 hover:text-[#C5A880] transition-colors flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Konsultasi Cepat via WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Section Divider between groups if all services are shown */}
                  {selectedFilter === 'all' && sIdx < displayedServices.length - 1 && (
                    <div className="pt-8 flex items-center justify-center">
                      <div className="h-px bg-gradient-to-r from-transparent via-[#2A2A34] to-transparent w-full max-w-2xl" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Guarantee Banner */}
        <div className="mt-16 text-center text-xs text-zinc-400 max-w-xl mx-auto flex items-center justify-center gap-2 p-4 rounded-sm bg-[#111114] border border-[#24242A]">
          <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
          <span>Seluruh file asli (raw) & hasil edit dikirimkan aman via Google Drive berkecepatan tinggi.</span>
        </div>

      </div>
    </section>
  );
};
