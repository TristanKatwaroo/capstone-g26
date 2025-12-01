"use client";

import { useState } from "react";

interface VideoUploadProps {
  onAnalysisComplete: (words: any[]) => void;
}

export default function VideoUpload({ onAnalysisComplete }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Handle file selection via click
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

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setStatusMessage("Uploading and processing...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

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
        setStatusMessage(`Success! Found words. Loading results...`);
        
        setTimeout(() => {
           onAnalysisComplete(data.words);
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
              className={`w-10 h-10 mb-4 transition-opacity ${isDragging ? "text-blue-500 opacity-100" : "text-foreground opacity-50"}`}
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
              <span className="font-semibold">Click to upload</span> or drag and drop
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
          
          {/* File Info Card */}
          <div className="p-4 border border-green-500/50 rounded-lg flex items-center justify-between bg-green-500/10">
            <div className="flex items-center space-x-3">
               <span className="text-green-600 dark:text-green-400 font-medium">Selected:</span>
               <span className="text-sm opacity-90 truncate max-w-[200px]">{selectedFile.name}</span>
            </div>
            <span className="text-xs opacity-60">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          {/* Process Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
              ${isUploading 
                ? "bg-blue-400 cursor-not-allowed opacity-70" 
                : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/20"
              }`}
          >
            {isUploading ? "Processing..." : "Process Video"}
          </button>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-lg text-sm text-center ${
              statusMessage.startsWith("Error") 
                ? "bg-red-500/10 text-red-600 border border-red-500/20" 
                : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
            }`}>
              {statusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}