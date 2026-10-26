import React from 'react';
import { ArrowUpRight, Camera } from 'lucide-react';
import { InstagramIcon } from '../common/InstagramIcon';
import { WebsiteSection } from '../../types';
import { useSite } from '../../context/SiteContext';

interface PublicationSectionProps {
  section?: WebsiteSection;
}

export const PublicationSection: React.FC<PublicationSectionProps> = ({ section }) => {
  const { settings } = useSite();

  if (section && !section.is_visible) return null;

  const title = section?.title || 'Portfolio & Publication';
  const subtitle = section?.subtitle || 'Komitmen & Karya Kami';
  const description =
    section?.description ||
    'Setiap karya yang kami hasilkan menjadi bagian dari perjalanan AF Frame dan dapat digunakan untuk kebutuhan portofolio, publikasi, serta pengembangan brand melalui berbagai media.';

  return (
    <section className="py-20 bg-[#0C0C0D] relative border-t border-[#24242A]/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#C5A880]/40 bg-[#131316] text-[#C5A880] mb-2">
          <Camera className="w-5 h-5" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold block">
          {subtitle}
        </span>

        <h3 className="font-serif text-2xl sm:text-4xl text-[#F8F6F0] font-light">
          {title}
        </h3>

        <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed max-w-2xl mx-auto font-sans">
          "{description}"
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href={settings.instagram_url || 'https://www.instagram.com/_afframe/'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#16161A] hover:bg-[#202026] text-zinc-200 border border-zinc-700 hover:border-[#C5A880] text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <InstagramIcon className="w-4 h-4 text-[#C5A880]" />
            <span>Lihat Update Terbaru di Instagram @_afframe</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
