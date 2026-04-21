// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t bg-background p-4 text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} TULUS. All rights reserved.
    </footer>
  );
}
