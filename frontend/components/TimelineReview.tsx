"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

interface TimelineMarker {
  id: string;
  text: string;
  start: number; // milliseconds from AssemblyAI
  end: number;   // milliseconds from AssemblyAI
  confidence: number;
  isSelected: boolean;
  isActive?: boolean;
}

interface ManualCensorSegment {
  id: string;
  start: number; // seconds
  end: number;   // seconds
}

interface TimelineReviewProps {
  markers: TimelineMarker[];
  videoDuration: number; // seconds
  onMarkerClick?: (marker: TimelineMarker) => void;
  manualSegments?: ManualCensorSegment[];
  onDeleteManualSegment?: (id: string) => void;
  onChangeManualSegment?: (id: string, start: number, end: number) => void; // Updates a manual segment after moving or resizing it.
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function TimelineReview({
  markers,
  videoDuration,
   onMarkerClick,
   manualSegments = [],
   onDeleteManualSegment,
   onChangeManualSegment,
}: TimelineReviewProps) {
  const manualTimelineRef = useRef<HTMLDivElement | null>(null); // Used to read the size and position of the manual timeline.

  const getMarkerPosition = (startMs: number) => {
    if (!videoDuration) return 0;

    const startSeconds = startMs / 1000;
    return Math.min((startSeconds / videoDuration) * 100, 100);
  };

  const getManualSegmentLeft = (startSeconds: number) => {
  if (!videoDuration) return 0;

  return Math.min((startSeconds / videoDuration) * 100, 100);
};

const getManualSegmentWidth = (startSeconds: number, endSeconds: number) => {
  if (!videoDuration) return 0;

  const duration = Math.max(endSeconds - startSeconds, 0.1);
  return Math.min((duration / videoDuration) * 100, 100);
};

// Smallest length allowed for a manual censor segment.
const MIN_SEGMENT_DURATION = 0.1;

// Keeps a value between a minimum and maximum.
const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

// Converts the mouse position on the timeline into seconds.
const getSecondsFromPointer = (clientX: number) => {
  const timeline = manualTimelineRef.current;
  if (!timeline || !videoDuration) return 0;

  const rect = timeline.getBoundingClientRect();
  const percent = (clientX - rect.left) / rect.width;

  return clamp(percent * videoDuration, 0, videoDuration);
};

// Starts moving or resizing a manual censor segment.
const startManualDrag = (
  event: ReactPointerEvent<HTMLDivElement | HTMLButtonElement>,
  segment: ManualCensorSegment,
  mode: "move" | "start" | "end"
) => {
  event.preventDefault();
  event.stopPropagation();

  // Save the original times before the user starts dragging.
  const firstPointerSeconds = getSecondsFromPointer(event.clientX);
  const originalStart = segment.start;
  const originalEnd = segment.end;
  const originalDuration = Math.max(
    originalEnd - originalStart,
    MIN_SEGMENT_DURATION
  );

  // Runs while the user is dragging
  const handlePointerMove = (moveEvent: PointerEvent) => {
    const pointerSeconds = getSecondsFromPointer(moveEvent.clientX);

    let nextStart = originalStart;
    let nextEnd = originalEnd;

    // Move the whole segment without changing its length.
    if (mode === "move") {
      const change = pointerSeconds - firstPointerSeconds;

      nextStart = clamp(
        originalStart + change,
        0,
        videoDuration - originalDuration
      );

      nextEnd = nextStart + originalDuration;
    }

    // Resize the left side to change the start time.
    if (mode === "start") {
      nextStart = clamp(
        pointerSeconds,
        0,
        originalEnd - MIN_SEGMENT_DURATION
      );

      nextEnd = originalEnd;
    }

    // Resize the right side to change the end time.
    if (mode === "end") {
      nextStart = originalStart;

      nextEnd = clamp(
        pointerSeconds,
        originalStart + MIN_SEGMENT_DURATION,
        videoDuration
      );
    }

    // Update the parent state so the marker moves on screen.
    onChangeManualSegment?.(
      segment.id,
      Number(nextStart.toFixed(2)),
      Number(nextEnd.toFixed(2))
    );
  };

  // Stop listening when the user lets go.
  const handlePointerUp = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
};

  return (
    <div className="w-full border border-foreground/10 rounded-xl p-4 bg-foreground/5">
      <div className="flex items-center justify-between mb-3 text-xs opacity-60">
        <span>0:00</span>
        <span>{formatTime(videoDuration || 0)}</span>
      </div>

      <div className="relative h-12 rounded-full bg-foreground/10">
        {markers.map((marker) => {
          const left = getMarkerPosition(marker.start);

          return (
            <button
              key={marker.id}
              type="button"
              onClick={() => onMarkerClick?.(marker)}
              className={`absolute top-1/2 h-6 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border transition cursor-pointer
                hover:scale-125 hover:ring-2 hover:ring-red-300 focus:outline-none focus:ring-2 focus:ring-red-300
                ${
                  marker.isActive
                    ? "bg-blue-400 border-blue-200 ring-3 ring-blue-300 scale-125 z-20"
                    : marker.isSelected
                      ? "bg-red-500 border-red-300 z-10"
                      : "bg-foreground/30 border-foreground/20 opacity-50 z-0"
                }`}
              style={{ left: `${left}%` }}
              title={`Jump to "${marker.text}" at ${formatTime(marker.start / 1000)}`}
              aria-label={`Jump to ${marker.text} at ${formatTime(marker.start / 1000)}`}
            />
          );
        })}
      </div>

      <p className="mt-3 text-xs opacity-60">
        {markers.length} flagged occurrence{markers.length === 1 ? "" : "s"} on timeline.
      </p>

      {manualSegments.length > 0 && (
  <div className="mt-4">
    <div
      ref={manualTimelineRef}
      className="relative h-10 rounded-full bg-blue-500/10 border border-blue-500/20 overflow-hidden"
      >   
      {manualSegments.map((segment) => {
        const left = getManualSegmentLeft(segment.start);
        const width = getManualSegmentWidth(segment.start, segment.end);

        return (
        <div
          key={segment.id}
          onPointerDown={(event) => startManualDrag(event, segment, "move")}
          className="absolute top-1/2 h-6 -translate-y-1/2 rounded-full bg-purple-500/70 border border-purple-300 cursor-grab active:cursor-grabbing pr-5"
          style={{
            left: `${left}%`,
            width: `${Math.max(width, 4)}%`,
          }}
          title={`Manual censor ${formatTime(segment.start)} - ${formatTime(segment.end)}`}
        >
          {/* Drag the left edge to change the start time. */}
          <button
            type="button"
            onPointerDown={(event) => startManualDrag(event, segment, "start")}
            className="absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l-full bg-white/40"
            aria-label="Resize manual censor start"
            title="Resize start time"
          />

          {/* Drag the right edge to change the end time. */}
          <button
            type="button"
            onPointerDown={(event) => startManualDrag(event, segment, "end")}
            className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-full bg-white/40"
            aria-label="Resize manual censor end"
            title="Resize end time"
          />

          {/* Deletes this manual censor segment. */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteManualSegment?.(segment.id);
            }}
            className="absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-purple-700/70 text-white text-[10px] flex items-center justify-center hover:bg-red-500 transition"
            aria-label="Delete manual censor segment"
            title="Delete manual censor segment"
          >
            ×
          </button>
        </div>
      );
      })}
    </div>

     <p className="mt-2 text-xs opacity-60">
      Manual censor segments
      </p>
  </div>
)}
    </div>
  );
}