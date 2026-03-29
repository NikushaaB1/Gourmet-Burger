/**
 * Gourmet Burger — script.js
 * Handles: authentication, data fetching, rendering, filtering, cart, modal, toast
 */

'use strict';

/* ──────────────────────────────────────────
   State
────────────────────────────────────────── */
let allItems     = [];
let activeCategory = 'burger';
let cart         = [];
let currentUser  = null;

/* ──────────────────────────────────────────
   Demo Users (for testing)
────────────────────────────────────────── */
const DEMO_USERS = [
  { username: 'email@test.com', password: 'password123' },
  { username: 'admin', password: 'admin123' },
  { username: 'user', password: 'user123' }
];

/* ──────────────────────────────────────────
   DOM References (resolved after DOMContentLoaded)
────────────────────────────────────────── */
let tabsContainer, menuGrid, cartCount, toastEl, modalOverlay,
    modalImg, modalBadges, modalName, modalDesc, modalPrice,
    modalAddBtn, loginOverlay, loginForm, menuSection;

/* ──────────────────────────────────────────
   Badge Config
────────────────────────────────────────── */
const BADGE_CONFIG = {
  vegan:   { cls: 'badge--vegan',   icon: '🌱' },
  new:     { cls: 'badge--new',     icon: '⭐' },
  popular: { cls: 'badge--popular', icon: '❤️' },
};

/* ──────────────────────────────────────────
   Init
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  cacheDOM();
  checkAuthStatus();
  attachStaticListeners();
  
  // Only load menu if user is logged in
  if (currentUser) {
    await loadData();
    renderTabs();
    renderMenu();
    updateCartBubble();
  }
});

/* ──────────────────────────────────────────
   Check Authentication Status
────────────────────────────────────────── */
function checkAuthStatus() {
  const savedUser = localStorage.getItem('currentUser');
  
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMenuUI();
  } else {
    showLoginUI();
  }
}

/* ──────────────────────────────────────────
   Show Login UI
────────────────────────────────────────── */
function showLoginUI() {
  loginOverlay.classList.add('open');
  menuSection.style.display = 'none';
  document.getElementById('user-section').style.display = 'none';
  document.body.style.overflow = 'hidden';
}

/* ──────────────────────────────────────────
   Show Menu UI
────────────────────────────────────────── */
function showMenuUI() {
  loginOverlay.classList.remove('open');
  menuSection.style.display = 'block';
  document.getElementById('user-section').style.display = 'flex';
  document.getElementById('username-display').textContent = `Welcome, ${currentUser.username}`;
  document.body.style.overflow = 'auto';
}

/* ──────────────────────────────────────────
   Cache DOM
────────────────────────────────────────── */
function cacheDOM() {
  tabsContainer  = document.getElementById('category-tabs');
  menuGrid       = document.getElementById('menu-grid');
  cartCount      = document.getElementById('cart-count');
  toastEl        = document.getElementById('toast');
  modalOverlay   = document.getElementById('modal-overlay');
  modalImg       = document.getElementById('modal-img');
  modalBadges    = document.getElementById('modal-badges');
  modalName      = document.getElementById('modal-name');
  modalDesc      = document.getElementById('modal-desc');
  modalPrice     = document.getElementById('modal-price');
  modalAddBtn    = document.getElementById('modal-add-btn');
  loginOverlay   = document.getElementById('login-overlay');
  loginForm      = document.getElementById('login-form');
  menuSection    = document.getElementById('menu-section');
}

/* ──────────────────────────────────────────
   Attach Static Listeners
────────────────────────────────────────── */
function attachStaticListeners() {
  // Login form submission
  loginForm.addEventListener('submit', handleLogin);

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Close modal on overlay click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Cart bubble click
  document.getElementById('cart-bubble').addEventListener('click', () => {
    showToast(`🛒 ${cart.length} item${cart.length !== 1 ? 's' : ''} in your cart`);
  });

  // ESC key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

/* ──────────────────────────────────────────
   Handle Login
────────────────────────────────────────── */
function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  // Validate credentials
  const user = DEMO_USERS.find(u => u.username === username && u.password === password);

  if (user) {
    currentUser = { username: username };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Show success message
    showToast(`✓ Welcome, ${username}!`);
    
    // Reset form
    loginForm.reset();
    
    // Load menu and show UI
    loadData().then(() => {
      renderTabs();
      renderMenu();
      updateCartBubble();
      showMenuUI();
    });
  } else {
    showToast('❌ Invalid credentials. Try email@test.com / password123');
  }
}

/* ──────────────────────────────────────────
   Handle Logout
────────────────────────────────────────── */
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    currentUser = null;
    cart = [];
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    
    showToast('👋 You have been logged out');
    
    // Reset form
    loginForm.reset();
    document.getElementById('login-username').focus();
    
    // Show login UI
    showLoginUI();
  }
}


/* ──────────────────────────────────────────
   Load Data from JSON
────────────────────────────────────────── */
async function loadData() {
  try {
    const res  = await fetch('Data.json');
    const data = await res.json();
    allItems = data.menu || [];

    // Populate restaurant info
    const resto = data.restaurant;
    document.title = resto.name;
    const logoEl = document.querySelector('.header__logo-text');
    if (logoEl) logoEl.textContent = resto.name;
  } catch (err) {
    console.error('Failed to load menu data:', err);
    allItems = [];
  }
}

