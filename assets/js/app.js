/**
 * Toko Online ISPARMO - Core Client Application
 * Handles: Theme Toggle, Dynamic JSON Hydration, Smart Search Engine with Synonyms,
 * Live Dropdown Preview, Category Filters, Sorting, FAQs, Modal
 */

(function () {
  'use strict';

  // --- STATE ---
  let productsData = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let currentSort = 'featured';

  // --- DOM ELEMENTS ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const productsContainer = document.getElementById('productsContainer');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const searchResultStatus = document.getElementById('searchResultStatus');
  const heroTagPills = document.querySelectorAll('.hero-tag-pill');
  const sortSelect = document.getElementById('sortSelect');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const countAll = document.getElementById('countAll');
  const countApps = document.getElementById('countApps');
  const countEbooks = document.getElementById('countEbooks');
  const countCourses = document.getElementById('countCourses');
  const backToTopBtn = document.getElementById('backToTopBtn');
  const affiliateModal = document.getElementById('affiliateModal');
  const openAffiliateBtns = document.querySelectorAll('.open-affiliate-modal');
  const closeAffiliateBtn = document.getElementById('closeAffiliateBtn');

  // ==========================================
  // 1. THEME TOGGLER (DARK / LIGHT MODE)
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('isparmo_store_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('isparmo_store_theme', next);
      });
    }
  }

  // ==========================================
  // 2. FETCH & INITIALIZE PRODUCTS
  // ==========================================
  async function loadProducts() {
    try {
      const response = await fetch('data/products.json?v=' + Date.now());
      if (!response.ok) {
        throw new Error('Gagal memuat data/products.json: ' + response.status);
      }
      const data = await response.json();
      productsData = data.products || [];
      updateCategoryCounts();
      renderProducts();
    } catch (err) {
      console.warn('Menggunakan fallback data produk:', err);
    }
  }

  // Update numbers on category buttons
  function updateCategoryCounts() {
    if (!productsData.length) return;

    const total = productsData.length;
    const apps = productsData.filter(p => p.category === 'app').length;
    const ebooks = productsData.filter(p => p.category === 'ebook').length;
    const courses = productsData.filter(p => p.category === 'pelatihan').length;

    if (countAll) countAll.textContent = total;
    if (countApps) countApps.textContent = apps;
    if (countEbooks) countEbooks.textContent = ebooks;
    if (countCourses) countCourses.textContent = courses;
  }

  // ==========================================
  // 3. SMART SEARCH & FILTER ENGINE
  // ==========================================
  function matchesSearch(item, query) {
    if (!query || query.trim() === '') return true;
    const q = query.toLowerCase().trim();

    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const tags = (item.tags || []).join(' ').toLowerCase();
    const badge = (item.badge || '').toLowerCase();
    const searchable = `${title} ${desc} ${category} ${tags} ${badge}`;

    // Direct substring check
    if (searchable.includes(q)) return true;

    // Synonym & token expansion
    const tokens = q.split(/\s+/).filter(Boolean);
    return tokens.every(token => {
      if (searchable.includes(token)) return true;

      // "buku", "ebook", "pdf", "panduan"
      if (['buku', 'ebook', 'pdf', 'panduan', 'bacaan'].includes(token)) {
        return category === 'ebook' || searchable.includes('ebook') || searchable.includes('buku') || searchable.includes('panduan');
      }
      // "aplikasi", "app", "tool", "tools"
      if (['aplikasi', 'app', 'apps', 'tool', 'tools', 'software', 'generator'].includes(token)) {
        return category === 'app' || searchable.includes('aplikasi') || searchable.includes('web app') || searchable.includes('studio') || searchable.includes('insinyur');
      }
      // "video", "rekaman", "pelatihan", "kursus"
      if (['video', 'rekaman', 'pelatihan', 'kursus', 'kelas', 'webinar'].includes(token)) {
        return category === 'pelatihan' || searchable.includes('pelatihan') || searchable.includes('rekaman') || searchable.includes('video');
      }
      // "guru", "sekolah", "pendidikan"
      if (['guru', 'sekolah', 'pendidikan', 'pengajar', 'murid'].includes(token)) {
        return searchable.includes('guru') || searchable.includes('cyborg') || searchable.includes('gemini') || searchable.includes('chatgpt');
      }
      // "marketing", "jualan", "promosi"
      if (['marketing', 'jualan', 'penjualan', 'promosi', 'umkm'].includes(token)) {
        return searchable.includes('marketing') || searchable.includes('umkm') || searchable.includes('penjualan');
      }
      // "website", "landing", "web"
      if (['website', 'landing', 'web', 'site'].includes(token)) {
        return searchable.includes('website') || searchable.includes('landing') || searchable.includes('insinyur');
      }
      // "foto", "gambar", "katalog"
      if (['foto', 'photo', 'gambar', 'image', 'studio'].includes(token)) {
        return searchable.includes('foto') || searchable.includes('studio') || searchable.includes('gambar');
      }

      return false;
    });
  }

  function getFilteredAndSortedProducts() {
    let list = [...productsData];

    // Filter by Category
    if (currentFilter !== 'all') {
      list = list.filter(item => item.category === currentFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      list = list.filter(item => matchesSearch(item, searchQuery));
    }

    // Sort
    if (currentSort === 'price-low') {
      list.sort((a, b) => (a.priceNumeric || 0) - (b.priceNumeric || 0));
    } else if (currentSort === 'price-high') {
      list.sort((a, b) => (b.priceNumeric || 0) - (a.priceNumeric || 0));
    } else if (currentSort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return list;
  }

  function getCategoryLabel(cat) {
    switch (cat) {
      case 'app': return 'Aplikasi Web AI';
      case 'ebook': return 'Ebook PDF';
      case 'pelatihan': return 'Pelatihan Video';
      default: return 'Produk Digital';
    }
  }

  function getFallbackIcon(item) {
    const t = (item.title || '').toLowerCase();
    if (t.includes('gemini')) return 'fa-brands fa-google';
    if (t.includes('chatgpt')) return 'fa-solid fa-robot';
    if (t.includes('website')) return 'fa-solid fa-code';
    if (t.includes('foto')) return 'fa-solid fa-camera-retro';
    if (t.includes('marketing')) return 'fa-solid fa-chart-line';
    if (item.category === 'app') return 'fa-solid fa-microchip';
    if (item.category === 'pelatihan') return 'fa-solid fa-play-circle';
    return 'fa-solid fa-book-bookmark';
  }

  // ==========================================
  // 4. NAVIGATION & SCROLL HELPERS
  // ==========================================
  function scrollToCatalog() {
    const catalogEl = document.getElementById('katalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function scrollToProduct(prodId) {
    const card = document.querySelector(`.product-card[data-id="${prodId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.borderColor = 'var(--brand-orange)';
      card.style.boxShadow = '0 0 0 3px var(--brand-orange-glow)';
      setTimeout(() => {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 2000);
    } else {
      scrollToCatalog();
    }
  }

  // ==========================================
  // 5. RENDER PRODUCTS GRID
  // ==========================================
  function renderProducts() {
    if (!productsContainer) return;

    const list = getFilteredAndSortedProducts();
    updateSearchResultStatus(list.length);

    if (list.length === 0) {
      productsContainer.innerHTML = `
        <div class="empty-catalog">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h3>Produk Tidak Ditemukan</h3>
          <p>Tidak ada produk yang cocok dengan pencarian "<strong>${escapeHtml(searchQuery)}</strong>". Silakan coba kata kunci lain atau reset filter.</p>
          <button id="resetFilterBtn" class="btn-primary" style="margin: 0 auto;">Reset Filter &amp; Pencarian</button>
        </div>
      `;
      const resetBtn = document.getElementById('resetFilterBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          resetAllFilters();
        });
      }
      return;
    }

    let html = '';
    list.forEach(item => {
      const catLabel = getCategoryLabel(item.category);
      const fallbackIcon = getFallbackIcon(item);

      // Media element
      let mediaHtml = '';
      if (item.image && item.image.trim() !== '') {
        mediaHtml = `<img src="${item.image}" alt="${escapeHtml(item.title)}" class="product-img" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'img-fallback-placeholder\\'><i class=\\'${fallbackIcon}\\'></i><span>${catLabel}</span></div>'">`;
      } else {
        mediaHtml = `
          <div class="img-fallback-placeholder">
            <i class="${fallbackIcon}"></i>
            <span>${catLabel}</span>
          </div>
        `;
      }

      // Badges
      let badgesHtml = `<span class="card-badge badge-category">${catLabel}</span>`;
      if (item.badge) {
        badgesHtml += `<span class="card-badge badge-featured">${escapeHtml(item.badge)}</span>`;
      }

      // Tags
      const tagsHtml = (item.tags || [])
        .slice(0, 3)
        .map(t => `<span class="card-tag">#${escapeHtml(t)}</span>`)
        .join('');

      html += `
        <article class="product-card" data-id="${item.id}" data-category="${item.category}">
          <div class="card-media-wrapper">
            ${mediaHtml}
          </div>
          <div class="card-body">
            <div class="card-meta-row">
              <div class="card-badges">${badgesHtml}</div>
              <div class="card-tags">${tagsHtml}</div>
            </div>
            <h3 class="product-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
            <p class="product-desc">${escapeHtml(item.description)}</p>
            <div class="card-footer">
              <div class="price-box">
                <span class="price-label">Harga</span>
                <span class="price-value">${escapeHtml(item.price)}</span>
              </div>
              <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-buy-card">
                <span>Beli di Lynk.id</span>
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem;">
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent('Halo, saya tertarik dengan produk ' + item.title + ' di: ' + item.url)}" 
                 target="_blank" rel="noopener noreferrer" class="btn-affiliate-card" style="color:#25D366;">
                <i class="fa-brands fa-whatsapp"></i> Tanya Produk
              </a>
              <button type="button" class="btn-affiliate-card open-affiliate-modal">
                <i class="fa-solid fa-handshake"></i> Komisi Affiliate
              </button>
            </div>
          </div>
        </article>
      `;
    });

    productsContainer.innerHTML = html;

    // Reattach modal open listener to card affiliate buttons
    document.querySelectorAll('.product-card .open-affiliate-modal').forEach(btn => {
      btn.addEventListener('click', openModal);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // 6. SINGLE UNIFIED SEARCH & FILTER HANDLER
  // ==========================================
  function updateSearchResultStatus(count) {
    if (!searchResultStatus) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      searchResultStatus.style.display = 'none';
      searchResultStatus.innerHTML = '';
      return;
    }

    searchResultStatus.style.display = 'flex';
    searchResultStatus.innerHTML = `
      <div class="status-content">
        <i class="fa-solid fa-circle-info"></i>
        <span>Menemukan <strong>${count}</strong> produk untuk kata kunci "<strong>${escapeHtml(trimmed)}</strong>"</span>
      </div>
      <button type="button" class="catalog-reset-link" id="statusResetSearchBtn" title="Hapus pencarian">
        <i class="fa-solid fa-xmark"></i> Hapus Filter
      </button>
    `;

    const statusResetBtn = document.getElementById('statusResetSearchBtn');
    if (statusResetBtn) {
      statusResetBtn.addEventListener('click', () => {
        handleSearch('');
        if (searchInput) searchInput.focus();
      });
    }
  }

  function handleSearch(val, shouldScroll = false) {
    searchQuery = (val || '').trim();
    if (searchInput && searchInput.value !== val) {
      searchInput.value = val;
    }

    if (searchClearBtn) {
      searchClearBtn.style.display = searchQuery ? 'flex' : 'none';
    }

    // Jika sedang mencari kata kunci, reset kategori tab ke 'all' agar hasil dari seluruh kategori keluar
    if (searchQuery !== '') {
      currentFilter = 'all';
      filterButtons.forEach(b => {
        const isAll = (b.dataset.filter === 'all');
        b.classList.toggle('active', isAll);
        b.setAttribute('aria-selected', isAll ? 'true' : 'false');
      });
      heroTagPills.forEach(p => {
        p.classList.toggle('active', p.dataset.category === 'all');
      });
    }

    renderProducts();

    if (shouldScroll) {
      scrollToCatalog();
    }
  }

  function setCategory(cat, shouldScroll = false) {
    currentFilter = cat || 'all';

    // Update catalog tab buttons
    filterButtons.forEach(btn => {
      const isMatch = (btn.dataset.filter === currentFilter);
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    // Update hero quick tag pills
    heroTagPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.category === currentFilter);
    });

    renderProducts();

    if (shouldScroll) {
      scrollToCatalog();
    }
  }

  function resetAllFilters() {
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.style.display = 'none';
    setCategory('all', false);
  }

  // ==========================================
  // 7. EVENT LISTENERS
  // ==========================================
  function initListeners() {
    // Category Filter Buttons in Catalog
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.filter || 'all';
        setCategory(cat, false);
      });
    });

    // Quick Category Exploration Pills in Hero
    heroTagPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.dataset.category || 'all';
        if (searchQuery) {
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
        }
        setCategory(cat, true);
      });
    });

    // Catalog Search Input
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        handleSearch(e.target.value, false);
      });

      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          handleSearch(searchInput.value, true);
        }
        if (e.key === 'Escape') {
          handleSearch('', false);
        }
      });
    }

    // Clear Button in Catalog Search
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        handleSearch('', false);
        if (searchInput) searchInput.focus();
      });
    }

    // Sort Select
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        currentSort = e.target.value;
        renderProducts();
      });
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const qBtn = item.querySelector('.faq-question');
      if (qBtn) {
        qBtn.addEventListener('click', () => {
          const isActive = item.classList.contains('active');
          faqItems.forEach(f => f.classList.remove('active'));
          if (!isActive) {
            item.classList.add('active');
          }
        });
      }
    });

    // Back to Top Button
    window.addEventListener('scroll', () => {
      if (backToTopBtn) {
        if (window.scrollY > 400) {
          backToTopBtn.classList.add('show');
        } else {
          backToTopBtn.classList.remove('show');
        }
      }
    });

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Affiliate Modal
    openAffiliateBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeAffiliateBtn) closeAffiliateBtn.addEventListener('click', closeModal);
    if (affiliateModal) {
      affiliateModal.addEventListener('click', e => {
        if (e.target === affiliateModal) closeModal();
      });
    }

    // Keyboard ESC to close modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && affiliateModal && affiliateModal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  function openModal() {
    if (affiliateModal) {
      affiliateModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (affiliateModal) {
      affiliateModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  // ==========================================
  // INITIALIZATION ON DOM READY
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initListeners();
    loadProducts();
  });
})();
