import ThemeToggle from "./ThemeToggle";
import { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

const API = import.meta.env.VITE_API || "http://localhost:4000";

export default function AuthForm({ onLogin }) {
  const [tab, setTab] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false); // 🔹 loading state

  // Load saved email if Remember Me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const checkStrength = (pwd) => {
    if (pwd.length < 6) return "Weak";
    if (/[A-Z]/.test(pwd) && /\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd))
      return "Strong";
    return "Medium";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true); // 🔹 start loading

      // Check confirm password
      if (tab === "register" && password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          tab === "login"
            ? { email, password }
            : { name, email, password }
        ),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      // Save token
      localStorage.setItem("token", data.token);

      // Save or remove remembered email
      if (rememberMe) localStorage.setItem("rememberEmail", email);
      else localStorage.removeItem("rememberEmail");

      console.log("📌 Logged in, token saved:", data.token);
      if (onLogin) onLogin(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // 🔹 stop loading
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">🌊 Ocean Hazard</h1>
        <ThemeToggle />
      </div>

      {/* Logo */}
      <img
        src="logo1.jpg"
        alt="Ocean Hazard Logo"
        className="w-20 h-20 mx-auto mb-4 rounded-full shadow-md"
      />

      <h1 className="text-2xl font-bold mb-2">🌊 Ocean Hazard Platform</h1>
      <p className="text-sm text-gray-600 mb-6">
        Crowdsourced hazard reporting for safer coastal communities.
      </p>

      {/* Tabs */}
      <div className="flex justify-center mb-4 space-x-2 text-sm font-medium">
        <button
          onClick={() => setTab("login")}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg transition ${
            tab === "login"
              ? "bg-blue-600 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <LogIn size={16} /> Login
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg transition ${
            tab === "register"
              ? "bg-blue-600 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <UserPlus size={16} /> Register
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white/90 p-6 rounded-2xl shadow-xl"
      >
        {tab === "register" && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />

        {/* Password with toggle */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordStrength(checkStrength(e.target.value));
            }}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Password Strength */}
        {password && (
          <p
            className={`text-sm font-medium ${
              passwordStrength === "Weak"
                ? "text-red-500"
                : passwordStrength === "Medium"
                ? "text-yellow-500"
                : "text-green-600"
            }`}
          >
            Strength: {passwordStrength}
          </p>
        )}

        {/* Confirm Password */}
        {tab === "register" && (
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        )}

        {/* Remember me + Forgot password */}
        {tab === "login" && (
          <div className="flex justify-between items-center text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded"
              />
              Remember me
            </label>
            <button type="button" className="text-blue-600 hover:underline">
              Forgot password?
            </button>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading} // 🔹 disable while loading
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg hover:opacity-90 transition font-semibold flex justify-center items-center gap-2"
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          )}
          {tab === "login" ? "Login" : "Register"}
        </button>
      </form>

      {/* Support Info */}
      <div className="mt-6 text-sm text-gray-700">
        <p>Need help? Contact our support:</p>
        <p>
          Toll-Free: <span className="font-semibold">1800-123-4567</span>
        </p>
        <p>
          Email: <span className="font-semibold">support@oceanhazard.org</span>
        </p>
      </div>

      <p className="mt-4 text-gray-500 text-xs">
        © 2025 Ocean Hazard Platform. All rights reserved.
      </p>
    </div>
  );
}
