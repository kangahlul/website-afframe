import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ArrowUpRight } from 'lucide-react';
import { ServiceArea, WebsiteSection } from '../../types';
import { api } from '../../lib/api';
import { normalizeMediaUrl, normalizeThumb } from '../../lib/mediaUtils';

interface ServiceAreasSectionProps {
  section?: WebsiteSection;
}

export const ServiceAreasSection: React.FC<ServiceAreasSectionProps> = ({ section }) => {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAreas = React.useCallback(async () => {
    try {
      const res = await api.get<{ areas: ServiceArea[] }>('/content/service-areas');
      setAreas(res.areas || []);
    } catch (err) {
      console.error('Failed to load service areas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  if (section && !section.is_visible) return null;

  return (
    <section id="service_areas" className="pt-14 pb-20 bg-[#09090A] relative border-t border-[#24242A]/60 scroll-mt-14">
      <div id="coverage" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
            {section?.subtitle || 'Coverage Wilayah'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light">
            {section?.title || 'Jangkauan Layanan AFFRAME'}
          </h2>
          <p className="text-sm text-zinc-400 font-sans">
            {section?.description ||
              'AFFRAME siap hadir langsung mengabadikan momen istimewa Anda di berbagai kota utama Jawa Timur dan wilayah sekitarnya.'}
          </p>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {areas.map(area => (
            <div
              key={area.id}
              className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden group hover:border-[#C5A880]/50 transition-all duration-300 flex flex-col"
            >
              {/* Image banner */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                <img
                  src={normalizeThumb(area.image_url) || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'}
                  alt={area.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-80" />
                {area.is_primary === 1 && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold bg-[#C5A880] text-[#0C0C0D] rounded-sm">
                    Area Utama
                  </span>
                )}
              </div>

              {/* Text content */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-serif text-xl text-[#F8F6F0] font-medium group-hover:text-[#C5A880] transition-colors">
                      {area.name}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {area.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-[#C5A880]">
                  <span>On-site Available</span>
                  <Navigation className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom area notice */}
        <div className="mt-12 text-center">
          <p className="text-xs text-zinc-400">
            Lokasi acara Anda berada di luar area di atas?{' '}
            <a href="#booking" className="text-[#C5A880] hover:underline font-medium">
              Konsultasikan via WhatsApp untuk penyesuaian jadwal & akomodasi.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
