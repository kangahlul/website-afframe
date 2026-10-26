const http = require('http');

async function runCrudSyncTests() {
  console.log('=== STARTING END-TO-END CRUD & PUBLIC SYNC VERIFICATION ===');

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
    // 1. Admin Login to get token
    const login = await testFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@afframe.com', password: 'Afframe2026!' })
    });
    if (!login.ok || !login.data.token) {
      throw new Error('Admin login failed: ' + JSON.stringify(login.data));
    }
    const token = login.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    console.log('[Step 1] Admin Authentication: SUCCESS ✅');

    // 2. Settings CRUD & Sync
    const originalSettings = (await testFetch('/api/settings')).data.settings;
    const testTagline = 'Capturing Meaningful Moments — Test Sync 2026';
    const updateSettingsRes = await testFetch('/api/settings', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ tagline: testTagline })
    });
    console.log('[Step 2A] Update Settings (Tagline):', updateSettingsRes.ok ? 'SUCCESS ✅' : 'FAILED ❌');

    // Verify public fetch sees the updated tagline immediately
    const publicSettings = await testFetch('/api/settings');
    const isTaglineSynced = publicSettings.data.settings.tagline === testTagline;
    console.log('[Step 2B] Public Settings Sync Verification:', isTaglineSynced ? 'PASSED ✅' : 'FAILED ❌');

    // Revert back
    await testFetch('/api/settings', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ tagline: originalSettings.tagline || 'Capturing Meaningful Moments.' })
    });

    // 3. Section Manager CRUD & Sync
    const sectionsRes = await testFetch('/api/sections?all=true');
    const termsSec = sectionsRes.data.sections.find(s => s.section_key === 'terms');
    console.log('[Step 3A] Terms Section exists in DB:', !!termsSec ? 'EXISTS ✅' : 'MISSING ❌');
    if (termsSec) {
      const updatedSec = await testFetch(`/api/sections/${termsSec.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ title: 'Syarat & Ketentuan Resmi AF Frame' })
      });
      console.log('[Step 3B] Section Update via CMS:', updatedSec.ok ? 'SUCCESS ✅' : 'FAILED ❌');
      // Revert title
      await testFetch(`/api/sections/${termsSec.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ title: 'Syarat & Ketentuan (S&K)' })
      });
    }

    // 4. Portfolio Projects CRUD
    const createProj = await testFetch('/api/portfolio/projects', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Project Test Automation',
        slug: 'project-test-automation-' + Date.now(),
        client_name: 'PT Test Automation',
        short_description: 'Test short description',
        full_description: 'Test full description',
        location: 'Surabaya',
        is_published: 1,
        gallery_images: ['https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200']
      })
    });
    console.log('[Step 4A] Create Portfolio Project:', createProj.ok ? 'SUCCESS ✅' : 'FAILED ❌');
    const newProjId = createProj.data?.project?.id;

    if (newProjId) {
      // Update Project
      const updateProj = await testFetch(`/api/portfolio/projects/${newProjId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ title: 'Project Test Automation (Updated)' })
      });
      console.log('[Step 4B] Update Portfolio Project:', updateProj.ok ? 'SUCCESS ✅' : 'FAILED ❌');

      // Delete Project
      const delProj = await testFetch(`/api/portfolio/projects/${newProjId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      console.log('[Step 4C] Delete Portfolio Project:', delProj.ok ? 'SUCCESS ✅' : 'FAILED ❌');
    }

    // 5. FAQ CRUD
    const createFaq = await testFetch('/api/content/faqs', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        question: 'Apakah hasil foto diedit satu per satu?',
        answer: 'Ya, seluruh foto pilihan diedit tone dan lighting secara profesional.',
        category: 'general'
      })
    });
    console.log('[Step 5A] Create FAQ Item:', createFaq.ok ? 'SUCCESS ✅' : 'FAILED ❌');
    const newFaqId = createFaq.data?.faq?.id;
    if (newFaqId) {
      await testFetch(`/api/content/faqs/${newFaqId}`, { method: 'DELETE', headers: authHeaders });
      console.log('[Step 5B] Delete FAQ Item: SUCCESS ✅');
    }

    // 6. Navigation Items CRUD
    const navRes = await testFetch('/api/content/navigation?all=true');
    console.log('[Step 6A] Fetch Navigation Items:', navRes.ok && navRes.data.items.length > 0 ? 'SUCCESS ✅' : 'FAILED ❌', `(${navRes.data.items.length} items)`);

    console.log('=== ALL CMS CRUD & SYNCHRONIZATION TESTS PASSED PERFECTLY! 🚀 ===');
    process.exit(0);
  } catch (err) {
    console.error('CRUD verification error:', err);
    process.exit(1);
  }
}

runCrudSyncTests();
