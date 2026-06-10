"use client";

interface TimelineMarker {
  id: string;
  text: string;
  start: number; // milliseconds from AssemblyAI
  end: number;   // milliseconds from AssemblyAI
  confidence: number;
  isSelected: boolean;
}

interface TimelineReviewProps {
  markers: TimelineMarker[];
  videoDuration: number; // seconds
  onMarkerClick?: (marker: TimelineMarker) => void;
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
}: TimelineReviewProps) {
  const getMarkerPosition = (startMs: number) => {
    if (!videoDuration) return 0;

    const startSeconds = startMs / 1000;
    return Math.min((startSeconds / videoDuration) * 100, 100);
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
                  marker.isSelected
                    ? "bg-red-500 border-red-300"
                    : "bg-foreground/30 border-foreground/20 opacity-50"
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
    </div>
  );
}