/**
 * MAB CLOSET — movimento e interação.
 *
 * Sem bibliotecas: IntersectionObserver para as entradas, um único laço de
 * requestAnimationFrame (que só roda enquanto há algo se movendo) para
 * parallax e textos, e apenas transform/opacity para manter tudo na GPU.
 */

const root = document.documentElement;
// Definida no <head> a partir de prefers-reduced-motion (ver Base.astro).
const reduceMotion = { matches: root.classList.contains('reduce-motion') };
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const $$ = <T extends HTMLElement = HTMLElement>(selector: string, context: ParentNode = document) =>
  Array.from(context.querySelectorAll<T>(selector));

/* -------------------------------------------------------------------------
   Header: encolhe ao rolar, some ao descer, volta ao subir.
   ------------------------------------------------------------------------- */
function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  let last = window.scrollY;

  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);

    if (Math.abs(y - last) > 6) {
      const hide = y > last && y > window.innerHeight * 0.6 && !root.classList.contains('menu-open');
      header.classList.toggle('is-hidden', hide);
      last = y;
    }
  };

  window.addEventListener('scroll', update, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  update();

  // Link ativo conforme a seção em vista
  const links = $$<HTMLAnchorElement>('[data-nav-link]');
  const sections = links
    .map((link) => document.querySelector<HTMLElement>(link.hash))
    .filter((section): section is HTMLElement => Boolean(section));

  if (!('IntersectionObserver' in window) || !sections.length) return;

  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          const current = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-current', current);
          if (current) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );

  sections.forEach((section) => spy.observe(section));
}

/* -------------------------------------------------------------------------
   Menu mobile
   ------------------------------------------------------------------------- */
function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !menu) return;

  const label = toggle.querySelector<HTMLElement>('[data-menu-label]');
  const background = $$('main, footer');
  const isOpen = () => root.classList.contains('menu-open');

  const set = (open: boolean) => {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (label) label.textContent = open ? 'Fechar' : 'Menu';
    menu.inert = !open;
    background.forEach((el) => (el.inert = open));
  };

  toggle.addEventListener('click', () => set(!isOpen()));

  menu.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) set(false);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      set(false);
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 64rem)').addEventListener('change', (event) => {
    if (event.matches && isOpen()) set(false);
  });
}

/* -------------------------------------------------------------------------
   Entradas ao rolar
   ------------------------------------------------------------------------- */
function initReveal() {
  const targets = $$('[data-reveal]');

  // No modo de menos movimento a entrada continua existindo, mas o CSS a
  // reduz a uma fusão curta — por isso o observador roda nos dois casos.
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );

  targets.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------------------------------
   Motor de rolagem: parallax, deslocamento horizontal, texto progressivo
   e o hero. As posições são medidas uma vez (e a cada redimensionamento);
   durante a rolagem não há leitura de layout.
   ------------------------------------------------------------------------- */
type Kind = 'frame' | 'x' | 'y' | 'scrub';

interface Item {
  el: HTMLElement;
  anchor: HTMLElement;
  kind: Kind;
  amount: number;
  top: number;
  height: number;
  current: number;
  words: HTMLElement[];
}

function initScrollMotion() {
  if (reduceMotion.matches) return;

  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const items: Item[] = [
    ...$$('[data-plx]').map((el) => ({
      el,
      // mede-se o pai, que não recebe transform — a leitura fica estável
      anchor: el.parentElement ?? el,
      kind: el.dataset.plx as Kind,
      amount: Number(el.dataset.plxAmount ?? 1),
      top: 0,
      height: 0,
      current: -1,
      words: [],
    })),
    ...$$('[data-scrub]').map((el) => ({
      el,
      anchor: el,
      kind: 'scrub' as Kind,
      amount: 1,
      top: 0,
      height: 0,
      current: -1,
      words: $$('.w', el),
    })),
  ];

  let vh = window.innerHeight;
  let vw = window.innerWidth;
  let frame = 0;

  const state = { hero: 0, heroTarget: 0, mx: 0, my: 0, mxTarget: 0, myTarget: 0 };

  const measure = () => {
    vh = window.innerHeight;
    vw = window.innerWidth;
    const y = window.scrollY;
    for (const item of items) {
      const rect = item.anchor.getBoundingClientRect();
      item.top = rect.top + y;
      item.height = rect.height;
    }
    request();
  };

  const target = (item: Item, y: number) =>
    item.kind === 'scrub'
      ? clamp((y + vh * 0.82 - item.top) / (item.height + vh * 0.34))
      : clamp((y + vh - item.top) / (vh + item.height));

  const apply = (item: Item) => {
    const p = item.current;
    const centered = (p - 0.5) * 2; // -1 … 1

    switch (item.kind) {
      case 'frame':
        item.el.style.transform = `translate3d(0, ${(-centered * 5.6 * item.amount).toFixed(3)}%, 0)`;
        break;
      case 'y':
        item.el.style.transform = `translate3d(0, ${(-centered * item.amount).toFixed(2)}px, 0)`;
        break;
      case 'x':
        item.el.style.transform = `translate3d(${((centered * item.amount * vw) / 100).toFixed(2)}px, 0, 0)`;
        break;
      case 'scrub': {
        const count = item.words.length;
        const head = p * (count + 3);
        for (let i = 0; i < count; i++) {
          item.words[i].style.opacity = (0.14 + 0.86 * clamp((head - i) / 3)).toFixed(3);
        }
        break;
      }
    }
  };

  const tick = () => {
    const y = window.scrollY;
    let moving = false;

    for (const item of items) {
      const goal = target(item, y);

      if (item.current < 0) {
        // primeiro quadro: assume a posição sem animar
        item.current = goal;
        apply(item);
        continue;
      }

      const delta = goal - item.current;
      if (delta === 0) continue;

      if (Math.abs(delta) > 0.0004) {
        item.current += delta * 0.11;
        moving = true;
      } else {
        item.current = goal;
      }
      apply(item);
    }

    if (hero) {
      state.heroTarget = clamp(y / vh);
      const dh = state.heroTarget - state.hero;
      const dx = state.mxTarget - state.mx;
      const dy = state.myTarget - state.my;

      if (Math.abs(dh) > 0.0004 || Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        state.hero += dh * 0.12;
        state.mx += dx * 0.06;
        state.my += dy * 0.06;
        moving = true;
        hero.style.setProperty('--p', state.hero.toFixed(4));
        hero.style.setProperty('--mx', state.mx.toFixed(4));
        hero.style.setProperty('--my', state.my.toFixed(4));
      }
    }

    frame = moving ? requestAnimationFrame(tick) : 0;
  };

  function request() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);
  document.fonts?.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

  if (hero && finePointer.matches) {
    hero.addEventListener(
      'pointermove',
      (event) => {
        state.mxTarget = (event.clientX / vw - 0.5) * 2;
        state.myTarget = (event.clientY / vh - 0.5) * 2;
        request();
      },
      { passive: true },
    );
    hero.addEventListener('pointerleave', () => {
      state.mxTarget = 0;
      state.myTarget = 0;
      request();
    });
  }

  measure();
}

