export function Marquee() {
  const companies = [
    "Amazon Prime",
    "Netflix",
    "Disney+ Hotstar",
    "Jio Cinema",
    "YouTube",
    "Bumble",
    "Swiggy Genie",
    "Bold Care",
    "EatSure",
    "Ather",
    "Infinix",
    "Frontrow",
    "WikiMedia"
  ];

  return (
    <div className="relative overflow-hidden bg-neutral-100 py-12">
      <div className="mb-6 text-center">
        <h3 className="tracking-wide opacity-70">Worked With</h3>
      </div>
      <div className="relative flex overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {companies.map((company, index) => (
            <div
              key={`first-${index}`}
              className="mx-8 flex items-center justify-center"
            >
              <span className="text-2xl font-semibold tracking-wide opacity-80 hover:opacity-100 transition-opacity">
                {company}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap">
          {companies.map((company, index) => (
            <div
              key={`second-${index}`}
              className="mx-8 flex items-center justify-center"
            >
              <span className="text-2xl font-semibold tracking-wide opacity-80 hover:opacity-100 transition-opacity">
                {company}
              </span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes marquee2 {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        .animate-marquee {
          animation: marquee 40s linear infinite;
        }

        .animate-marquee2 {
          animation: marquee2 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
