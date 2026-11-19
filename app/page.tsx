import Image from "next/image";
import Link from "next/link";
import { Reveal, StaggerGroup, StaggerItem } from "./components/animations";
import { SiteFooter, SiteHeader } from "./components/site-shell";
import { equipment } from "./data/equipment";

const categories = [
  {
    name: "Construction",
    count: "120+ tools",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Photography",
    count: "86 kits",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Vehicles",
    count: "64 rides",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Agriculture",
    count: "42 machines",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Electronics",
    count: "98 essentials",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Events",
    count: "57 setups",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=85",
  },
];

const reviews = [
  {
    quote:
      "Found the exact camera setup I needed for a weekend shoot. Booking was straightforward and the owner was lovely.",
    name: "Nusrat Jahan",
    role: "Photographer, Dhaka",
    initials: "NJ",
    rating: "5.0",
  },
  {
    quote:
      "We rented a mini excavator for a home project instead of buying one. It saved us time, money, and a lot of hassle.",
    name: "Arif Rahman",
    role: "Homeowner, Chattogram",
    initials: "AR",
    rating: "5.0",
  },
  {
    quote:
      "I listed equipment that was sitting unused in my workshop. It is now earning for me every single month.",
    name: "Maliha Chowdhury",
    role: "Equipment owner, Dhaka",
    initials: "MC",
    rating: "4.9",
  },
  {
    quote:
      "The flexible rental period made it easy to get our community event ready without overspending on gear.",
    name: "Tanvir Hasan",
    role: "Event organizer, Sylhet",
    initials: "TH",
    rating: "5.0",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div className={`section-heading${light ? " section-heading-light" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> GOOD GEAR. BETTER PROJECTS.</p>
            <h1>
              Make room for
              <br />
              <span>what&apos;s possible.</span>
            </h1>
            <p className="hero-description">
              Find the right equipment for the job, the journey, or the big idea.
              Rent from people nearby and get straight to making.
            </p>
            <div className="hero-actions">
              <a className="button button-accent" href="#featured">
                Find your equipment <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="#how-it-works">
                How Fieldkit works <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>R</span><span>M</span><span>A</span><span>+</span>
              </div>
              <p><strong>Made for doers.</strong><br />Trusted by a growing community.</p>
            </div>
            <span className="hero-scribble" aria-hidden="true">Make it happen</span>
          </div>

          <div className="hero-visual">
            <Image
              className="hero-image"
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=90"
              alt="Construction equipment ready for a new project"
              fill
              priority
              unoptimized
              sizes="(max-width: 760px) 100vw, 52vw"
            />
            <div className="hero-image-shade" />
            <div className="hero-location"><span aria-hidden="true">⌖</span> Dhaka & beyond</div>
            <div className="hero-note">
              <div><strong>Borrow good things.</strong><br /><span>Give your next idea a go.</span></div>
            </div>
            <div className="hero-caption"><span>01</span> The right tool changes everything.</div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Fieldkit at a glance">
          <div><strong>1,200<span>+</span></strong><span>ready-to-rent finds</span></div>
          <div><strong>4.9<span>/5</span></strong><span>average renter rating</span></div>
          <div><strong>64<span>%</span></strong><span>less than buying new</span></div>
          <p>Good for your project.<br /><em>Better for the planet.</em></p>
        </section>
        <p className="preview-disclaimer">
          This frontend preview uses sample figures, listings, and customer stories.
        </p>

        <section className="section categories-section" id="categories">
          <Reveal>
            <SectionHeading
              eyebrow="A PLACE FOR EVERY PROJECT"
              title="What are you looking for?"
              description="From a one-day fix to a big-time build, find what you need from people around you."
            />
          </Reveal>
          <StaggerGroup className="category-grid">
            {categories.map((category, index) => (
              <StaggerItem key={category.name}>
                <a className="category-card" href="#featured">
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 16vw"
                  />
                  <span className="category-shade" />
                  <span className="category-index">0{index + 1}</span>
                  <span className="category-info">
                    <strong>{category.name}</strong>
                    <span>{category.count} <span aria-hidden="true">↗</span></span>
                  </span>
                </a>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <section className="section featured-section" id="featured">
          <Reveal className="featured-heading-row">
            <SectionHeading
              eyebrow="GOOD FINDS, CLOSE BY"
              title="A few things worth borrowing."
              description="Owner-approved picks to get your next project moving."
            />
            <Link className="text-link featured-link" href="/equipment">
              Browse all equipment <span aria-hidden="true">↗</span>
            </Link>
          </Reveal>
          <StaggerGroup className="equipment-grid">
            {equipment.map((item) => (
              <StaggerItem key={item.name}>
                <article className="equipment-card">
                  <div className="equipment-image-wrap">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw"
                    />
                    <span className="equipment-tag"><span />{item.tag}</span>
                    <span className="favorite-mark" aria-hidden="true">♡</span>
                  </div>
                  <div className="equipment-content">
                    <div className="equipment-category">
                      <span>{item.category}</span><span className="rating">★ {item.rating}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p className="equipment-location"><span aria-hidden="true">⌖</span> {item.location}</p>
                    <div className="equipment-bottom">
                      <p><strong>{item.rate}</strong> <span>/ {item.period}</span></p>
                      <Link
                        className="details-arrow"
                        href="/equipment"
                        aria-label={`Browse live equipment like ${item.name}`}
                      >
                        ↗
                      </Link>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
          <p className="sample-note">A preview of the Fieldkit marketplace. Listings shown are illustrative.</p>
        </section>

        <section className="why-section" id="why-fieldkit">
          <div className="why-visual">
            <Image
              src="https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1400&q=85"
              alt="A well-organized collection of tools"
              fill
              unoptimized
              sizes="(max-width: 760px) 100vw, 50vw"
            />
            <div className="why-photo-label"><span>FIELD NOTES / 001</span><strong>Less owning.<br />More doing.</strong></div>
            <div className="why-stamp">USE<br />AGAIN<br /><span>↗</span></div>
          </div>
          <Reveal className="why-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> A BETTER WAY TO GET THINGS DONE</p>
            <h2>More doing.<br /><em>Less owning.</em></h2>
            <p className="why-description">
              Great equipment shouldn&apos;t sit idle, and good ideas shouldn&apos;t
              wait. We make it easier for neighbors to share the things that
              help them get things done.
            </p>
            <div className="benefit-list">
              <div><span className="benefit-number">01</span><p><strong>Keep more in your pocket</strong><br /><span>Rent for a fraction of the cost of buying.</span></p><span className="benefit-icon">↘</span></div>
              <div><span className="benefit-number">02</span><p><strong>Good gear, good people</strong><br /><span>Find quality equipment from local owners.</span></p><span className="benefit-icon">↘</span></div>
              <div><span className="benefit-number">03</span><p><strong>On your own timeline</strong><br /><span>Choose a rental period that fits your plans.</span></p><span className="benefit-icon">↘</span></div>
              <div><span className="benefit-number">04</span><p><strong>Better things, used more</strong><br /><span>Share what&apos;s already here. Waste a little less.</span></p><span className="benefit-icon">↘</span></div>
            </div>
          </Reveal>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-top">
            <Reveal>
              <SectionHeading
                eyebrow="NO FUSS. JUST GO."
                title="Three steps to getting it done."
                description="The right equipment is closer than you think."
                light
              />
            </Reveal>
            <Link className="button button-light" href="/equipment">Find your next rental <span aria-hidden="true">↗</span></Link>
          </div>
          <StaggerGroup className="steps-grid">
            {[
              { number: "01", title: "Find your thing", description: "Search equipment from local owners and compare what works for you.", symbol: "⌕" },
              { number: "02", title: "Make a plan", description: "Choose your dates, share a few details, and send a booking request.", symbol: "↗" },
              { number: "03", title: "Get out there", description: "Pick up your gear and get on with making something happen.", symbol: "↗" },
            ].map((step) => (
              <StaggerItem key={step.number}>
                <article className="step-card">
                  <div className="step-card-top"><span>{step.number} / 03</span><span className="step-symbol" aria-hidden="true">{step.symbol}</span></div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span className="step-rule" />
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <section className="section reviews-section" id="reviews">
          <Reveal>
            <SectionHeading
              eyebrow="GOOD WORDS FROM GOOD PEOPLE"
              title="Projects made possible."
              description="A little less buying. A lot more getting things done."
            />
          </Reveal>
          <StaggerGroup className="reviews-grid">
            {reviews.map((review) => (
              <StaggerItem key={review.name}>
                <article className="review-card">
                  <div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>★★★★★ <span>{review.rating}</span></div>
                  <blockquote>&ldquo;{review.quote}&rdquo;</blockquote>
                  <div className="review-person">
                    <span className="review-avatar">{review.initials}</span>
                    <span><strong>{review.name}</strong><br /><span>{review.role}</span></span>
                    <span className="review-verified" aria-label="Community member">✓</span>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
          <p className="sample-note">Customer stories shown here are illustrative examples.</p>
        </section>

        <section className="closing-cta">
          <div><p className="eyebrow">YOUR NEXT PROJECT STARTS HERE</p><h2>Got a thing to do?<br /><em>We&apos;ve got a thing for that.</em></h2></div>
          <Link className="button button-dark" href="/equipment">Explore equipment <span aria-hidden="true">↗</span></Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