/* -------------------------------------------------------------------------
   Cursor com rótulo — apenas com mouse, apenas sobre [data-cursor]
   ------------------------------------------------------------------------- */
function initCursor() {
  const cursor = document.querySelector<HTMLElement>('[data-cursor-el]');
  const text = cursor?.querySelector<HTMLElement>('[data-cursor-text]');
  if (!cursor || !text || !finePointer.matches || reduceMotion.matches) return;

  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let frame = 0;
  let active = false;

  const loop = () => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    frame = active || Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2 ? requestAnimationFrame(loop) : 0;
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      tx = event.clientX;
      ty = event.clientY;
    },
    { passive: true },
  );

  for (const el of $$('[data-cursor]')) {
    el.addEventListener('pointerenter', (event) => {
      text.textContent = el.dataset.cursor ?? '';
      if (!active) {
        x = tx = event.clientX;
        y = ty = event.clientY;
      }
      active = true;
      cursor.classList.add('is-active');
      if (!frame) frame = requestAnimationFrame(loop);
    });

    el.addEventListener('pointerleave', () => {
      active = false;
      cursor.classList.remove('is-active');
    });
  }

  // ao rolar, o elemento pode sair de baixo do ponteiro sem disparar pointerleave
  window.addEventListener(
    'scroll',
    () => {
      if (!active) return;
      const under = document.elementFromPoint(tx, ty);
      if (!under?.closest('[data-cursor]')) {
        active = false;
        cursor.classList.remove('is-active');
      }
    },
    { passive: true },
  );
}

/* -------------------------------------------------------------------------
   Botão "magnético" — atração muito leve em direção ao ponteiro
   ------------------------------------------------------------------------- */
function initMagnetic() {
  if (!finePointer.matches || reduceMotion.matches) return;

  for (const el of $$('[data-magnetic]')) {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate3d(${(dx * 0.16).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px, 0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  }
}

/* -------------------------------------------------------------------------
   Indicador "aberta agora", calculado no fuso de Três Lagoas
   ------------------------------------------------------------------------- */
interface Slot {
  days: number[];
  open: string;
  close: string;
}

function initOpenStatus() {
  const el = document.querySelector<HTMLElement>('[data-open-status]');
  if (!el) return;

  let slots: Slot[];
  try {
    slots = JSON.parse(el.dataset.hours ?? '[]');
  } catch {
    return;
  }

  const minutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const clock = (time: string) => {
    const [h, m] = time.split(':');
    return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
  };

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const update = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: el.dataset.timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());

    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    const day = WEEKDAYS.indexOf(get('weekday'));
    const now = Number(get('hour')) * 60 + Number(get('minute'));
    if (day < 0 || Number.isNaN(now)) return;

    const today = slots.find((slot) => slot.days.includes(day));
    let open = false;
    let detail = '';

    if (today && now >= minutes(today.open) && now < minutes(today.close)) {
      open = true;
      detail = `até ${clock(today.close)}`;
    } else if (today && now < minutes(today.open)) {
      detail = `abre hoje às ${clock(today.open)}`;
    } else {
      for (let offset = 1; offset <= 7; offset++) {
        const next = (day + offset) % 7;
        const slot = slots.find((candidate) => candidate.days.includes(next));
        if (!slot) continue;
        detail = `abre ${offset === 1 ? 'amanhã' : NAMES[next]} às ${clock(slot.open)}`;
        break;
      }
    }

    el.textContent = `${open ? 'Aberta agora' : 'Fechada agora'}${detail ? ` · ${detail}` : ''}`;
    el.dataset.state = open ? 'open' : 'closed';
    el.hidden = false;
  };

  try {
    update();
    window.setInterval(update, 60_000);
  } catch {
    /* fuso indisponível no navegador: o indicador simplesmente não aparece */
  }
}

initHeader();
initMenu();
initReveal();
initScrollMotion();
initCursor();
initMagnetic();
initOpenStatus();
