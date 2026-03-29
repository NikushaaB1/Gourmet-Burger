/**
 * Gourmet Burger — script.js  v3.0
 * Firebase Auth (Email + Google) | Firestore Orders | EmailJS | Admin Panel
 * Reviews | Search | Cart | Toast | Modals
 */
'use strict';

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
let allItems        = [];
let activeCategory  = 'burger';
let cart            = [];
let currentUser     = null;
let currentProfile  = {};
let allOrders       = [];
let searchQuery     = '';

const ADMIN_EMAILS = ['admin@burger.com', 'nikolozgurgenidze3@gmail.com'];

const BADGE_CONFIG = {
  vegan:   { cls: 'badge--vegan',   icon: '🌱' },
  new:     { cls: 'badge--new',     icon: '⭐' },
  popular: { cls: 'badge--popular', icon: '❤️' },
};

/* ══════════════════════════════════════════════
   DOM CACHE
══════════════════════════════════════════════ */
let $tabsContainer, $menuGrid, $cartCount, $toastEl,
    $modalOverlay, $modalImg, $modalBadges, $modalName, $modalDesc, $modalPrice, $modalAddBtn,
    $loginOverlay, $navSidebar, $navOverlay, $menuToggle, $searchInput;

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  cacheDOM();
  attachListeners();
  loadCart();

  // Firebase auth state
  if (window.fbAuth) {
    window.fbAuth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = { uid: user.uid, email: user.email, name: user.displayName || user.email.split('@')[0] };
        await afterLogin();
      } else {
        currentUser = null;
        showLoginUI();
      }
    });
  } else {
    // fallback: check localStorage demo login
    const saved = localStorage.getItem('demoUser');
    if (saved) {
      currentUser = JSON.parse(saved);
      afterLogin();
    } else {
      showLoginUI();
    }
  }
});

function cacheDOM() {
  $tabsContainer = document.getElementById('category-tabs');
  $menuGrid      = document.getElementById('menu-grid');
  $cartCount     = document.getElementById('cart-count');
  $toastEl       = document.getElementById('toast');
  $modalOverlay  = document.getElementById('modal-overlay');
  $modalImg      = document.getElementById('modal-img');
  $modalBadges   = document.getElementById('modal-badges');
  $modalName     = document.getElementById('modal-name');
  $modalDesc     = document.getElementById('modal-desc');
  $modalPrice    = document.getElementById('modal-price');
  $modalAddBtn   = document.getElementById('modal-add-btn');
  $loginOverlay  = document.getElementById('login-overlay');
  $navSidebar    = document.getElementById('nav-sidebar');
  $navOverlay    = document.getElementById('nav-overlay');
  $menuToggle    = document.getElementById('menu-toggle');
  $searchInput   = document.getElementById('search-input');
}

function attachListeners() {
  // Nav
  $menuToggle?.addEventListener('click', openNav);
  document.getElementById('nav-close')?.addEventListener('click', closeNav);
  $navOverlay?.addEventListener('click', closeNav);

  // Auth forms
  document.getElementById('login-form')?.addEventListener('submit', handleEmailLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  document.getElementById('btn-google-login')?.addEventListener('click', handleGoogleLogin);
  document.getElementById('btn-google-register')?.addEventListener('click', handleGoogleLogin);

  // Search
  $searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderMenu();
  });
  document.getElementById('search-clear')?.addEventListener('click', () => {
    $searchInput.value = '';
    searchQuery = '';
    renderMenu();
  });

  // Modal close
  $modalOverlay?.addEventListener('click', (e) => { if (e.target === $modalOverlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeNav(); } });

  // Cart bubble
  document.getElementById('cart-bubble')?.addEventListener('click', openCartModal);

  // Admin form
  document.getElementById('add-product-form')?.addEventListener('submit', handleAddProduct);

  // Checkout
  document.getElementById('btn-checkout')?.addEventListener('click', handleCheckout);
}

