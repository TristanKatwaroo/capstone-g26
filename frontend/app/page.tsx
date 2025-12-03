"use client";

import { useState } from "react";
import VideoUpload from "../components/VideoUpload";
import Results from "../components/Results";

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

  const [analysisResults, setAnalysisResults] = useState<any[] | null>(null);
  // const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const [serverFilename, setServerFilename] = useState<string | null>(null);

  const handleAnalysisComplete = (results: any[], filename: string) => {
    setAnalysisResults(results);
    setServerFilename(filename);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8 w-full">
        
        <h1 className="text-4xl font-bold tracking-tight">
          CleanCut
        </h1>
        
        {!analysisResults ? (
          <>
            <p className="text-lg text-center max-w-xl opacity-70">
              Upload a video to automatically detect and flag profanity using AI.
            </p>
            <VideoUpload onAnalysisComplete={handleAnalysisComplete} />
          </>
        ) : (
          <Results 
            initialWords={analysisResults}
            filename={serverFilename!}
            onReset={() => setAnalysisResults(null)} 
          />
        )}

      </main>
    </div>
  );
}