// ── config.js ───────────────────────────────────────────────────────
// Fonte única da URL do backend, carregada por TODAS as páginas do SALVe.
//
// Antes deste arquivo, a mesma URL estava copiada em 8 HTMLs
// (<script>window.SALVE_API = "...";</script> repetido em cada um);
// trocar de servidor exigia editar todos, e esquecer um deixava aquela
// tela muda. É exatamente o que tinha acontecido com
// ficha-avaliacao.html: o arquivo já esperava
// <script src="config.js"></script> (ver comentário no seu <head>), mas
// este arquivo nunca chegou a ser criado — a página sempre caía no valor
// de exemplo ('https://seu-backend.onrender.com') e nunca falava com o
// backend de verdade.
//
// window.SALVE_API é o nome usado pelas demais páginas (pericia-core.js);
// window.SALVE_BACKEND_URL é o alias que ficha-avaliacao.html já lia.
window.SALVE_API = "https://salve-backend.onrender.com";
window.SALVE_BACKEND_URL = window.SALVE_API;
