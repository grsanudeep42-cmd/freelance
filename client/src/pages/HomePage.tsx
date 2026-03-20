import { useAuth } from "../store/authContext";

export function HomePage(): JSX.Element {
  const { state, login, logout } = useAuth();

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>Find skills. Hire talent.</h1>
      <p style={{ marginTop: 12, color: "rgba(0,0,0,0.7)" }}>
        SkillBridge helps teams and freelancers match on verified skills across design, development, writing, and more.
      </p>

      <div style={{ marginTop: 20 }}>
        {state.isAuthenticated ? (
          <button onClick={logout} style={{ padding: "10px 14px", cursor: "pointer" }}>
            Logout {state.displayName ? `(${state.displayName})` : ""}
          </button>
        ) : (
          <button
            onClick={() => login("Demo User")}
            style={{ padding: "10px 14px", cursor: "pointer" }}
          >
            Login (demo)
          </button>
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>Try it:</p>
        <ul style={{ marginTop: 8, color: "rgba(0,0,0,0.7)" }}>
          <li>Go to “Skills” to load sample data from the API.</li>
          <li>Health-check the server at `GET /health`.</li>
        </ul>
      </div>
    </main>
  );
}

