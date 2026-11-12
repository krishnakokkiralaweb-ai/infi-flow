
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../../firebase/auth";
import { useAuth } from "../../../AuthContext";
import "./AdminLogin.css";
import usePageTitle from "../../../hooks/usePageTitle";

function AdminLogin() {
  usePageTitle("Admin Login");

  const navigate = useNavigate();

  const {
    user,
    isAdmin,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginAdmin(email, password);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      <div className="login-card">
        <div className="login-brand">
          <div className="brand-symbol">∞</div>
          <span>INIFLOW</span>
        </div>

        <div className="login-heading">
          <span className="login-tag">ADMIN PORTAL</span>
          <h1>Welcome Back</h1>
          <p>Sign in to manage your creative workspace.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="login-button"
            disabled={loading || authLoading}
          >
            {loading || authLoading
              ? "Signing in..."
              : "Sign In"}
            {!loading && !authLoading && <span>→</span>}
          </button>
        </form>

        <div className="login-footer">
          <span className="footer-dot"></span>
          Secure Admin Access
        </div>
      </div>

      <p className="login-copyright">
        © {new Date().getFullYear()} INIFLOW. All rights reserved.
      </p>
    </div>
  );
}

export default AdminLogin;
