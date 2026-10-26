import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { TermsContent, WebsiteSection } from '../../types';
import { api } from '../../lib/api';

interface TermsSectionProps {
  section?: WebsiteSection;
}

export const TermsSection: React.FC<TermsSectionProps> = ({ section }) => {
  const [terms, setTerms] = useState<TermsContent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTerms = React.useCallback(async () => {
    try {
      const res = await api.get<{ terms: TermsContent[] }>('/content/terms');
      setTerms(res.terms || []);
    } catch (err) {
      console.error('Failed to load terms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  if (section && !section.is_visible) return null;

  return (
    <section id="terms" className="pt-14 pb-20 bg-[#09090A] relative border-t border-[#24242A]/60 scroll-mt-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
            {section?.subtitle || 'Ketentuan Layanan'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light">
            {section?.title || 'Syarat & Ketentuan (S&K)'}
          </h2>
          <p className="text-sm text-zinc-400 font-sans">
            {section?.description ||
              'Kebijakan resmi operasional AF Frame demi kenyamanan dan kelancaran kerja sama dokumentasi.'}
          </p>
        </div>

        {/* Clauses list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-zinc-900 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {terms.map((term, idx) => (
              <div
                key={term.id}
                className="p-5 sm:p-6 bg-[#121215] border border-[#24242A] rounded-sm flex items-start gap-4 hover:border-[#C5A880]/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center font-serif text-sm font-semibold shrink-0 mt-0.5">
                  {term.clause_number || idx + 1}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#F8F6F0] font-sans">
                    {term.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                    {term.clause_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer / note */}
        <div className="mt-10 p-5 rounded-sm bg-[#131316] border border-amber-900/40 text-xs text-amber-200/80 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0" />
          <span>
            Dengan melakukan transfer pembayaran uang muka (DP), klien secara otomatis menyetujui seluruh butir Syarat & Ketentuan AF Frame yang tertera di atas.
          </span>
        </div>

      </div>
    </section>
  );
};
