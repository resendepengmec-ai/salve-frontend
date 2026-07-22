# SALVe — Frontend (GitHub Pages)

Site estático. Duas telas:
- `index.html` — login (Google OAuth). Porta de entrada do sistema.
- `ficha-avaliacao.html` — ficha de avaliação do bem (dirigida por método).

## Configurar
Edite **uma linha** em `index.html` com a URL do backend no Render:
```html
<script>window.SALVE_API = "https://salve-backend-xxxx.onrender.com";</script>
```
(Deixando em branco, o admin informa a URL no painel "Configuração inicial do administrador".)

## Deploy
1. `git init && git add . && git commit -m "SALVe frontend"`
2. Crie o repo `salve-frontend` no GitHub e faça `git push`.
3. **Settings → Pages → Deploy from branch → main → /(root)**.
4. Anote a URL: `https://SEU-USUARIO.github.io/salve-frontend/`

## Google Cloud Console
No Client ID OAuth, em **Authorized JavaScript origins**, inclua a origem do Pages:
`https://SEU-USUARIO.github.io`

## Primeiro acesso
Rodapé → **Configuração inicial do administrador** → informe URL do servidor + Client ID → entre.
O primeiro e-mail vira admin; o Client ID é salvo no backend para os demais.
