import Script from "next/script";

const CONTENTSQUARE_SRC = "https://t.contentsquare.net/uxa/6b6448fe82361.js";

export default function ContentsquareAnalytics() {
  if (process.env.NODE_ENV === "development") return null;

  return <Script src={CONTENTSQUARE_SRC} strategy="lazyOnload" />;
}
