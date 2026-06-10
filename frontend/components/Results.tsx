// Results screen: shows detected words, the video + timeline, manual-censor
// tools, and Export. React component in TypeScript (.tsx).
// "use client" = runs in the browser (needed for state + the <video>).
"use client";

// "@/..." paths point at the frontend root. useState/useRef are React hooks.
import { useRef, useState } from "react";
import TimelineReview from "@/components/TimelineReview";
import ManualCensorControls from "@/components/ManualCensorControls";
import { Button } from "@/components/ui/button"
import { Download, Loader2, RotateCcw} from "lucide-react"


// `interface` = the shape of an object for TypeScript (compile-time only).
// Transcribed word from the backend. NOTE: start/end are MILLISECONDS (the
// unit AssemblyAI emits) — the video element and export use seconds, so the
// two are converted at every boundary.
interface BackendWord {
  text: string;
  start: number; // ms
  end: number; // ms
  confidence: number; // 0–1
  isCensored: boolean; // matched the profanity blacklist
}

// `extends BackendWord` = all of BackendWord's fields, plus the two below.
// Word + UI state. isFlagged = detected (fixed; controls visibility);
// isSelected = user wants it censored (toggleable). Splitting them lets an
// un-checked word stay on screen while only its censor action flips.
interface UIWord extends BackendWord {
  isFlagged: boolean;
  isSelected: boolean;
}

// User-placed censor region, in SECONDS (matches currentTime / inputs /
// export, so no conversion needed; the timeline overlay *1000s at its edge).
export interface ManualCensorSegment {
  id: string; // crypto.randomUUID
  start: number; // seconds
  end: number; // seconds
}

// Props = inputs from the parent. `() => void` = a function taking/returning
// nothing; `BackendWord[]` = an array of BackendWord.
interface ResultsProps {
  initialWords: BackendWord[];
  filename: string;
  videoUrl: string;
  onReset: () => void;
}

