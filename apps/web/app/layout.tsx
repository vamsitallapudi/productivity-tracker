import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var KEY = 'themeV1';
              var t = localStorage.getItem(KEY);
              if (t === 'dark' || t === 'light') {
                document.documentElement.classList.toggle('dark', t === 'dark');
              } else {
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', prefersDark);
              }
            } catch (e) {}
          })();
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
