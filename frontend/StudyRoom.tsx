import { useEffect } from "react";
import {
  Badge,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { useCountdown } from "../useCountdown";
import { useRoomSocket } from "../useRoomSocket";
import { FATAL_CLOSE_MESSAGES, type RunningPhase } from "../types";
import { MemberRail } from "./MemberRail";
import { SessionScreen } from "./SessionScreen";
import { SetupScreen } from "./SetupScreen";

export interface StudyRoomProps {
  /** e.g. `wss://api.example.com/ws/${roomId}` */
  socketUrl: string;
  roomName: string;
  onLeave?: () => void;
}

export function StudyRoom({ socketUrl, roomName, onLeave }: StudyRoomProps) {
  const { state, status, error, clockOffsetMs, send, retry } = useRoomSocket({ url: socketUrl });

  // keepTransitions: the dark<->light fade on phase change should animate,
  // not snap - Mantine disables color-scheme transitions by default.
  const { setColorScheme } = useMantineColorScheme({ keepTransitions: true });

  const paused = state?.pausedRemaining != null;
  const remaining = useCountdown(state?.endsAt ?? null, clockOffsetMs, state?.pausedRemaining ?? null);

  // The room's phase drives the page's light/dark scheme: focus dims the
  // room, break brings it up. theme.ts ties the "accent" color to this same
  // scheme via virtualColor, so every Mantine component reading
  // theme.primaryColor repaints itself - no per-component phase checks.
  useEffect(() => {
    setColorScheme(state?.phase === "break" ? "light" : "dark");
  }, [state?.phase, setColorScheme]);

  if (error) {
    return (
      <Container size="xs" pt={80}>
        <Stack gap="md" align="flex-start">
          <Title order={2}>{FATAL_CLOSE_MESSAGES[error.code] ?? "This room closed the connection."}</Title>
          {error.reason && <Text c="dimmed">{error.reason}</Text>}
          <Group>
            <Button onClick={retry}>Try again</Button>
            {onLeave && (
              <Button variant="default" onClick={onLeave}>
                Back to your rooms
              </Button>
            )}
          </Group>
        </Stack>
      </Container>
    );
  }

  if (!state) {
    return (
      <Container size="xs" pt={80}>
        <Group gap="sm">
          <Loader size="sm" />
          <Text c="dimmed">Joining {roomName}...</Text>
        </Group>
      </Container>
    );
  }

  // While reconnecting, the last known state is still shown - the timer is
  // absolute, so it stays correct without the socket. Controls lock because
  // an intent sent now would be dropped.
  const offline = status !== "open";

  const phaseMinutes = state.phase === "break" ? state.breakMinutes : state.focusMinutes;
  const nextMinutes = state.phase === "break" ? state.focusMinutes : state.breakMinutes;
  const startedByName = state.members.find((m) => m.userId === state.startedBy)?.name ?? null;

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg" mb="xl">
        <Group justify="space-between" align="baseline">
          <Title order={2}>{roomName}</Title>
          <Badge
            variant={status === "reconnecting" ? "light" : "outline"}
            color={status === "reconnecting" ? "orange" : "gray"}
          >
            {status === "reconnecting" ? "Reconnecting..." : `${state.members.length} in the room`}
          </Badge>
        </Group>
        <Divider />
      </Stack>

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          {state.phase === "idle" ? (
            <SetupScreen
              focusMinutes={state.focusMinutes}
              breakMinutes={state.breakMinutes}
              memberCount={state.members.length}
              disabled={offline}
              onChangeDurations={(focusMinutes, breakMinutes) =>
                send({ type: "set_durations", focusMinutes, breakMinutes })
              }
              onStart={(phase: RunningPhase) =>
                send({
                  type: "start",
                  phase,
                  focusMinutes: state.focusMinutes,
                  breakMinutes: state.breakMinutes,
                })
              }
            />
          ) : (
            <SessionScreen
              phase={state.phase}
              remaining={remaining}
              totalSeconds={phaseMinutes * 60}
              paused={paused}
              startedByName={startedByName}
              nextMinutes={nextMinutes}
              clockOffsetMs={clockOffsetMs}
              disabled={offline}
              onPause={() => send({ type: "pause" })}
              onResume={() => send({ type: "resume" })}
              onEnd={() => send({ type: "end" })}
            />
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <MemberRail members={state.members} phase={state.phase} paused={paused} />
        </Grid.Col>
      </Grid>
    </Container>
  );
}
