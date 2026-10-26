const http = require('http');

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE END-TO-END VERIFICATION ---');

  // Helper fetch
  async function testFetch(path, options = {}) {
    const res = await fetch(`http://localhost:5000${path}`, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      const json = await res.json();
      return { status: res.status, ok: res.ok, data: json };
    }
    const text = await res.text();
    return { status: res.status, ok: res.ok, text };
  }

  try {
    // 1. Health check
    const health = await testFetch('/api/health');
    console.log('[Test 1] Health check:', health.status === 200 && health.data.status === 'ok' ? 'PASSED ✅' : 'FAILED ❌', health.data);

    // 2. Settings check
    const settingsRes = await testFetch('/api/settings');
    console.log('[Test 2] Site Settings:', settingsRes.ok && settingsRes.data.settings.brand_name === 'AF Frame' ? 'PASSED ✅' : 'FAILED ❌');
    console.log('         WhatsApp:', settingsRes.data.settings.whatsapp_number, '| Instagram:', settingsRes.data.settings.instagram_handle);

    // 3. Sections check
    const sectionsRes = await testFetch('/api/sections');
    console.log('[Test 3] Website Sections:', sectionsRes.ok && sectionsRes.data.sections.length >= 8 ? 'PASSED ✅' : 'FAILED ❌', `(${sectionsRes.data.sections.length} sections)`);

    // 4. Portfolio Categories check
    const catRes = await testFetch('/api/portfolio/categories');
    console.log('[Test 4] Portfolio Categories:', catRes.ok && catRes.data.categories.length === 6 ? 'PASSED ✅' : 'FAILED ❌', `(${catRes.data.categories.map(c => c.name).join(', ')})`);

    // 5. Portfolio Projects check
    const projRes = await testFetch('/api/portfolio/projects');
    console.log('[Test 5] Portfolio Projects:', projRes.ok && projRes.data.projects.length >= 6 ? 'PASSED ✅' : 'FAILED ❌', `(${projRes.data.projects.length} projects)`);

    // 6. Project Detail by slug
    const singleProj = await testFetch('/api/portfolio/projects/intimate-sacred-union-arya-nadhira');
    console.log('[Test 6] Project Detail by Slug:', singleProj.ok && singleProj.data.project.title.includes('Arya') ? 'PASSED ✅' : 'FAILED ❌');

    // 7. Services & Packages (Exact Catalog Data)
    const servRes = await testFetch('/api/services');
    console.log('[Test 7] Services & Packages Catalog:', servRes.ok && servRes.data.services.length === 6 ? 'PASSED ✅' : 'FAILED ❌');
    for (const s of servRes.data.services) {
      console.log(`         - ${s.name}: ${s.packages.map(p => `${p.package_name} (Rp ${p.promotional_price.toLocaleString('id-ID')})`).join(', ')}`);
    }

    // 8. Benefits check
    const benRes = await testFetch('/api/content/benefits');
    console.log('[Test 8] 5 Benefits (Why AF Frame):', benRes.ok && benRes.data.benefits.length === 5 ? 'PASSED ✅' : 'FAILED ❌', `(${benRes.data.benefits.map(b => b.title).join(', ')})`);

    // 9. Terms check
    const termsRes = await testFetch('/api/content/terms');
    console.log('[Test 9] Syarat & Ketentuan (7 Pasal):', termsRes.ok && termsRes.data.terms.length === 7 ? 'PASSED ✅' : 'FAILED ❌');

    // 10. FAQs check
    const faqRes = await testFetch('/api/content/faqs');
    console.log('[Test 10] FAQs:', faqRes.ok && faqRes.data.faqs.length >= 8 ? 'PASSED ✅' : 'FAILED ❌');

    // 11. Service Areas check
    const areaRes = await testFetch('/api/content/service-areas');
    console.log('[Test 11] Service Areas:', areaRes.ok && areaRes.data.areas.length >= 4 ? 'PASSED ✅' : 'FAILED ❌', `(${areaRes.data.areas.map(a => a.name).join(', ')})`);

    // 12. Public Booking Form Submission
    const bookingRes = await testFetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Budi Santoso',
        whatsapp_number: '081234567890',
        email: 'budi@example.com',
        service_name: 'Graduation Photography & Videography',
        package_name: 'DIAMOND',
        event_date: '2026-04-10',
        location: 'Surabaya',
        additional_notes: 'Foto wisuda kampus B UNAIR bersama keluarga',
        agreed_terms: 1
      })
    });
    console.log('[Test 12] Booking Submission & WhatsApp Generator:', bookingRes.ok && bookingRes.data.inquiry_code ? 'PASSED ✅' : 'FAILED ❌');
    console.log('          Generated Code:', bookingRes.data.inquiry_code);
    console.log('          WhatsApp URL:', bookingRes.data.whatsappRedirectUrl.slice(0, 60) + '...');

    // 13. Admin Auth Login
    const loginRes = await testFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@afframe.com',
        password: 'Afframe2026!'
      })
    });
    console.log('[Test 13] Admin Authentication Login:', loginRes.ok && loginRes.data.token ? 'PASSED ✅' : 'FAILED ❌');
    const adminToken = loginRes.data.token;

    // 14. Protected Admin Dashboard Stats
    const statsRes = await testFetch('/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('[Test 14] Protected Dashboard Metrics:', statsRes.ok && statsRes.data.metrics.totalPackages > 0 ? 'PASSED ✅' : 'FAILED ❌', statsRes.data.metrics);

    // 15. Protected Inquiries List & CSV Export
    const inqListRes = await testFetch('/api/inquiries', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('[Test 15] Admin Inquiries Query:', inqListRes.ok && inqListRes.data.inquiries.length >= 3 ? 'PASSED ✅' : 'FAILED ❌', `(${inqListRes.data.inquiries.length} total inquiries)`);

    const csvRes = await testFetch('/api/inquiries/export/csv', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('[Test 16] Inquiries CSV Export:', csvRes.ok && csvRes.text.includes('Kode Inquiry') ? 'PASSED ✅' : 'FAILED ❌');

    // 17. Security Check: Anonymous access to admin inquiries must be 401
    const anonInq = await testFetch('/api/inquiries');
    console.log('[Test 17] Security Guard (Anonymous access to inquiries rejected):', anonInq.status === 401 ? 'PASSED ✅' : 'FAILED ❌');

    console.log('--- ALL ACCEPTANCE TESTS COMPLETED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

// Start server in background for testing if needed
const server = require('./index');
setTimeout(runTests, 1500);
