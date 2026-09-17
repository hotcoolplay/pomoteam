import { Badge, Button, Group, Progress, Stack, Text } from '@mantine/core';

type TimerProps = {
  // timeRemaining should be in seconds
  timeRemaining: number;
  totalTime: number;
  timerMode: 'focus' | 'break';
  isPaused: boolean;
  startedBy: string | null;
  pause: () => void;
  resume: () => void;
};

function Timer({
  timeRemaining,
  totalTime,
  timerMode,
  isPaused,
  startedBy,
  pause,
  resume,
}: TimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerString = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const pct = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0;

  return (
    <Stack gap="lg">
      <div>
        <Badge variant="dot" size="lg" color={isPaused ? 'gray' : 'accent'}>
          {isPaused
            ? timerMode === 'focus'
              ? 'Focus paused'
              : 'Break paused'
            : timerMode === 'focus'
              ? 'Focusing'
              : 'On break'}
        </Badge>
        {startedBy && (
          <Text size="sm" c="dimmed" mt={6}>
            {startedBy} started this round
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
            fontSize: 'clamp(4.5rem, 15.5vw, 9.5rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {timerString}
        </Text>
        <Progress
          value={pct}
          size="sm"
          radius="xl"
          color="accent"
          transitionDuration={200}
          mt="sm"
        />
      </div>

      <Text c="dimmed" maw={480}>
        {isPaused
          ? "Paused for everyone. The room's clock is stopped until someone resumes it."
          : `${timerMode === 'focus' ? 'Break' : 'Back to focus'} at ${minutes} minutes.`}
      </Text>

      <Group>
        <Button color="accent" onClick={isPaused ? resume : pause}>
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
      </Group>
    </Stack>
  );
}

export default Timer;