/* ══════════════════════════════════════════════
   AUTH — EMAIL LOGIN
══════════════════════════════════════════════ */
async function handleEmailLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';

  // Demo shortcut
  const DEMO = [
    { email: 'admin@burger.com', password: 'admin123', name: 'Admin' },
    { email: 'user@test.com',    password: 'user1234', name: 'Test User' },
  ];
  const demo = DEMO.find(u => u.email === email && u.password === password);
  if (demo) {
    currentUser = { uid: 'demo_' + demo.email, email: demo.email, name: demo.name, demo: true };
    localStorage.setItem('demoUser', JSON.stringify(currentUser));
    showToast('✅ Welcome, ' + demo.name + '!');
    await afterLogin();
    return;
  }

  // Real Firebase
  try {
    setBtnLoading('btn-email-login', true);
    const cred = await window.fbAuth.signInWithEmailAndPassword(email, password);
    currentUser = { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName || email.split('@')[0] };
    showToast('✅ Welcome back!');
  } catch (err) {
    errEl.textContent = firebaseErrMsg(err.code);
  } finally {
    setBtnLoading('btn-email-login', false);
  }
}

/* ══════════════════════════════════════════════
   AUTH — REGISTER
══════════════════════════════════════════════ */
async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('register-error');
  errEl.textContent = '';

  try {
    setBtnLoading('btn-email-register', true);
    const cred = await window.fbAuth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    await window.fbDb.collection('users').doc(cred.user.uid).set({ name, email, role: 'user', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    showToast('🎉 Account created!');
  } catch (err) {
    errEl.textContent = firebaseErrMsg(err.code);
  } finally {
    setBtnLoading('btn-email-register', false);
  }
}

/* ══════════════════════════════════════════════
   AUTH — GOOGLE LOGIN
══════════════════════════════════════════════ */
async function handleGoogleLogin() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await window.fbAuth.signInWithPopup(provider);
    showToast('✅ Signed in with Google!');
  } catch (err) {
    showToast('❌ Google sign-in failed: ' + err.message);
  }
}

/* ══════════════════════════════════════════════
   AUTH — LOGOUT
══════════════════════════════════════════════ */
async function handleLogout() {
  if (!confirm('Logout?')) return;
  closeNav();
  if (currentUser?.demo) {
    localStorage.removeItem('demoUser');
    currentUser = null;
    cart = [];
    saveCart();
    showLoginUI();
  } else {
    await window.fbAuth?.signOut();
  }
  showToast('👋 Logged out');
}

/* ══════════════════════════════════════════════
   AFTER LOGIN
══════════════════════════════════════════════ */
async function afterLogin() {
  await loadMenuData();
  loadProfile();
  await loadOrdersFromFirebase();
  renderTabs();
  renderMenu();
  updateCartBubble();
  showMenuUI();
  updateAdminUI();
}

function showLoginUI() {
  document.getElementById('login-overlay').classList.add('open');
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('site-footer').style.display = 'none';
  $menuToggle.style.display = 'none';
  document.getElementById('user-info-mini').style.display = 'none';
  document.body.style.overflow = 'hidden';
}

function showMenuUI() {
  document.getElementById('login-overlay').classList.remove('open');
  document.getElementById('main-content').style.display = 'block';
  document.getElementById('site-footer').style.display = 'block';
  $menuToggle.style.display = 'flex';
  const mini = document.getElementById('user-info-mini');
  mini.style.display = 'flex';
  document.getElementById('username-mini').textContent = currentUser.name;
  document.body.style.overflow = '';
}

function updateAdminUI() {
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email);
  document.getElementById('admin-link').style.display = isAdmin ? 'flex' : 'none';
}

function switchToRegister() {
  document.getElementById('login-overlay').classList.remove('open');
  document.getElementById('register-overlay').classList.add('open');
}
function switchToLogin() {
  document.getElementById('register-overlay').classList.remove('open');
  document.getElementById('login-overlay').classList.add('open');
}