// A component is a function returning UI (the JSX below). `{ ... }: ResultsProps`
// unpacks the named props from the props object.
export default function Results({ initialWords, filename, videoUrl, onReset }: ResultsProps) {
  // useState returns [current value, setter]; calling the setter re-renders.
  // The `() => ...` runs once to build the starting value; `...w` copies w's
  // fields, then we add the two flags.
  // Detected words start selected, so the default export censors everything
  // flagged; the user opts words out from there.
  const [words, setWords] = useState<UIWord[]>(() =>
    initialWords.map(w => ({
      ...w,
      isFlagged: w.isCensored,
      isSelected: w.isCensored
    }))
  );
  const [isExporting, setIsExporting] = useState(false);
  // useRef = a handle to the real <video> element (set via ref={videoRef}
  // below) so we can read/seek playback. Unlike state, changing it doesn't
  // re-render. `.current` is null until the element appears.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Both in seconds, kept in sync with the <video> element via its events
  // below. videoDuration stays 0 until the video's metadata has loaded, which
  // is how we know the video is ready to use (see isVideoReady).
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [manualSegments, setManualSegments] = useState<ManualCensorSegment[]>([]);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  // The video URL can arrive in three forms. A full "http..." URL or a
  // "blob:" URL (a local, in-browser file the user just picked) is already
  // usable as-is. Anything else is a path on our own server (e.g. "/videos/x")
  // and needs the backend's address put in front of it.
  const resolvedVideoUrl =
    videoUrl.startsWith("blob:") || videoUrl.startsWith("http")
      ? videoUrl
      : `${API_BASE_URL}${videoUrl}`;

  const isVideoReady = videoDuration > 0;

  // Filter on isFlagged (not isSelected) so un-checked rows stay visible.
  const displayWords = words.filter((w) => w.isFlagged);

  // Build the timeline dots fresh on every render so the "currently playing"
  // highlight (isActive) follows the video as it plays. Word times are in ms,
  // so we compare against the current play position converted to ms.
  const timelineMarkers = displayWords.map((word, index) => {
  const currentTimeMs = currentVideoTime * 1000;

  // Treat a word as active a little before/after it actually plays, otherwise
  // very short words would only light up for a single frame.
  const ACTIVE_BUFFER_MS = 100;

  return {
    id: `${word.text}-${word.start}-${word.end}-${index}`,
    text: word.text,
    start: word.start,
    end: word.end,
    confidence: word.confidence,
    isSelected: word.isSelected,
    isActive:
      currentTimeMs >= word.start - ACTIVE_BUFFER_MS &&
      currentTimeMs <= word.end + ACTIVE_BUFFER_MS,
  };
});

  // Jump the video to a clicked timeline dot (its time is in ms; the video
  // needs seconds) and leave it paused so the user stays in control.
  const handleMarkerClick = (marker: { start: number }) => {
  if (!videoRef.current) return;

  const timeInSeconds = marker.start / 1000;

  videoRef.current.currentTime = timeInSeconds;
  setCurrentVideoTime(timeInSeconds);
  videoRef.current.pause();
};

  const DEFAULT_SEGMENT_DURATION = 1; // seconds

  // Add a 1-second censor starting wherever the video is currently paused,
  // shortened if that would run past the end. Does nothing until the video has
  // loaded (the Add button is also disabled until then).
  const addManualCensor = () => {
    const video = videoRef.current;
    if (!video || videoDuration <= 0) return;

    const start = video.currentTime;
    const end = Math.min(start + DEFAULT_SEGMENT_DURATION, videoDuration);

    // setState with a function gives you the latest value (prev). We return a
    // brand-new array (`[...prev, new]`) rather than pushing onto the old one —
    // React only re-renders when given a new value, never a mutated one.
    setManualSegments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), start, end },
    ]);
  };

  // Change a segment's start or end while keeping it sensible: ignore a blank
  // field, force the value to stay between 0 and the video length, and make
  // sure end is always after start (if an edit would cross over, push the
  // other value out of the way).
  const updateManualCensor = (
    id: string,
    field: "start" | "end",
    value: number,
  ) => {
    setManualSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== id) return seg;
        if (Number.isNaN(value)) return seg;

        const max = videoDuration > 0 ? videoDuration : value;
        const clamped = Math.max(0, Math.min(value, max));
        const next = { ...seg, [field]: clamped };

        if (field === "start" && next.start >= next.end)
          next.end = Math.min(next.start + DEFAULT_SEGMENT_DURATION, max);
        if (field === "end" && next.end <= next.start)
          next.start = Math.max(0, next.end - DEFAULT_SEGMENT_DURATION);

        return next;
      }),
    );
  };

  // Minimal hook the dedicated deletion UI builds on later.
  const deleteManualCensor = (id: string) =>
    setManualSegments((prev) => prev.filter((seg) => seg.id !== id));

  // seconds -> m:ss (e.g. 75 -> "1:15").
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle whether a word will be censored. The clicked `index` refers to the
  // displayed (filtered) list, but we have to update the full `words` list.
  // displayWords holds the same objects as words, so `w === displayWords[index]`
  // finds the exact word that was clicked.
  const toggleSelection = (index: number) => {
    const newWords = words.map((w) => {
        if (w === displayWords[index]) {
            return { ...w, isSelected: !w.isSelected };
        }
        return w;
    });
    setWords(newWords);
  };

  // POST the selected regions to the backend and download the muted video.
  const handleExport = async () => {
    setIsExporting(true);

    // Build the list of time ranges to mute from the still-selected words,
    // converting their times from ms to the seconds the backend expects.
    // (Manual censors are already in seconds and would be added here later.)
    const segmentsToMute = words
      .filter(w => w.isSelected)
      .map(w => ({
        start: w.start / 1000,
        end: w.end / 1000
      }));

    try {
      console.log("Requesting export for", filename, segmentsToMute);

      const response = await fetch("http://localhost:8080/api/export-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: filename,
          censorshipSegments: segmentsToMute
        })
      });

      if (!response.ok) throw new Error("Export failed");

      // The response body is the finished video file as raw bytes (a Blob).
      const blob = await response.blob();

      // Browsers can't save a Blob directly, so we trigger a normal download:
      // give the bytes a temporary in-memory URL, create a hidden <a> link
      // pointing at it with the desired filename, and click it for the user.
      // Then we free the temporary URL and remove the link to avoid leaks.
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `censored_${filename}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("Video downloaded successfully!");

    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export video.");
    } finally {
      setIsExporting(false);
    }
  };

  // Everything below is JSX — HTML-like markup that React turns into DOM.
  // `{ }` drops JavaScript into the markup, `className` is HTML's `class`
  // (renamed because `class` is reserved), and the strings are Tailwind CSS
  // utility classes for styling.
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
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            className="inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Upload New Video
          </Button>
      </div>

      {/* Player + the timeline tools that read from it. */}
      <div className="mb-8 space-y-4">
        <div className="border border-foreground/10 rounded-xl overflow-hidden bg-black">
          {/* Copy the video's length and current position into state as they
              change, so the timeline and manual-censor tools can react. */}
          <video
            ref={videoRef}
            src={resolvedVideoUrl}
            controls
            className="w-full max-h-[500px]"
            onLoadedMetadata={(event) => {
              setVideoDuration(event.currentTarget.duration);
            }}
            onTimeUpdate={(event) => {
              setCurrentVideoTime(event.currentTarget.currentTime);
            }}
          />
        </div>

        {/* Child components are used like tags; the attributes are their props.
            We pass data down (markers) and functions up (onMarkerClick). */}
        <TimelineReview
          markers={timelineMarkers}
          videoDuration={videoDuration}
          onMarkerClick={handleMarkerClick}
        />

        <ManualCensorControls
          segments={manualSegments}
          isVideoReady={isVideoReady}
          videoDuration={videoDuration}
          onAdd={addManualCensor}
          onUpdate={updateManualCensor}
          onDelete={deleteManualCensor}
        />
      </div>

      {/* One row per flagged word with a censor toggle. */}
      <div className="border border-foreground/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5 border-b border-foreground/10">
              <tr>
                <th className="px-6 py-4 font-semibold opacity-90">Word Detected</th>
                <th className="px-6 py-4 font-semibold opacity-90">Timestamp</th>
                <th className="px-6 py-4 font-semibold opacity-90">Confidence</th>
                <th className="px-6 py-4 font-semibold opacity-90 text-right">Censored</th>
              </tr>
            </thead>
            {/* Render one <tr> per word. `.map` turns the list into a list of
                rows; React needs a unique `key` on each to track them. */}
            <tbody className="divide-y divide-foreground/10">
              {displayWords.map((word, index) => (
                <tr
                    key={index}
                    // Red tint when selected, dimmed when opted out.
                    className={`transition-colors ${
                        word.isSelected
                            ? "bg-red-500/10 hover:bg-red-500/15"
                            : "opacity-60 hover:opacity-100 hover:bg-foreground/5"
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
                    {/* CSS-only toggle: hidden checkbox drives the styled div via peer-checked. */}
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={word.isSelected}
                        onChange={() => toggleSelection(index)}
                      />
                      <div className="relative w-11 h-6 bg-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* `condition && <jsx/>` renders the element only when the condition is
            true — a common way to show something conditionally in JSX. */}
        {displayWords.length === 0 && (
          <div className="p-12 text-center opacity-60">
            No profanity detected based on your blacklist!
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="mt-8 flex justify-end gap-4">
        <Button
          onClick={handleExport}
          disabled={isExporting}
          size="lg"
          className="px-8 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 inline-flex items-center"
        >
          {/* `cond ? a : b` picks between two bits of JSX. `<>...</>` is a
              Fragment: groups elements without adding a wrapper tag. */}
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Export...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
}