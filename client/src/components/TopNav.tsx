import { Link, NavLink } from "react-router-dom";

export function TopNav(): JSX.Element {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? "#111827" : "rgba(17,24,39,0.7)",
    textDecoration: "none",
    fontWeight: isActive ? 700 : 500
  });

  return (
    <header
      style={{
        width: "100%",
        padding: "16px 24px",
        background: "linear-gradient(90deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link to="/" style={{ color: "#111827", textDecoration: "none", fontWeight: 800 }}>
          SkillBridge
        </Link>
        <nav style={{ display: "flex", gap: 16 }}>
          <NavLink to="/" style={linkStyle}>
            Home
          </NavLink>
          <NavLink to="/skills" style={linkStyle}>
            Skills
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

