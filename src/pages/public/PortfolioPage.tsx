import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { Search, Eye, Play, ArrowUpRight, X, Film, Image as ImageIcon } from 'lucide-react';
import { PortfolioProject, PortfolioCategory } from '../../types';
import { api } from '../../lib/api';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

// Lazy load lightbox — hanya didownload saat user klik karya (bukan saat halaman load)
const PortfolioLightboxModal = lazy(() =>
  import('../../components/public/PortfolioLightboxModal').then(m => ({ default: m.PortfolioLightboxModal }))
);

export const PortfolioPage: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Lightbox
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projRes, catRes] = await Promise.all([
          api.get<{ projects: PortfolioProject[] }>('/portfolio/projects', {
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: searchQuery || undefined,
            all: false
          }),
          api.get<{ categories: PortfolioCategory[] }>('/portfolio/categories')
        ]);
        setProjects(projRes.projects || []);
        setCategories(catRes.categories || []);
      } catch (err) {
        console.error('Failed to load portfolio items:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadData();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  // Filter projects by Media Type
  const filteredProjects = projects.filter(p => {
    const isVideo = p.media_type === 'video' || Boolean(p.featured_video_url && p.featured_video_url.trim());
    if (mediaFilter === 'video') return isVideo;
    if (mediaFilter === 'photo') return !isVideo;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Banner */}
          <div className="max-w-3xl mb-12 space-y-4">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
                Arsip Karya AFFRAME
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl text-[#F8F6F0] font-light leading-tight">
              Portofolio & Visual Storytelling
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light font-sans">
              Koleksi dokumentasi fotografi resolusi tinggi, wedding reels 9:16 untuk media sosial, dan sinematik teaser eksklusif di Surabaya, Gresik, Lamongan, dan sekitarnya.
            </p>
          </div>

          {/* Controls: Media Format Filter + Category Filter + Search */}
          <div className="space-y-4 pb-8 border-b border-zinc-800">
            {/* Media Format Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setMediaFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  mediaFilter === 'all'
                    ? 'bg-zinc-200 text-black font-semibold shadow-sm'
                    : 'bg-[#141418] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Semua Format
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
                <span>🎬 Video & Reels (Portrait / Landscape)</span>
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

            {/* Category tabs & Search input */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-sm text-xs uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#C5A880] text-[#0C0C0D] shadow-md shadow-[#C5A880]/20'
                      : 'bg-[#16161A] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-3 py-1 rounded-sm text-xs uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat.slug
                        ? 'bg-[#C5A880] text-[#0C0C0D] shadow-md shadow-[#C5A880]/20'
                        : 'bg-[#16161A] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari karya, klien, lokasi..."
                  className="w-full pl-9 pr-4 py-2 bg-[#16161A] border border-[#26262B] rounded-sm text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-10">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="aspect-[9/16] bg-zinc-900 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <p className="font-serif text-2xl text-zinc-400">Tidak ada karya yang sesuai dengan kriteria filter.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setMediaFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-sm bg-[#18181D] border border-zinc-700 text-xs uppercase tracking-wider text-zinc-300 hover:text-white cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-10">
              {filteredProjects.map((project, idx) => {
                const isVideo = project.media_type === 'video' || Boolean(project.featured_video_url && project.featured_video_url.trim());
                const isPortrait = project.orientation === 'portrait';

                return (
                  <div
                    key={project.id}
                    onClick={() => setActiveModalIndex(idx)}
                    className="group relative flex flex-col bg-[#131316] border border-[#24242A] hover:border-[#C5A880]/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-[#C5A880]/5"
                  >
                    {/* Media Container */}
                    <div className={`relative overflow-hidden bg-black ${
                      isPortrait ? 'aspect-[9/16]' : 'aspect-[4/5]'
                    }`}>
                      <img
                        src={normalizeMediaUrl(project.cover_image_url)}
                        alt={project.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Dark gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0D] via-black/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                        {project.category_name ? (
                          <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-[#0C0C0D]/85 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 rounded-xs">
                            {project.category_name}
                          </span>
                        ) : <span />}

                        {isVideo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-black rounded-xs shadow">
                            <Film className="w-2.5 h-2.5" />
                            <span>{isPortrait ? '9:16 Reels' : '16:9'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/70 text-zinc-300 rounded-xs border border-zinc-700">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>Foto</span>
                          </span>
                        )}
                      </div>

                      {/* Center Play Button for Video */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-[#C5A880] text-black flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300 ring-4 ring-[#C5A880]/30">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Eye Icon for Photo */}
                      {!isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="w-11 h-11 rounded-full bg-black/80 text-[#C5A880] flex items-center justify-center shadow-xl border border-[#C5A880]/40">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      {/* Bottom Title on Media */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                        <h3 className="font-serif text-base sm:text-lg text-[#F8F6F0] group-hover:text-[#C5A880] transition-colors leading-snug line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-light">
                          {project.client_name || project.location || 'Dokumentasi Spesial'}
                        </p>
                      </div>
                    </div>

                    {/* Meta details footer */}
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
          )}

        </div>
      </main>

      {/* Lightbox — lazy loaded, hanya muncul saat diklik */}
      {activeModalIndex !== null && (
        <Suspense fallback={null}>
          <PortfolioLightboxModal
            projects={filteredProjects}
            currentIndex={activeModalIndex}
            isOpen={activeModalIndex !== null}
            onClose={() => setActiveModalIndex(null)}
            onNavigate={(newIdx) => setActiveModalIndex(newIdx)}
          />
        </Suspense>
      )}

      <Footer />
    </div>
  );
};
