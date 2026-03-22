export function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ background: '#121932', padding: 20, borderRadius: 16, minWidth: 220, border: '1px solid #1f2b55' }}>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
