# MAB Closet — site institucional

Site de página única da MAB Closet (moda feminina · Shopping Galeria · Três Lagoas — MS).
Feito em [Astro](https://astro.build): gera HTML estático, otimiza as fotos em AVIF/WebP e
envia apenas ~7 KB de JavaScript próprio. Sem bibliotecas de animação.

## Rodar

```bash
npm install
npm run dev       # desenvolvimento — http://localhost:4321
npm run build     # gera a versão final em dist/
npm run preview   # serve a versão final localmente
```

> **Animações não aparecem?** Se o Windows estiver com _Configurações → Acessibilidade →
> Efeitos visuais → Efeitos de animação_ desligado, o navegador informa
> `prefers-reduced-motion` e o site troca parallax, máscaras e zoom por fusões suaves
> (comportamento intencional de acessibilidade). Para ver a versão completa sem mexer no
> sistema, abra **`http://localhost:4321/?motion=full`**.

## Onde mexer

| O quê | Onde |
| --- | --- |
| Telefone, Instagram, endereço, horários, menu | `src/data/site.ts` (fonte única — header, footer, SEO e dados estruturados leem daqui) |
| Domínio definitivo (canonical, Open Graph, sitemap) | `astro.config.mjs` → `SITE_URL` |
| Cores, tipografia, botões, animações de entrada | `src/styles/global.css` |
| Textos de cada seção | o próprio componente em `src/components/` |
| Capítulos da curadoria | `src/components/Curadoria.astro` → `chapters` |
| Mosaico "Siga a MAB" | `src/components/Instagram.astro` → `tiles` |
| Assinatura tipográfica / logotipo | `src/components/ui/Logo.astro` |

## Identidade

- **Cores** — oliva `#62663B` (assinatura), oliva escuro `#45482B`, grafite `#202124`,
  carvão `#2B2C2E`, off-white `#F3F0E8`, branco quente `#FAF9F5`. O oliva aparece em
  detalhes (numerais, itálicos, botões, fios, indicadores) e em um único grande plano de
  cor: o fechamento.
- **Tipografia** — Cormorant Garamond (títulos e frases de impacto; o itálico é a "voz de
  detalhe") + DM Sans (navegação, textos, informações). Fontes auto-hospedadas.
- **Assinatura** — "MAB" em sans compacta + "CLOSET" em serif espaçada, seguindo a lógica
  do logotipo. Não é o logotipo: o monograma original não foi redesenhado.

## Fotos

As originais ficam em `Fotos-site/`. O script abaixo remove a barra de rolagem dos prints,
recorta elementos de terceiros e grava as versões de trabalho em `src/assets/images/`:

```bash
npm run images    # requer Python + Pillow
```

Para trocar uma foto, substitua o arquivo em `src/assets/images/` mantendo o nome — o
Astro gera os tamanhos e formatos no build. Lembre de atualizar o `alt` no componente.

## Pendências (marcadas com `TODO(MAB)` no código)

1. **Logotipo oficial** — enviar o arquivo vetorial (SVG) ou PNG em alta para entrar em
   `Logo.astro`.
2. **Domínio** — `astro.config.mjs` usa `https://www.mabcloset.com.br` como provisório.
3. **Fotos** — confirmar o direito de uso das imagens (parte delas parece ser de
   campanhas de marcas/fornecedores) e, quando houver, incluir fotos da própria loja
   (a seção "Experiência" está preparada para isso).
4. **Textos** — nomes dos capítulos da curadoria e frases foram escritos a partir das
   fotos e das informações fornecidas; nenhuma marca, preço ou dado comercial foi
   inventado. Revisar à vontade.
