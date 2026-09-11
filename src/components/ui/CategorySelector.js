'use client';

// ─── Category Configuration ───────────────────────────────────────────────

export const CATEGORY_CONFIG = {
  'Food':          { emoji: '🍽️', color: '#FF5C5C' },
  'Groceries':     { emoji: '🛒', color: '#00C853' },
  'Shopping':      { emoji: '🛍️', color: '#5B8EFF' },
  'Travel':        { emoji: '🚗', color: '#FF9F40' },
  'Rent':          { emoji: '🏠', color: '#F59E0B' },
  'Investments':   { emoji: '📈', color: '#A78BFA' },
  'Health':        { emoji: '💊', color: '#EC4899' },
  'EMI/Bill':      { emoji: '⚡', color: '#8A8A8A' },
  'Subscriptions': { emoji: '🔄', color: '#06B6D4' },
  'Entertainment': { emoji: '🎬', color: '#F97316' },
  'Education':     { emoji: '📚', color: '#14B8A6' },
  'Personal':      { emoji: '👤', color: '#E879F9' },
  'Others':        { emoji: '📌', color: '#555555' },
  // Legacy
  'Other':         { emoji: '📌', color: '#555555' },
  'Bills':         { emoji: '⚡', color: '#8A8A8A' },
};

export function getCategoryConfig(name) {
  return CATEGORY_CONFIG[name] || CATEGORY_CONFIG['Others'];
}

// ─── Category Icon (circular, dark) ──────────────────────────────────────

export function CategoryIcon({ name, size = 36 }) {
  const config = getCategoryConfig(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${config.color}20`,
        border: `1px solid ${config.color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {config.emoji}
    </div>
  );
}

// ─── Category Selector (pill grid, dark) ─────────────────────────────────

export function CategorySelector({ value, onChange, categories }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {categories.map((cat) => {
        const config = getCategoryConfig(cat.name);
        const selected = value === cat.name;
        return (
          <button
            key={cat.id || cat.name}
            type="button"
            onClick={() => onChange(cat.name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 100,
              border: `1.5px solid ${selected ? config.color : '#242424'}`,
              background: selected ? `${config.color}18` : 'transparent',
              color: selected ? config.color : '#8A8A8A',
              fontSize: 13,
              fontWeight: selected ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14 }}>{config.emoji}</span>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
