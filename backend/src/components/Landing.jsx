import ThemeToggle from "../components/ThemeToggle";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">🌊 Ocean Hazard Platform</h1>
        <ThemeToggle />
      </header>
      {/* Your existing landing content */}
    </div>
  );
}
