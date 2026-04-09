'use client';

export default function Footer() {
  return (
    <footer
      className="py-8 mt-16"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-disabled)' }}>ASBL Pre-Sales Intelligence</span>
        <span style={{ color: 'var(--text-disabled)' }}>Landmark & Broadway benchmarks</span>
      </div>
    </footer>
  );
}
