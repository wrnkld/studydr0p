// Hardcoded card sort results view for the "Where does it go in the fridge?"
// example. Renders three stacked sections: BY CARD, MATRIX, DISAGREEMENT.
// Strict visual rules: black on white, no rounded corners, no icons, no shadows.

const CARDS = [
  "Ketchup",
  "Mayo",
  "Leftover pizza",
  "Beer",
  "Oat milk",
  "Mystery tupperware",
  "Wilting spinach",
  "Cheese",
  "Hot sauce",
  "Birthday cake",
  "Baking soda",
  "Eggs",
];

const CATEGORIES = [
  "Door",
  "Top shelf",
  "Middle shelf",
  "Bottom shelf",
  "Freezer",
  "Trash",
];

const TOTAL = 20;

// Hardcoded distribution: card -> category -> count
const DATA: Record<string, Record<string, number>> = {
  Ketchup: { Door: 9, "Middle shelf": 7, Trash: 4 },
  Mayo: { "Top shelf": 8, "Middle shelf": 5, Door: 4, Trash: 3 },
  "Leftover pizza": { "Middle shelf": 10, "Bottom shelf": 5, Freezer: 3, "Top shelf": 2 },
  Beer: { Door: 14, "Top shelf": 3, "Middle shelf": 3 },
  "Oat milk": { "Top shelf": 10, "Middle shelf": 8, Door: 2 },
  "Mystery tupperware": { Trash: 14, "Bottom shelf": 3, "Middle shelf": 2, Freezer: 1 },
  "Wilting spinach": { Trash: 17, "Bottom shelf": 2, "Middle shelf": 1 },
  Cheese: { "Middle shelf": 11, "Top shelf": 6, "Bottom shelf": 2, Door: 1 },
  "Hot sauce": { Door: 12, "Middle shelf": 4, "Top shelf": 2, Trash: 2 },
  "Birthday cake": { "Middle shelf": 8, "Top shelf": 4, "Bottom shelf": 3, Freezer: 5 },
  "Baking soda": { "Bottom shelf": 8, "Middle shelf": 5, Door: 3, Trash: 3, "Top shelf": 1 },
  Eggs: { "Bottom shelf": 9, Door: 7, "Middle shelf": 3, "Top shelf": 1 },
};

// Six shades of gray, one per category, used consistently across sections.
// Ordered to give clear visual separation in stacked bars.
const CATEGORY_SHADES: Record<string, string> = {
  Door: "#000000",
  "Top shelf": "#333333",
  "Middle shelf": "#5c5c5c",
  "Bottom shelf": "#858585",
  Freezer: "#adadad",
  Trash: "#d4d4d4",
};

function pct(n: number) {
  return Math.round((n / TOTAL) * 100);
}

// Shannon entropy normalized to 0..1, then to 0..100 for display.
function chaos(counts: Record<string, number>) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const n of Object.values(counts)) {
    if (n === 0) continue;
    const p = n / total;
    h -= p * Math.log2(p);
  }
  // Max entropy across the six categories
  const maxH = Math.log2(CATEGORIES.length);
  return Math.round((h / maxH) * 100);
}

function topCategory(counts: Record<string, number>) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [cat, n] = sorted[0];
  return { cat, pct: pct(n) };
}

export default function FridgeCardSortResults() {
  return (
    <div className="bg-white text-black space-y-16">
      {/* Top metadata row */}
      <section className="flex flex-wrap gap-x-24 gap-y-8 pt-4">
        {[
          { n: TOTAL, label: "participants" },
          { n: CARDS.length, label: "cards" },
          { n: CATEGORIES.length, label: "categories" },
        ].map((m) => (
          <div key={m.label}>
            <div className="text-7xl font-bold leading-none">{m.n}</div>
            <div className="mt-3 text-xs text-gray-500 uppercase tracking-wide">
              {m.label}
            </div>
          </div>
        ))}
      </section>

      <ByCardSection />
      <MatrixSection />
      <DisagreementSection />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest pb-2 border-b-4 border-black mb-6">
      {children}
    </h2>
  );
}

function ByCardSection() {
  return (
    <section>
      <SectionHeader>By card</SectionHeader>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-xs">
        {CATEGORIES.map((c) => (
          <div key={c} className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-3"
              style={{ backgroundColor: CATEGORY_SHADES[c] }}
            />
            <span>{c}</span>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {CARDS.map((card) => {
          const counts = DATA[card];
          const top = topCategory(counts);
          return (
            <div
              key={card}
              className="grid grid-cols-12 gap-4 items-center text-sm"
            >
              <div className="col-span-3 font-medium">{card}</div>
              <div className="col-span-6 flex h-6 w-full">
                {CATEGORIES.map((cat) => {
                  const n = counts[cat] ?? 0;
                  if (n === 0) return null;
                  return (
                    <div
                      key={cat}
                      title={`${cat}: ${n} (${pct(n)}%)`}
                      style={{
                        width: `${(n / TOTAL) * 100}%`,
                        backgroundColor: CATEGORY_SHADES[cat],
                      }}
                    />
                  );
                })}
              </div>
              <div className="col-span-3 text-xs text-gray-600">
                {top.cat} {top.pct}%
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MatrixSection() {
  // Darker fill for higher percentages. Pure black at 100%, white at 0%.
  const fill = (p: number) => {
    if (p === 0) return "transparent";
    // Map 0..100 -> 0.05..0.95 alpha
    const a = 0.05 + (p / 100) * 0.9;
    return `rgba(0,0,0,${a.toFixed(3)})`;
  };

  return (
    <section>
      <SectionHeader>Matrix</SectionHeader>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-black font-medium"></th>
              {CATEGORIES.map((c) => (
                <th
                  key={c}
                  className="p-2 border-b border-black font-medium text-left whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CARDS.map((card) => {
              const counts = DATA[card];
              return (
                <tr key={card}>
                  <td className="p-2 font-medium border-b border-gray-200 whitespace-nowrap">
                    {card}
                  </td>
                  {CATEGORIES.map((cat) => {
                    const n = counts[cat] ?? 0;
                    const p = pct(n);
                    return (
                      <td
                        key={cat}
                        className="p-2 border-b border-gray-200 text-center"
                        style={{
                          backgroundColor: fill(p),
                          color: p >= 55 ? "white" : "black",
                        }}
                      >
                        {p === 0 ? "" : `${p}%`}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DisagreementSection() {
  const ranked = CARDS.map((card) => ({
    card,
    chaos: chaos(DATA[card]),
  })).sort((a, b) => b.chaos - a.chaos);

  return (
    <section>
      <SectionHeader>Disagreement</SectionHeader>
      <div className="space-y-3">
        {ranked.map((r) => (
          <div
            key={r.card}
            className="grid grid-cols-12 gap-4 items-center text-sm"
          >
            <div className="col-span-3 font-medium">{r.card}</div>
            <div className="col-span-7 h-4 bg-gray-100">
              <div
                className="h-full bg-black"
                style={{ width: `${r.chaos}%` }}
              />
            </div>
            <div className="col-span-2 text-xs text-gray-600">
              {r.chaos}% chaos
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
