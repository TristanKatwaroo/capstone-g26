"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VideoUpload from "../components/VideoUpload";
import Results from "../components/Results";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any[] | null>(null);
  const [serverFilename, setServerFilename] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? null);
    }

    getUser();
  }, []);

  const handleAnalysisComplete = (
    results: any[],
    filename: string,
    previewUrl: string
  ) => {
    setAnalysisResults(results);
    setServerFilename(filename);
    setVideoUrl(previewUrl);
  };

  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="w-full flex justify-end mb-6">
        {userEmail ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="opacity-70">{userEmail}</span>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="px-3 py-2 rounded-md border border-foreground/20 hover:bg-foreground/5"
            >
              Log Out
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="px-3 py-2 rounded-md border border-foreground/20 text-sm hover:bg-foreground/5"
          >
            Log In
          </a>
        )}
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 w-full">
        <h1 className="text-4xl font-bold tracking-tight">
          CleanCut
        </h1>

        {!userEmail ? (
          <div className="text-center border border-foreground/10 rounded-xl p-6 max-w-md bg-foreground/5">
            <p className="mb-4 opacity-80">
              Please log in to upload videos and save custom word lists.
            </p>
            <a
              href="/login"
              className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Log In
            </a>
          </div>
        ) : !analysisResults ? (
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
            videoUrl={videoUrl!}
            onReset={() => {
              if (videoUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(videoUrl);
              }

              setAnalysisResults(null);
              setServerFilename(null);
              setVideoUrl(null);
            }}
          />
        )}
      </main>
    </div>
  );
}