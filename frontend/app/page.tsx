"use client";

export default function Home() {

  const handleTestConnection = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/test');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("Response from backend:", data.message);
      alert("Success! Backend says: " + data.message);

    } catch (error) {
      console.error("Failed to fetch from backend:", error);
      alert("Error: Could not connect to backend. Check console.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-12 py-32 px-16">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
          Capstone Project (Group 26)
        </h1>
        
        <button
          onClick={handleTestConnection}
          className="rounded-full bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Test Backend Connection
        </button>
      </main>
    </div>
  );
}