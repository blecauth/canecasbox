// ======================================================
// Estado
// ======================================================
let products = [];
let editingCode = null; // código do card em edição, ou null se for "adicionar"

const el = (id) => document.getElementById(id);

const loginScreen = el("loginScreen");
const loginForm = el("loginForm");
const loginEmail = el("loginEmail");
const loginPassword = el("loginPassword");
const loginError = el("loginError");
const adminPanel = el("adminPanel");
const logoutBtn = el("logoutBtn");

const cardList = el("cardList");
const listEmpty = el("listEmpty");
const cardCount = el("cardCount");
const cardForm = el("cardForm");
const formTitle = el("formTitle");
const formSubmitBtn = el("formSubmitBtn");
const formCancelBtn = el("formCancelBtn");
const formError = el("formError");

const fieldCode = el("fieldCode");
const fieldName = el("fieldName");
const fieldDesc = el("fieldDesc");
const fieldPrice = el("fieldPrice");
const fieldColor = el("fieldColor");
const fieldImageFile = el("fieldImageFile");
const fieldImageUrl = el("fieldImageUrl");
const imagePreviewRow = el("imagePreviewRow");
const imagePreview = el("imagePreview");
const imageUploadStatus = el("imageUploadStatus");

// ======================================================
// Autenticação
// ======================================================
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showPanel();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginScreen.hidden = false;
  adminPanel.hidden = true;
}

function showPanel() {
  loginScreen.hidden = true;
  adminPanel.hidden = false;
  loadProducts();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const loginBtn = el("loginBtn");
  loginBtn.disabled = true;
  loginBtn.textContent = "Entrando...";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: loginEmail.value.trim(),
    password: loginPassword.value,
  });

  loginBtn.disabled = false;
  loginBtn.textContent = "Entrar";

  if (error) {
    loginError.textContent = "E-mail ou senha inválidos.";
    loginError.hidden = false;
    return;
  }
  showPanel();
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

checkSession();

// ======================================================
// Carregar produtos do banco
// ======================================================
async function loadProducts() {
  listEmpty.hidden = false;
  listEmpty.textContent = "Carregando...";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    listEmpty.textContent = "Erro ao carregar: " + error.message;
    return;
  }

  products = data;
  renderList();
}

// ======================================================
// Lista de cards
// ======================================================
function renderList() {
  cardList.querySelectorAll(".card-row").forEach((n) => n.remove());
  listEmpty.hidden = products.length > 0;
  listEmpty.textContent = "Nenhum card cadastrado ainda — use o formulário abaixo.";
  cardCount.textContent = `${products.length} card${products.length === 1 ? "" : "s"}`;

  products.forEach((product) => {
    const row = document.createElement("div");
    row.className = "card-row";
    row.innerHTML = `
      <img class="card-row-thumb" src="${product.image || ""}" alt="" onerror="this.style.background='${product.color || "#ccc"}';this.removeAttribute('src')">
      <div class="card-row-info">
        <div class="card-row-name">${escapeHtml(product.name)}</div>
        <div class="card-row-meta">
          <span>${escapeHtml(product.code)}</span>
          <span>R$ ${Number(product.price).toFixed(2).replace(".", ",")}</span>
        </div>
      </div>
      <div class="card-row-actions">
        <button type="button" class="icon-btn" data-action="edit" data-code="${product.code}">Editar</button>
        <button type="button" class="icon-btn danger" data-action="remove" data-code="${product.code}">Remover</button>
      </div>
    `;
    cardList.appendChild(row);
  });
}

cardList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const code = btn.dataset.code;

  if (btn.dataset.action === "remove") {
    if (!confirm(`Remover o card ${code}? Essa ação já apaga direto do catálogo, sem desfazer.`)) return;
    const { error } = await supabaseClient.from("products").delete().eq("code", code);
    if (error) {
      alert("Erro ao remover: " + error.message);
      return;
    }
    products = products.filter((p) => p.code !== code);
    renderList();
  }

  if (btn.dataset.action === "edit") {
    const product = products.find((p) => p.code === code);
    if (product) startEdit(product);
  }
});

// ======================================================
// Formulário — adicionar / editar
// ======================================================
function startEdit(product) {
  editingCode = product.code;
  fieldCode.value = product.code;
  fieldName.value = product.name;
  fieldDesc.value = product.description;
  fieldPrice.value = product.price;
  fieldColor.value = product.color || "#1F4B4C";
  fieldImageUrl.value = product.image || "";

  if (product.image) {
    imagePreview.src = product.image;
    imagePreviewRow.hidden = false;
    imageUploadStatus.textContent = "foto atual";
  } else {
    imagePreviewRow.hidden = true;
  }

  formTitle.textContent = `Editando ${product.code}`;
  formSubmitBtn.textContent = "Salvar alterações";
  formCancelBtn.hidden = false;
  formError.hidden = true;
  cardForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  editingCode = null;
  cardForm.reset();
  fieldColor.value = "#1F4B4C";
  fieldImageUrl.value = "";
  imagePreviewRow.hidden = true;
  formTitle.textContent = "Adicionar novo card";
  formSubmitBtn.textContent = "Adicionar card";
  formCancelBtn.hidden = true;
  formError.hidden = true;
}

formCancelBtn.addEventListener("click", resetForm);

// Upload de imagem para o Supabase Storage assim que o arquivo é escolhido
fieldImageFile.addEventListener("change", async () => {
  const file = fieldImageFile.files[0];
  if (!file) return;

  imagePreview.src = URL.createObjectURL(file);
  imagePreviewRow.hidden = false;
  imageUploadStatus.textContent = "Enviando imagem...";
  formSubmitBtn.disabled = true;

  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

  try {
    const { error: uploadError } = await supabaseClient.storage
      .from("product-images")
      .upload(path, file);
    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage.from("product-images").getPublicUrl(path);
    fieldImageUrl.value = data.publicUrl;
    imagePreview.src = data.publicUrl;
    imageUploadStatus.textContent = "Imagem enviada ✓";
  } catch (err) {
    imageUploadStatus.textContent = "Erro no upload: " + err.message;
  } finally {
    formSubmitBtn.disabled = false;
  }
});

cardForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const code = fieldCode.value.trim();
  const duplicate = products.some((p) => p.code === code && p.code !== editingCode);
  if (duplicate) {
    formError.textContent = `Já existe um card com o código "${code}".`;
    formError.hidden = false;
    return;
  }

  const product = {
    code,
    name: fieldName.value.trim(),
    description: fieldDesc.value.trim(),
    price: parseFloat(fieldPrice.value),
    color: fieldColor.value,
    image: fieldImageUrl.value.trim(),
  };

  formSubmitBtn.disabled = true;

  let error;
  if (editingCode) {
    ({ error } = await supabaseClient.from("products").update(product).eq("code", editingCode));
  } else {
    ({ error } = await supabaseClient.from("products").insert(product));
  }

  formSubmitBtn.disabled = false;

  if (error) {
    formError.textContent = "Erro ao salvar: " + error.message;
    formError.hidden = false;
    return;
  }

  await loadProducts();
  resetForm();
});

// ======================================================
// Util
// ======================================================
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
