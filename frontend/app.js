const grid = document.querySelector('#menu-grid');
const dialog = document.querySelector('#order-dialog');
const selectedContainer = document.querySelector('#selected-items');
const selected = new Map();
let categories = [];
let currentFilter = 'tous';
let searchQuery = '';

const formatPrice = amount => new Intl.NumberFormat('fr-FR').format(amount);

function renderCards(filter = 'tous') {
  if (grid.dataset.view === 'landing') {
    currentFilter = filter;
    const chosen = categories.filter(category => filter === 'tous' || category.id === filter);
    const products = chosen.flatMap(category => category.items
      .filter(item => !searchQuery || `${item.name} ${item.details} ${category.title}`.toLocaleLowerCase('fr').includes(searchQuery))
      .map((item, index) => productCard(category, item, category.items.indexOf(item))));
    grid.innerHTML = products.length ? `<div class="category-items product-grid">${products.join('')}</div>` : '<p class="loading">Aucun plat ou boisson ne correspond à votre recherche.</p>';
    bindProductButtons();
    return;
  }
  const requestedCategory = new URLSearchParams(window.location.search).get('category') || filter;
  const shown = categories.filter(category => category.id === requestedCategory);
  const pageCategory = shown[0];
  if (pageCategory) {
    document.body.dataset.theme = pageCategory.id;
    const title = document.querySelector('#category-page-title');
    if (title) title.textContent = pageCategory.title;
    const description = document.querySelector('#category-page-description');
    if (description) description.textContent = pageCategory.description;
    document.title = `${pageCategory.title} | Restaurant Mobil - Bien Manger`;
  }
  grid.innerHTML = shown.map(category => `<section class="menu-category" aria-labelledby="heading-${category.id}">
    <header class="menu-category-heading">
      <div><p class="category-kicker">LA CARTE · ${category.items.length} PROPOSITIONS</p><h3 class="blink-title" id="heading-${category.id}">${category.title}</h3><p class="category-description">${category.description}</p></div>
      <div class="category-price">${categoryPriceLabel(category)} <small>${category.currency}</small></div>
    </header>
    <div class="category-items">${category.items.filter(item => !searchQuery || `${item.name} ${item.details}`.toLocaleLowerCase('fr').includes(searchQuery)).map((item, index) => productCard(category, item, category.items.indexOf(item))).join('')}</div>
  </section>`).join('');
  bindProductButtons();
}

function productCard(category, item, index) {
  const key = `${category.id}-${index}`;
  const isAdded = selected.has(key);
  const price = item.price ?? category.price;
  return `<article class="menu-card">
    <img class="menu-image" src="${item.image}" alt="${item.imageAlt}" loading="lazy">
    <div class="card-content">
      <div class="card-top"><span class="card-category">${category.title}</span><span class="card-price">${formatPrice(price)}<small>${category.currency}</small></span></div>
      <h4>${item.name}</h4><p>${item.details}</p>
      <div class="card-order"><span>Ajouter à ma commande</span><button class="add-item ${isAdded ? 'is-added' : ''}" data-key="${key}" aria-label="${isAdded ? 'Retirer' : 'Ajouter'} ${item.name}">${isAdded ? '✓' : '+'}</button></div>
    </div>
  </article>`;
}

function bindProductButtons() {
  grid.querySelectorAll('.add-item').forEach(button => button.addEventListener('click', () => toggleItem(button.dataset.key)));
}

function categoryPriceLabel(category) {
  const prices = [...new Set(category.items.map(item => item.price ?? category.price))].sort((a, b) => a - b);
  return prices.length === 1 ? formatPrice(prices[0]) : `${formatPrice(prices[0])}–${formatPrice(prices.at(-1))}`;
}

function getItem(key) {
  for (const category of categories) {
    const index = Number(key.slice(category.id.length + 1));
    if (key.startsWith(`${category.id}-`) && category.items[index]) return { ...category.items[index], price: category.items[index].price ?? category.price, currency: category.currency };
  }
}

function toggleItem(key) {
  const wasSelected = selected.has(key);
  const item = getItem(key);
  if (wasSelected) selected.delete(key);
  else selected.set(key, item);
  const active = document.querySelector('.category-tab.is-active')?.dataset.category || 'tous';
  renderCards(active);
  updateDialog();
  showToast(wasSelected ? 'Retiré du panier.' : 'Ajouté au panier.');
}

function updateDialog() {
  selectedContainer.innerHTML = [...selected.entries()].map(([key, item]) => `<div class="selected-line"><span>${item.name}</span><span>${formatPrice(item.price)} ${item.currency}<button data-remove="${key}" aria-label="Retirer ${item.name}"> ×</button></span></div>`).join('');
  selectedContainer.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => toggleItem(button.dataset.remove)));
  const count = document.querySelector('#cart-count');
  if (count) count.textContent = String(selected.size);
  const headerCount = document.querySelector('#header-cart-count');
  if (headerCount) headerCount.textContent = String(selected.size);
}

document.querySelectorAll('.category-tab').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.category-tab').forEach(tab => { tab.classList.toggle('is-active', tab === button); tab.setAttribute('aria-selected', String(tab === button)); });
  renderCards(button.dataset.category);
}));

const searchInput = document.querySelector('#product-search');
searchInput?.addEventListener('input', () => { searchQuery = searchInput.value.trim().toLocaleLowerCase('fr'); renderCards(currentFilter); });
document.querySelector('#search-submit')?.addEventListener('click', () => searchInput?.focus());
document.querySelector('#mobile-search-button')?.addEventListener('click', () => { searchInput?.focus(); searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
document.querySelector('#mobile-cart-button')?.addEventListener('click', () => {
  if (!selected.size) return showToast('Ajoutez d’abord un plat à votre panier.');
  updateDialog(); dialog.showModal();
});
document.querySelector('#header-cart-button')?.addEventListener('click', () => {
  if (!selected.size) return showToast('Ajoutez d’abord un plat à votre panier.');
  updateDialog(); dialog.showModal();
});

document.querySelector('#send-order').addEventListener('click', async () => {
  if (!selected.size) return showToast('Ajoutez un plat avant de continuer.');
  try {
    const response = await fetch('/api/commande', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [...selected.values()].map(item => `${item.name} (${formatPrice(item.price)} ${item.currency})`), payment: document.querySelector('#payment-method').value, note: document.querySelector('#order-note').value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'La commande n’a pas pu être préparée.');
    window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
    dialog.close();
  } catch (error) { showToast(error.message); }
});

let toastTimer;
function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message; toast.classList.add('is-visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

document.querySelector('#year').textContent = new Date().getFullYear();
fetch('/api/menu').then(response => {
  if (!response.ok) throw new Error('Chargement impossible');
  return response.json();
}).then(menu => { categories = menu.categories; renderCards(); }).catch(() => {
  grid.innerHTML = '<p class="loading">La carte n’a pas pu être chargée. Vérifiez que le serveur est démarré.</p>';
});
