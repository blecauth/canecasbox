// ======================================================
// CONFIGURAÇÃO — troque pelo seu número de WhatsApp
// Formato: código do país + DDD + número, só dígitos
// ======================================================
const WHATSAPP_NUMBER = "5511999999999";

// ======================================================
// CATÁLOGO — agora vem do Supabase (editável pelo painel admin)
// ======================================================
let PRODUCTS = [];

async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    PRODUCTS = data;
  } catch (err) {
    console.error("Não foi possível carregar o catálogo:", err);
    PRODUCTS = [];
  }
  renderProducts(PRODUCTS);
  requestAnimationFrame(updateActiveCard);
}

// Caso uma foto não seja encontrada, este SVG genérico entra no lugar
function fallbackMugSVG(color) {
  return `
    <svg viewBox="0 0 100 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="20" y="14" width="48" height="62" rx="9" fill="${color}"/>
      <path d="M68 30h6a10 10 0 0 1 0 20h-6" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
      <rect x="20" y="14" width="48" height="12" rx="6" fill="#ffffff" opacity="0.22"/>
    </svg>
  `;
}

// ======================================================
// Estado
// ======================================================
const track = document.getElementById("track");
const emptyState = document.getElementById("emptyState");
const indexLabel = document.getElementById("indexLabel");
const searchInput = document.getElementById("searchInput");
const buyBtn = document.getElementById("buyBtn");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");
const modalCode = document.getElementById("modalCode");
const modalClose = document.getElementById("modalClose");
const modalConfirm = document.getElementById("modalConfirm");

let activeProduct = null;

// ======================================================
// Renderização dos cards
// ======================================================
function formatPrice(value) {
  return "R$ " + value.toFixed(2).replace(".", ",");
}

function renderProducts(list) {
  track.innerHTML = "";

  if (list.length === 0) {
    emptyState.hidden = false;
    indexLabel.textContent = "00 / 00";
    activeProduct = null;
    return;
  }

  emptyState.hidden = true;

  list.forEach((product) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.code = product.code;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", product.name);

    card.innerHTML = `
      <div class="mug" style="background:${product.color}1a;">
        <img src="${product.image}" alt="${product.name}" loading="lazy"
             onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'mug-fallback',innerHTML:fallbackMugSVG('${product.color}')}))">
      </div>
      <p class="card-desc">${product.name} — ${product.description}</p>
      <div class="card-meta">
        <span class="price">${formatPrice(product.price)}</span>
        <span class="stamp">${product.code}</span>
      </div>
    `;
    track.appendChild(card);
  });

  updateActiveCard();
}

// ======================================================
// Carrossel: escala/opacidade conforme distância do centro
// ======================================================
let rafPending = false;

function updateActiveCard() {
  const cards = Array.from(track.querySelectorAll(".card"));
  if (cards.length === 0) return;

  const trackRect = track.getBoundingClientRect();
  const trackCenter = trackRect.left + trackRect.width / 2;

  let closest = null;
  let closestDist = Infinity;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const dist = Math.abs(trackCenter - cardCenter);

    const norm = Math.min(dist / (trackRect.width * 0.55), 1);
    const scale = 1 - norm * 0.24;
    const opacity = 1 - norm * 0.5;

    card.style.transform = `scale(${scale.toFixed(3)}) translateY(${(norm * 10).toFixed(1)}px)`;
    card.style.opacity = opacity.toFixed(2);
    card.classList.remove("is-active");

    if (dist < closestDist) {
      closestDist = dist;
      closest = card;
    }
  });

  if (closest) {
    closest.classList.add("is-active");
    closest.style.transform = "scale(1) translateY(0px)";
    closest.style.opacity = "1";
    activeProduct = PRODUCTS.find((p) => p.code === closest.dataset.code) || null;

    const total = cards.length;
    const position = cards.indexOf(closest) + 1;
    indexLabel.textContent = `${String(position).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  }
}

function onScroll() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    updateActiveCard();
    rafPending = false;
  });
}

track.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);

// Efeito de toque: leve "afundar" ao tocar em um card
track.addEventListener(
  "touchstart",
  (e) => {
    const card = e.target.closest(".card");
    if (card) card.classList.add("is-pressed");
  },
  { passive: true }
);
track.addEventListener("touchend", () => {
  track.querySelectorAll(".is-pressed").forEach((c) => c.classList.remove("is-pressed"));
});

// Clicar num card lateral leva ele ao centro
track.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card && !card.classList.contains("is-active")) {
    card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
});

// ======================================================
// Busca
// ======================================================
searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = term
    ? PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term)
      )
    : PRODUCTS;

  renderProducts(filtered);
  track.scrollLeft = 0;
  requestAnimationFrame(updateActiveCard);
});

// ======================================================
// Modal de confirmação
// ======================================================
function openModal() {
  if (!activeProduct) return;
  modalTitle.textContent = activeProduct.name;
  modalDesc.textContent = activeProduct.description;
  modalPrice.textContent = formatPrice(activeProduct.price);
  modalCode.textContent = activeProduct.code;
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

buyBtn.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

modalConfirm.addEventListener("click", () => {
  if (!activeProduct) return;
  const message = `Olá! Tenho interesse na ${activeProduct.name} (código ${activeProduct.code}) — ${formatPrice(activeProduct.price)}.`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
  closeModal();
});

// ======================================================
// Inicialização
// ======================================================
loadProducts();
