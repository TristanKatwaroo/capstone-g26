"use client";

import { useState } from "react";

// Define the shape of the data coming from the Backend
interface BackendWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  isCensored: boolean; // This is what the backend sends (Detection)
}

// Define the shape we use for the UI state
interface UIWord extends BackendWord {
  isFlagged: boolean; // Did the system flag it? (Permanent for this view)
  isSelected: boolean; // Does the user want to censor it? (Toggleable)
}

interface ResultsProps {
  initialWords: BackendWord[];
  onReset: () => void;
}

export default function Results({ initialWords, onReset }: ResultsProps) {
  // 1. Initialize State: Map backend data to UI data
  // We explicitly separate "Detection" (isFlagged) from "Action" (isSelected)
  const [words, setWords] = useState<UIWord[]>(() => 
    initialWords.map(w => ({
      ...w,
      isFlagged: w.isCensored, // "isCensored" from backend means it was detected
      isSelected: w.isCensored // By default, we select everything that was detected
    }))
  );

  const [isExporting, setIsExporting] = useState(false);

  // We only want to display words that were flagged by the system
  // Using 'isFlagged' ensures they don't disappear if the user unchecks them.
  const displayWords = words.filter((w) => w.isFlagged);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle ONLY the selection state, leaving the row visible
  const toggleSelection = (index: number) => {
    // We need to find the word in the main 'words' array that matches the index in 'displayWords'
    // Since 'displayWords' is a filtered view, we can't just use the index directly if we were rendering all words.
    // However, since we are only rendering flagged words, we can just map the original array.
    
    const newWords = words.map((w) => {
        // Use a unique identifier if possible, but for now reference equality or timestamps works
        if (w === displayWords[index]) {
            return { ...w, isSelected: !w.isSelected };
        }
        return w;
    });
    setWords(newWords);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    // Filter to get only the words the user has CONFIRMED they want to censor
    const finalCensorshipList = words.filter(w => w.isSelected);

    console.log("Exporting with final list:", finalCensorshipList);

    setTimeout(() => {
      alert(`Export Complete! Applied censorship to ${finalCensorshipList.length} words.`);
      setIsExporting(false);
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-bold">Review Detections</h2>
            <p className="text-sm opacity-60 mt-1">
                The system flagged {displayWords.length} words. Uncheck any you want to keep.
            </p>
        </div>
        <button 
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline"
        >
          Upload New Video
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Word Detected</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Confidence</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {displayWords.map((word, index) => (
                <tr 
                    key={index} 
                    className={`transition-colors ${
                        word.isSelected 
                            ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20" // Highlighted if active
                            : "opacity-60 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-zinc-800/50" // Dimmed if ignored
                    }`}
                >
                  <td className="px-6 py-4 font-medium text-red-600 dark:text-red-400">
                    {word.text}
                  </td>
                  <td className="px-6 py-4 opacity-70 font-mono">
                    {formatTime(word.start / 1000)} - {formatTime(word.end / 1000)}
                  </td>
                  <td className="px-6 py-4 opacity-70">
                    {(word.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={word.isSelected}
                        onChange={() => toggleSelection(index)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                      <span className="ms-3 text-sm font-medium min-w-[50px]">
                        {word.isSelected ? "Censor" : "Ignore"}
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Empty State */}
        {displayWords.length === 0 && (
          <div className="p-12 text-center opacity-60">
            No profanity detected based on your blacklist!
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-all shadow-lg
            ${isExporting 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20"
            }`}
        >
          {isExporting ? "Processing Export..." : "Export Video"}
        </button>
      </div>
    </div>
  );
}