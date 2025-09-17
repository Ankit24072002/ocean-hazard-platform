import { useState } from "react";

const API = import.meta.env.VITE_API || "http://localhost:4000";

export default function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message }),
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Server did not return JSON. Got instead:\n${text.substring(0, 200)}`
        );
      }

      if (!res.ok) throw new Error(data.error || "Failed to send feedback");

      setStatus("✅ Feedback submitted successfully!");
      setMessage("");
    } catch (err) {
      setStatus(`❌ ${err.message}`);
      console.error("Feedback failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-center">
      <textarea
        placeholder="Your feedback..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        className="w-4/5 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
      />
      <button
        type="submit"
        className="w-4/5 bg-green-600 dark:bg-green-700 text-white py-2 rounded hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
      >
        Submit Feedback
      </button>
      {status && <p className="text-sm mt-2">{status}</p>}
    </form>
  );
}