/* ──────────────────────────────────────────
   Render Category Tabs
────────────────────────────────────────── */
function renderTabs() {
  const categories = [...new Set(allItems.map(i => i.category))];
  tabsContainer.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${cat === activeCategory ? 'active' : ''}`;
    btn.textContent = capitalize(cat);
    btn.addEventListener('click', () => switchCategory(cat));
    tabsContainer.appendChild(btn);
  });
}

/* ──────────────────────────────────────────
   Switch Category
────────────────────────────────────────── */
function switchCategory(cat) {
  activeCategory = cat;
  // Update active tab
  tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === cat);
  });
  renderMenu();
}

/* ──────────────────────────────────────────
   Render Menu Cards
────────────────────────────────────────── */
function renderMenu() {
  const filtered = allItems.filter(item => item.category === activeCategory);
  menuGrid.innerHTML = '';

  if (!filtered.length) {
    menuGrid.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🍽️</div>
        <h3>Nothing here yet</h3>
        <p>Check back soon for new items!</p>
      </div>`;
    return;
  }

  filtered.forEach((item, idx) => {
    const card = buildCard(item, idx);
    menuGrid.appendChild(card);
  });
}

/* ──────────────────────────────────────────
   Build Card Element
────────────────────────────────────────── */
function buildCard(item, idx) {
  const card = document.createElement('article');
  card.className = 'menu-card';
  card.style.animationDelay = `${idx * 0.07}s`;

  const inCart = cart.some(c => c.id === item.id);

  card.innerHTML = `
    <div class="card__image-wrap">
      <img src="Images/${item.image.split('/').pop()}" alt="${item.name}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjMyIiBmaWxsPSIjYWFhIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCI+SW1hZ2U8L3RleHQ+PC9zdmc+'">
      <div class="card__badges">${buildBadgesHTML(item.badges)}</div>
      <button class="card__info-btn" aria-label="More info" data-id="${item.id}">i</button>
    </div>
    <div class="card__body">
      <h3 class="card__name">${item.name}</h3>
      <p class="card__desc">${item.description}</p>
    </div>
    <div class="card__footer">
      <span class="card__price">$${item.price.toFixed(2)}</span>
      <button class="btn-select${inCart ? ' added' : ''}" data-id="${item.id}">
        ${inCart ? 'ADDED ✓' : 'SELECT'}
      </button>
    </div>`;

  // Info button → open modal
  card.querySelector('.card__info-btn').addEventListener('click', () => {
    openModal(item);
  });

  // Select button → add to cart
  card.querySelector('.btn-select').addEventListener('click', (e) => {
    addToCart(item, e.target);
  });

  return card;
}

/* ──────────────────────────────────────────
   Build Badges HTML
────────────────────────────────────────── */
function buildBadgesHTML(badges = []) {
  return badges.map(b => {
    const key    = b.type.toLowerCase();
    const config = BADGE_CONFIG[key] || { cls: '', icon: '' };
    return `<span class="badge ${config.cls}">
      <span class="badge-icon">${config.icon}</span>${b.label}
    </span>`;
  }).join('');
}

/* ──────────────────────────────────────────
   Cart Logic
────────────────────────────────────────── */
function addToCart(item, btn) {
  const exists = cart.find(c => c.id === item.id);

  if (exists) {
    cart = cart.filter(c => c.id !== item.id);
    btn.textContent = 'SELECT';
    btn.classList.remove('added');
    showToast(`Removed from cart`);
  } else {
    cart.push({ ...item, quantity: 1 });
    btn.textContent = 'ADDED ✓';
    btn.classList.add('added');
    showToast(`✓ Added to cart`);
  }

  updateCartBubble();
}

function updateCartBubble() {
  const count = cartCount;
  if (cart.length > 0) {
    count.textContent = cart.length;
    count.style.display = 'flex';
  } else {
    count.style.display = 'none';
  }
}

/* ──────────────────────────────────────────
   Modal
────────────────────────────────────────── */
function openModal(item) {
  modalImg.src = `Images/${item.image.split('/').pop()}`;
  modalBadges.innerHTML = buildBadgesHTML(item.badges);
  modalName.textContent = item.name;
  modalDesc.textContent = item.description;
  modalPrice.textContent = `$${item.price.toFixed(2)}`;

  const inCart = cart.some(c => c.id === item.id);
  modalAddBtn.textContent = inCart ? 'REMOVE FROM CART' : 'ADD TO CART';
  modalAddBtn.classList.toggle('added', inCart);

  modalAddBtn.onclick = () => {
    const btn = document.querySelector(`.btn-select[data-id="${item.id}"]`);
    if (btn) addToCart(item, btn);
    closeModal();
  };

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = 'auto';
}

/* ──────────────────────────────────────────
   Toast
────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  toastEl.innerHTML = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ──────────────────────────────────────────
   Helpers
────────────────────────────────────────── */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}