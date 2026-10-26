import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { FaqItem, WebsiteSection } from '../../types';
import { api } from '../../lib/api';
import { useSite } from '../../context/SiteContext';

interface FAQSectionProps {
  section?: WebsiteSection;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ section }) => {
  const { settings } = useSite();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await api.get<{ faqs: FaqItem[] }>('/content/faqs');
        setFaqs(res.faqs || []);
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  if (section && !section.is_visible) return null;

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="pt-14 pb-20 bg-[#0C0C0D] relative border-t border-[#24242A]/60 scroll-mt-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
            {section?.subtitle || 'Informasi Lengkap'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light">
            {section?.title || 'Frequently Asked Questions'}
          </h2>
          <p className="text-sm text-zinc-400 font-sans">
            {section?.description ||
              'Segala hal yang perlu Anda ketahui mengenai alur booking, pembayaran DP, pengiriman file, hingga kebijakan perubahan jadwal.'}
          </p>
        </div>

        {/* FAQs Accordion */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-zinc-900 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={faq.id}
                  className="border border-[#24242A] rounded-sm bg-[#131316] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-medium text-[#F8F6F0]">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#C5A880] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans border-t border-zinc-800/60 animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Contact direct link */}
        <div className="mt-12 p-6 rounded-sm bg-[#131316] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880] shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">Ada pertanyaan spesifik yang belum terjawab?</h4>
              <p className="text-xs text-zinc-400">Tim AF Frame siap membantu konsultasi via WhatsApp setiap saat.</p>
            </div>
          </div>
          <a
            href={settings.whatsapp_url || 'https://wa.me/6285755152579'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-sm bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
          >
            Chat WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
};
