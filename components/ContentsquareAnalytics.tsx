import Script from "next/script";

const CONTENTSQUARE_SRC = "https://t.contentsquare.net/uxa/6b6448fe82361.js";

export default function ContentsquareAnalytics() {
  return <Script src={CONTENTSQUARE_SRC} strategy="afterInteractive" />;
}
