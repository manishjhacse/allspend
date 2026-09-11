'use client';

export function EmptyState({ emoji = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>{emoji}</div>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: '#17201C', marginBottom: 6 }}>{title}</h3>
      {description && (
        <p style={{ fontSize: 14, color: '#66736D', lineHeight: 1.5, marginBottom: action ? 20 : 0 }}>
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
}
