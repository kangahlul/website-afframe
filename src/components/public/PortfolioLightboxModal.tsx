import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Film, Image as ImageIcon, MessageCircle, ExternalLink, Play } from 'lucide-react';
import { PortfolioProject, PortfolioVideo } from '../../types';
import {
  getVideoEmbedUrl,
  normalizeMediaUrl,
  getDirectVideoUrl,
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
} from '../../lib/mediaUtils';

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
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);
  const [activeMediaMode, setActiveMediaMode] = useState<'video' | 'photo'>('video');
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = projects.length;
  const project = projects[currentIndex];

  // Reset indices and determine default view mode when project changes
  useEffect(() => {
    setSelectedPhotoIndex(0);
    setSelectedVideoIndex(0);
    setVideoLoadFailed(false);
    if (!project) return;
    if (project.media_type === 'photo') {
      setActiveMediaMode('photo');
    } else if (project.media_type === 'video') {
      setActiveMediaMode('video');
    } else {
      setActiveMediaMode(project.featured_video_url ? 'video' : 'photo');
    }
  }, [currentIndex, project]);

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

  // Prevent background scroll
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

  // Determine all available videos for this project
  const projectVideos: PortfolioVideo[] = (project.videos && project.videos.length > 0)
    ? project.videos
    : project.featured_video_url
      ? [{ title: 'Video Utama', video_url: project.featured_video_url, orientation: project.orientation || 'portrait' }]
      : [];

  // All photos for photo viewer
  const allImages = [
    project.cover_image_url,
    ...(project.images ? project.images.map(img => img.image_url) : [])
  ].filter(Boolean);

  const hasVideos = projectVideos.length > 0;
  const hasPhotos = allImages.length > 0;
  const isVideoMode = (activeMediaMode === 'video' && hasVideos) || (!hasPhotos && hasVideos);

  // Active video
  const activeVideo: PortfolioVideo | undefined = projectVideos[selectedVideoIndex] || projectVideos[0];
  const activeVideoUrl = activeVideo?.video_url || '';
  const isPortrait = (activeVideo?.orientation || project.orientation || 'portrait') === 'portrait';
  const isDriveVideo = isGoogleDriveUrl(activeVideoUrl);
  const directVideoUrl = getDirectVideoUrl(activeVideoUrl);
  const embedUrl = !isDriveVideo ? getVideoEmbedUrl(activeVideoUrl) : null;
  const driveFallbackUrl = isDriveVideo ? getGoogleDrivePreviewUrl(activeVideoUrl) : null;

  useEffect(() => {
    setVideoLoadFailed(false);
  }, [selectedVideoIndex, activeVideoUrl]);

  const currentPhotoUrl = allImages[selectedPhotoIndex] || project.cover_image_url;

  const waConsultMessage = encodeURIComponent(
    `Halo AFFRAME, saya sangat tertarik melihat karya dokumentasi "${project.title}". Boleh konsultasi paket dokumentasi & ketersediaan jadwal serupa?`
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between h-[100dvh] w-full overflow-hidden select-none"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between px-3 sm:px-6 pt-3.5 pb-2.5 sm:py-3.5 z-30 bg-black/90 sm:bg-gradient-to-b sm:from-black sm:via-black/80 sm:to-transparent border-b border-zinc-800/40 sm:border-b-0 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Index Counter */}
          <span className="px-2 py-0.5 rounded-full bg-[#18181C] border border-zinc-800 text-[10px] sm:text-[11px] font-mono text-zinc-300 shrink-0">
            {currentIndex + 1} / {total}
          </span>

          {/* Category Pill */}
          {project.category_name && (
            <span className="px-2 py-0.5 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E2D2BC] text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold truncate max-w-[120px] sm:max-w-none">
              {project.category_name}
            </span>
          )}

          {/* Switcher if project has both videos and photos */}
          {hasVideos && hasPhotos && (
            <div className="flex items-center gap-1 bg-black/80 p-0.5 rounded-full border border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveMediaMode('video')}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                  isVideoMode
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-2.5 h-2.5" />
                <span>Video ({projectVideos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaMode('photo')}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                  !isVideoMode
                    ? 'bg-[#C5A880] text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-2.5 h-2.5" />
                <span>Foto ({allImages.length})</span>
              </button>
            </div>
          )}

          {/* Media Format Badge (if only 1 media type) */}
          {(!hasVideos || !hasPhotos) && (
            isVideoMode ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[9px] sm:text-[10px] font-semibold shrink-0">
                <Film className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{isPortrait ? 'Reels 9:16' : 'Sinematik 16:9'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] sm:text-[10px] font-semibold shrink-0">
                <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Foto ({allImages.length})</span>
              </span>
            )
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors border border-zinc-800 cursor-pointer shrink-0 ml-2"
          title="Tutup (Esc)"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Multi-Video Selector Tabs (if project has more than 1 video) */}
      {isVideoMode && projectVideos.length > 1 && (
        <div
          className="w-full px-3 sm:px-6 py-1.5 z-25 bg-black/60 flex items-center justify-center gap-1.5 overflow-x-auto scrollbar-none shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-[10px] text-zinc-400 font-semibold mr-1 shrink-0">Pilih Video:</span>
          {projectVideos.map((vid, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedVideoIndex(idx)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedVideoIndex === idx
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/30'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{vid.title || `Video ${idx + 1}`}</span>
              <span className="text-[9px] opacity-75">
                ({vid.orientation === 'portrait' ? '9:16' : '16:9'})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Showcase Stage (Responsive Bounded Height for Mobile & Desktop) */}
      <div
        className="relative flex-grow flex items-center justify-center px-2 sm:px-14 py-1 sm:py-2 min-h-0 w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Desktop Prev Button */}
        {total > 1 && (
          <button
            onClick={handlePrev}
            className="hidden sm:flex absolute left-3 md:left-6 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/70 hover:bg-[#C5A880] text-zinc-300 hover:text-black border border-zinc-700/80 hover:border-[#C5A880] items-center justify-center transition-all shadow-xl cursor-pointer hover:scale-105"
            title="Karya Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {/* Media Player Container */}
        <div className="w-full h-full flex items-center justify-center min-h-0">
          {isVideoMode && activeVideoUrl ? (
            isPortrait ? (
              /* ========================================================
                 PORTRAIT 9:16 REELS CONTAINER (Mobile & Desktop Fit)
                 Tinggi Adaptif Otomatis (100dvh) & Video Tampak Penuh
                 ======================================================== */
              <div
                className="relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#C5A880]/50 shadow-2xl shadow-[#C5A880]/10 flex items-center justify-center max-w-[90vw] mx-auto select-none"
                style={{
                  height: (isVideoMode && projectVideos.length > 1) ? 'calc(100dvh - 200px)' : 'calc(100dvh - 160px)',
                  maxHeight: '680px',
                  aspectRatio: '9/16',
                }}
              >
                {/* Smartphone Speaker Accent */}
                <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-14 sm:w-16 h-1 bg-zinc-700/60 rounded-full z-20 pointer-events-none" />

                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={activeVideo?.title || project.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : !videoLoadFailed ? (
                  <video
                    key={directVideoUrl}
                    src={directVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    loop
                    onError={() => setVideoLoadFailed(true)}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center center' }}
                  >
                    <source src={directVideoUrl} type="video/mp4" />
                    <source src={directVideoUrl} />
                  </video>
                ) : (
                  <iframe
                    src={driveFallbackUrl || activeVideoUrl}
                    title={activeVideo?.title || project.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            ) : (
              /* ========================================================
                 LANDSCAPE 16:9 CINEMATIC CONTAINER
                 ======================================================== */
              <div
                className="relative w-full max-w-4xl lg:max-w-5xl aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center mx-auto"
                style={{
                  maxHeight: (isVideoMode && projectVideos.length > 1)
                    ? 'calc(100dvh - 200px)'
                    : 'calc(100dvh - 160px)',
                }}
              >
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={activeVideo?.title || project.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : !videoLoadFailed ? (
                  <video
                    key={directVideoUrl}
                    src={directVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    onError={() => setVideoLoadFailed(true)}
                    className="w-full h-full object-contain"
                    style={{ objectPosition: 'center center' }}
                  >
                    <source src={directVideoUrl} type="video/mp4" />
                    <source src={directVideoUrl} />
                  </video>
                ) : (
                  <iframe
                    src={driveFallbackUrl || activeVideoUrl}
                    title={activeVideo?.title || project.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            )
          ) : (
            /* ========================================================
               PHOTO GALLERY VIEWER
               ======================================================== */
            <div className="flex flex-col items-center justify-center h-full max-w-5xl w-full min-h-0">
              <div
                className="relative flex items-center justify-center min-h-0"
                style={{ height: allImages.length > 1 ? 'calc(100dvh - 210px)' : 'calc(100dvh - 160px)' }}
              >
                <img
                  src={normalizeMediaUrl(currentPhotoUrl)}
                  alt={project.title}
                  className="max-h-full max-w-full object-contain rounded-lg border border-zinc-800 shadow-2xl"
                />
              </div>

              {/* Multi-Photo Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto max-w-full px-2 py-1 scrollbar-none shrink-0">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded overflow-hidden border transition-all shrink-0 cursor-pointer ${
                        selectedPhotoIndex === idx
                          ? 'border-[#C5A880] ring-2 ring-[#C5A880]/50 scale-105'
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

        {/* Desktop Next Button */}
        {total > 1 && (
          <button
            onClick={handleNext}
            className="hidden sm:flex absolute right-3 md:right-6 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/70 hover:bg-[#C5A880] text-zinc-300 hover:text-black border border-zinc-700/80 hover:border-[#C5A880] items-center justify-center transition-all shadow-xl cursor-pointer hover:scale-105"
            title="Karya Berikutnya"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
      </div>

      {/* Bottom Info Bar & Navigation Controls */}
      <div
        className="w-full px-3 sm:px-6 py-2.5 sm:py-3 z-30 bg-gradient-to-t from-black via-black/95 to-black/80 border-t border-zinc-900 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Mobile Prev / Next Navigation Controls Bar */}
          {total > 1 && (
            <div className="flex sm:hidden items-center justify-between w-full pb-1 border-b border-zinc-800/60">
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[11px] font-medium border border-zinc-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              <span className="text-[10px] text-zinc-500 font-mono">
                Geser untuk karya lain ({currentIndex + 1}/{total})
              </span>

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#C5A880] hover:bg-[#B39366] text-black rounded text-[11px] font-semibold"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Project Title & Short Description */}
          <div className="min-w-0 space-y-0.5">
            <h3 className="font-serif text-sm sm:text-lg text-[#F8F6F0] font-medium truncate">
              {project.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate font-light">
              {project.short_description || project.location || 'Surabaya / Lamongan / Gresik'}
            </p>
          </div>

          {/* Direct Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* WhatsApp Consultation */}
            <a
              href={`https://wa.me/6285755152579?text=${waConsultMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-[11px] font-semibold transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Tanya Konsep Serupa</span>
            </a>

            {/* Read full story */}
            <Link
              to={`/portfolio/${project.slug}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xs bg-[#18181D] hover:bg-[#C5A880] text-zinc-200 hover:text-black border border-zinc-700 hover:border-[#C5A880] text-[11px] font-semibold transition-colors"
            >
              <span>Detail</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
