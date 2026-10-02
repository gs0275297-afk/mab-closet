/**
 * Fonte única das informações da MAB Closet.
 * Tudo o que aparece em mais de um lugar (header, footer, SEO, dados
 * estruturados) sai daqui — altere aqui e o site inteiro acompanha.
 */

const WHATSAPP_NUMBER = '5567981755951';

export const whatsapp = (message = 'Olá! Vim pelo site da MAB Closet e gostaria de atendimento.') =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** "09:00" → "9h" · "08:30" → "8h30" */
export const formatHour = (time: string) => {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)}h${minutes === '00' ? '' : minutes}`;
};

export const site = {
  name: 'MAB Closet',
  title: 'MAB Closet — Moda feminina em Três Lagoas, MS',
  description:
    'Loja multimarcas de moda feminina em Três Lagoas, MS. Uma curadoria contemporânea no Shopping Galeria, com atendimento também pelo WhatsApp.',
  locale: 'pt-BR',

  phone: {
    display: '+55 67 98175-5951',
    e164: '+5567981755951',
  },

  instagram: {
    handle: '@mabcloset',
    url: 'https://www.instagram.com/mabcloset/',
  },

  address: {
    street: 'Rua Dr. Munir Thomé, 310',
    place: 'Shopping Galeria',
    city: 'Três Lagoas',
    state: 'MS',
    country: 'BR',
  },

  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'MAB Closet, Rua Dr. Munir Thomé, 310, Shopping Galeria, Três Lagoas - MS',
  )}`,

  /** Fuso de Mato Grosso do Sul — usado no indicador "aberta agora". */
  timeZone: 'America/Campo_Grande',

  /** `days`: 0 = domingo … 6 = sábado. */
  hours: [
    { label: 'Segunda a sexta', short: 'Seg — Sex', days: [1, 2, 3, 4, 5], open: '09:00', close: '18:00' },
    { label: 'Sábado', short: 'Sáb', days: [6], open: '08:00', close: '14:00' },
  ],

  nav: [
    { label: 'Início', href: '#inicio' },
    { label: 'A marca', href: '#marca' },
    { label: 'Coleções', href: '#colecoes' },
    { label: 'Experiência', href: '#experiencia' },
    { label: 'Contato', href: '#contato' },
  ],
} as const;

export type Site = typeof site;
