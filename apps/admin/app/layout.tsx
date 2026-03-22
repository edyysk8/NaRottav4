export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#0b1020', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
