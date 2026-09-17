import { useState } from "react";
import { Button, Chip, Group, NumberInput, Progress, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { formatDuration } from "../time";
import type { RunningPhase } from "../types";

const FOCUS_CHIPS = [25, 45, 50, 90];
const BREAK_CHIPS = [5, 10, 15];

export interface SetupScreenProps {
  focusMinutes: number;
  breakMinutes: number;
  memberCount: number;
  disabled?: boolean;
  /** Broadcast so the other members see the change while it's being made. */
  onChangeDurations: (focusMinutes: number, breakMinutes: number) => void;
  onStart: (phase: RunningPhase) => void;
}

export function SetupScreen({
  focusMinutes,
  breakMinutes,
  memberCount,
  disabled = false,
  onChangeDurations,
  onStart,
}: SetupScreenProps) {
  // Which length is being edited. Local - it's a view preference, not room state.
  const [editing, setEditing] = useState<RunningPhase>("focus");

  const isFocus = editing === "focus";
  const chips = isFocus ? FOCUS_CHIPS : BREAK_CHIPS;
  const value = isFocus ? focusMinutes : breakMinutes;
  const total = focusMinutes + breakMinutes;

  const setValue = (minutes: number): void => {
    onChangeDurations(isFocus ? minutes : focusMinutes, isFocus ? breakMinutes : minutes);
  };

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>{isFocus ? "How long is this round?" : "How long is the break?"}</Title>
        <Text c="dimmed" mt={4} maw={480}>
          The room runs one timer. Whatever you set here starts for all {memberCount} of you,
          and everyone switches to the break together.
        </Text>
      </div>

      <SegmentedControl<RunningPhase>
        value={editing}
        onChange={setEditing}
        color="accent"
        data={[
          { label: "Focus", value: "focus" },
          { label: "Break", value: "break" },
        ]}
        style={{ alignSelf: "flex-start" }}
      />

      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          {isFocus ? "Focus length" : "Break length"}
        </Text>

        <Chip.Group multiple={false} value={String(value)} onChange={(v) => setValue(Number(v))}>
          <Group gap="xs">
            {chips.map((minutes) => (
              <Chip key={minutes} value={String(minutes)} disabled={disabled} color="accent">
                {minutes} min
              </Chip>
            ))}
          </Group>
        </Chip.Group>

        <NumberInput
          value={value}
          onChange={(v) => {
            // NumberInput reports '' and '-' as intermediate typing states
            // (see the value-type docs) - don't clamp mid-edit on those.
            if (v === "" || v === "-") return;
            const n = typeof v === "number" ? v : Number(v);
            if (!Number.isNaN(n)) setValue(n);
          }}
          min={1}
          max={180}
          clampBehavior="blur"
          suffix=" minutes"
          disabled={disabled}
          w={160}
          aria-label={`Custom ${editing} length in minutes`}
        />
      </Stack>

      <Stack gap="xs">
        <Text size="sm" c="dimmed">The round everyone runs</Text>
        <Progress.Root size={36}>
          <Progress.Section value={(focusMinutes / total) * 100} color="brass">
            <Progress.Label>{formatDuration(focusMinutes * 60)} focus</Progress.Label>
          </Progress.Section>
          <Progress.Section value={(breakMinutes / total) * 100} color="sea">
            <Progress.Label>{formatDuration(breakMinutes * 60)} break</Progress.Label>
          </Progress.Section>
        </Progress.Root>
      </Stack>

      <div>
        <Button size="lg" disabled={disabled} onClick={() => onStart(editing)}>
          {isFocus ? "Start focus for everyone" : "Start break for everyone"}
        </Button>
        <Text size="sm" c="dimmed" mt={8}>
          Anyone in the room can start, pause, or end the round.
        </Text>
      </div>
    </Stack>
  );
}
