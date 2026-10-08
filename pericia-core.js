/* SALVe — núcleo JS das telas de perícia (sem build). Exposto em window.SP. */
(function () {
  "use strict";
  const store = (() => { try { return JSON.parse(localStorage.getItem("salve_api") || "null"); } catch (e) { return null; } })();
  const BASE = ((window.SALVE_API || "") || (store && store.base) || "").replace(/\/$/, "");
  const TOKEN = (store && store.token) || "";
  if (!BASE || !TOKEN) { location.href = "index.html"; return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dBR = (s) => s ? String(s).slice(0, 10).split("-").reverse().join("/") : "—";
  const brl = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v))) ? "—"
    : "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hoje = () => new Date().toISOString().slice(0, 10);

  function toast(m, erro) {
    let t = $("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
    t.textContent = m; t.classList.toggle("err", !!erro); t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), erro ? 5000 : 2600);
  }

  async function api(path, opts = {}) {
    const init = { ...opts, headers: { "Content-Type": "application/json", Authorization: "Bearer " + TOKEN, ...(opts.headers || {}) } };
    if (init.body && typeof init.body !== "string") init.body = JSON.stringify(init.body);
    // Timeout explícito e opcional (ex.: leitura de PDF por IA, que pode
    // demorar bem mais que uma chamada comum): sem isto, uma resposta lenta
    // trava a Promise indefinidamente e qualquer botão/estado que dependa
    // dela nunca libera.
    let timer;
    if (opts.timeoutMs) { const ac = new AbortController(); init.signal = ac.signal; timer = setTimeout(() => ac.abort(), opts.timeoutMs); }
    let r;
    try { r = await fetch(BASE + path, init); }
    catch (e) { if (e.name === "AbortError") throw new Error("Tempo esgotado aguardando resposta — tente novamente."); throw e; }
    finally { if (timer) clearTimeout(timer); }
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { try { localStorage.removeItem("salve_api"); } catch (e) {} location.href = "index.html"; throw new Error("sessão"); }
    if (!r.ok || j.ok === false) throw new Error(j.error || ("HTTP " + r.status));
    return j.data;
  }
  const post = (p, b, timeoutMs) => api(p, { method: "POST", body: b || {}, timeoutMs });
  const del = (p) => api(p, { method: "DELETE" });

  function baixar(nome, b64, mime) {
    const bin = atob(b64); const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([u], { type: mime || "application/octet-stream" }));
    a.download = nome; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  const lerArquivo = (file) => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(file); });

  async function montarNav(ativo) {
    const nav = $("nav");
    const links = [["processos.html", "Perícias"], ["contratos.html", "Contratos"], ["bens.html", "Laudos"], ["normas.html", "Normas e prazos"], ["admin.html", "Usuários"]];
    nav.className = "nav";
    nav.innerHTML = `<span class="brand">SAL<b>Ve</b></span>${links.map(([h, t]) => `<a href="${h}"${h === ativo ? ' class="active"' : ""}>${t}</a>`).join("")}
      <span class="grow"></span><span class="me" id="me"></span><button class="out" id="btnOut">Sair</button>`;
    $("btnOut").onclick = async () => { try { await post("/api/auth/logout"); } catch (e) {} try { localStorage.removeItem("salve_api"); } catch (e) {} location.href = "index.html"; };
    const me = await api("/api/auth/me");
    $("me").innerHTML = `<b>${esc(me.name || me.email)}</b><span class="role">${esc(me.role)}</span>`;
    return me;
  }

  let REF = null;
  async function refs() { if (!REF) REF = await api("/api/pericia/referencias"); return REF; }
  const optHTML = (lista, sel, vazio) => (vazio !== undefined ? `<option value="">${esc(vazio)}</option>` : "") +
    lista.map((o) => { const v = typeof o === "string" ? o : o.id; const t = typeof o === "string" ? o : (o.label || o.rotulo || o.nome); return `<option value="${esc(v)}"${String(v) === String(sel ?? "") ? " selected" : ""}>${esc(t)}</option>`; }).join("");

  /* Bloco de origem (rastreabilidade). prefixo = id base dos campos. */
  function origemHTML(px, o, opts = {}) {
    o = o || {};
    const classes = (REF && REF.classesOrigem) || [];
    const lista = opts.classes ? classes.filter((c) => opts.classes.includes(c.id)) : classes;
    return `<div class="grid g4 orig ${esc(o.classe || "")}" id="${px}_box">
      <div class="fld"><label>Natureza da informação</label><select id="${px}_classe">${optHTML(lista, o.classe || opts.padrao, "—")}</select></div>
      <div class="fld"><label>ID do documento</label><input id="${px}_doc" value="${esc(o.documentoId || "")}" placeholder="ex.: 123456789"></div>
      <div class="fld"><label>Evento / página</label><div class="row" style="flex-wrap:nowrap"><input id="${px}_ev" value="${esc(o.evento || "")}" placeholder="evento"><input id="${px}_pg" value="${esc(o.pagina || "")}" placeholder="pág."></div></div>
      <div class="fld"><label>Data do documento</label><input type="date" id="${px}_dt" value="${esc(o.data || "")}"></div>
      <div class="fld span2" id="${px}_partebox"><label>Parte que alega</label><input id="${px}_parte" value="${esc(o.parte || "")}" placeholder="obrigatório para alegação de parte"></div>
    </div>`;
  }
  function lerOrigem(px) {
    const g = (s) => ($(px + "_" + s) || {}).value || "";
    return { classe: g("classe") || null, documentoId: g("doc"), evento: g("ev"), pagina: g("pg"), data: g("dt"), parte: g("parte") };
  }
  function citar(o) {
    if (!o) return `<span class="nl">${esc((REF && REF.naoLocalizado) || "NÃO LOCALIZADO")}</span>`;
    const p = [];
    if (o.documentoId) p.push("ID " + o.documentoId);
    if (o.evento) p.push("ev. " + o.evento);
    if (o.pagina) p.push("p. " + o.pagina);
    if (o.data) p.push(dBR(o.data));
    return p.length ? esc(p.join(", ")) : `<span class="nl">${esc((REF && REF.naoLocalizado) || "NÃO LOCALIZADO")}</span>`;
  }
  const rotClasse = (id) => ((REF && REF.classesOrigem || []).find((c) => c.id === id) || {}).label || "sem classificação";
  const pillClasse = (id) => `<span class="cls ${esc(id || "")}">${esc(rotClasse(id))}</span>`;

  /* Editor de linhas (arrays de objetos). cols: [{k, rot, tipo, opts, w, ph}] */
  function editorLinhas(el, cols, linhas, cfg = {}) {
    let dados = (linhas || []).map((x) => ({ ...x }));
    function campo(c, v, i) {
      const at = `data-i="${i}" data-k="${c.k}"`;
      if (c.tipo === "select") return `<select ${at}>${optHTML(c.opts, v, "—")}</select>`;
      if (c.tipo === "check") return `<input type="checkbox" ${at}${v ? " checked" : ""} aria-label="${esc(c.rot)}">`;
      if (c.tipo === "textarea") return `<textarea ${at} rows="2">${esc(v ?? "")}</textarea>`;
      return `<input ${at} type="${c.tipo || "text"}" value="${esc(v ?? "")}" placeholder="${esc(c.ph || "")}"${c.tipo === "number" ? ' step="any"' : ""}>`;
    }
    function render() {
      el.innerHTML = `<div class="tscroll"><table class="ed"><thead><tr>${cols.map((c) => `<th style="${c.w ? "width:" + c.w : ""}">${esc(c.rot)}</th>`).join("")}<th style="width:40px"></th></tr></thead>
        <tbody>${dados.length ? dados.map((l, i) => `<tr>${cols.map((c) => `<td>${campo(c, l[c.k], i)}</td>`).join("")}<td><button class="btn sm danger" data-rm="${i}" aria-label="Remover linha">✕</button></td></tr>`).join("")
          : `<tr><td colspan="${cols.length + 1}" class="muted small">${esc(cfg.vazio || "Nenhuma linha.")}</td></tr>`}</tbody></table></div>
        <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-add>+ ${esc(cfg.rotuloAdd || "Adicionar linha")}</button></div>`;
      el.querySelectorAll("[data-k]").forEach((inp) => inp.addEventListener(inp.type === "checkbox" || inp.tagName === "SELECT" ? "change" : "input", () => {
        const c = cols.find((x) => x.k === inp.dataset.k);
        dados[+inp.dataset.i][inp.dataset.k] = inp.type === "checkbox" ? inp.checked : (c.tipo === "number" ? (inp.value === "" ? "" : Number(inp.value)) : inp.value);
        cfg.onChange && cfg.onChange(dados);
      }));
      el.querySelectorAll("[data-rm]").forEach((b) => b.onclick = () => { dados.splice(+b.dataset.rm, 1); render(); cfg.onChange && cfg.onChange(dados); });
      el.querySelector("[data-add]").onclick = () => { dados.push({ ...(cfg.novo || {}) }); render(); };
    }
    render();
    return { get: () => dados.filter((l) => cols.some((c) => l[c.k] !== undefined && l[c.k] !== "" && l[c.k] !== false)), set: (d) => { dados = (d || []).map((x) => ({ ...x })); render(); } };
  }

  /* Formulário a partir do schema do módulo. */
  function schemaHTML(schema, dados, px, bens) {
    const grupos = [];
    schema.forEach((c) => { let g = grupos.find((x) => x.nome === c.grupo); if (!g) grupos.push(g = { nome: c.grupo || "Dados", campos: [] }); g.campos.push(c); });
    return grupos.map((g) => `<div class="chk-grupo">${esc(g.nome)}</div><div class="grid g3">${g.campos.map((c) => {
      const v = dados ? dados[c.chave] : "";
      const id = `${px}_${c.chave}`;
      const rot = `<label for="${id}">${esc(c.rotulo)}${c.unidade ? ` (${esc(c.unidade)})` : ""}${c.obrigatorio ? ' <span class="req">*</span>' : ""}</label>`;
      let inp;
      if (c.tipo === "selecao") inp = `<select id="${id}">${optHTML(c.opcoes, v, "—")}</select>`;
      else if (c.tipo === "textarea") inp = `<textarea id="${id}">${esc(v || "")}</textarea>`;
      else if (c.tipo === "booleano") inp = `<select id="${id}">${optHTML(["Sim", "Não"], v, "—")}</select>`;
      else if (c.tipo === "referencia_bem") {
        const lista = (bens || []).map((b) => ({ id: b.id, label: (b.nome || b.descricao || b.id) + (b.valorAdotado ? " — " + brl(b.valorAdotado) : "") }));
        inp = `<div class="row" style="flex-wrap:nowrap"><select id="${id}">${optHTML(lista, v, "Nenhuma")}</select>${v ? `<a class="btn sm ghost" href="ficha-avaliacao.html?id=${encodeURIComponent(v)}${(bens || []).find((b) => b.id === v && b.contrato) ? "&contrato=" + encodeURIComponent((bens.find((b) => b.id === v)).contrato) : ""}" target="_blank" rel="noopener">Abrir ficha</a>` : ""}</div>`;
      } else inp = `<input id="${id}" type="${c.tipo === "numero" ? "number" : c.tipo === "data" ? "date" : "text"}" value="${esc(v ?? "")}"${c.tipo === "numero" ? ' step="any"' : ""}>`;
      return `<div class="fld${c.tipo === "textarea" || c.tipo === "referencia_bem" ? " spanall" : ""}">${rot}${inp}</div>`;
    }).join("")}</div>`).join("");
  }
  function lerSchema(schema, px) {
    const o = {};
    schema.forEach((c) => { const el = $(`${px}_${c.chave}`); if (el) o[c.chave] = c.tipo === "numero" ? (el.value === "" ? "" : Number(el.value)) : el.value; });
    return o;
  }

  /* Painel de documento gerado: bloqueios + texto editável + .docx */
  function docPainel(el, out, processoId, cfg = {}) {
    const r = out.resultado;
    el.innerHTML = `${out.bloqueios && out.bloqueios.length ? `<div class="blq"><b>Pré-condições pendentes</b><ul>${out.bloqueios.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>${r ? "" : `<div class="row" style="margin-top:8px"><button class="btn sm danger" data-rasc>Gerar mesmo assim como rascunho</button></div>`}</div>` : ""}
      ${r ? `<textarea class="doc" data-txt aria-label="Texto do documento">${esc(r.texto)}</textarea>
      <div class="row end" style="margin-top:8px"><button class="btn ghost" data-cp>Copiar texto</button><button class="btn" data-docx>Baixar .docx</button></div>` : ""}`;
    const rb = el.querySelector("[data-rasc]"); if (rb) rb.onclick = () => cfg.rascunho && cfg.rascunho();
    const cp = el.querySelector("[data-cp]"); if (cp) cp.onclick = async () => { await navigator.clipboard.writeText(el.querySelector("[data-txt]").value); toast("Texto copiado."); };
    const dx = el.querySelector("[data-docx]"); if (dx) dx.onclick = async () => {
      try { const d = await post(`/api/pericia/processos/${processoId}/docx`, { titulo: r.titulo, texto: el.querySelector("[data-txt]").value });
        baixar(d.nome, d.base64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); } catch (e) { toast(e.message, true); }
    };
  }

  const SIT = { vencido: ["no", "Vencido"], vence_hoje: ["no", "Vence hoje"], atencao: ["at", "Próximo"], a_vencer: ["inf", "A vencer"], cumprido: ["ok", "Cumprido"], incalculavel: ["neu", "Incalculável"] };
  const pillSit = (s) => { const x = SIT[s] || ["neu", s || "—"]; return `<span class="pill ${x[0]}">${esc(x[1])}</span>`; };
  const pillStatus = (st) => st ? `<span class="pill ${st.cor === "verde" ? "ok" : st.cor === "amarelo" ? "at" : "no"}" title="${esc((st.motivos || []).join("; "))}">${st.icone} ${esc(st.rotulo)}</span>` : "";

  window.SP = { BASE, TOKEN, $, esc, dBR, brl, hoje, toast, api, post, del, baixar, lerArquivo, montarNav, refs, optHTML,
    origemHTML, lerOrigem, citar, rotClasse, pillClasse, editorLinhas, schemaHTML, lerSchema, docPainel, pillSit, pillStatus };
})();
