import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Play, Film, Image as ImageIcon, MessageCircle, ExternalLink } from 'lucide-react';
import { PortfolioProject } from '../../types';
import { getVideoEmbedUrl, normalizeMediaUrl } from '../../lib/mediaUtils';

interface PortfolioLightboxModalProps {
  projects: PortfolioProject[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const PortfolioLightboxModal: React.FC<PortfolioLightboxModalProps> = ({
  projects,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);

  const total = projects.length;
  const project = projects[currentIndex];

  // Reset selected photo when project changes
  useEffect(() => {
    setSelectedPhotoIndex(0);
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    onNavigate((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onNavigate]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    onNavigate((currentIndex + 1) % total);
  }, [currentIndex, total, onNavigate]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartX.current = null;
  };

  if (!isOpen || !project) return null;

  const isVideo = project.media_type === 'video' || Boolean(project.featured_video_url && project.featured_video_url.trim());
  const isPortrait = project.orientation === 'portrait';
  const embedUrl = isVideo && project.featured_video_url ? getVideoEmbedUrl(project.featured_video_url) : null;

  // Active photo for photo galleries
  const allImages = [
    project.cover_image_url,
    ...(project.images ? project.images.map(img => img.image_url) : [])
  ].filter(Boolean);
  const currentPhotoUrl = allImages[selectedPhotoIndex] || project.cover_image_url;

  const waConsultMessage = encodeURIComponent(
    `Halo AFFRAME, saya sangat tertarik melihat karya dokumentasi "${project.title}". Boleh konsultasi paket dokumentasi & ketersediaan jadwal serupa?`
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-8 py-4 z-20 bg-gradient-to-b from-black/80 to-transparent"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Index Counter */}
          <span className="px-2.5 py-1 rounded-full bg-[#18181C] border border-zinc-800 text-[11px] font-mono text-zinc-300">
            {currentIndex + 1} / {total}
          </span>

          {/* Category Pill */}
          {project.category_name && (
            <span className="px-2.5 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E2D2BC] text-[10px] uppercase tracking-wider font-semibold">
              {project.category_name}
            </span>
          )}

          {/* Media Format Badge */}
          {isVideo ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-semibold">
              <Film className="w-3 h-3" />
              <span>{isPortrait ? 'Reels 9:16 (Portrait)' : 'Sinematik 16:9'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-semibold">
              <ImageIcon className="w-3 h-3" />
              <span>Galeri Foto</span>
            </span>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-zinc-800 cursor-pointer"
          title="Tutup (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Showcase Stage */}
      <div
        className="relative flex-grow flex items-center justify-center px-4 sm:px-16 py-2 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Navigation Arrow: Previous */}
        {total > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-[#C5A880] text-zinc-300 hover:text-black border border-zinc-700/80 hover:border-[#C5A880] flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer hover:scale-105"
            title="Karya Sebelumnya (Panah Kiri)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Media Container */}
        <div className="w-full flex items-center justify-center">
          {isVideo ? (
            isPortrait ? (
              /* Portrait 9:16 Smartphone / Reels Container */
              <div className="relative w-[300px] sm:w-[350px] md:w-[380px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border-2 border-[#C5A880]/50 shadow-2xl shadow-[#C5A880]/10 flex items-center justify-center">
                {/* Smartphone Speaker / Notch Accent */}
                <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-zinc-700/60 rounded-full z-20 pointer-events-none" />

                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={project.title}
                    className="w-full h-full object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={project.featured_video_url}
                    controls
                    autoPlay
                    playsInline
                    loop
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ) : (
              /* Landscape 16:9 Cinematic Player */
              <div className="relative w-full max-w-4xl lg:max-w-5xl aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={project.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={project.featured_video_url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )
          ) : (
            /* Photo Viewer with Multiple Gallery Support */
            <div className="flex flex-col items-center max-w-5xl w-full">
              <div className="relative max-h-[68vh] flex items-center justify-center">
                <img
                  src={normalizeMediaUrl(currentPhotoUrl)}
                  alt={project.title}
                  className="max-h-[68vh] max-w-full object-contain rounded-lg border border-zinc-800 shadow-2xl"
                />
              </div>

              {/* Multi-Photo Thumbnail Bar */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full px-2 py-1 scrollbar-none">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`w-12 h-12 rounded overflow-hidden border transition-all shrink-0 cursor-pointer ${
                        selectedPhotoIndex === idx
                          ? 'border-[#C5A880] ring-2 ring-[#C5A880]/40 scale-105'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={normalizeMediaUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Arrow: Next */}
        {total > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-[#C5A880] text-zinc-300 hover:text-black border border-zinc-700/80 hover:border-[#C5A880] flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer hover:scale-105"
            title="Karya Berikutnya (Panah Kanan)"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      {/* Bottom Info & Action Bar */}
      <div
        className="w-full px-4 sm:px-8 py-4 z-20 bg-gradient-to-t from-black via-black/90 to-transparent border-t border-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h3 className="font-serif text-lg sm:text-2xl text-[#F8F6F0] font-medium truncate">
              {project.title}
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-1 max-w-2xl font-light">
              {project.short_description || project.location || 'Surabaya / Lamongan / Gresik'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Direct WhatsApp Consultation */}
            <a
              href={`https://wa.me/6285755152579?text=${waConsultMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Tanya Konsep Serupa</span>
            </a>

            {/* Read full story page */}
            <Link
              to={`/portfolio/${project.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#18181D] hover:bg-[#C5A880] text-zinc-200 hover:text-black border border-zinc-700 hover:border-[#C5A880] text-xs font-semibold transition-colors"
            >
              <span>Cerita Lengkap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
