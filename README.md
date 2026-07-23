# SALVe — Frontend (GitHub Pages)

Site estático. Cinco telas, todas conversando com o backend via `/api/...`:
- `index.html` — login (Google OAuth). Porta de entrada → abre Contratos.
- `contratos.html` — o engenheiro cria contratos e, dentro de cada um, adiciona os itens avaliados.
- `ficha-avaliacao.html` — ficha do bem (aberta a partir de um contrato, via `?contrato=`).
- `bens.html` — laudos: listagem geral, ranking 80/20 e detalhe por bem.
- `admin.html` — usuários: autorizar e-mails (whitelist) e papéis. (Só admin.)

## Papéis
- **admin** (o primeiro a entrar) — vê tudo.
- **engenheiro** — cria contratos e itens; enxerga apenas os seus.

## Configurar
`window.SALVE_API` em cada HTML (ou ao menos no `index.html`) com a URL do Render:
```html
<script>window.SALVE_API = "https://salve-backend.onrender.com";</script>
```

## Deploy (GitHub Pages)
Suba os arquivos no repo `salve-frontend` → Settings → Pages → main → /(root).
No Google Cloud, inclua a origem do Pages em Authorized JavaScript origins.

## Fluxo
login → Contratos → (abre um contrato) → + Adicionar item → Ficha → salvar → volta ao contrato.
