import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { Search, Eye, Play, ArrowUpRight, X } from 'lucide-react';
import { PortfolioProject, PortfolioCategory } from '../../types';
import { api } from '../../lib/api';
import { getVideoEmbedUrl, normalizeMediaUrl } from '../../lib/mediaUtils';

export const PortfolioPage: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Banner */}
          <div className="max-w-3xl mb-12 space-y-4">
            <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
              Arsip Karya AFFRAME
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl text-[#F8F6F0] font-light leading-tight">
              Portofolio & Visual Storytelling
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light font-sans">
              Koleksi dokumentasi fotografi dan sinematografi untuk berbagai perayaan, wisuda, korporasi, dan konten kreatif di Jawa Timur.
            </p>
          </div>

          {/* Controls: Category Filter + Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-800">
            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
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
                  className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
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
            <div className="relative w-full md:w-72">
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

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] bg-zinc-900 animate-pulse rounded-sm" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <p className="font-serif text-2xl text-zinc-400">Tidak ada proyek yang sesuai dengan kriteria.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-sm bg-[#18181D] border border-zinc-700 text-xs uppercase tracking-wider text-zinc-300 hover:text-white"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="group relative flex flex-col bg-[#131316] border border-[#24242A] overflow-hidden rounded-sm hover:border-[#C5A880]/50 transition-all duration-300"
                >
                  {/* Image Cover Container */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-black">
                    <img
                      src={normalizeMediaUrl(project.cover_image_url)}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Dark gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0D] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Category Pill */}
                    {project.category_name && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold bg-[#0C0C0D]/85 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 rounded-sm">
                          {project.category_name}
                        </span>
                      </div>
                    )}

                    {/* Prominent Video Play Badge */}
                    {project.featured_video_url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoUrl(project.featured_video_url);
                        }}
                        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
                        title="Tonton Video"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Putar Video</span>
                      </button>
                    )}

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-xs">
                      <button
                        onClick={() => setLightboxImage(project.cover_image_url)}
                        className="w-10 h-10 rounded-full bg-[#0C0C0D]/90 text-white hover:text-[#C5A880] flex items-center justify-center transition-transform hover:scale-110"
                        title="Lihat Pratinjau Foto"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {project.featured_video_url && (
                        <button
                          onClick={() => setActiveVideoUrl(project.featured_video_url)}
                          className="w-10 h-10 rounded-full bg-[#C5A880] text-[#0C0C0D] flex items-center justify-center transition-transform hover:scale-110 font-bold"
                          title="Tonton Video"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                      )}
                      <Link
                        to={`/portfolio/${project.slug}`}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transition-transform hover:scale-110"
                        title="Halaman Detail Proyek"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Meta details */}
                  <div className="p-5 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-serif text-xl text-[#F8F6F0] group-hover:text-[#C5A880] transition-colors leading-snug">
                        <Link to={`/portfolio/${project.slug}`}>
                          {project.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                        {project.short_description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{project.location || 'Surabaya / Lamongan'}</span>
                      <span>{project.project_date ? new Date(project.project_date).getFullYear() : '2026'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 text-zinc-400 hover:text-white p-2"
          >
            <X className="w-7 h-7" />
          </button>
          <img
            src={normalizeMediaUrl(lightboxImage)}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-sm"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Video Modal */}
      {activeVideoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setActiveVideoUrl(null)}
        >
          <button
            onClick={() => setActiveVideoUrl(null)}
            className="absolute top-6 right-6 text-zinc-400 hover:text-white p-2"
          >
            <X className="w-7 h-7" />
          </button>
          <div
            className="w-full max-w-4xl aspect-video bg-black rounded overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {getVideoEmbedUrl(activeVideoUrl) ? (
              <iframe
                src={getVideoEmbedUrl(activeVideoUrl)!}
                title="AFFRAME Video Player"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video src={activeVideoUrl} controls autoPlay playsInline className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
