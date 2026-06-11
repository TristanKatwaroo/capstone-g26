"use client";

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
}: TimelineReviewProps) {
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
    <p className="mb-2 text-xs opacity-60">
      Manual censor segments
    </p>

    <div className="relative h-10 rounded-full bg-blue-500/10 border border-blue-500/20">
      {manualSegments.map((segment) => {
        const left = getManualSegmentLeft(segment.start);
        const width = getManualSegmentWidth(segment.start, segment.end);

        return (
          <div
            key={segment.id}
            className="absolute top-1/2 h-6 -translate-y-1/2 rounded-full bg-purple-500/70 border border-purple-300 flex items-center justify-end px-1"
            style={{
              left: `${left}%`,
              width: `${Math.max(width, 4)}%`,
            }}
            title={`Manual censor ${formatTime(segment.start)} - ${formatTime(segment.end)}`}
          
            // Removes this manual censor segment from the timeline.
          >
            <button
              type="button"
              onClick={() => onDeleteManualSegment?.(segment.id)}
              className="h-5 w-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600 transition"
              aria-label="Delete manual censor segment"
              title="Delete manual censor segment"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  </div>
)}
    </div>
  );
}