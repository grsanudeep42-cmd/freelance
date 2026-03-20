import { Navigate, Route, Routes } from "react-router-dom";
import { TopNav } from "./components/TopNav";
import { HomePage } from "./pages/HomePage";
import { SkillsPage } from "./pages/SkillsPage";

export default function App(): JSX.Element {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, rgba(59,130,246,0.06), transparent)" }}>
      <TopNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

