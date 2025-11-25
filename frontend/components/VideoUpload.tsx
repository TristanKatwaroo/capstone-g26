"use client";

import { useState } from "react";

export default function VideoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection via click
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Handle Drag Over
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // Handle Drag Leave
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  // Handle Drop
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedFile(event.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Upload Zone */}
      <div
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
        ${
          isDragging
            ? "border-blue-500 bg-blue-500/10" // Active Drag State (Keep blue for clear feedback)
            : "border-foreground/30 hover:border-foreground/50 hover:bg-foreground/5" // Resting State (Adaptive)
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
          />
        </label>
      </div>

      {/* Selected File Feedback */}
      {selectedFile && (
        <div className="mt-4 p-4 border border-green-500/50 rounded-lg flex items-center justify-between bg-green-500/10">
          <div className="flex items-center space-x-3">
             <span className="text-green-600 dark:text-green-400 font-medium">Ready to process:</span>
             <span className="text-sm opacity-90">{selectedFile.name}</span>
          </div>
          <span className="text-xs opacity-60">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      )}
    </div>
  );
}