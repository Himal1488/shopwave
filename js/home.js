// home.js
(function(){
  const filterToggle = document.getElementById('filterToggle');
  const filterPopup = document.getElementById('filterPopup');
  const applyBtn = document.getElementById('applyFilters');
  const clearBtn = document.getElementById('clearFilters');
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const recommendedGrid = document.getElementById('recommendedGrid');

  // Build filter UI inside popup (if not preloaded)
  function buildFilterUI(){
    // The DOM already contains the inputs in home.html.
    // Here just position popup to the right of the toggle button.
  }

  function positionPopup(){
    // position it so it aligns to the right of the filter button
    const btn = filterToggle;
    const rect = btn.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    // place right aligned with button
    filterPopup.style.top = top + 'px';
    filterPopup.style.right = (window.innerWidth - rect.right + 8) + 'px';
  }

  filterToggle.addEventListener('click', () => {
    const isShown = filterPopup.classList.toggle('show');
    filterPopup.setAttribute('aria-hidden', !isShown);
    if(isShown) positionPopup();
  });

  window.addEventListener('resize', () => {
    if(filterPopup.classList.contains('show')) positionPopup();
  });

  // collect filters and navigate to products.html
  function gatherFiltersAndGo(){
    const categoriesSelect = document.getElementById('filterCategories');
    const selectedCats = Array.from(categoriesSelect.selectedOptions).map(o=>o.value);
    const minPrice = document.getElementById('minPrice').value || '';
    const maxPrice = document.getElementById('maxPrice').value || '';
    const ratingRadio = document.querySelector('input[name="minRating"]:checked');
    const minRating = ratingRadio ? ratingRadio.value : '';

    const q = new URLSearchParams();
    if(searchInput.value.trim()) q.set('q', searchInput.value.trim());
    if(selectedCats.length) q.set('categories', selectedCats.join(','));
    if(minPrice) q.set('min', minPrice);
    if(maxPrice) q.set('max', maxPrice);
    if(minRating) q.set('rating', minRating);

    // store this search into recent searches (localStorage)
    const recent = JSON.parse(localStorage.getItem('shopwave-recent') || '[]');
    const entry = { q: searchInput.value.trim(), categories: selectedCats, min: minPrice, max: maxPrice, rating: minRating, time: Date.now() };
    recent.unshift(entry);
    // keep last 10
    localStorage.setItem('shopwave-recent', JSON.stringify(recent.slice(0,10)));

    window.location.href = `products.html?${q.toString()}`;
  }

  // Apply/clear handlers
  if(applyBtn) applyBtn.addEventListener('click', gatherFiltersAndGo);
  if(clearBtn) clearBtn.addEventListener('click', ()=>{
    document.getElementById('filterCategories').selectedIndex = -1;
    document.getElementById('minPrice').value='';
    document.getElementById('maxPrice').value='';
    document.querySelector('input[name="minRating"][value="3"]').checked = true;
  });
  if(searchBtn) searchBtn.addEventListener('click', gatherFiltersAndGo);

  // Theme toggle (sync with products page)
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  function applyTheme(theme){
    document.body.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    // store as "dark" or "light"
    localStorage.setItem('shopwave-theme', theme);
  }
  // initialize theme from storage
  const savedTheme = localStorage.getItem('shopwave-theme') || 'dark';
  applyTheme(savedTheme);
  themeToggle.addEventListener('click', () => {
    const current = localStorage.getItem('shopwave-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  // Recommended cards logic: show 3 products prioritized by recent searches then rotate randomly every 15s
  const RECOMMEND_COUNT = 3;
  function renderRecommended(){
    // load recent searches
    const recent = JSON.parse(localStorage.getItem('shopwave-recent') || '[]');
    // flatten categories they used recently
    const recentCats = [];
    recent.forEach(r => {
      (r.categories || []).forEach(c => {
        if(!recentCats.includes(c)) recentCats.push(c);
      });
    });

    // pick products: prefer those categories, else random
    const picks = [];
    if (recentCats.length) {
  outer:
  for (let i = 0; i < recentCats.length; i++) {
    const cat = recentCats[i];

    for (let p of PRODUCTS) {
      if (p.category === cat && !picks.find(x => x.id === p.id)) {
        picks.push(p);
        if (picks.length >= RECOMMEND_COUNT) break outer;
      }
    }
  }
}

    // fill with random if needed
    let shuffled = PRODUCTS.slice().sort(()=>Math.random()-0.5);
    for(let p of shuffled){
      if(picks.length >= RECOMMEND_COUNT) break;
      if(!picks.find(x=>x.id===p.id)) picks.push(p);
    }

    // build DOM
    recommendedGrid.innerHTML = '';
    picks.forEach(prod => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="thumb" style="background-image:url('${prod.image}')"></div>
        <h3>${prod.name}</h3>
        <div class="muted">${prod.brand} • ${prod.category}</div>
        <p class="price">Rs. ${prod.price.toLocaleString()}</p>
        <div class="muted"> ${renderStars(prod.rating)} </div>
        <div class="card-actions">
          <button class="btn view-btn" data-id="${prod.id}">View</button>
          <button class="btn ghost add-cart" data-id="${prod.id}">Add to cart</button>
          <button class="buy-now" data-id="${prod.id}">Buy Now</button>
        </div>
      `;
      recommendedGrid.appendChild(card);

      // clicking image or view navigates to products and highlights product
      card.querySelector('.thumb').addEventListener('click', ()=>goToProduct(prod.id));
      card.querySelector('.view-btn').addEventListener('click', ()=>goToProduct(prod.id));
      card.querySelector('.buy-now').addEventListener('click', ()=> {
        // simple buy -> go to product page anchored
        goToProduct(prod.id);
      });
    });
  }

  function renderStars(n){
    let s = '';
    for(let i=1;i<=5;i++){
      s += i<=n ? '★' : '☆';
    }
    return `<span style="color:var(--accent);font-weight:700">${s}</span>`;
  }

  function goToProduct(id){
    // navigate to products.html with highlight param
    const recent = JSON.parse(localStorage.getItem('shopwave-recent') || '[]');
    // also push brand/category into recent so recommended changes
    const product = PRODUCTS.find(p=>p.id===id);
    if(product){
      recent.unshift({ q: product.name, categories:[product.category], time: Date.now() });
      localStorage.setItem('shopwave-recent', JSON.stringify(recent.slice(0,10)));
    }
    window.location.href = `products.html?highlight=${id}`;
  }

  // rotate recommended every 15s
  renderRecommended();
  setInterval(renderRecommended, 15000);

  // small utilities
  document.getElementById('year').textContent = new Date().getFullYear();
})();
