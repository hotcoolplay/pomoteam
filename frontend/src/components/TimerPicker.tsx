import { Button, Chip, Group, NumberInput, Stack, Text, Title } from '@mantine/core';
import { type TimerMode } from '@/app/routes/$roomId';

type TimerPickerProps = {
  timerMode: TimerMode;
  memberCount: number;
  totalTime: number;
  setTotalTime: (minutes: number) => void;
  start: () => void;
};

const FOCUS_TIMER_LIST = [10, 15, 20, 25, 30, 45, 60];
const BREAK_TIMER_LIST = [5, 10, 15, 20, 30];

function TimerPicker({ timerMode, totalTime, setTotalTime, memberCount, start }: TimerPickerProps) {
  const timerList = timerMode === 'focus' ? FOCUS_TIMER_LIST : BREAK_TIMER_LIST;

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>
          {timerMode === 'focus' ? 'How long is this round?' : 'How long is the break?'}
        </Title>
        <Text c="dimmed" mt={4} maw={480}>
          The room runs one timer. Whatever you set here starts for all {memberCount} of you, and
          everyone switches to the break together.
        </Text>
      </div>

      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          {timerMode === 'focus' ? 'Focus length' : 'Break length'}
        </Text>

        <Chip.Group
          multiple={false}
          value={String(totalTime)}
          onChange={(v) => setTotalTime(Number(v))}
        >
          <Group gap="xs">
            {timerList.map((minutes) => (
              <Chip key={minutes} value={String(minutes)} color="accent">
                {minutes} min
              </Chip>
            ))}
          </Group>
        </Chip.Group>

        <NumberInput
          value={totalTime / 60}
          onChange={(v) => {
            // NumberInput reports '' and '-' as intermediate typing states
            // (see the value-type docs) - don't clamp mid-edit on those.
            if (v === '' || v === '-') {
              return;
            }
            const n = typeof v === 'number' ? v : Number(v);
            if (!Number.isNaN(n)) {
              setTotalTime(n);
            }
          }}
          min={1}
          max={180}
          clampBehavior="blur"
          suffix=" minutes"
          w={160}
          aria-label={`Custom ${timerMode} length in minutes`}
        />
      </Stack>

      <div>
        <Button size="lg" onClick={() => start()}>
          {timerMode === 'focus' ? 'Start focus for everyone' : 'Start break for everyone'}
        </Button>
        <Text size="sm" c="dimmed" mt={8}>
          Anyone in the room can start, pause, or end the round.
        </Text>
      </div>
    </Stack>
  );
}

export default TimerPicker;
