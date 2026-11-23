// Ember Clash — the four elemental suits.
// Every suit is told apart by BOTH a colour and a shape, never by text alone,
// so a card stays readable even at thumbnail size.
export const SUITS = {
  flame: { key: 'flame', name: 'Flame', glyph: '▲', colour: '#e5484d', dark: '#8f1d22', beats: 'leaf' },
  leaf: { key: 'leaf', name: 'Leaf', glyph: '◆', colour: '#46a758', dark: '#1e5c2e', beats: 'stone' },
  stone: { key: 'stone', name: 'Stone', glyph: '■', colour: '#8b8d98', dark: '#4c4e57', beats: 'tide' },
  tide: { key: 'tide', name: 'Tide', glyph: '●', colour: '#3e8ef7', dark: '#1c4f9e', beats: 'flame' },
};

export const SUIT_KEYS = ['flame', 'leaf', 'stone', 'tide'];

// The advantage cycle: Flame burns Leaf, Leaf cracks Stone,
// Stone dams Tide, Tide douses Flame.
export function suitBeats(attackerKey, defenderKey) {
  return SUITS[attackerKey].beats === defenderKey;
}

export function suitOf(card) {
  return SUITS[card.suit];
}

export function cardLabel(card) {
  return `${card.value} ${SUITS[card.suit].name}`;
}

// A card's face text for the big centre number and the corner pips.
export function cardFace(card) {
  const suit = SUITS[card.suit];
  return { value: String(card.value), glyph: suit.glyph, name: suit.name, colour: suit.colour };
}