/* ══════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════ */
function openNav()  { $navSidebar.classList.add('open'); $navOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeNav() { $navSidebar.classList.remove('open'); $navOverlay.classList.remove('open'); document.body.style.overflow = ''; }

/* ══════════════════════════════════════════════
   LOAD MENU DATA
══════════════════════════════════════════════ */
async function loadMenuData() {
  try {
    const res  = await fetch('data/Data.json');
    const data = await res.json();
    allItems = data.menu || [];
    // Merge admin-added products from localStorage
    const extra = JSON.parse(localStorage.getItem('admin_products') || '[]');
    allItems = [...allItems, ...extra];
  } catch (err) {
    console.error('Data load error:', err);
    allItems = [];
  }
}

/* ══════════════════════════════════════════════
   RENDER TABS
══════════════════════════════════════════════ */
function renderTabs() {
  const cats = [...new Set(allItems.map(i => i.category))];
  $tabsContainer.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (cat === activeCategory ? ' active' : '');
    btn.textContent = capitalize(cat);
    btn.addEventListener('click', () => switchCategory(cat));
    $tabsContainer.appendChild(btn);
  });
}

function switchCategory(cat) {
  activeCategory = cat;
  $tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === cat));
  renderMenu();
}

/* ══════════════════════════════════════════════
   RENDER MENU
══════════════════════════════════════════════ */
function renderMenu() {
  let filtered = allItems.filter(i => i.category === activeCategory);
  if (searchQuery) {
    filtered = allItems.filter(i =>
      i.name.toLowerCase().includes(searchQuery) ||
      i.description.toLowerCase().includes(searchQuery) ||
      i.category.toLowerCase().includes(searchQuery)
    );
  }

  $menuGrid.innerHTML = '';
  if (!filtered.length) {
    $menuGrid.innerHTML = `<div class="empty-state"><div class="es-icon">🔍</div><h3>No results for "${searchQuery || activeCategory}"</h3></div>`;
    return;
  }
  filtered.forEach((item, i) => $menuGrid.appendChild(buildCard(item, i)));
}

/* ══════════════════════════════════════════════
   BUILD CARD
══════════════════════════════════════════════ */
function buildCard(item, idx) {
  const card = document.createElement('article');
  card.className = 'menu-card';
  card.style.animationDelay = idx * 0.07 + 's';
  const inCart = cart.some(c => c.id === item.id);
  const imgSrc = item.image.startsWith('http') ? item.image : 'Images/' + item.image.split('/').pop();

  card.innerHTML = `
    <div class="card__image-wrap">
      <img src="${imgSrc}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'">
      <div class="card__badges">${badgesHTML(item.badges)}</div>
      <button class="card__info-btn" title="Details">i</button>
    </div>
    <div class="card__body">
      <h3 class="card__name">${item.name}</h3>
      <p class="card__desc">${item.description}</p>
    </div>
    <div class="card__footer">
      <span class="card__price">$${item.price.toFixed(2)}</span>
      <button class="btn-select${inCart?' added':''}">${inCart?'ADDED ✓':'SELECT'}</button>
    </div>`;

  card.querySelector('.card__info-btn').addEventListener('click', () => openModal(item));
  card.querySelector('.btn-select').addEventListener('click', e => addToCart(item, e.currentTarget));
  return card;
}

