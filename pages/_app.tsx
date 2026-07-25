// pages/_app.tsx
import '../styles/globals.css';
import Head from 'next/head';
import { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Arc-music</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#6366f1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
