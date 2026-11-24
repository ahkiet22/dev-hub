import { useState } from 'react';

export default function App({ basePath }: { basePath?: string }) {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
        Example Vite Remote App
      </h2>
      <p style={{ fontSize: '0.875rem', opacity: 0.75, marginTop: '0.25rem' }}>
        Mounted dynamically inside Dev Hub{basePath ? ` at ${basePath}` : ''}.
      </p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        style={{
          marginTop: '0.75rem',
          padding: '0.4rem 0.8rem',
          borderRadius: '0.375rem',
          border: '1px solid currentColor',
          cursor: 'pointer',
        }}
      >
        Remote Counter: {count}
      </button>
    </div>
  );
}
