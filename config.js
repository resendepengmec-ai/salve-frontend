/**
 * SALVe — configuração do frontend.
 * Carregue ANTES da ficha, no <head>:   <script src="config.js"></script>
 */
window.SALVE_BACKEND_URL = 'https://salve-backend.onrender.com';

// Chave da sessão no localStorage. O login (index.html) grava
// localStorage['salve_api'] = { base, token }; a ficha lê o campo .token.
// (Antes apontava para 'smm_auth', herdado do SGM — causa dos 401 na ficha.)
window.SALVE_TOKEN_KEY = 'salve_api';
