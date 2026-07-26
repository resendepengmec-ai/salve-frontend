/**
 * SALVe — configuração do frontend.
 * Carregue ANTES da ficha, no <head>:   <script src="config.js"></script>
 */
window.SALVE_BACKEND_URL = 'https://salve-backend.onrender.com';

// Chave do token JWT no localStorage. O app do SALVe herdou a auth do SGM,
// que guarda o token em 'smm_auth'.
window.SALVE_TOKEN_KEY = 'smm_auth';
