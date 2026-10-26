import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PortfolioProject, PortfolioCategory, WebsiteSection } from '../../types';
import { api } from '../../lib/api';

interface SelectedWorksSectionProps {
  section?: WebsiteSection;
}

export const SelectedWorksSection: React.FC<SelectedWorksSectionProps> = ({ section }) => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, catRes] = await Promise.all([
          api.get<{ projects: PortfolioProject[] }>('/portfolio/projects', { limit: 6, all: false }),
          api.get<{ categories: PortfolioCategory[] }>('/portfolio/categories'),
        ]);
        setProjects(projRes.projects || []);
        setCategories(catRes.categories || []);
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (section && !section.is_visible) return null;

  const filteredProjects =
    selectedCategory === 'all'
      ? projects
      : projects.filter(
          p => p.category_slug === selectedCategory || String(p.category_id) === selectedCategory
        );

  return (
    <section id="portfolio" className="pt-14 pb-20 bg-[#0C0C0D] relative border-t border-[#24242A]/60 scroll-mt-14">
      <div id="selected_works" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
              {section?.subtitle || 'Selected Works'}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light">
              {section?.title || 'Momen yang Dipercayakan'}
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl">
              {section?.description ||
                'Dokumentasi visual pilihan yang menggambarkan kehangatan perayaan, keanggunan wisuda, kesakralan pernikahan, dan profesionalitas korporasi.'}
            </p>
          </div>

          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A880] hover:text-[#E2D2BC] transition-colors group font-semibold self-start md:self-auto"
          >
            <span>Lihat Semua Karya</span>
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#C5A880] text-[#0C0C0D] shadow-md shadow-[#C5A880]/20'
                : 'bg-[#18181C] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Semua Karya
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium transition-all shrink-0 ${
                selectedCategory === cat.slug
                  ? 'bg-[#C5A880] text-[#0C0C0D] shadow-md shadow-[#C5A880]/20'
                  : 'bg-[#18181C] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[4/5] bg-zinc-900 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            Belum ada proyek portofolio dalam kategori ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, idx) => (
              <div
                key={project.id}
                className="group relative flex flex-col bg-[#131316] border border-[#24242A] overflow-hidden rounded-sm hover:border-[#C5A880]/50 transition-all duration-300"
              >
                {/* Image Cover Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-black">
                  <img
                    src={project.cover_image_url}
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Dark gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0D] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Category Pill */}
                  {project.category_name && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold bg-[#0C0C0D]/80 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 rounded-sm">
                        {project.category_name}
                      </span>
                    </div>
                  )}

                  {/* Quick Action Overlay (Lightbox & Detail) */}
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
            src={lightboxImage}
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
            {activeVideoUrl.includes('youtube') || activeVideoUrl.includes('youtu.be') ? (
              <iframe
                src={
                  activeVideoUrl.includes('embed')
                    ? activeVideoUrl
                    : `https://www.youtube.com/embed/${activeVideoUrl.split('v=')[1] || activeVideoUrl.split('/').pop()}`
                }
                title="AF Frame Video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={activeVideoUrl} controls autoPlay className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}
    </section>
  );
};
