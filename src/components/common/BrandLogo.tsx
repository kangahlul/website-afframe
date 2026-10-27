import React from 'react';
import { useSite } from '../../context/SiteContext';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const { settings } = useSite();

  const logoText = settings.logo_text || settings.brand_name || 'AFFRAME';
  const logoSubtitle = settings.logo_subtitle || settings.tagline || 'Photography & Cinematic Production';
  const logoInitials =
    settings.logo_initials ||
    (settings.brand_name ? settings.brand_name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() : 'AF');
  const logoStyle = settings.logo_style || 'combined'; // 'combined' | 'text_emblem' | 'image_only'
  const logoImage = settings.logo_light || settings.logo_primary || '';
  const monogramImage = settings.logo_monogram || '';

  // Size definitions
  const sizeConfig = {
    sm: {
      imgHeight: 'h-7 sm:h-8',
      boxSize: 'w-8 h-8',
      initialsSize: 'text-sm font-bold',
      titleSize: 'text-base sm:text-lg tracking-[0.16em]',
      subSize: 'text-[8px] tracking-[0.22em]',
      gap: 'gap-2'
    },
    md: {
      imgHeight: 'h-9 sm:h-10',
      boxSize: 'w-9 h-9 sm:w-10 sm:h-10',
      initialsSize: 'text-lg sm:text-xl font-bold',
      titleSize: 'text-xl sm:text-2xl tracking-[0.2em]',
      subSize: 'text-[9px] tracking-[0.28em]',
      gap: 'gap-2.5 sm:gap-3'
    },
    lg: {
      imgHeight: 'h-11 sm:h-12',
      boxSize: 'w-11 h-11 sm:w-12 sm:h-12',
      initialsSize: 'text-xl sm:text-2xl font-bold',
      titleSize: 'text-2xl sm:text-3xl tracking-[0.2em]',
      subSize: 'text-[10px] tracking-[0.3em]',
      gap: 'gap-3 sm:gap-3.5'
    }
  }[size];

  // 1. Image only style (only if image exists)
  if (logoStyle === 'image_only' && logoImage) {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={normalizeMediaUrl(logoImage)}
          alt={logoText}
          className={`${sizeConfig.imgHeight} w-auto object-contain transition-transform group-hover:scale-102`}
        />
      </div>
    );
  }

  // 2. Combined style or Text Emblem style
  // Icon element (either uploaded logo/monogram image or styled luxury initial box)
  const renderIcon = () => {
    if (logoStyle === 'combined' && (monogramImage || logoImage)) {
      const activeIcon = monogramImage || logoImage;
      return (
        <div className={`${sizeConfig.boxSize} rounded-sm border border-[#C5A880]/60 flex items-center justify-center bg-[#131316] group-hover:border-[#C5A880] transition-colors shadow-sm overflow-hidden shrink-0`}>
          <img
            src={normalizeMediaUrl(activeIcon)}
            alt="Logo Icon"
            className="w-full h-full object-contain p-1"
          />
        </div>
      );
    }

    return (
      <div className={`${sizeConfig.boxSize} rounded-sm border border-[#C5A880]/60 flex items-center justify-center bg-[#131316] group-hover:border-[#C5A880] transition-colors shadow-sm overflow-hidden shrink-0`}>
        <span className={`font-serif ${sizeConfig.initialsSize} tracking-wider text-[#F8F6F0]`}>
          {logoInitials}
        </span>
      </div>
    );
  };

  return (
    <div className={`flex items-center ${sizeConfig.gap} ${className} group`}>
      {renderIcon()}
      <div className="flex flex-col min-w-0">
        <span className={`font-serif ${sizeConfig.titleSize} font-bold text-[#F8F6F0] leading-none group-hover:text-[#C5A880] transition-colors truncate`}>
          {logoText}
        </span>
        {showSubtitle && logoSubtitle && (
          <span className={`uppercase ${sizeConfig.subSize} text-[#C5A880] font-sans mt-1 font-medium truncate`}>
            {logoSubtitle}
          </span>
        )}
      </div>
    </div>
  );
};
