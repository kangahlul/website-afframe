import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, MessageSquare, Calendar, MapPin, User, Phone, Building, DollarSign } from 'lucide-react';
import { InstagramIcon } from '../common/InstagramIcon';
import { Service, ServicePackage, WebsiteSection } from '../../types';
import { api } from '../../lib/api';
import { useSite } from '../../context/SiteContext';

interface BookingFormSectionProps {
  section?: WebsiteSection;
  selectedPackageInfo?: {
    serviceId: number;
    packageId: number;
    serviceName: string;
    packageName: string;
  } | null;
}

export const BookingFormSection: React.FC<BookingFormSectionProps> = ({ section, selectedPackageInfo }) => {
  const { settings } = useSite();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [availablePackages, setAvailablePackages] = useState<ServicePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [company, setCompany] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    inquiryCode: string;
    whatsappRedirectUrl: string;
  } | null>(null);

  // Load services for dropdown
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await api.get<{ services: Service[] }>('/services');
        setServices(res.services || []);
      } catch (err) {
        console.error('Failed to load services for form:', err);
      }
    }
    loadServices();
  }, []);

  // Update packages when selected service changes
  useEffect(() => {
    if (selectedServiceId) {
      const svc = services.find(s => String(s.id) === selectedServiceId);
      if (svc && svc.packages) {
        setAvailablePackages(svc.packages);
      } else {
        setAvailablePackages([]);
      }
    } else {
      setAvailablePackages([]);
      setSelectedPackageId('');
    }
  }, [selectedServiceId, services]);

  // Handle external prefill from package cards
  useEffect(() => {
    if (selectedPackageInfo) {
      setSelectedServiceId(String(selectedPackageInfo.serviceId));
      setTimeout(() => {
        setSelectedPackageId(String(selectedPackageInfo.packageId));
      }, 50);
    }
  }, [selectedPackageInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !whatsapp.trim() || !eventDate || !location.trim()) {
      setErrorMessage('Mohon lengkapi kolom wajib: Nama, No WhatsApp, Tanggal Acara, dan Lokasi.');
      return;
    }

    if (!agreedTerms) {
      setErrorMessage('Anda harus menyetujui Syarat & Ketentuan AF Frame.');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentSvc = services.find(s => String(s.id) === selectedServiceId);
      const currentPkg = availablePackages.find(p => String(p.id) === selectedPackageId);

      const payload = {
        full_name: fullName,
        whatsapp_number: whatsapp,
        email,
        instagram_handle: instagram,
        company,
        service_id: selectedServiceId ? Number(selectedServiceId) : null,
        package_id: selectedPackageId ? Number(selectedPackageId) : null,
        service_name: currentSvc ? currentSvc.name : '',
        package_name: currentPkg ? currentPkg.package_name : '',
        event_date: eventDate,
        event_time: eventTime,
        location,
        budget_range: budget,
        additional_notes: notes,
        agreed_terms: agreedTerms ? 1 : 0
      };

      const res = await api.post<{
        inquiry_code: string;
        whatsappRedirectUrl: string;
      }>('/inquiries', payload);

      setSuccessInfo({
        inquiryCode: res.inquiry_code,
        whatsappRedirectUrl: res.whatsappRedirectUrl
      });

      // Automatically open WhatsApp in new tab after 1.5 seconds or let user click
      setTimeout(() => {
        window.open(res.whatsappRedirectUrl, '_blank');
      }, 800);

    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirimkan formulir booking. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (section && !section.is_visible) return null;

  return (
    <section id="booking-form" className="pt-14 pb-20 bg-[#0C0C0D] relative border-t border-[#24242A]/60 scroll-mt-14">
      <div id="booking" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
            {section?.subtitle || 'Reservasi & Inquiry'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light">
            {section?.title || 'Kunci Tanggal & Diskusikan Project'}
          </h2>
          <p className="text-sm text-zinc-400 font-sans">
            {section?.description ||
              'Isi formulir singkat di bawah ini. Data Anda akan langsung tersimpan di sistem kami dan terhubung otomatis ke WhatsApp resmi AF Frame.'}
          </p>
        </div>

        {/* Success Confirmation Card */}
        {successInfo ? (
          <div className="p-8 sm:p-12 bg-[#131316] border border-[#C5A880] rounded-sm text-center space-y-6 animate-fadeIn shadow-2xl">
            <div className="w-16 h-16 bg-[#C5A880]/15 text-[#C5A880] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-3xl text-[#F8F6F0]">Inquiry Berhasil Terkirim!</h3>
              <p className="text-sm text-zinc-300">
                Kode Reservasi Anda:{' '}
                <span className="font-mono text-[#C5A880] font-bold text-base px-2 py-0.5 bg-[#1C1C22] rounded">
                  {successInfo.inquiryCode}
                </span>
              </p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Data inquiry Anda telah tersimpan aman di database AF Frame. Jendela WhatsApp akan otomatis terbuka untuk verifikasi ketersediaan jadwal tim.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={successInfo.whatsappRedirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-sm bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-semibold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Buka Pesan WhatsApp Sekarang</span>
              </a>

              <button
                onClick={() => {
                  setSuccessInfo(null);
                  setFullName('');
                  setWhatsapp('');
                  setEventDate('');
                  setLocation('');
                  setNotes('');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-sm border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider hover:border-zinc-500 transition-colors"
              >
                Kirim Inquiry Lain
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-8 sm:p-10 bg-[#121215] border border-[#24242A] rounded-sm space-y-6 shadow-2xl"
          >
            {errorMessage && (
              <div className="p-4 rounded-sm bg-red-950/40 border border-red-800 text-red-200 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Row 1: Nama & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Nama Lengkap <span className="text-[#C5A880]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Contoh: Farhan Pratama"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Nomor WhatsApp <span className="text-[#C5A880]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 085755152579"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Email & Instagram */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Akun Instagram (Opsional)
                </label>
                <div className="relative">
                  <InstagramIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="@username"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Service Category & Dynamic Package */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                    Kategori Layanan
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={e => {
                      setSelectedServiceId(e.target.value);
                      setSelectedPackageId('');
                    }}
                    className="w-full px-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 focus:outline-none focus:border-[#C5A880] transition-colors"
                  >
                    <option value="">-- Pilih Layanan Dokumentasi --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                    Pilihan Paket
                  </label>
                  <select
                    value={selectedPackageId}
                    onChange={e => setSelectedPackageId(e.target.value)}
                    disabled={!selectedServiceId || availablePackages.length === 0}
                    className="w-full px-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 focus:outline-none focus:border-[#C5A880] transition-colors disabled:opacity-50"
                  >
                    <option value="">
                      {availablePackages.length === 0
                        ? '-- Pilih Layanan Terlebih Dahulu --'
                        : '-- Pilih Paket --'}
                    </option>
                    {availablePackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.package_name} ({pkg.promotional_price > 0 ? `Rp ${pkg.promotional_price.toLocaleString('id-ID')}` : 'By Quotation'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visual Quick Select Package Pills */}
              {availablePackages.length > 0 && (
                <div className="p-3 bg-[#16161B] border border-[#262630] rounded-sm">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-2">
                    Pilih Cepat Paket:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availablePackages.map(pkg => {
                      const isSelected = String(pkg.id) === selectedPackageId;
                      const hasPromo = pkg.promotional_price > 0 && pkg.promotional_price < pkg.regular_price;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackageId(String(pkg.id))}
                          className={`p-3 rounded-sm text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#C5A880]/15 border-2 border-[#C5A880] text-white shadow-md'
                              : 'bg-[#1C1C22] border border-[#2E2E38] text-zinc-300 hover:border-zinc-500'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-[#C5A880]' : 'text-zinc-200'}`}>
                                Paket {pkg.package_name}
                              </span>
                              {pkg.is_featured === 1 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#C5A880] text-black font-bold">
                                  FAVORIT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {pkg.duration ? `${pkg.duration} • ` : ''}
                              {hasPromo ? (
                                <span className="text-[#C5A880] font-semibold">
                                  Rp {pkg.promotional_price.toLocaleString('id-ID')}
                                </span>
                              ) : pkg.is_quotation_based ? (
                                'By Quotation'
                              ) : (
                                `Rp ${pkg.regular_price.toLocaleString('id-ID')}`
                              )}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#C5A880] text-black' : 'border border-zinc-600'
                          }`}>
                            {isSelected && <span className="text-xs font-bold">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Event Date, Time, & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Tanggal Acara <span className="text-[#C5A880]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 focus:outline-none focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Waktu / Jam (Opsional)
                </label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  placeholder="Contoh: 09:00 WIB"
                  className="w-full px-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Kota / Lokasi Acara <span className="text-[#C5A880]">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Lamongan / Gresik / Surabaya"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Company & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Nama Perusahaan / Organisasi (Opsional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Untuk Corporate Event / Brand"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                  Estimasi Budget (Opsional)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="Contoh: Sesuai Paket / Rp 1.5jt"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold mb-2">
                Catatan Tambahan & Konsep Khusus
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Tuliskan jika Anda membutuhkan konsep video tertentu, request drone, atau penambahan anggota..."
                className="w-full px-4 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-sm text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
              />
            </div>

            {/* S&K Agreement Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="terms_agree"
                checked={agreedTerms}
                onChange={e => setAgreedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#C5A880] focus:ring-[#C5A880]"
              />
              <label htmlFor="terms_agree" className="text-xs text-zinc-400">
                Saya menyetujui{' '}
                <a href="#terms" className="text-[#C5A880] hover:underline font-medium">
                  Syarat & Ketentuan AF Frame
                </a>
                , termasuk ketentuan DP 50% untuk konfirmasi jadwal dan hak penggunaan karya untuk materi portofolio.
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-sm bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-semibold text-xs uppercase tracking-widest transition-all shadow-xl hover:shadow-[#C5A880]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan & Menghubungkan...' : 'Kirim Inquiry & Lanjut ke WhatsApp'}</span>
            </button>
          </form>
        )}

      </div>
    </section>
  );
};
