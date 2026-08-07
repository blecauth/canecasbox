// Lê o arquivo .env (texto simples, formato CHAVE=valor) e
// expõe as variáveis em window.ENV para o restante do painel usar.
//
// IMPORTANTE: isso NÃO torna a chave secreta para quem acessa a página.
// Qualquer coisa executada no navegador pode ser vista via DevTools/aba
// de rede. O .env aqui só evita que a chave fique escrita direto no
// código-fonte versionado — não protege a chave de um visitante da
// própria página admin. Veja o aviso completo no topo do admin.html.

window.ENV = {};

async function loadEnv() {
  try {
    const res = await fetch(".env", { cache: "no-store" });
    if (!res.ok) throw new Error("arquivo .env não encontrado no servidor");
    const text = await res.text();

    text.split("\n").forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return;
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) return;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      window.ENV[key] = value;
    });
  } catch (err) {
    console.warn("[env-loader] Não foi possível carregar .env:", err.message);
  }
  return window.ENV;
}
