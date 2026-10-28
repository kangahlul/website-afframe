import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { ArrowLeft, Calendar, MapPin, User, Eye, Play, ArrowUpRight, X } from 'lucide-react';
import { PortfolioProject } from '../../types';
import { api } from '../../lib/api';
import {
  getVideoEmbedUrl,
  normalizeMediaUrl,
  getDirectVideoUrl,
  isGoogleDriveUrl,
  getGoogleDrivePreviewUrl,
} from '../../lib/mediaUtils';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<PortfolioProject | null>(null);
  const [related, setRelated] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ project: PortfolioProject; related: PortfolioProject[] }>(`/portfolio/projects/${slug}`);
        setProject(res.project);
        setRelated(res.related || []);
        window.scrollTo(0, 0);
      } catch (err: any) {
        setError(err.message || 'Proyek portofolio tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProject();
    }
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 pb-24">
        {loading ? (
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="h-8 w-32 bg-zinc-900 animate-pulse mb-6" />
            <div className="h-14 w-3/4 bg-zinc-900 animate-pulse mb-8" />
            <div className="aspect-[16/9] bg-zinc-900 animate-pulse rounded-sm" />
          </div>
        ) : error || !project ? (
          <div className="max-w-2xl mx-auto px-4 py-32 text-center space-y-4">
            <h1 className="font-serif text-3xl text-zinc-300">Proyek Tidak Ditemukan</h1>
            <p className="text-sm text-zinc-500">Proyek yang Anda cari mungkin telah diubah atau dihapus.</p>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#C5A880] text-[#0C0C0D] text-xs uppercase tracking-wider font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Portofolio</span>
            </Link>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Back link */}
            <div className="mb-8">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 hover:text-[#C5A880] transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Portofolio</span>
              </Link>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-4 mb-8">
              {project.category_name && (
                <span className="inline-block px-3 py-1 text-xs uppercase tracking-widest font-semibold bg-[#1C1C22] text-[#C5A880] border border-[#C5A880]/30 rounded-sm">
                  {project.category_name}
                </span>
              )}

              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#F8F6F0] font-light leading-tight">
                {project.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-2 text-xs text-zinc-400 border-b border-zinc-800 pb-6">
                {project.client_name && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Klien: {project.client_name}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Lokasi: {project.location}</span>
                  </div>
                )}
                {project.project_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Tanggal: {project.project_date}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Image */}
            <div className="aspect-[16/10] sm:aspect-[16/9] w-full rounded-sm overflow-hidden bg-black mb-12 border border-[#24242A] shadow-2xl">
              <img
                src={normalizeMediaUrl(project.cover_image_url)}
                alt={project.title}
                className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-500"
                onClick={() => setLightboxImage(project.cover_image_url)}
              />
            </div>

            {/* Narrative / Description */}
            <div className="max-w-3xl mx-auto space-y-6 mb-16">
              <h2 className="font-serif text-2xl text-[#F8F6F0] border-l-2 border-[#C5A880] pl-4">
                Narasi & Konsep Visual
              </h2>
              <p className="text-base sm:text-lg text-zinc-300 font-light leading-relaxed font-sans whitespace-pre-line">
                {project.full_description || project.short_description}
              </p>
            </div>

            {/* Video Showcase (Supports Multiple Videos per Event) */}
            {((project.videos && project.videos.length > 0) || project.featured_video_url) && (
              <div className="mb-16 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                  <h3 className="font-serif text-2xl text-[#F8F6F0]">
                    Video Dokumentasi & Sinematik Acara
                  </h3>
                </div>

                <div className="space-y-8">
                  {((project.videos && project.videos.length > 0)
                    ? project.videos
                    : [{ title: 'Video Utama', video_url: project.featured_video_url, orientation: project.orientation || 'portrait' }]
                  ).map((vid, idx) => {
                    const isPortrait = vid.orientation === 'portrait';
                    const isDrive = isGoogleDriveUrl(vid.video_url);
                    const embedUrl = isDrive ? null : getVideoEmbedUrl(vid.video_url);
                    const directUrl = getDirectVideoUrl(vid.video_url);
                    return (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {isPortrait ? 'Reels 9:16' : 'Sinematik 16:9'}
                          </span>
                          <h4 className="font-medium text-white text-sm">
                            {vid.title || `Video ${idx + 1}`}
                          </h4>
                        </div>

                        <div className={`rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-2xl relative flex items-center justify-center ${
                          isPortrait
                            ? 'w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] mx-auto border-2 border-[#C5A880]/40'
                            : 'w-full max-w-4xl mx-auto aspect-video'
                        }`}>
                          {isDrive ? (
                            <iframe
                              src={getGoogleDrivePreviewUrl(vid.video_url)!}
                              title={vid.title || project.title}
                              className="border-0 pointer-events-auto"
                              style={isPortrait ? {
                                position: 'absolute',
                                top: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                height: '100%',
                                width: 'calc(100% * 256 / 81)',
                                maxWidth: 'none',
                              } : {
                                width: '100%',
                                height: '100%',
                              }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={vid.title || project.title}
                              className={`w-full h-full ${isPortrait ? 'object-cover' : 'object-contain'} border-0`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={directUrl}
                              controls
                              playsInline
                              loop
                              className={`w-full h-full ${isPortrait ? 'object-cover' : 'object-contain'}`}
                              style={{ objectPosition: 'center center' }}
                            >
                              <source src={directUrl} type="video/mp4" />
                              <source src={directUrl} />
                            </video>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gallery Images Grid */}
            {project.images && project.images.length > 0 && (
              <div className="space-y-6 mb-20">
                <h3 className="font-serif text-2xl sm:text-3xl text-[#F8F6F0]">
                  Galeri Foto Dokumentasi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {project.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-sm bg-black border border-zinc-800 group cursor-pointer"
                      onClick={() => setLightboxImage(img.image_url)}
                    >
                      <img
                        src={normalizeMediaUrl(img.image_url)}
                        alt={img.alt_text || project.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-6 h-6 text-[#C5A880]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="p-8 bg-[#131316] border border-[#24242A] rounded-sm text-center space-y-4 mb-20">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#F8F6F0]">
                Tertarik Mengabadikan Momen Anda Bersama AFFRAME?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
                Diskusikan konsep visual, tanggal pelaksanaan, dan pilihan paket terbaik sesuai ekspektasi Anda.
              </p>
              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] px-6 py-3 rounded-sm text-xs uppercase tracking-widest font-semibold transition-all"
                >
                  <span>Reservasi Sekarang</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Related Projects */}
            {related.length > 0 && (
              <div className="space-y-6 pt-12 border-t border-zinc-800">
                <h3 className="font-serif text-2xl text-[#F8F6F0]">Karya Serupa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map(rel => (
                    <Link
                      key={rel.id}
                      to={`/portfolio/${rel.slug}`}
                      className="group block bg-[#131316] border border-zinc-800 rounded-sm overflow-hidden hover:border-[#C5A880]/50 transition-all"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-black">
                        <img
                          src={normalizeMediaUrl(rel.cover_image_url)}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold block mb-1">
                          {rel.category_name}
                        </span>
                        <h4 className="font-serif text-base text-[#F8F6F0] group-hover:text-[#C5A880] transition-colors line-clamp-1">
                          {rel.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
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

      <Footer />
    </div>
  );
};