function badgesHTML(badges = []) {
  return badges.map(b => {
    const c = BADGE_CONFIG[b.type] || { cls: '', icon: '' };
    return `<span class="badge ${c.cls}"><span>${c.icon}</span>${b.label}</span>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   CART
══════════════════════════════════════════════ */
function addToCart(item, btn) {
  const idx = cart.findIndex(c => c.id === item.id);
  if (idx > -1) {
    cart.splice(idx, 1);
    btn.textContent = 'SELECT';
    btn.classList.remove('added');
    showToast('🗑 Removed: ' + item.name);
  } else {
    cart.push({ ...item, qty: 1 });
    btn.textContent = 'ADDED ✓';
    btn.classList.add('added');
    showToast('🍔 Added: ' + item.name);
    const bubble = document.getElementById('cart-bubble');
    bubble.style.transform = 'scale(1.3)';
    setTimeout(() => bubble.style.transform = '', 250);
  }
  updateCartBubble();
  saveCart();
}

function updateCartBubble() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  $cartCount.textContent = total;
  $cartCount.style.display = total ? 'flex' : 'none';
}

function saveCart()  { localStorage.setItem('cart', JSON.stringify(cart)); }
function loadCart()  { try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; } }

/* ══════════════════════════════════════════════
   CART MODAL
══════════════════════════════════════════════ */
function openCartModal() {
  const overlay = document.getElementById('cart-overlay');
  const list    = document.getElementById('cart-items-list');
  const totalEl = document.getElementById('cart-total');

  if (!cart.length) {
    list.innerHTML = '<p class="cart-empty">🛒 Your cart is empty</p>';
    totalEl.textContent = '$0.00';
  } else {
    list.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item__info">
          <span class="cart-item__name">${item.name}</span>
          <div class="cart-item__qty-wrap">
            <button onclick="changeQty(${item.id},-1)" class="qty-btn">−</button>
            <span class="qty-val">${item.qty}</span>
            <button onclick="changeQty(${item.id},1)"  class="qty-btn">+</button>
          </div>
        </div>
        <span class="cart-item__price">$${(item.price * item.qty).toFixed(2)}</span>
      </div>`).join('');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    totalEl.textContent = '$' + total.toFixed(2);
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartModal() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartBubble();
  openCartModal(); // re-render
}

/* ══════════════════════════════════════════════
   CHECKOUT + FIREBASE + EMAILJS
══════════════════════════════════════════════ */
async function handleCheckout() {
  if (!cart.length) { showToast('🛒 Cart is empty!'); return; }

  const profile = loadProfile();
  if (!profile.address) {
    showToast('📍 Please fill in your delivery address first!');
    closeCartModal();
    openProfileModal();
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const order = {
    userId:    currentUser.uid,
    userEmail: currentUser.email,
    userName:  currentUser.name,
    items:     cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
    total:     parseFloat(total.toFixed(2)),
    address:   profile.address,
    phone:     profile.phone || '',
    status:    'pending',
    createdAt: new Date().toISOString()
  };

  setBtnLoading('btn-checkout', true);

  // Save to Firestore
  let orderId = 'local_' + Date.now();
  try {
    if (window.fbDb) {
      const docRef = await window.fbDb.collection('orders').add({ ...order, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      orderId = docRef.id;
    }
  } catch (err) {
    console.warn('Firestore save failed:', err);
    // Save locally as fallback
    const local = JSON.parse(localStorage.getItem('localOrders') || '[]');
    local.push({ ...order, id: orderId });
    localStorage.setItem('localOrders', JSON.stringify(local));
  }

  // Send email via EmailJS
  try {
    const cfg = window.EMAILJS_CONFIG;
    if (cfg && cfg.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      await emailjs.send(cfg.serviceID, cfg.templateID, {
        to_email:      currentUser.email,
        user_name:     currentUser.name,
        order_id:      orderId,
        order_items:   order.items.map(i => `${i.name} ×${i.qty} — $${(i.price*i.qty).toFixed(2)}`).join('\n'),
        order_total:   '$' + total.toFixed(2),
        delivery_addr: profile.address,
        order_date:    new Date().toLocaleString()
      });
      showToast('📧 Confirmation email sent to ' + currentUser.email);
    }
  } catch (err) {
    console.warn('EmailJS failed:', err);
  }

  // Clear cart
  cart = [];
  saveCart();
  updateCartBubble();
  renderMenu();
  closeCartModal();
  setBtnLoading('btn-checkout', false);
  allOrders.push({ ...order, id: orderId });
  showToast('✅ Order placed! ID: ' + orderId.slice(0, 8));
}

/* ══════════════════════════════════════════════
   LOAD ORDERS FROM FIREBASE
══════════════════════════════════════════════ */
async function loadOrdersFromFirebase() {
  allOrders = [];
  try {
    if (!window.fbDb || currentUser?.demo) return;
    const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
    let query = window.fbDb.collection('orders').orderBy('createdAt', 'desc').limit(50);
    if (!isAdmin) query = query.where('userId', '==', currentUser.uid);
    const snap = await query.get();
    snap.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.warn('Orders load failed:', e);
  }
}

/* ══════════════════════════════════════════════
   ITEM MODAL
══════════════════════════════════════════════ */
function openModal(item) {
  const imgSrc = item.image.startsWith('http') ? item.image : 'Images/' + item.image.split('/').pop();
  $modalImg.src           = imgSrc;
  $modalImg.alt           = item.name;
  $modalBadges.innerHTML  = badgesHTML(item.badges);
  $modalName.textContent  = item.name;
  $modalDesc.textContent  = item.description;
  $modalPrice.textContent = '$' + item.price.toFixed(2);
  const inCart = cart.some(c => c.id === item.id);
  $modalAddBtn.textContent = inCart ? 'REMOVE FROM CART' : 'ADD TO CART';
  $modalAddBtn.className   = 'btn-select' + (inCart ? ' added' : '');

  // Ratings
  const reviewsEl = document.getElementById('modal-reviews');
  renderModalReviews(item.id, reviewsEl);

  const newBtn = $modalAddBtn.cloneNode(true);
  $modalAddBtn.parentNode.replaceChild(newBtn, $modalAddBtn);
  $modalAddBtn = newBtn;
  $modalAddBtn.addEventListener('click', () => {
    const allBtns = document.querySelectorAll('.btn-select');
    allBtns.forEach(b => { if (b.closest('.menu-card')) addToCart(item, b); });
    const cardBtn = [...document.querySelectorAll('.menu-card')].find(c => c.querySelector('.card__name')?.textContent === item.name)?.querySelector('.btn-select');
    if (cardBtn) addToCart(item, cardBtn);
    closeModal();
  });

  $modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════
   REVIEWS
══════════════════════════════════════════════ */
function getReviews(itemId) {
  return JSON.parse(localStorage.getItem('reviews_' + itemId) || '[]');
}
function saveReview(itemId, review) {
  const reviews = getReviews(itemId);
  reviews.unshift(review);
  localStorage.setItem('reviews_' + itemId, JSON.stringify(reviews.slice(0, 20)));
}

function renderModalReviews(itemId, container) {
  const reviews = getReviews(itemId);
  const avg     = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  container.innerHTML = `
    <div class="reviews-section">
      <div class="reviews-header">
        <h4>Reviews ${avg ? `<span class="avg-rating">★ ${avg}</span>` : ''}</h4>
      </div>
      <div class="reviews-list">
        ${reviews.length ? reviews.map(r => `
          <div class="review-card">
            <div class="review-top">
              <span class="review-author">${r.author}</span>
              <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
            </div>
            <p class="review-text">${r.text}</p>
          </div>`).join('') : '<p class="no-reviews">No reviews yet. Be the first!</p>'}
      </div>
      <div class="review-form">
        <p class="review-form-title">Leave a Review</p>
        <div class="star-picker" id="star-picker-${itemId}">
          ${[1,2,3,4,5].map(n => `<span class="star" data-v="${n}" onclick="pickStar(this,'${itemId}')">☆</span>`).join('')}
        </div>
        <input type="hidden" id="star-val-${itemId}" value="0">
        <textarea id="review-text-${itemId}" class="review-textarea" placeholder="Share your experience..." rows="2"></textarea>
        <button class="btn-submit-review" onclick="submitReview('${itemId}')">Submit Review</button>
      </div>
    </div>`;
}

function pickStar(el, itemId) {
  const val = parseInt(el.dataset.v);
  document.getElementById('star-val-' + itemId).value = val;
  const stars = document.querySelectorAll(`#star-picker-${itemId} .star`);
  stars.forEach((s, i) => s.textContent = i < val ? '★' : '☆');
}

function submitReview(itemId) {
  const rating = parseInt(document.getElementById('star-val-' + itemId).value);
  const text   = document.getElementById('review-text-' + itemId).value.trim();
  if (!rating) { showToast('⭐ Please select a star rating'); return; }
  if (!text)   { showToast('✏️ Please write a review'); return; }

  saveReview(itemId, {
    author: currentUser?.name || 'Guest',
    rating,
    text,
    date: new Date().toLocaleDateString()
  });
  showToast('✅ Review submitted!');
  const reviewsEl = document.getElementById('modal-reviews');
  renderModalReviews(itemId, reviewsEl);
}

/* ══════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════ */
function openProfileModal() { document.getElementById('profile-overlay').classList.add('open'); loadProfile(); }
function closeProfileModal() { document.getElementById('profile-overlay').classList.remove('open'); }

function loadProfile() {
  const p = JSON.parse(localStorage.getItem('profile_' + (currentUser?.uid || 'guest')) || '{}');
  currentProfile = p;
  const f = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  f('profile-name', p.name || currentUser?.name);
  f('profile-email', currentUser?.email);
  f('profile-phone', p.phone);
  f('profile-address', p.address);
  f('profile-city', p.city);
  return p;
}

function saveProfile() {
  const g = id => document.getElementById(id)?.value.trim() || '';
  const profile = { name: g('profile-name'), phone: g('profile-phone'), address: g('profile-address'), city: g('profile-city') };
  localStorage.setItem('profile_' + (currentUser?.uid || 'guest'), JSON.stringify(profile));
  currentProfile = profile;
  showToast('✅ Profile saved!');
  closeProfileModal();
}

/* ══════════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════════ */
function openAdminPanel() {
  if (!ADMIN_EMAILS.includes(currentUser?.email)) { showToast('⛔ Admin only'); return; }
  document.getElementById('admin-overlay').classList.add('open');
  loadAdminData();
}
function closeAdminPanel() { document.getElementById('admin-overlay').classList.remove('open'); }

function switchAdminTab(tab, el) {
  document.querySelectorAll('.admin-tab-content').forEach(e => e.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(e => e.classList.remove('active'));
  document.getElementById('admin-' + tab).classList.add('active');
  el.classList.add('active');
}

function loadAdminData() {
  // Products table
  const extra = JSON.parse(localStorage.getItem('admin_products') || '[]');
  const all   = [...allItems];
  let html = '';
  all.forEach(item => {
    html += `<tr>
      <td><img src="${item.image.startsWith('http') ? item.image : 'Images/'+item.image.split('/').pop()}" style="width:40px;height:40px;object-fit:cover;border-radius:6px"></td>
      <td>${item.name}</td>
      <td>${capitalize(item.category)}</td>
      <td>$${parseFloat(item.price).toFixed(2)}</td>
      <td><button class="admin-del-btn" onclick="deleteProduct(${item.id})">🗑 Delete</button></td>
    </tr>`;
  });
  document.getElementById('admin-products-list').innerHTML = html || '<tr><td colspan="5">No products</td></tr>';

  // Stats
  const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
  const orders = [...allOrders, ...localOrders];
  document.getElementById('stat-orders').textContent  = orders.length;
  document.getElementById('stat-revenue').textContent = '$' + orders.reduce((s, o) => s + (o.total || 0), 0).toFixed(2);
  document.getElementById('stat-users').textContent   = allItems.length;

  // Orders table
  const localO = JSON.parse(localStorage.getItem('localOrders') || '[]');
  const allO   = [...allOrders, ...localO];
  let oHtml = '';
  allO.forEach(o => {
    oHtml += `<tr>
      <td>#${(o.id || '').slice(0,8)}</td>
      <td>${o.userName || o.userEmail}</td>
      <td>$${parseFloat(o.total||0).toFixed(2)}</td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
    </tr>`;
  });
  document.getElementById('admin-orders-list').innerHTML = oHtml || '<tr><td colspan="4">No orders yet</td></tr>';
}

function openAddProductForm() { document.getElementById('add-product-overlay').classList.add('open'); }
function closeAddProductForm() { document.getElementById('add-product-overlay').classList.remove('open'); }

function handleAddProduct(e) {
  e.preventDefault();
  const g = id => document.getElementById(id)?.value.trim();
  const product = {
    id:          Date.now(),
    name:        g('product-name'),
    category:    g('product-category'),
    price:       parseFloat(g('product-price')),
    description: g('product-desc'),
    image:       g('product-image') || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    badges:      (g('product-badges') || '').split(',').filter(Boolean).map(b => ({ label: capitalize(b.trim()), type: b.trim().toLowerCase() }))
  };
  const stored = JSON.parse(localStorage.getItem('admin_products') || '[]');
  stored.push(product);
  localStorage.setItem('admin_products', JSON.stringify(stored));
  allItems.push(product);
  showToast('✅ Product added: ' + product.name);
  e.target.reset();
  closeAddProductForm();
  renderTabs();
  renderMenu();
  loadAdminData();
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  allItems = allItems.filter(i => i.id !== id);
  const stored = JSON.parse(localStorage.getItem('admin_products') || '[]').filter(i => i.id !== id);
  localStorage.setItem('admin_products', JSON.stringify(stored));
  showToast('🗑 Product deleted');
  renderMenu();
  loadAdminData();
}

/* ══════════════════════════════════════════════
   MY ORDERS MODAL
══════════════════════════════════════════════ */
function openMyOrders() {
  const overlay = document.getElementById('orders-overlay');
  const list    = document.getElementById('orders-list');
  const localO  = JSON.parse(localStorage.getItem('localOrders') || '[]').filter(o => o.userEmail === currentUser?.email);
  const orders  = [...allOrders, ...localO];

  list.innerHTML = orders.length ? orders.map(o => `
    <div class="order-card">
      <div class="order-card__header">
        <span class="order-id">Order #${(o.id||'').slice(0,8)}</span>
        <span class="status-badge status-${o.status}">${o.status}</span>
      </div>
      <div class="order-items">${(o.items||[]).map(i => `${i.name} ×${i.qty}`).join(' · ')}</div>
      <div class="order-total">Total: <strong>$${parseFloat(o.total||0).toFixed(2)}</strong></div>
    </div>`).join('') : '<p class="cart-empty">📋 No orders yet</p>';

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMyOrders() { document.getElementById('orders-overlay').classList.remove('open'); document.body.style.overflow = ''; }

/* ══════════════════════════════════════════════
   CONTACT FORM (EmailJS)
══════════════════════════════════════════════ */
async function sendContactEmail(e) {
  e.preventDefault();
  const cfg = window.EMAILJS_CONFIG;
  if (!cfg || cfg.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
    showToast('⚠️ EmailJS not configured yet. See JS/firebase-config.js');
    return;
  }
  const params = {
    from_name:  document.getElementById('contact-name').value,
    from_email: document.getElementById('contact-email').value,
    message:    document.getElementById('contact-msg').value,
  };
  try {
    setBtnLoading('btn-contact-send', true);
    await emailjs.send(cfg.serviceID, cfg.templateID, params);
    showToast('📧 Message sent!');
    e.target.reset();
  } catch (err) {
    showToast('❌ Failed to send: ' + err.text);
  } finally {
    setBtnLoading('btn-contact-send', false);
  }
}

/* ══════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════ */
let _toastTimer;
function showToast(msg) {
  $toastEl.innerHTML = msg;
  $toastEl.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => $toastEl.classList.remove('show'), 3000);
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function setBtnLoading(id, on) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = on;
  btn.style.opacity = on ? '.6' : '1';
}

function firebaseErrMsg(code) {
  const map = {
    'auth/user-not-found':   'No account found with this email.',
    'auth/wrong-password':   'Wrong password.',
    'auth/email-already-in-use': 'Email already registered.',
    'auth/invalid-email':    'Invalid email address.',
    'auth/weak-password':    'Password must be at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/too-many-requests':'Too many attempts. Try again later.',
  };
  return map[code] || 'Something went wrong. Try again.';
}

// Scroll to top
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }