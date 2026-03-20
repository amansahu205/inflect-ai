const companies = [
  "apple.com", "nvidia.com", "tesla.com", "microsoft.com",
  "amazon.com", "google.com", "meta.com", "netflix.com",
  "berkshirehathaway.com", "jpmorgan.com", "goldmansachs.com", "visa.com",
];

const LOGO_TOKEN = "pk_AH1Nlal1QY6dlBilaz85Bg";

const LogoStrip = () => (
  <section className="py-10 border-t border-b border-border overflow-hidden" style={{ background: "#060A12" }}>
    <p className="text-center text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-8">
      Research any of these companies
    </p>
    <div className="relative overflow-hidden">
      <div className="flex animate-marquee w-max">
        {[...companies, ...companies].map((domain, i) => (
          <div key={`${domain}-${i}`} className="flex items-center justify-center mx-8 shrink-0">
            <img
              src={`https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&size=40`}
              alt={domain.replace(".com", "")}
              loading="lazy"
              className="h-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LogoStrip;
