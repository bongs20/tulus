// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t border-border bg-white p-4 text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} TULUS · Teknologi Usulan Layanan Sosial
    </footer>
  );
}
