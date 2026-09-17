import { Badge, Button, Group, Progress, Stack, Text } from "@mantine/core";
import { clockIn, formatDuration } from "../time";
import type { RunningPhase } from "../types";

export interface SessionScreenProps {
  phase: RunningPhase;
  remaining: number;
  totalSeconds: number;
  paused: boolean;
  /** Display name of whoever started the round, or null if they've left. */
  startedByName: string | null;
  /** Length of the phase that comes next, in minutes. */
  nextMinutes: number;
  clockOffsetMs: number;
  disabled?: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export function SessionScreen({
  phase,
  remaining,
  totalSeconds,
  paused,
  startedByName,
  nextMinutes,
  clockOffsetMs,
  disabled = false,
  onPause,
  onResume,
  onEnd,
}: SessionScreenProps) {
  const isFocus = phase === "focus";
  const pct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;

  return (
    <Stack gap="lg">
      <div>
        {/* variant="dot" gives the small state-dot for free */}
        <Badge variant="dot" size="lg" color={paused ? "gray" : "accent"}>
          {paused ? (isFocus ? "Focus paused" : "Break paused") : isFocus ? "Focusing" : "On break"}
        </Badge>
        {startedByName && (
          <Text size="sm" c="dimmed" mt={6}>
            {startedByName} started this round
          </Text>
        )}
      </div>

      <div>
        <Text
          role="timer"
          aria-live="off"
          fw={700}
          ff="heading"
          style={{
            fontSize: "clamp(4.5rem, 15.5vw, 9.5rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatDuration(remaining)}
        </Text>
        <Progress value={pct} size="sm" radius="xl" color="accent" transitionDuration={200} mt="sm" />
      </div>

      <Text c="dimmed" maw={480}>
        {paused
          ? "Paused for everyone. The room's clock is stopped until someone resumes it."
          : `${isFocus ? "Break" : "Back to focus"} at ${clockIn(remaining, clockOffsetMs)}, ` +
            `then ${nextMinutes} minutes. The whole room switches together.`}
      </Text>

      <Group>
        <Button color="accent" disabled={disabled} onClick={paused ? onResume : onPause}>
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button variant="default" disabled={disabled} onClick={onEnd}>
          End round
        </Button>
      </Group>
    </Stack>
  );
}
