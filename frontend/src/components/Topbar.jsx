export default function Topbar({ brands, activeBrandId, onChangeBrand }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-ink px-6">
      <div className="flex items-center gap-3">
        <label htmlFor="brand-switch" className="text-sm text-text-muted">
          Tracking
        </label>
        <select
          id="brand-switch"
          value={activeBrandId ?? ""}
          onChange={(e) => onChangeBrand(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}