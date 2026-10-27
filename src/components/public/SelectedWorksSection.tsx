import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, Eye, ChevronLeft, ChevronRight, Film, Image as ImageIcon, SlidersHorizontal, LayoutGrid } from 'lucide-react';
import { PortfolioProject, PortfolioCategory, WebsiteSection } from '../../types';
import { api } from '../../lib/api';
import { normalizeMediaUrl, getDirectVideoUrl, isGoogleDriveUrl } from '../../lib/mediaUtils';
import { PortfolioLightboxModal } from './PortfolioLightboxModal';

interface SelectedWorksSectionProps {
  section?: WebsiteSection;
}

export const SelectedWorksSection: React.FC<SelectedWorksSectionProps> = ({ section }) => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const [loading, setLoading] = useState(true);

  // Modal Lightbox & Slider
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  // Slider container ref
  const sliderRef = useRef<HTMLDivElement>(null);
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [projRes, catRes] = await Promise.all([
        api.get<{ projects: PortfolioProject[] }>('/portfolio/projects', { limit: 16, all: false }),
        api.get<{ categories: PortfolioCategory[] }>('/portfolio/categories'),
      ]);
      setProjects(projRes.projects || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -380 : 380;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (section && !section.is_visible) return null;

  // Filter projects by Category and Media Type (Video / Photo)
  const filteredProjects = projects.filter(p => {
    const matchCat =
      selectedCategory === 'all' ||
      p.category_slug === selectedCategory ||
      String(p.category_id) === selectedCategory;

    const isVideo = p.media_type === 'video' || Boolean(p.featured_video_url && p.featured_video_url.trim());
    const matchMedia =
      mediaFilter === 'all' ||
      (mediaFilter === 'video' && isVideo) ||
      (mediaFilter === 'photo' && !isVideo);

    return matchCat && matchMedia;
  });

  return (
    <section id="portfolio" className="pt-16 pb-24 bg-[#0C0C0D] relative border-t border-[#24242A]/60 scroll-mt-14 overflow-hidden">
      <div id="selected_works" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
                {section?.subtitle || 'Selected Works & Visual Reels'}
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light leading-tight">
              {section?.title || 'Karya Dokumentasi & Sinematik'}
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl font-light">
              {section?.description ||
                'Kompilasi karya dokumentasi foto, reels potrait 9:16 untuk media sosial, dan sinematik teaser eksklusif untuk pernikahan, perayaan, wisuda, dan korporasi.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher: Slider vs Grid */}
            <div className="hidden sm:flex items-center bg-[#141418] border border-zinc-800 rounded-sm p-1">
              <button
                onClick={() => setViewMode('slider')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'slider'
                    ? 'bg-[#C5A880] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Tampilan Geser Slider / Carousel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Mode Geser</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#C5A880] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Tampilan Kisi / Grid Koleksi"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Mode Kisi</span>
              </button>
            </div>

            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A880] hover:text-[#E2D2BC] transition-colors group font-semibold self-start md:self-auto py-2"
            >
              <span>Arsip Lengkap</span>
              <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Media & Category Controls */}
        <div className="space-y-4 mb-8">
          {/* Top Filter: Media Format (Semua vs Video & Reels vs Galeri Foto) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/80">
            <button
              onClick={() => setMediaFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                mediaFilter === 'all'
                  ? 'bg-zinc-200 text-black font-semibold shadow-sm'
                  : 'bg-[#141418] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Semua Karya
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                mediaFilter === 'video'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-[#141418] text-zinc-400 hover:text-amber-300 border border-zinc-800'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>🎬 Video & Reels Potrait</span>
            </button>
            <button
              onClick={() => setMediaFilter('photo')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                mediaFilter === 'photo'
                  ? 'bg-[#C5A880] text-black font-semibold shadow-md shadow-[#C5A880]/20'
                  : 'bg-[#141418] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>📸 Galeri Foto</span>
            </button>
          </div>

          {/* Sub Filter: Category Pills */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-sm text-xs uppercase tracking-wider font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#C5A880]/20 border border-[#C5A880] text-[#E2D2BC] font-semibold'
                    : 'bg-transparent text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                Semua Kategori
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1 rounded-sm text-xs uppercase tracking-wider font-medium transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-[#C5A880]/20 border border-[#C5A880] text-[#E2D2BC] font-semibold'
                      : 'bg-transparent text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Slider Navigation Chevrons (when in slider mode) */}
            {viewMode === 'slider' && filteredProjects.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <button
                  onClick={() => scrollSlider('left')}
                  className="w-8 h-8 rounded-full bg-[#18181D] hover:bg-[#C5A880] text-zinc-400 hover:text-black border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Geser Kiri"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollSlider('right')}
                  className="w-8 h-8 rounded-full bg-[#18181D] hover:bg-[#C5A880] text-zinc-400 hover:text-black border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Geser Kanan"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Showcase Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[9/16] bg-zinc-900 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm bg-[#121215] border border-zinc-800/80 rounded-lg space-y-3">
            <p className="font-serif text-lg text-zinc-300">Belum ada karya untuk pilihan kategori atau format ini.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setMediaFilter('all');
              }}
              className="px-4 py-1.5 rounded-sm bg-[#18181D] border border-zinc-700 text-xs uppercase tracking-wider text-zinc-300 hover:text-white cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : viewMode === 'slider' ? (
          /* ========================================================
             SLIDER CAROUSEL MODE (Geser Kiri/Kanan dengan Snap)
             ======================================================== */
          <div className="relative group/slider">
            <div
              ref={sliderRef}
              className="flex items-stretch gap-5 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory scroll-smooth"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {filteredProjects.map((project, idx) => {
                const isVideo = project.media_type === 'video' || Boolean(project.featured_video_url && project.featured_video_url.trim());
                const isPortrait = project.orientation === 'portrait';
                const isHovered = hoveredVideoId === project.id;
                const isDirectVideo = isVideo && project.featured_video_url && (
                  project.featured_video_url.endsWith('.mp4') ||
                  project.featured_video_url.endsWith('.webm') ||
                  project.featured_video_url.includes('/uploads/') ||
                  isGoogleDriveUrl(project.featured_video_url)
                );

                return (
                  <div
                    key={project.id}
                    onClick={() => setActiveModalIndex(idx)}
                    onMouseEnter={() => setHoveredVideoId(project.id)}
                    onMouseLeave={() => setHoveredVideoId(null)}
                    className={`group relative flex flex-col bg-[#131316] border border-[#24242A] hover:border-[#C5A880]/60 rounded-xl overflow-hidden cursor-pointer snap-start shrink-0 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-[#C5A880]/5 ${
                      isPortrait
                        ? 'w-[260px] sm:w-[285px] md:w-[310px]'
                        : 'w-[300px] sm:w-[360px] md:w-[400px]'
                    }`}
                  >
                    {/* Media Card Container */}
                    <div className={`relative overflow-hidden bg-black ${
                      isPortrait ? 'aspect-[9/16]' : 'aspect-video'
                    }`}>
                      {/* Direct Video Auto-Preview on Hover */}
                      {isDirectVideo && isHovered ? (
                        <video
                          src={getDirectVideoUrl(project.featured_video_url)}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={normalizeMediaUrl(project.cover_image_url)}
                          alt={project.title}
                          loading="lazy"
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      )}

                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0D] via-black/20 to-transparent opacity-75 group-hover:opacity-85 transition-opacity" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                        {project.category_name ? (
                          <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-[#0C0C0D]/85 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 rounded-xs">
                            {project.category_name}
                          </span>
                        ) : <span />}

                        {isVideo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/90 text-black rounded-xs shadow">
                            <Film className="w-2.5 h-2.5" />
                            <span>{isPortrait ? '9:16' : '16:9'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/70 text-zinc-300 rounded-xs border border-zinc-700">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>Foto</span>
                          </span>
                        )}
                      </div>

                      {/* Center Play Button on Video Cards */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-13 h-13 rounded-full bg-[#C5A880] text-black flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300 ring-4 ring-[#C5A880]/30">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Eye Preview button for photo cards */}
                      {!isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-black/80 text-[#C5A880] flex items-center justify-center shadow-xl border border-[#C5A880]/40">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>
                      )}

                      {/* Bottom Quick Title on Media */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                        <h3 className="font-serif text-base sm:text-lg text-[#F8F6F0] group-hover:text-[#C5A880] transition-colors leading-snug line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-light">
                          {project.client_name || project.location || 'Dokumentasi Spesial'}
                        </p>
                      </div>
                    </div>

                    {/* Card Meta Footer */}
                    <div className="p-3 bg-[#131316] flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {isVideo ? 'Klik untuk Tonton' : 'Klik untuk Lihat Foto'}
                      </span>
                      <span className="text-[#C5A880] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-semibold text-[10px]">
                        <span>Buka</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-center text-[11px] text-zinc-500 mt-2 sm:hidden">
              ← Geser ke samping untuk melihat karya lain →
            </p>
          </div>
        ) : (
          /* ========================================================
             GRID MODE (Kisi Multi-Kolom Klasik)
             ======================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project, idx) => {
              const isVideo = project.media_type === 'video' || Boolean(project.featured_video_url && project.featured_video_url.trim());
              const isPortrait = project.orientation === 'portrait';

              return (
                <div
                  key={project.id}
                  onClick={() => setActiveModalIndex(idx)}
                  className="group relative flex flex-col bg-[#131316] border border-[#24242A] hover:border-[#C5A880]/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  <div className={`relative overflow-hidden bg-black ${
                    isPortrait ? 'aspect-[9/16]' : 'aspect-[4/5]'
                  }`}>
                    <img
                      src={normalizeMediaUrl(project.cover_image_url)}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0D] via-transparent to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                      {project.category_name && (
                        <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-[#0C0C0D]/85 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 rounded-xs">
                          {project.category_name}
                        </span>
                      )}

                      {isVideo && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-black rounded-xs shadow">
                          <Film className="w-2.5 h-2.5" />
                          <span>{isPortrait ? 'Reels 9:16' : '16:9'}</span>
                        </span>
                      )}
                    </div>

                    {/* Center Action */}
                    {isVideo ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-[#C5A880] text-black flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform ring-4 ring-[#C5A880]/30">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="w-11 h-11 rounded-full bg-black/80 text-[#C5A880] flex items-center justify-center shadow-xl border border-[#C5A880]/40">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-serif text-lg text-[#F8F6F0] group-hover:text-[#C5A880] transition-colors leading-snug">
                        {project.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed font-light">
                        {project.short_description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{project.location || 'Surabaya'}</span>
                      <span className="text-[#C5A880] font-semibold text-[10px]">Tonton / Lihat →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox / In-Place Modal Pop-up with Sliding Support */}
      {activeModalIndex !== null && (
        <PortfolioLightboxModal
          projects={filteredProjects}
          currentIndex={activeModalIndex}
          isOpen={activeModalIndex !== null}
          onClose={() => setActiveModalIndex(null)}
          onNavigate={(newIdx) => setActiveModalIndex(newIdx)}
        />
      )}
    </section>
  );
};
