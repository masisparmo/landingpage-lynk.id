/**
 * Toko Online ISPARMO - Core Client Application
 * Handles: Theme Toggle, Dynamic JSON Hydration, Live Filter & Search, Sorting, FAQs, Modal
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
      // Add cache buster for fresh data from GitHub Pages
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
      // If products already in DOM fallback, leave them or keep existing
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
  // 3. FILTER, SORT & RENDER PRODUCTS
  // ==========================================
  function getFilteredAndSortedProducts() {
    let list = [...productsData];

    // Filter by Category
    if (currentFilter !== 'all') {
      list = list.filter(item => item.category === currentFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const titleMatch = item.title && item.title.toLowerCase().includes(q);
        const descMatch = item.description && item.description.toLowerCase().includes(q);
        const tagMatch = item.tags && item.tags.some(t => t.toLowerCase().includes(q));
        return titleMatch || descMatch || tagMatch;
      });
    }

    // Sort
    if (currentSort === 'price-low') {
      list.sort((a, b) => (a.priceNumeric || 0) - (b.priceNumeric || 0));
    } else if (currentSort === 'price-high') {
      list.sort((a, b) => (b.priceNumeric || 0) - (a.priceNumeric || 0));
    } else if (currentSort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Featured first, then id
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

  function renderProducts() {
    if (!productsContainer) return;

    const list = getFilteredAndSortedProducts();

    if (list.length === 0) {
      productsContainer.innerHTML = `
        <div class="empty-catalog">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h3>Produk Tidak Ditemukan</h3>
          <p>Tidak ada produk yang cocok dengan pencarian "<strong>${escapeHtml(searchQuery)}</strong>". Silakan coba kata kunci lain atau reset filter.</p>
          <button id="resetFilterBtn" class="btn-primary" style="margin: 0 auto;">Reset Filter</button>
        </div>
      `;
      const resetBtn = document.getElementById('resetFilterBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          currentFilter = 'all';
          filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
          renderProducts();
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
            <div class="card-badges">${badgesHtml}</div>
            ${mediaHtml}
          </div>
          <div class="card-body">
            <div class="card-tags">${tagsHtml}</div>
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
  // 4. EVENT LISTENERS
  // ==========================================
  function initListeners() {
    // Filter Buttons
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter || 'all';
        renderProducts();
      });
    });

    // Search Input with debounce
    let searchTimeout = null;
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchQuery = e.target.value;
          renderProducts();
        }, 180);
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
