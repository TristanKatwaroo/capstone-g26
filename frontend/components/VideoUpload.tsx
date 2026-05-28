"use client";

import { useMemo, useState, useEffect } from "react";
import { getSavedWordList, saveWordList, parseCommaSeparatedWords } from "@/lib/wordLists";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader2, Save } from "lucide-react";

interface VideoUploadProps {
  onAnalysisComplete: (
    words: any[],
    serverFilename: string,
    videoPreviewUrl: string
  ) => void;
}

export default function VideoUpload({ onAnalysisComplete }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [wordListInput, setWordListInput] = useState("");
  const parsedWords = useMemo(
    () => parseCommaSeparatedWords(wordListInput),
    [wordListInput]
  );

  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [isSavingWordList, setIsSavingWordList] = useState(false);
  const [wordListSaveMessage, setWordListSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSavedList() {
      try {
        const savedList = await getSavedWordList();

        if (savedList?.words?.length) {
          setWordListInput(savedList.words.join(", "));
          // setWordListSaveMessage("Saved word list loaded.");
        }
      } catch (error: any) {
        console.log("Failed to load saved word list:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          raw: error,
        });
      }
    }

    loadSavedList();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedFile(event.dataTransfer.files[0]);
      setStatusMessage(null);
    }
  };

  const handleSaveWordList = async () => {
    if (parsedWords.length === 0) {
      setWordListSaveMessage("Enter at least one word before saving.");
      return;
    }

    setIsSavingWordList(true);
    setWordListSaveMessage(null);

    try {
      await saveWordList(parsedWords);
      setWordListSaveMessage("Word list saved successfully.");
    } catch (error: any) {
      console.log("Failed to save word list:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        raw: error,
      });

      setWordListSaveMessage(
        error?.message
          ? `Could not save word list: ${error.message}`
          : "Could not save word list."
      );
    } finally {
      setIsSavingWordList(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setStatusMessage("Uploading and processing...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      formData.append("wordList", JSON.stringify(parsedWords));

      const response = await fetch("http://localhost:8080/api/process-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Processing Results:", data);

      if (data.words) {
        setStatusMessage("Success! Found words. Loading results...");

        setTimeout(() => {
          const localPreviewUrl = URL.createObjectURL(selectedFile);

          onAnalysisComplete(
            data.words,
            data.filename,
            data.videoUrl ?? localPreviewUrl
          );
        }, 1000);
      } else {
        setStatusMessage("Processing complete, but no transcript returned.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setStatusMessage("Error: Processing failed. Check console.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      {/* Word List Input */}
      <div className="p-4 border border-foreground/10 rounded-lg bg-foreground/5">
        <label className="block text-sm font-semibold mb-2">
          Custom Word List
        </label>

        <textarea
          value={wordListInput}
          onChange={(event) => {
            setWordListInput(event.target.value);
            setWordListSaveMessage(null);
          }}
          placeholder="Enter words separated by commas, e.g. test, secret, private name"
          className="w-full min-h-28 rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500"
          disabled={isUploading}
        />

        <p className="text-xs opacity-60 mt-2">
          Leave blank to use the default blacklist.
        </p>

        {/* {parsedWords.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium opacity-70 mb-2">
              Words to detect:
            </p>

            <div className="flex flex-wrap gap-2">
              {parsedWords.map((word) => (
                <span
                  key={word}
                  className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )} */}

        <Button
          type="button"
          variant="secondary"
          onClick={handleSaveWordList}
          disabled={isUploading || isSavingWordList || parsedWords.length === 0}
          className="mt-4 inline-flex items-center gap-2"
        >
          {isSavingWordList ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Word List
            </>
          )}
        </Button>
        {wordListSaveMessage && (
          <p
            className={`mt-3 text-sm ${
              wordListSaveMessage.includes("successfully")
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {wordListSaveMessage}
          </p>
        )}
      </div>

      {/* Upload Zone */}
      <div
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
        ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-foreground/30 hover:border-foreground/50 hover:bg-foreground/5"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-full"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <svg
              className={`w-10 h-10 mb-4 transition-opacity ${
                isDragging
                  ? "text-blue-500 opacity-100"
                  : "text-foreground opacity-50"
              }`}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>

            <p className="mb-2 text-sm opacity-90">
              <span className="font-semibold">Click to upload</span> or drag
              and drop
            </p>

            <p className="text-xs opacity-60">MP4, MOV (MAX. 1GB)</p>
          </div>

          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Selected File Feedback & Action Button */}
      {selectedFile && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 border border-green-500/50 rounded-lg flex items-center justify-between bg-green-500/10">
            <div className="flex items-center space-x-3">
              <span className="text-green-600 dark:text-green-400 font-medium">
                Selected:
              </span>
              <span className="text-sm opacity-90 truncate max-w-[200px]">
                {selectedFile.name}
              </span>
            </div>

            <span className="text-xs opacity-60">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            size="lg"
            className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                Processing...
              </>
            ) : (
              <>
                <ArrowUpIcon className="mr-2 h-4 w-4 text-white" />
                Process Video
              </>
            )}
          </Button>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-sm text-center ${
                statusMessage.startsWith("Error")
                  ? "bg-red-500/10 text-red-600 border border-red-500/20"
                  : "bg-blue-500/10 border border-blue-500/20"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}