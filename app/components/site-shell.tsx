import Link from "next/link";

function BrandMark() {
  return (
    <Link className="brand" href="/#top" aria-label="Fieldkit home">
      <span className="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 36 36" fill="none">
          <path
            d="M7 25.5 18 7l11 18.5H7Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 25.5 18 15l6 10.5M18 7v5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>fieldkit<span className="brand-period">.</span></span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <>
      <div className="announcement">
        <span className="announcement-dot" />
        The smarter way to get the gear you need.{" "}
        <Link href="/#how-it-works">See how it works <span aria-hidden="true">→</span></Link>
      </div>
      <header className="site-header" id="top">
        <div className="nav-shell">
          <BrandMark />
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/equipment">Find equipment</Link>
            <Link href="/#categories">Categories</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#reviews">Our community</Link>
          </nav>
          <Link className="button button-dark nav-cta" href="/equipment">
            Explore rentals <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <BrandMark />
          <p>Good gear has more than one life.<br />Let&apos;s make the most of it.</p>
        </div>
        <div className="footer-column">
          <strong>Explore</strong>
          <Link href="/equipment">Find equipment</Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/#how-it-works">How it works</Link>
        </div>
        <div className="footer-column">
          <strong>Fieldkit</strong>
          <Link href="/#why-fieldkit">Our story</Link>
          <Link href="/#reviews">Community</Link>
          <Link href="/#top">Back to top ↑</Link>
        </div>
        <div className="footer-note">
          <span>MADE FOR THE MAKERS.</span>
          <p>Share what you have.<br /><em>Find what you need.</em></p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Fieldkit. Make good things happen.</span>
        <span>Made for a more resourceful world</span>
      </div>
    </footer>
  );
}
