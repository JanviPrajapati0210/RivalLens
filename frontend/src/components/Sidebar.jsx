import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/add-brand", label: "Add brand" },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-surface px-4 py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
        <span className="font-display text-lg font-semibold text-text-primary">RivalLens</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-brand/15 text-text-primary"
                  : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}