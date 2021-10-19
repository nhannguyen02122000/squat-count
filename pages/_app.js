import '../styles/globals.css'
import Script from 'next/script'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Script src="https://unpkg.com/ml5@latest/dist/ml5.min.js" strategy="beforeInteractive" />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
