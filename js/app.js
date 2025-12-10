/* app.js — Unified script for home.html and products.html
   (Updated: auth checks, improved search token matching)
*/

(() => {
  // ---------- Helpers ----------
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from((r||document).querySelectorAll(s));
  function formatPrice(v){ return `Rs. ${v.toLocaleString('en-IN')}`; }
  const saveJSON = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const readJSON = (k, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? fallback : (v || fallback); } catch(e){ return fallback; }
  };

  // ---------- Auth helper ----------
  function isLoggedIn(){
    try {
      const u = JSON.parse(localStorage.getItem('shopwave-user'));
      return !!u && typeof u === 'object';
    } catch(e){ return false; }
  }

  function ensureLoggedIn(redirectTarget){
    if(!isLoggedIn()){
      // optionally store where they wanted to go so after login you can redirect
      if(redirectTarget) localStorage.setItem('shopwave-intended', redirectTarget);
      location.href = 'login.html';
      return false;
    }
    return true;
  }

  // ---------- Deterministic product dataset (100 items) ----------
  const categories = [
    "Phones","Laptops","Printers","Tablets","Cameras",
    "Speakers","Routers","Wearables","Accessories","Monitors"
  ];

  const itemsByCategory = {
    Phones: [
      "iPhone 14","Samsung Galaxy S21","OnePlus 9","Google Pixel 6","Xiaomi Mi 11",
      "Oppo Find X3","Vivo X60","Sony Xperia 5","Nokia XR20","Motorola Edge"
    ],
    Laptops: [
      "MacBook Pro","Dell XPS 13","HP Spectre x360","Lenovo ThinkPad X1","Asus ROG Zephyrus",
      "Acer Swift 3","Microsoft Surface Laptop","Razer Blade 15","MSI Prestige","Gigabyte Aero"
    ],
    Printers: [
      "HP OfficeJet Pro","Canon Pixma","Epson EcoTank","Brother HL-L2350","Samsung Xpress",
      "Lexmark MB2236","Kodak Step","Ricoh SP C261DN","Xerox Phaser","Kyocera ECOSYS"
    ],
    Tablets: [
      "iPad Air","Samsung Galaxy Tab S7","Amazon Fire HD","Microsoft Surface Go","Lenovo Tab P11",
      "Huawei MatePad","Xiaomi Pad 5","Asus ZenPad 3","Acer Iconia","Nokia T20"
    ],
    Cameras: [
      "Canon EOS R6","Nikon Z6","Sony A7III","Fujifilm X-T4","Olympus OM-D E-M1",
      "Panasonic Lumix S5","Leica Q2","Pentax K-1","GoPro HERO9","DJI Pocket 2"
    ],
    Speakers: [
      "Bose SoundLink","JBL Charge 4","Sonos One","Marshall Stanmore","Sony SRS-XB43",
      "UE Boom 3","Harman Kardon Onyx","Klipsch The One","Bowers & Wilkins Zeppelin","Anker Soundcore"
    ],
    Routers: [
      "TP-Link Archer","Netgear Nighthawk","Asus RT-AC68U","Linksys EA7500","D-Link DIR-882",
      "Google Nest Wifi","Eero Pro","Ubiquiti UniFi","Zyxel Armor","Tenda AC10"
    ],
    Wearables: [
      "Apple Watch Series 7","Samsung Galaxy Watch 4","Fitbit Sense","Garmin Forerunner 245",
      "Huawei Watch GT2","Amazfit GTR","Fossil Gen 5","Suunto 7","Withings Steel HR","Xiaomi Mi Band 6"
    ],
    Accessories: [
      "Anker PowerCore","Belkin Charger","Logitech MX Master","Sandisk Extreme","Kingston SSD",
      "Bose QC Earbuds","Apple AirPods Pro","Samsung EVO Plus","Razer Mouse","Corsair K70"
    ],
    Monitors: [
      "Dell UltraSharp","LG UltraFine","Asus ProArt","Samsung Odyssey","Acer Predator",
      "BenQ PD2700","HP Z27","Philips Brilliance","ViewSonic Elite","MSI Optix"
    ]
  };

  const priceMap = (function(){
    const map = {};
    const phonePrices = [140000, 95000, 65000, 72000, 50000, 42000, 45000, 97000, 40000, 47000];
    itemsByCategory.Phones.forEach((n,i)=>map[n]=phonePrices[i]);

    const laptopPrices = [220000, 150000, 170000, 180000, 200000, 90000, 120000, 240000, 160000, 210000];
    itemsByCategory.Laptops.forEach((n,i)=>map[n]=laptopPrices[i]);

    const printerPrices = [28000, 12000, 35000, 11000, 15000, 16000, 7000, 25000, 19000, 23000];
    itemsByCategory.Printers.forEach((n,i)=>map[n]=printerPrices[i]);

    const tabletPrices = [90000, 85000, 20000, 75000, 30000, 36000, 42000, 27000, 23000, 22000];
    itemsByCategory.Tablets.forEach((n,i)=>map[n]=tabletPrices[i]);

    const cameraPrices = [320000, 250000, 210000, 170000, 140000, 180000, 450000, 190000, 50000, 48000];
    itemsByCategory.Cameras.forEach((n,i)=>map[n]=cameraPrices[i]);

    const speakerPrices = [35000, 20000, 45000, 40000, 28000, 18000, 36000, 25000, 65000, 12000];
    itemsByCategory.Speakers.forEach((n,i)=>map[n]=speakerPrices[i]);

    const routerPrices = [12000, 24000, 15000, 13000, 9000, 20000, 18000, 35000, 14000, 7000];
    itemsByCategory.Routers.forEach((n,i)=>map[n]=routerPrices[i]);

    const wearPrices = [45000, 32000, 26000, 22000, 18000, 15000, 21000, 28000, 17000, 4000];
    itemsByCategory.Wearables.forEach((n,i)=>map[n]=wearPrices[i]);

    const accPrices = [12000, 2500, 12000, 4500, 9000, 28000, 30000, 3500, 4500, 15000];
    itemsByCategory.Accessories.forEach((n,i)=>map[n]=accPrices[i]);

    const monitorPrices = [120000, 110000, 90000, 170000, 150000, 65000, 36000, 45000, 40000, 50000];
    itemsByCategory.Monitors.forEach((n,i)=>map[n]=monitorPrices[i]);

    return map;
  })();

  const products = [];
  let imgIndex = 10;
  Object.keys(itemsByCategory).forEach(cat=>{
    itemsByCategory[cat].forEach((name, idx)=>{
      const id = `${cat.slice(0,3).toLowerCase()}-${idx+1}`;
      const price = priceMap[name] || 9999;
      const rating = 0;
      products.push({
        id,
        name,
        category: cat,
        price,
        rating,
        img: `../images/picture${imgIndex++}.jpg`,
        description: `${name} is a ${cat.toLowerCase().slice(0, -1)} designed for everyday users. It offers reliable performance, modern design and good value for money. Ideal for those who want a dependable ${cat.toLowerCase().slice(0, -1)} without compromise.`
      });
    });
  });

  window.SHOPWAVE_PRODUCTS = products;

  // ---------- LocalStorage helpers ----------
  function getRatingsFor(id){ return readJSON(`ratings-${id}`, []); }
  function pushRating(id, value){
    const arr = getRatingsFor(id);
    arr.push(value);
    saveJSON(`ratings-${id}`, arr);
    return arr;
  }
  function avgRatingFromArr(arr){
    if(!arr || !arr.length) return 0;
    const s = arr.reduce((a,b)=>a+b,0);
    return Math.round((s/arr.length) * 10) / 10;
  }

  function addToCart(productId, qty=1){
    // require login
    if(!ensureLoggedIn('cart.html')) return;
    const cart = readJSON('cart', []);
    const prod = products.find(p=>p.id===productId);
    if(!prod) return;
    const existing = cart.find(i=>i.id===productId);
    if(existing){ existing.qty += qty; existing.addedAt = Date.now(); }
    else cart.push({ id: productId, name: prod.name, price: prod.price, qty, addedAt: Date.now() });
    saveJSON('cart', cart);
    return cart;
  }

  function setBuyNow(productId, qty=1){
    // require login
    if(!ensureLoggedIn('checkout.html')) return;
    const prod = products.find(p=>p.id===productId);
    if(!prod) return;
    const buyNow = { id: productId, name: prod.name, price: prod.price, qty, addedAt: Date.now() };
    saveJSON('buyNow', buyNow);
    return buyNow;
  }

  // ---------- Theme Toggle ----------
  function initTheme(){
    const toggle = qs('#themeToggle') || qs('#themeToggleProd') || null;
    const saved = localStorage.getItem('shopwave-theme') || 'dark';
    document.body.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
    if(toggle){
      toggle.addEventListener('click', ()=>{
        const cur = document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const next = cur === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('shopwave-theme', next);
      });
    }
  }

  // ---------- Nav show/hide for login/register ----------
  function updateNavAuthUI(){
    const show = isLoggedIn();
    qsa('.login-btn').forEach(el => el.style.display = show ? 'none' : '');
    qsa('.register-btn').forEach(el => el.style.display = show ? 'none' : '');
    // If logged out, ensure account icon remains but clicking it can go to login
    qsa('.icon-btn').forEach(el=>{
      // keep buttons as they are (account and cart icons)
    });
  }

  // ---------- Home page logic ----------
  function initHome(){
    // update nav
    updateNavAuthUI();

    // wire filter button that toggles filterSidebar (if present)
    const filterBtn = qs('#filterToggle');
    const filterSidebar = qs('#filterSidebar');
    if(filterBtn && filterSidebar){
      filterSidebar.style.display = 'none';
      let visible=false;
      filterBtn.addEventListener('click', (ev)=>{
        visible=!visible;
        filterSidebar.style.display = visible ? 'block' : 'none';
      });
      document.addEventListener('click', (ev)=>{
        if(!visible) return;
        if(filterSidebar.contains(ev.target) || filterBtn.contains(ev.target)) return;
        visible=false; filterSidebar.style.display='none';
      });
    }

    // Search on home - reads top input and filters if present => go to products.html with params
    const searchBtn = qs('#searchBtn');
    const searchInput = qs('#searchInput');
    function performHomeSearch(){
      const q = (searchInput && searchInput.value || '').trim();
      const category = (qs('#filterCategory') && qs('#filterCategory').value) || '';
      const min = (qs('#filterMin') && qs('#filterMin').value) || '';
      const max = (qs('#filterMax') && qs('#filterMax').value) || '';
      const ratingEl = document.querySelector('#filterSidebar input[name="rating"]:checked');
      const rating = ratingEl ? ratingEl.value : '';

      const params = new URLSearchParams();
      if(q) params.set('q', q);
      if(category) params.set('category', category);
      if(min) params.set('min', min);
      if(max) params.set('max', max);
      if(rating) params.set('rating', rating);
      // save to recent searches for recommendation preference
      const recent = readJSON('shopwave-recent', []);
      recent.unshift({ q, category, min, max, rating, time: Date.now() });
      saveJSON('shopwave-recent', recent.slice(0,10));
      // browse/search requires login
      if(!ensureLoggedIn(`products.html?${params.toString()}`)) return;
      location.href = `products.html?${params.toString()}`;
    }
    if(searchBtn) searchBtn.addEventListener('click', performHomeSearch);
    if(searchInput) searchInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') performHomeSearch(); });

    // === NEW: wire Apply / Reset buttons on home filter ===
    const applyHomeBtn = qs('#applyFilter');
    const resetHomeBtn = qs('#resetFilter');
    if(applyHomeBtn) applyHomeBtn.addEventListener('click', performHomeSearch);
    if(resetHomeBtn) resetHomeBtn.addEventListener('click', ()=>{
      const cat = qs('#filterCategory'); if(cat) cat.selectedIndex = 0;
      const min = qs('#filterMin'); if(min) min.value = '';
      const max = qs('#filterMax'); if(max) max.value = '';
      const any = qs('#filterSidebar input[name="rating"][value=""]');
      if(any) any.checked = true;
    });

    // categories buttons on home -> search that category
    qsa('.categories .cat').forEach(b=>{
      b.addEventListener('click', ()=>{
        const category = b.textContent.trim();
        const params = new URLSearchParams();
        params.set('category', category);
        const recent = readJSON('shopwave-recent', []);
        recent.unshift({ q:'', category, time: Date.now() });
        saveJSON('shopwave-recent', recent.slice(0,10));
        // require login to view products
        if(!ensureLoggedIn(`products.html?${params.toString()}`)) return;
        location.href = `products.html?${params.toString()}`;
      });
    });

    // Recommended rendering
    const recRoot = qs('#recommendedGrid');
    if(!recRoot) return;

    function pickRecommended(){
      const recent = readJSON('shopwave-recent', []);
      let preferCat = null;
      for(let r of recent){
        if(r.category) { preferCat = r.category; break; }
        if(r.q){
          const ql = r.q.toLowerCase();
          for(const c of categories){
            if(ql.includes(c.toLowerCase().slice(0,4))){ preferCat = c; break; }
          }
          if(preferCat) break;
        }
      }
      let pool = products.slice();
      if(preferCat) pool = pool.filter(p=>p.category===preferCat);
      for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
      return pool.slice(0,3);
    }

    function renderRecommended(){
      recRoot.innerHTML = '';
      const list = pickRecommended();
      list.forEach(p=>{
        const el = document.createElement('article');
        el.className = 'product-card';
        el.innerHTML = `
          <div class="thumb" style="background-image:url('${p.img}')"></div>
          <h3>${p.name}</h3>
          <p class="price">${formatPrice(p.price)}</p>
          <div class="card-actions">
            <button class="btn small view-btn" data-id="${p.id}">View</button>
            <button class="btn small ghost addcart" data-id="${p.id}">Add to cart</button>
            <button class="btn small primary buynow" data-id="${p.id}">Buy now</button>
          </div>
        `;
        recRoot.appendChild(el);
      });

      // attach handlers
      recRoot.querySelectorAll('.view-btn').forEach(b=>{
        b.addEventListener('click', (ev)=>{
          const id = b.dataset.id;
          const prod = products.find(x=>x.id===id);
          const intended = `products.html#${id}`;
          // if not logged in, go to login
          if(!ensureLoggedIn(intended)) return;
          const recent = readJSON('shopwave-recent', []);
          if(prod){ recent.unshift({ q: prod.name, category: prod.category, time: Date.now() }); saveJSON('shopwave-recent', recent.slice(0,10)); }
          location.href = intended;
        });
      });

      recRoot.querySelectorAll('.addcart').forEach(b=>{
        b.addEventListener('click', ()=> {
          addToCart(b.dataset.id, 1);
          if(isLoggedIn()) alert('Added to cart');
        });
      });

      recRoot.querySelectorAll('.buynow').forEach(b=>{
        b.addEventListener('click', ()=> {
          setBuyNow(b.dataset.id, 1);
          // setBuyNow will redirect to checkout if logged in
        });
      });
    }

    renderRecommended();
    setInterval(renderRecommended, 15000);
    // set footer year
    const y = qs('#year'); if(y) y.textContent = new Date().getFullYear();

    // Hook Browse Products button (home)
    const browseBtn = qs('#browseProductsBtn');
    if(browseBtn){
      browseBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        const intended = browseBtn.getAttribute('href') || 'products.html';
        if(!ensureLoggedIn(intended)) return;
        location.href = intended;
      });
    }
  }

  // ---------- Products page logic ----------
  function initProducts(){
    // update nav
    updateNavAuthUI();

    const grid = qs('#productsGrid');
    if(!grid) return;

    // Toggle filter sidebar (prod)
    const ftBtn = qs('#filterToggleProd');
    const ftSide = qs('#filterSidebarProd');
    if(ftBtn && ftSide){
      ftSide.style.display = 'none';
      let open = false;
      ftBtn.addEventListener('click', ()=>{ open = !open; ftSide.style.display = open ? 'block' : 'none'; });
      document.addEventListener('click', (ev)=>{
        if(!open) return;
        if(ftSide.contains(ev.target) || ftBtn.contains(ev.target)) return;
        open = false; ftSide.style.display = 'none';
      });
    }

    // Render product cards (filtered based on query params)
    function applyQueryFilters(list){
      const url = new URL(location.href);
      const params = url.searchParams;
      const rawq = (params.get('q') || '').trim().toLowerCase();
      const category = (params.get('category') || '').trim();
      const min = parseFloat(params.get('min')) || null;
      const max = parseFloat(params.get('max')) || null;
      const rating = parseFloat(params.get('rating')) || null;

      // split rawq into tokens to match any of them
      const tokens = rawq ? rawq.split(/[\s,]+|and/).map(t=>t.trim()).filter(Boolean) : [];

      let out = list.slice();
      if(tokens.length){
        out = out.filter(p => {
          const name = p.name.toLowerCase();
          const cat = p.category.toLowerCase();
          // match if any token appears in name or category
          return tokens.some(tok => name.includes(tok) || cat.includes(tok));
        });
      }
      if(category){
        out = out.filter(p => p.category === category);
      }
      if(min !== null){
        out = out.filter(p => p.price >= min);
      }
      if(max !== null){
        out = out.filter(p => p.price <= max);
      }
      if(rating){
        out = out.filter(p => {
          const arr = getRatingsFor(p.id);
          const avg = avgRatingFromArr(arr);
          return avg >= rating;
        });
      }
      return out;
    }

    function renderAll(list){
      grid.innerHTML = '';
      list.forEach(p=>{
        const avg = avgRatingFromArr(getRatingsFor(p.id));
        const card = document.createElement('article');
        card.className = 'card';
        card.id = p.id;
        card.setAttribute('data-category', p.category);
        card.setAttribute('data-price', p.price);
        card.setAttribute('data-rating', avg);
        card.innerHTML = `
          <img src="${p.img}" alt="${p.name}" onerror="this.style.opacity=0.6">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <div>
              <div style="font-weight:800">${p.name}</div>
              <div class="cat">${p.category} • <span class="price">${formatPrice(p.price)}</span></div>
            </div>
            <div style="text-align:right">
              <div class="rating">★ ${avg}</div>
              <div style="margin-top:8px">
                <button class="btn small view-local" data-id="${p.id}">View</button>
                <button class="btn small ghost addcart" data-id="${p.id}">Add to cart</button>
                <button class="btn small primary buynow" data-id="${p.id}">Buy now</button>
              </div>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });

      // Wire view-local (open modal) — require login
      grid.querySelectorAll('.view-local').forEach(b=>{
        b.addEventListener('click', (ev)=>{
          const id = b.dataset.id;
          if(!ensureLoggedIn(`products.html#${id}`)) return;
          openProductModal(id);
        });
      });

      // Wire addcart
      grid.querySelectorAll('.addcart').forEach(b=>{
        b.addEventListener('click', ()=>{
          addToCart(b.dataset.id, 1);
          if(isLoggedIn()) alert('Added to cart');
        });
      });

      // Wire buynow
      grid.querySelectorAll('.buynow').forEach(b=>{
        b.addEventListener('click', ()=>{
          setBuyNow(b.dataset.id, 1);
          // setBuyNow will redirect if logged in
        });
      });
    }

    // initial render
    const filtered = applyQueryFilters(products);
    renderAll(filtered);

    // highlight if hash present (#id)
    function highlightFromHash(){
      const hash = location.hash.replace('#','');
      if(!hash) return;
      const el = document.getElementById(hash);
      if(!el) return;
      el.scrollIntoView({behavior:'smooth', block:'center'});
      el.classList.add('highlight');
      setTimeout(()=>el.classList.remove('highlight'), 2000);
    }

    // also accept ?highlight= param for compatibility
    const urlParams = new URL(location.href).searchParams;
    const highlightParam = urlParams.get('highlight');
    if(highlightParam){
      location.hash = `#${highlightParam}`;
    }
    highlightFromHash();
    window.addEventListener('hashchange', highlightFromHash);

    // search on products page
    const searchBtn = qs('#searchBtnProd');
    const searchInput = qs('#searchInputProd');
    function performSearchProd(){
      const q = (searchInput && searchInput.value || '').trim();
      const category = qs('#filterCategoryProd') ? qs('#filterCategoryProd').value : '';
      const min = qs('#filterMinProd') ? qs('#filterMinProd').value : '';
      const max = qs('#filterMaxProd') ? qs('#filterMaxProd').value : '';
      const ratingEl = document.querySelector('#filterSidebarProd input[name="ratingProd"]:checked');
      const rating = ratingEl ? ratingEl.value : '';
      const params = new URLSearchParams();
      if(q) params.set('q', q);
      if(category) params.set('category', category);
      if(min) params.set('min', min);
      if(max) params.set('max', max);
      if(rating) params.set('rating', rating);
      // save recent
      const recent = readJSON('shopwave-recent', []);
      recent.unshift({ q, category, min, max, rating, time: Date.now() });
      saveJSON('shopwave-recent', recent.slice(0,10));
      location.href = `products.html?${params.toString()}`;
    }
    if(searchBtn) searchBtn.addEventListener('click', performSearchProd);
    if(searchInput) searchInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') performSearchProd(); });
    qs('#applyFilterProd') && qs('#applyFilterProd').addEventListener('click', performSearchProd);
    qs('#resetFilterProd') && qs('#resetFilterProd').addEventListener('click', ()=>{ location.href='products.html'; });

    // set footer year
    const y = qs('#yearProd'); if(y) y.textContent = new Date().getFullYear();

    // create product modal DOM (only once)
    createModalDOM();
  }

  // ---------- Modal (product view) ----------
  function createModalDOM(){
    if(qs('#productModal')) return;
    const modal = document.createElement('div');
    modal.id = 'productModal';
    modal.style.position='fixed';
    modal.style.inset='0';
    modal.style.display='none';
    modal.style.alignItems='center';
    modal.style.justifyContent='center';
    modal.style.zIndex='200';
    modal.innerHTML = `
      <div style="width:90%;max-width:900px;background:var(--card);border-radius:12px;padding:18px;box-shadow:0 30px 80px rgba(0,0,0,0.7);color:var(--text);position:relative">
        <button id="closeModal" class="btn" style="position:absolute;right:12px;top:12px">Close</button>
        <div style="display:flex;gap:16px;align-items:flex-start">
          <img id="modalImg" src="" alt="" style="width:45%;height:240px;object-fit:cover;border-radius:8px;background:#222">
          <div style="flex:1">
            <h2 id="modalTitle" style="margin:0 0 6px"></h2>
            <div id="modalPrice" style="font-weight:800;margin-bottom:8px"></div>
            <div id="modalDesc" style="color:var(--muted);margin-bottom:12px"></div>
            <div style="margin-bottom:12px">
              <label>Quantity: <input id="modalQty" type="number" min="1" value="1" style="width:70px;padding:6px;border-radius:6px;border:none"></label>
            </div>
            <div style="margin-bottom:12px">
              <div style="margin-bottom:6px">Your rating:</div>
              <div id="modalStars" style="font-size:1.3rem; margin-bottom:8px;"></div>
              <button id="submitRating" class="btn small">Submit Rating</button>
            </div>
            <div style="display:flex;gap:8px">
              <button id="modalAddCart" class="btn ghost">Add to cart</button>
              <button id="modalBuyNow" class="btn primary">Buy now</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    qs('#closeModal').addEventListener('click', ()=> { modal.style.display='none'; });
    modal.addEventListener('click', (ev)=>{ if(ev.target === modal) modal.style.display='none'; });

    qs('#modalStars').addEventListener('click', (ev) => {
      if(ev.target.dataset && ev.target.dataset.star){
        const val = parseInt(ev.target.dataset.star);
        updateModalStars(val);
        qs('#modalStars').dataset.selected = val;
      }
    });

    qs('#submitRating').addEventListener('click', ()=>{
      const modalEl = qs('#productModal');
      const pid = modalEl.dataset.pid;
      const sel = parseInt(qs('#modalStars').dataset.selected || '0');
      if(!pid) return alert('No product selected');
      if(!sel || sel < 1 || sel > 5) return alert('Please select 1-5 stars');
      const arr = pushRating(pid, sel);
      const avg = avgRatingFromArr(arr);
      const card = document.getElementById(pid);
      if(card) {
        const ratingEl = card.querySelector('.rating');
        if(ratingEl) ratingEl.textContent = `★ ${avg}`;
      }
      alert(`Thanks! You rated ${sel}★ — new average ${avg}★`);
    });

    qs('#modalAddCart').addEventListener('click', ()=>{
      const modalEl = qs('#productModal');
      const pid = modalEl.dataset.pid;
      const qty = parseInt(qs('#modalQty').value) || 1;
      if(!pid) return;
      addToCart(pid, qty);
      if(isLoggedIn()) alert('Added to cart');
    });

    qs('#modalBuyNow').addEventListener('click', ()=>{
      const modalEl = qs('#productModal');
      const pid = modalEl.dataset.pid;
      const qty = parseInt(qs('#modalQty').value) || 1;
      if(!pid) return;
      setBuyNow(pid, qty);
      // redirect occurs in setBuyNow
    });
  }

  function updateModalStars(n){
    const container = qs('#modalStars');
    container.innerHTML = '';
    for(let i=1;i<=5;i++){
      const span = document.createElement('span');
      span.textContent = i <= n ? '★' : '☆';
      span.dataset.star = i;
      span.style.cursor = 'pointer';
      span.style.marginRight = '6px';
      container.appendChild(span);
    }
    container.dataset.selected = n;
  }

  function openProductModal(id){
    const product = products.find(p=>p.id === id);
    if(!product) return alert('Product not found');
    const modal = qs('#productModal');
    modal.style.display = 'flex';
    modal.dataset.pid = id;
    qs('#modalImg').src = product.img;
    qs('#modalTitle').textContent = product.name;
    qs('#modalPrice').textContent = formatPrice(product.price);
    qs('#modalDesc').textContent = product.description;
    qs('#modalQty').value = 1;
    const avg = avgRatingFromArr(getRatingsFor(id));
    updateModalStars(Math.round(avg));
  }

  // ---------- Init wiring ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    initTheme();

    // update nav auth UI on load
    updateNavAuthUI();

    if(qs('#recommendedGrid') && location.pathname.indexOf('home.html') !== -1) initHome();
    if(qs('#productsGrid') && location.pathname.indexOf('products.html') !== -1) initProducts();

    if(location.pathname.endsWith('/') || location.pathname.endsWith('/index.html')) {
      if(qs('#recommendedGrid')) initHome();
    }
  });

})();



