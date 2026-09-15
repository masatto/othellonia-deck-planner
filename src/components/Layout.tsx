import { NavLink, Outlet } from "react-router-dom";
import { OfflineBanner } from "./OfflineBanner";

const NAV_ITEMS = [
  { to: "/", label: "デッキ一覧", icon: "🗂" },
  { to: "/search", label: "デッキを探す", icon: "🔍" },
  { to: "/backup", label: "バックアップ", icon: "💾" },
];

export function Layout() {
  return (
    <>
      <OfflineBanner />
      <Outlet />
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
