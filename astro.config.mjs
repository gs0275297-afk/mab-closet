import { defineConfig } from 'astro/config';

// TODO(MAB): trocar pelo domínio definitivo antes de publicar.
// É usado em canonical, Open Graph, sitemap e dados estruturados.
const SITE_URL = 'https://www.mabcloset.com.br';

export default defineConfig({
  site: SITE_URL,
  compressHTML: true,
  build: {
    // Página única: CSS embutido elimina uma requisição bloqueante.
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
});
