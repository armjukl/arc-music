// pages/_app.tsx
import '../styles/globals.css';
import Head from 'next/head';
import { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.className}>
      <Head>
        <title>Arc-music</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#6366f1" />
      </Head>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
