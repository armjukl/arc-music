// pages/_app.tsx
import '../styles/globals.css';
import { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/next';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

export default MyApp;
