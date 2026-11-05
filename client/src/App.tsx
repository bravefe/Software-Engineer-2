import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import HealthPage from "./pages/Health";
import HomePage from "./pages";
import LoginPage from "./pages/Login";
import NotFoundPage from "./pages/NotFound";

function LoginRoute() {
  const navigate = useNavigate();

  return <LoginPage onLoginSuccess={() => navigate("/", { replace: true })} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="login" element={<LoginRoute />} />
        <Route path="not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </AuthProvider>
  );
}
