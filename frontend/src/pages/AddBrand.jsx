import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addBrand } from "../lib/api";

export default function AddBrand({ onBrandAdded }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Brand name is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const competitorNames = competitorInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const newBrand = await addBrand({ name: name.trim(), category: category.trim(), competitorNames });
      onBrandAdded(newBrand);
      navigate("/");
    } catch (err) {
      setError("Couldn't add this brand. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Track a new brand</h1>
        <p className="text-sm text-text-muted">
          We'll start pulling mentions and running sentiment analysis as soon as this is saved.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm text-text-primary">
            Brand name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Zepto"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm text-text-primary">
            Category
          </label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Quick Commerce"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="competitors" className="text-sm text-text-primary">
            Competitors <span className="text-text-muted">(comma-separated, optional)</span>
          </label>
          <input
            id="competitors"
            value={competitorInput}
            onChange={(e) => setCompetitorInput(e.target.value)}
            placeholder="e.g. Blinkit, Swiggy Instamart"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Start tracking"}
        </button>
      </form>
    </div>
  );
}