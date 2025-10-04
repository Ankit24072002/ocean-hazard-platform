// --- imports remain the same ---
import { useState } from "react";
import AuthForm from "./components/Authform.jsx";
import ReportForm from "./components/ReportForm.jsx";
import MapView from "./components/MapView.jsx";
import FeedPanel from "./components/FeedPanel.jsx";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Sun, Moon, MessageSquare, Map, Home, Share2, Shield, List, Headphones,
  Twitter, Facebook, Instagram, Youtube
} from "lucide-react";

import Papa from "papaparse";

// --- ThemeToggle ---
function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-gray-400 dark:border-gray-600 transition-all duration-300 absolute top-4 right-4"
      title="Toggle Theme"
    >
      {theme === "light" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

// --- Main App ---
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role] = useState("admin");
  const [reports, setReports] = useState([]);
  const [initialReports, setInitialReports] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedLat, setSelectedLat] = useState("");
  const [selectedLon, setSelectedLon] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeTab, setActiveTab] = useState("dashboard"); // navigation

  // handlers
  const handleAction = (id, status) =>
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  const toggleFavorite = (id) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  const handleAddReport = (r) => {
    setReports((prev) => [r, ...prev]);
    setInitialReports((prev) => [r, ...prev]);
  };

  // filters
  const filteredReports = reports
    .filter((r) => {
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      const matchesSearch =
        r.hazard_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "latest") return b.timestamp - a.timestamp;
      if (sortBy === "oldest") return a.timestamp - b.timestamp;
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    })
    .slice(0, visibleCount);

  const stats = [
    { name: "Pending", value: reports.filter((r) => r.status === "Pending").length },
    { name: "Approved", value: reports.filter((r) => r.status === "Approved").length },
    { name: "Rejected", value: reports.filter((r) => r.status === "Rejected").length },
  ];
  const colors = ["#facc15", "#22c55e", "#ef4444"];

  // ---------- LOGIN VIEW ----------
  if (!loggedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center dark:bg-gray-900"
        style={{ backgroundImage: "url('main image.jpg')" }}
      >
        <ThemeToggle />
        <div className="bg-white/90 dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-4 text-black dark:text-white">
            🌊 Administrator Registration
          </h1>
          <AuthForm onLogin={() => setLoggedIn(true)} />
        </div>
      </div>
    );
  }

  // ---------- MAIN APP VIEW ----------
  return (
    <div
      className="min-h-screen p-4 bg-blue-50 dark:bg-gray-900 bg-cover bg-center"
      style={{ backgroundImage: "url('floods.jpg')" }}
    >
      <ThemeToggle />
      <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-800 p-4 rounded-2xl shadow-xl">
      <div className="flex justify-center mb-4 gap-2">
  <input
    type="text"
    placeholder="Search by hazard type or description..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-1/3 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
  />
  <button
    onClick={() => {
      // optional: you can trigger a manual search here if needed
      // currently live filtering handles it automatically
    }}
    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
  >
    🔍 Search
  </button>
</div>
        
        {/* 🔹 NAVIGATION TABS */}
        <div className="flex flex-wrap justify-around mb-6 border-b pb-2 text-sm font-medium gap-2">
          <button onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-1 ${activeTab==="dashboard"?"text-blue-600 font-semibold":"text-gray-600 dark:text-gray-300"}`}>
            <Home size={16}/> Dashboard
          </button>
          <button onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1 ${activeTab==="map"?"text-blue-600 font-semibold":"text-gray-600 dark:text-gray-300"}`}>
            <Map size={16}/> Maps
          </button>
          <button onClick={() => setActiveTab("feedback")}
            className={`flex items-center gap-1 ${activeTab==="feedback"?"text-blue-600 font-semibold":"text-gray-600 dark:text-gray-300"}`}>
            <MessageSquare size={16}/> Feedback
          </button>
          <button onClick={() => setActiveTab("social")}
            className={`flex items-center gap-1 ${activeTab==="social"?"text-blue-600 font-semibold":"text-gray-600 dark:text-gray-300"}`}>
            <Share2 size={16}/> Social
          </button>
          <button onClick={() => setActiveTab("tips")}
            className={`flex items-center gap-1 ${activeTab==="tips"?"text-blue-600 font-semibold":"text-gray-600 dark:text-gray-300"}`}>
            <Shield size={16}/> Safety Tips
          </button>
          <button onClick={() => setActiveTab("myreports")}
            className={`flex items-center gap-1 ${activeTab==="myreports"?"text-blue-600 font-semibold":"text-gray-600 dark:text-gray-300"}`}>
            <List size={16}/> My Reports
          </button>
          <button onClick={() => setActiveTab("support")}
            className={`flex items-center gap-1 ${activeTab==="support"?"text-blue-600 font-semibold":"text-gray-600 dark:text-gray-300"}`}>
            <Headphones size={16}/> Support
          </button>
        </div>

        {/* 🔹 CONDITIONAL RENDERING */}
        {activeTab === "dashboard" && (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center gap-2 border-b pb-3">
      <span className="text-2xl">📊</span>
      <h1 className="text-xl font-bold text-black dark:text-white">
        Reports Dashboard
      </h1>
    </div>

    {/* Top Stats Overview */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow hover:scale-105 transition">
        <h3 className="text-sm">🌊 Total Reports</h3>
        <p className="text-2xl font-bold">{reports.length}</p>
      </div>
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl shadow hover:scale-105 transition">
        <h3 className="text-sm">✅ Verified Reports</h3>
        <p className="text-2xl font-bold">
          {reports.filter((r) => r.status === "verified").length}
        </p>
      </div>
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-xl shadow hover:scale-105 transition">
        <h3 className="text-sm">⭐ Favorites</h3>
        <p className="text-2xl font-bold">{favorites.length}</p>
      </div>
    </div>

    {/* Dashboard Grid */}
    <div className="grid md:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg transition">
        <h2 className="font-semibold mb-3 text-black dark:text-white">
          📈 Report Statistics
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={stats}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label
            >
              {stats.map((entry, index) => (
                <Cell
                  key={index}
                  fill={colors[index % colors.length]}
                  className="cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Reports Feed */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg transition">
        <h2 className="font-semibold mb-3 text-black dark:text-white">
          📰 Reports Feed
        </h2>
        <FeedPanel
          reports={filteredReports}
          onAction={handleAction}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          role={role}
        />
      </div>
    </div>
  </div>
)}


        {activeTab === "map" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow h-[70vh]">
              <MapView
                reports={reports}
                onMapClick={(latlng) => {
                  setSelectedLat(latlng.lat.toFixed(5));
                  setSelectedLon(latlng.lng.toFixed(5));
                }}
              />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
              <ReportForm onCreated={handleAddReport} defaultLat={selectedLat} defaultLon={selectedLon}/>
            </div>
          </div>
        )}

        {activeTab === "feedback" && (
  <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xl text-black dark:text-white space-y-6 border border-gray-200 dark:border-gray-700 animate-fade-in">
    
    {/* Gradient Header Strip */}
    <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 to-indigo-600"></div>

    {/* Header */}
    <div className="flex items-center gap-2 border-b pb-3 border-gray-200 dark:border-gray-700">
      <span className="text-2xl animate-bounce">💬</span>
      <h2 className="text-xl font-bold">Submit Feedback</h2>
    </div>

    {/* Emoji Rating */}
    <div>
      <p className="text-sm font-semibold mb-2">Rate your experience:</p>
      <div className="flex gap-4 text-2xl">
        {["😀","😐","😡"].map((emoji, i) => (
          <span
            key={i}
            title={i === 0 ? "Great!" : i === 1 ? "Okay" : "Needs Improvement"}
            className={`cursor-pointer hover:scale-125 transition duration-200 ${
              i === 0 ? "hover:text-green-500" : i === 1 ? "hover:text-yellow-500" : "hover:text-red-500"
            }`}
            onClick={() => alert(`You selected: ${emoji}`)}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>

    {/* Category Dropdown */}
    <div>
      <label className="block text-sm font-semibold mb-1">Category:</label>
      <select className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition">
        <option value="">-- Select an option --</option>
        <option value="ui">🎨 User Interface</option>
        <option value="features">⚙️ Features</option>
        <option value="performance">⚡ Performance</option>
        <option value="bugs">🐞 Bug Report</option>
        <option value="other">📝 Other</option>
      </select>
    </div>

    {/* Textarea with live counter */}
    <div>
      <label className="block text-sm font-semibold mb-1">Your Feedback:</label>
      <textarea
        id="feedback-textarea"
        className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition"
        rows={5}
        maxLength={300}
        placeholder="Share your thoughts about the platform..."
        onInput={(e) => {
          const counter = document.getElementById("char-counter");
          if (counter) counter.textContent = `${e.target.value.length} / 300 characters`;
        }}
      ></textarea>
      <p id="char-counter" className="text-xs text-right text-gray-500 mt-1">0 / 300 characters</p>
    </div>

    {/* Contact (optional) */}
    <div>
      <label className="block text-sm font-semibold mb-1">Contact (optional):</label>
      <input
        type="email"
        placeholder="Enter email if you want us to reach you"
        className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
    </div>

    {/* Submit Button with spinner */}
    <div className="text-center">
      <button
        id="submit-btn"
        className="relative px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-md hover:scale-105 transition-transform group"
        onClick={() => {
          const btn = document.getElementById("submit-btn");
          const spinner = document.getElementById("spinner");
          btn.disabled = true;
          spinner.classList.remove("hidden");
          setTimeout(() => {
            spinner.classList.add("hidden");
            btn.disabled = false;
            alert("Feedback submitted successfully!");
          }, 1200);
        }}
      >
        <span className="flex items-center justify-center gap-2">
          🚀 Send Feedback
          <svg
            id="spinner"
            className="hidden animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle>
            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </span>
      </button>
    </div>

    {/* Success Message */}
    <div className="hidden mt-3 p-3 rounded-lg bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 text-sm text-center">
      ✅ Thank you! Your feedback has been submitted.
    </div>
  </div>
)}

        {activeTab === "social" && (
  <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg text-black dark:text-white space-y-8">
    
    {/* Header */}
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-extrabold flex items-center gap-2">
        📱 Social Media Updates
      </h2>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Stay connected with live feeds & news
      </span>
    </div>

    {/* 🔄 Live Ticker Bar */}
    <div className="overflow-hidden relative h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center">
      <p className="absolute whitespace-nowrap animate-marquee text-white font-semibold text-sm">
        🚨 Breaking: IMD issues cyclone warning • 🌊 NDRF deployed for relief • ⚡ Stay indoors during heavy rains • 📢 Follow official channels for verified news
      </p>
    </div>

    {/* Round Icon Buttons */}
    <div className="flex gap-4 flex-wrap justify-center">
      <button
        onClick={() => window.open("https://twitter.com", "_blank")}
        className="p-3 rounded-full bg-blue-500 text-white hover:rotate-12 hover:scale-110 transition-transform shadow-md"
        title="Twitter"
      >
        <Twitter className="w-5 h-5" />
      </button>
      <button
        onClick={() => window.open("https://facebook.com", "_blank")}
        className="p-3 rounded-full bg-blue-700 text-white hover:rotate-12 hover:scale-110 transition-transform shadow-md"
        title="Facebook"
      >
        <Facebook className="w-5 h-5" />
      </button>
      <button
        onClick={() => window.open("https://instagram.com", "_blank")}
        className="p-3 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white hover:rotate-12 hover:scale-110 transition-transform shadow-md"
        title="Instagram"
      >
        <Instagram className="w-5 h-5" />
      </button>
      <button
        onClick={() => window.open("https://youtube.com", "_blank")}
        className="p-3 rounded-full bg-red-600 text-white hover:rotate-12 hover:scale-110 transition-transform shadow-md"
        title="YouTube"
      >
        <Youtube className="w-5 h-5" />
      </button>
    </div>

    {/* 🌟 Trending Hashtags */}
    <div className="flex gap-2 flex-wrap justify-center">
      {["#StaySafe", "#CycloneAlert", "#DisasterPreparedness", "#NDRF", "#IMDUpdates"].map((tag, i) => (
        <span 
          key={i} 
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-blue-500 hover:text-white cursor-pointer transition"
        >
          {tag}
        </span>
      ))}
    </div>

    {/* Content Grid */}
    <div className="grid md:grid-cols-3 gap-6">
      
      {/* News Section */}
      <div className="col-span-1 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col">
        <h3 className="text-lg font-semibold mb-3">📰 Latest Updates</h3>
        <div className="overflow-y-auto space-y-3 pr-2 max-h-80">
          <div className="bg-white dark:bg-gray-700 p-3 rounded-lg hover:shadow transition">
            <p className="text-sm font-medium">🌊 Cyclone alert issued for coastal regions.</p>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded-lg hover:shadow transition">
            <p className="text-sm font-medium">🚨 IMD reports heavy rainfall in Bay of Bengal.</p>
            <span className="text-xs text-gray-500">5 hours ago</span>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded-lg hover:shadow transition">
            <p className="text-sm font-medium">📢 NDRF deployed for emergency response.</p>
            <span className="text-xs text-gray-500">Yesterday</span>
          </div>
        </div>
      </div>

      {/* Video Section */}
      <div className="col-span-2 grid gap-4">
        <div className="w-full h-64 border rounded-xl overflow-hidden shadow relative group">
          <iframe
            src="https://www.youtube.com/embed/PA-s5T3D7a8"
            className="w-full h-full"
            title="Cyclone Fengal Live Tracker"
            allowFullScreen
          ></iframe>
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Cyclone Fengal Live Tracker</span>
        </div>
        <div className="w-full h-64 border rounded-xl overflow-hidden shadow relative group">
          <iframe
            src="https://www.youtube.com/embed/UMkxwSFHxgs"
            className="w-full h-full"
            title="YouTube Live"
            allowFullScreen
          ></iframe>
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Emergency Broadcast</span>
        </div>
      </div>
    </div>
    
    {/* 📊 Poll Section */}
    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl shadow text-center space-y-3">
      <h3 className="font-semibold">📊 Quick Poll: Are you prepared for emergencies?</h3>
      <div className="flex gap-3 justify-center">
        <button className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:scale-105 transition">✅ Yes</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:scale-105 transition">🤔 Maybe</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:scale-105 transition">❌ No</button>
      </div>
    </div>

    {/* 🎶 Background Tune */}
    <div className="flex justify-center">
      <button
        onClick={() => {
          const audio = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
          audio.play();
        }}
        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow hover:scale-105 transition"
      >
        🎶 Play Calm Background Tune
      </button>
    </div>
    
    {/* CTA */}
    <div className="text-center">
      <button
        onClick={() => alert("More updates coming soon!")}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-md hover:scale-105 transition-transform"
      >
        🔔 Get More Live Updates
      </button>
    </div>
  </div>
)}



        {activeTab === "tips" && (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg text-black dark:text-white space-y-8">
    {/* Header */}
    <div className="flex items-center gap-2 border-b pb-3">
      <span className="text-2xl animate-bounce">🛡️</span>
      <h2 className="text-xl font-bold">Safety Tips</h2>
    </div>

    {/* 🔔 Quick Live Alert Banner */}
    <div className="p-3 bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm rounded-lg shadow animate-pulse">
      🚨 Live Alert: High tide expected in coastal areas. Stay away from beaches!
    </div>

    {/* 🚨 Alert Box (Original) */}
    <div className="p-4 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-800 dark:to-red-900 rounded-lg border border-red-400 flex items-start gap-3 shadow">
      <span className="text-red-600 dark:text-red-300 text-2xl animate-pulse">⚠️</span>
      <p className="text-sm font-medium text-red-800 dark:text-red-200">
        Stay alert during cyclone warnings. Follow evacuation orders from local authorities immediately.
      </p>
    </div>

    {/* 🌟 Animated Tip Carousel */}
    <div className="overflow-hidden relative h-20 bg-indigo-50 dark:bg-indigo-800 rounded-lg flex items-center justify-center">
      <p className="absolute whitespace-nowrap animate-marquee text-indigo-700 dark:text-indigo-200 font-medium">
        📝 Remember: Keep documents safe • 💡 Charge power banks • 🚰 Store drinking water • 🩹 First aid kit ready
      </p>
    </div>

    {/* 📊 Readiness Meter */}
    <div>
      <h3 className="font-semibold mb-2">Your Preparedness Level</h3>
      <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
        <div
          className="bg-green-500 h-4 rounded-full animate-pulse"
          style={{ width: "70%" }}
        ></div>
      </div>
      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
        You are 70% prepared. Keep improving!
      </p>
    </div>

    {/* 📋 Essential Checklist (Original) */}
    <div>
      <h3 className="font-semibold text-lg mb-3">📋 Essential Checklist</h3>
      <ul className="space-y-3">
        <li className="flex items-start gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:shadow transition">
          <span className="text-green-600 dark:text-green-400 text-lg">✔️</span>
          <div>
            <p className="font-medium">Stay updated with official forecasts</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Check IMD or NDMA updates regularly.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:shadow transition">
          <span className="text-green-600 dark:text-green-400 text-lg">✔️</span>
          <div>
            <p className="font-medium">Avoid beaches during alerts</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Strong waves and winds can be fatal.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:shadow transition">
          <span className="text-green-600 dark:text-green-400 text-lg">✔️</span>
          <div>
            <p className="font-medium">Prepare emergency kits</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Include food, water, first aid, flashlight, and power bank.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:shadow transition">
          <span className="text-green-600 dark:text-green-400 text-lg">✔️</span>
          <div>
            <p className="font-medium">Report hazards immediately</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use this platform to alert authorities in real-time.
            </p>
          </div>
        </li>
      </ul>
    </div>

    {/* 🎯 Hazard-Specific Tabs (New Feature) */}
    <div>
      <h3 className="font-semibold text-lg mb-3">⚡ Hazard-Specific Tips</h3>
      <div className="flex gap-3 flex-wrap">
        {["Cyclone", "Flood", "Earthquake", "Fire"].map((hazard, idx) => (
          <button
            key={idx}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-blue-500 hover:text-white transition"
          >
            {hazard}
          </button>
        ))}
      </div>
    </div>

    {/* 📞 Emergency Contacts (Original) */}
    <div className="p-4 bg-blue-100 dark:bg-blue-800 rounded-lg border border-blue-400">
      <h3 className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-200">
        📞 Emergency Contacts
      </h3>
      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
        <li>🚑 Ambulance: 108</li>
        <li>🚒 Fire & Rescue: 101</li>
        <li>👮 Police: 100</li>
        <li>🌊 NDMA Helpline: 1078</li>
      </ul>
    </div>

    {/* 📺 YouTube Section (Original) */}
    <div>
      <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
        📺 Learn More
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative group">
          <iframe
            src="https://www.youtube.com/embed/43M5mZuzHF8"
            className="w-full h-52 border rounded-lg shadow-md group-hover:scale-105 transition-transform"
            title="Disaster Preparedness Video"
            allowFullScreen
          ></iframe>
          <p className="absolute bottom-1 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
            Disaster Preparedness
          </p>
        </div>
        <div className="relative group">
          <iframe
            src="https://www.youtube.com/embed/Lq5k7IG_TV0"
            className="w-full h-52 border rounded-lg shadow-md group-hover:scale-105 transition-transform"
            title="Emergency Safety Guide"
            allowFullScreen
          ></iframe>
          <p className="absolute bottom-1 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
            Emergency Safety Guide
          </p>
        </div>
      </div>
    </div>

    {/* 🎵 Relaxing Audio Button (New Feature) */}
    <div className="flex justify-center">
      <button
        onClick={() => {
          const audio = new Audio(
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          );
          audio.play();
        }}
        className="px-5 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium rounded-lg shadow hover:scale-105 transition"
      >
        🎵 Play Relaxing Guide Audio
      </button>
    </div>

    {/* 📘 Call to Action (Original) */}
    <div className="text-center">
      <a
        href="https://ndma.gov.in/en/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow hover:scale-105 transition-transform"
      >
        📘 Read Full Safety Guide
      </a>
    </div>
  </div>
)}



        {activeTab === "myreports" && (
  <div className="space-y-6">
    {/* ✅ Your Original Code (Unchanged) */}
    {/* Header */}
    <div className="flex items-center gap-2 border-b pb-3">
      <span className="text-2xl">📑</span>
      <h2 className="text-lg font-bold text-black dark:text-white">
        My Reports
      </h2>
    </div>

    {/* Filters */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Search reports..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/2 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      />

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full md:w-1/4 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <option value="">All Statuses</option>
        <option value="verified">Verified</option>
        <option value="pending">Pending</option>
      </select>
    </div>

    {/* Report Count Summary */}
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl shadow hover:scale-105 transition transform">
      <h3 className="text-sm">📝 Total Reports Submitted</h3>
      <p className="text-2xl font-bold">{reports.length}</p>
    </div>

    {/* Report List */}
    <div className="space-y-3">
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-100 dark:bg-gray-800 rounded-xl shadow">
          <span className="text-5xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            No reports found. Try adjusting filters or submit a new report!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredReports.map((r, idx) => {
            const hazardColors = {
              Flood: "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200",
              Cyclone: "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200",
              Fire: "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200",
              Earthquake: "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200",
              Storm: "bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-200",
              Default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            };
            const hazardClass = hazardColors[r.hazard_type] || hazardColors.Default;

            return (
              <li
                key={idx}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                           bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 
                           transition flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 shadow-sm hover:shadow-md"
              >
                {/* Hazard Info */}
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="text-xl">
                    {r.hazard_type === "Flood" && "🌊"}
                    {r.hazard_type === "Cyclone" && "🌀"}
                    {r.hazard_type === "Fire" && "🔥"}
                    {r.hazard_type === "Earthquake" && "🌍"}
                    {r.hazard_type === "Storm" && "⛈️"}
                    {!r.hazard_type && "⚠️"}
                  </span>
                  <div>
                    <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
                      {r.hazard_type}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${hazardClass}`}>
                        {r.hazard_type || "Unknown"}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {r.description}
                    </p>
                    {r.date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        📅 {new Date(r.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-0">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      r.status === "verified"
                        ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200"
                    }`}
                  >
                    {r.status ? r.status : "Pending"}
                  </span>
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    View
                  </button>
                  <button className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition">
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>

    {/* ✅ Extra Features Below */}

    {/* Report Category Filter */}
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mt-6">
      <label className="font-semibold text-sm">Filter by Hazard Type</label>
      <select
        onChange={(e) => setHazardFilter(e.target.value)}
        className="mt-2 w-full p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white"
      >
        <option value="">All Hazards</option>
        <option value="Flood">🌊 Flood</option>
        <option value="Cyclone">🌀 Cyclone</option>
        <option value="Fire">🔥 Fire</option>
        <option value="Earthquake">🌍 Earthquake</option>
        <option value="Storm">⛈️ Storm</option>
      </select>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="p-4 bg-green-100 dark:bg-green-800 rounded-xl text-center shadow">
        <h4 className="text-2xl font-bold text-green-700 dark:text-green-200">
          {reports.filter((r) => r.status === "verified").length}
        </h4>
        <p className="text-sm">✅ Verified Reports</p>
      </div>
      <div className="p-4 bg-yellow-100 dark:bg-yellow-800 rounded-xl text-center shadow">
        <h4 className="text-2xl font-bold text-yellow-700 dark:text-yellow-200">
          {reports.filter((r) => r.status === "pending").length}
        </h4>
        <p className="text-sm">⏳ Pending Reports</p>
      </div>
    </div>

    {/* Progress Bar */}
    <div className="mt-6">
      <h4 className="text-sm font-semibold mb-2">Report Verification Progress</h4>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 overflow-hidden">
        <div
          className="bg-green-500 h-4"
          style={{
            width: `${
              (reports.filter((r) => r.status === "verified").length /
                (reports.length || 1)) *
              100
            }%`,
          }}
        ></div>
      </div>
    </div>

    {/* Export Options */}
    <div className="mt-6 flex gap-3">
      <button className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
        ⬇️ Export CSV
      </button>
      <button className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition">
        📄 Export PDF
      </button>
    </div>
  </div>
)}



       {activeTab === "support" && (
  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-xl text-black dark:text-white">
    {/* ✅ Original Support & Help Center */}
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
      ☎️ Support & Help Center
    </h2>

    {/* Contact Options */}
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      {/* Phone */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
        <div className="p-3 rounded-full bg-blue-500 text-white">📞</div>
        <div>
          <h3 className="font-semibold">Toll-Free Hotline</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Available 24/7</p>
          <p className="text-lg font-bold text-blue-600">1800-123-4567</p>
        </div>
      </div>

      {/* Email Support */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
        <div className="p-3 rounded-full bg-green-500 text-white">
          {/* Email Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12H8m0 0l-4-4m4 4l-4 4m4-4h8m0 0l4-4m-4 4l4 4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Email Support</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Replies within 12 hrs</p>
          <p className="text-lg font-bold text-green-600">support@oceanhazard.org</p>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
        <div className="p-3 rounded-full bg-green-600 text-white">
          {/* WhatsApp Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.52 3.48A11.93 11.93 0 0012 0C5.38 0 0 5.38 0 12c0 2.11.54 4.18 1.58 6.02L0 24l6.21-1.63A11.96 11.96 0 0012 24c6.62 0 12-5.38 12-12 0-3.2-1.25-6.22-3.48-8.52zM12 22c-1.84 0-3.62-.49-5.18-1.42l-.37-.22-3.69.97.99-3.58-.24-.38A9.93 9.93 0 012 12c0-5.52 4.48-10 10-10 2.68 0 5.2 1.05 7.07 2.93A9.96 9.96 0 0122 12c0 5.52-4.48 10-10 10zm5.27-7.73c-.29-.14-1.72-.85-1.99-.95-.27-.1-.46-.14-.65.14-.19.27-.74.95-.91 1.14-.17.19-.34.22-.63.08-.29-.14-1.23-.45-2.35-1.44-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.65-1.57-.89-2.15-.23-.55-.47-.48-.65-.49h-.56c-.19 0-.51.07-.78.36-.27.29-1.02.99-1.02 2.42 0 1.43 1.04 2.81 1.18 3 .14.19 2.05 3.14 4.97 4.4 2.92 1.26 2.92.84 3.45.79.53-.05 1.72-.7 1.97-1.38.24-.67.24-1.24.17-1.38-.07-.14-.26-.22-.55-.36z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">WhatsApp</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Quick replies (9AM–6PM)</p>
          <a href="https://wa.me/918888888888" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-green-600 hover:underline">
            +91 7439907850
          </a>
        </div>
      </div>

      {/* Live Chat */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
        <div className="p-3 rounded-full bg-purple-600 text-white">
          {/* Chat Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-6 4h4m9 5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14l4-4h10l4 4z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Live Chat</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Available 10AM–8PM</p>
          <button className="mt-1 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">
            Start Chat
          </button>
        </div>
      </div>

      {/* Office Location */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.656 0 3-1.343 3-3s-1.344-3-3-3-3 1.343-3 3 1.344 3 3 3zm0 0c0 4.418-6 7-6 7h12s-6-2.582-6-7z" />
          </svg>
          Our Office
        </h3>
        <p className="mb-2">81B, Sector 18A, New Delhi, India</p>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.4214224241036!2d77.23452941508283!3d28.59042808243154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce3b3f18a6f1b%3A0x1b2b87e1e7b5c0d6!2sIndia%20Meteorological%20Department!5e0!3m2!1sen!2sin!4v1695485100000!5m2!1sen!2sin"
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-lg"
          title="Google Maps - IMD Office"
        ></iframe>
      </div>
    </div>

    {/* Support Request Form */}
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-3">📨 Submit a Support Request</h3>
      <form className="space-y-3">
        <input type="text" placeholder="Your Name" className="w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700" required />
        <input type="email" placeholder="Your Email" className="w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700" required />
        <select className="w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700" required>
          <option value="">Select Issue Type</option>
          <option value="technical">⚙️ Technical Issue</option>
          <option value="account">👤 Account Issue</option>
          <option value="report">📑 Report Related</option>
          <option value="other">❓ Other</option>
        </select>
        <textarea rows={4} placeholder="Describe your issue..." className="w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700" required></textarea>
        <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          🚀 Submit Request
        </button>
      </form>
    </div>

    {/* ✅ Extra Features */}

    {/* Online Status Indicator */}
    <div className="flex items-center justify-between mt-6 p-4 bg-green-100 dark:bg-green-800 rounded-lg shadow">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
        <p className="font-semibold text-green-700 dark:text-green-300">
          Our Support Team is Online 🚀
        </p>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Avg. Response: ~1 hr
      </span>
    </div>

    {/* Support Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl text-center shadow hover:shadow-lg transition">
        <h4 className="text-2xl font-bold text-blue-600">98%</h4>
        <p className="text-sm text-gray-500 dark:text-gray-300">Tickets Resolved</p>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl text-center shadow hover:shadow-lg transition">
        <h4 className="text-2xl font-bold text-green-600">15+</h4>
        <p className="text-sm text-gray-500 dark:text-gray-300">Active Support Agents</p>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl text-center shadow hover:shadow-lg transition">
        <h4 className="text-2xl font-bold text-purple-600">1hr</h4>
        <p className="text-sm text-gray-500 dark:text-gray-300">Avg. Response Time</p>
      </div>
    </div>

    {/* FAQ Accordion */}
    <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-3">❓ Frequently Asked Questions</h3>
      <details className="p-3 border-b dark:border-gray-600 cursor-pointer">
        <summary className="font-medium">How long does it take to get a reply?</summary>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Usually within 1–2 hours during business hours.
        </p>
      </details>
      <details className="p-3 border-b dark:border-gray-600 cursor-pointer">
        <summary className="font-medium">Can I track my support request?</summary>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Yes, you’ll receive a ticket ID to track progress.
        </p>
      </details>
      <details className="p-3 cursor-pointer">
        <summary className="font-medium">Do you provide 24/7 assistance?</summary>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Phone support is 24/7, while chat & email are available 9AM–8PM.
        </p>
      </details>
    </div>

    {/* Social Media Links */}
    <div className="mt-6 flex flex-wrap gap-4 justify-center">
      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg shadow hover:bg-blue-500 transition">
        🐦 Twitter
      </a>
      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 transition">
        🔗 LinkedIn
      </a>
      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
        📘 Facebook
      </a>
      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg shadow hover:bg-pink-600 transition">
        📸 Instagram
      </a>
    </div>

    {/* File Upload */}
    <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-3">📎 Attach a File (Optional)</h3>
      <input type="file" className="w-full p-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700" />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        You can upload screenshots, logs, or error reports (Max 5MB).
      </p>
    </div>
  </div>
)}


      </div>
    </div>
  );
}



