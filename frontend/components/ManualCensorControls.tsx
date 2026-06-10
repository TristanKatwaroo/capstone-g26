"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ManualCensorSegment } from "@/components/Results";

// This component only draws the UI — the segment data and the rules for
// changing it live in the parent (Results), reached through the callbacks.
interface ManualCensorControlsProps {
  segments: ManualCensorSegment[]; // the censors to list (times in seconds)
  isVideoReady: boolean; // when false, the Add button is disabled
  videoDuration: number; // video length in seconds; highest allowed time
  onAdd: () => void; // add a new censor
  onUpdate: (id: string, field: "start" | "end", value: number) => void; // edit a time
  onDelete: (id: string) => void; // remove a censor
}

// An "Add" button plus an editable list of the censors the user has placed.
export default function ManualCensorControls({
  segments,
  isVideoReady,
  videoDuration,
  onAdd,
  onUpdate,
  onDelete,
}: ManualCensorControlsProps) {
  return (
    <div className="w-full border border-foreground/10 rounded-xl p-4 bg-foreground/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold opacity-90">Manual Censors</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAdd}
          disabled={!isVideoReady}
          className="inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Manual Censor
        </Button>
      </div>

      {!isVideoReady && (
        <p className="text-xs opacity-60">
          Load the video to add a manual censor.
        </p>
      )}

      {isVideoReady && segments.length === 0 && (
        <p className="text-xs opacity-60">No manual censors added.</p>
      )}

      {segments.length > 0 && (
        <ul className="space-y-2">
          {segments.map((seg) => (
            <li
              key={seg.id}
              className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-background/40 px-3 py-2"
            >
              {/* Read the input as a number. If the field is empty this gives
                  NaN, and the parent's onUpdate leaves the value unchanged. */}
              <label className="flex items-center gap-1.5 text-xs opacity-80">
                Start (s)
                <input
                  type="number"
                  min={0}
                  max={videoDuration}
                  step={0.1}
                  value={seg.start}
                  onChange={(e) =>
                    onUpdate(seg.id, "start", e.currentTarget.valueAsNumber)
                  }
                  className="w-20 rounded-md border border-foreground/20 bg-transparent px-2 py-1 font-mono text-sm"
                />
              </label>

              <label className="flex items-center gap-1.5 text-xs opacity-80">
                End (s)
                <input
                  type="number"
                  min={0}
                  max={videoDuration}
                  step={0.1}
                  value={seg.end}
                  onChange={(e) =>
                    onUpdate(seg.id, "end", e.currentTarget.valueAsNumber)
                  }
                  className="w-20 rounded-md border border-foreground/20 bg-transparent px-2 py-1 font-mono text-sm"
                />
              </label>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(seg.id)}
                aria-label="Delete manual censor"
                className="ml-auto text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
