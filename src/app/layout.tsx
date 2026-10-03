import "./globals.css";

// The real <html> lives in [locale]/layout.tsx; this root only exists so Next has one.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
