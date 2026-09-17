import { Avatar, Group, Indicator, Stack, Text } from '@mantine/core';

export interface MemberRailProps {
  members: string[];
  timeRemaining: number;
  paused: boolean;
}

/**
 * Who's in the room. Because the timer is room-wide, this list doesn't carry
 * per-person times - every member is on the same clock. What it does carry is
 * presence, which is the part that varies: a dropped socket shows as a
 * pulsing, greyed indicator rather than removing someone mid-round.
 */
function MemberRail({ members, timeRemaining, paused }: MemberRailProps) {
  return (
    <Stack gap="md">
      <div>
        <Text fw={600}>In the room</Text>
        <Text size="sm" c="dimmed">
          {timeRemaining === 0
            ? 'Everyone here shares one timer.'
            : `All ${members.length} on the same clock${paused ? ', currently stopped' : ''}.`}
        </Text>
      </div>

      {members.length === 1 ? (
        <Text size="sm" c="dimmed" maw={280}>
          You're the only one here. Others show up as they join.
        </Text>
      ) : (
        <Stack gap="sm">
          {members.map((member) => (
            <Group gap="sm" wrap="nowrap">
              <Indicator inline position="bottom-end" size={10} color="teal" withBorder>
                <Avatar name={member} color="initials" radius="xl" />
              </Indicator>

              <Group gap={6} wrap="nowrap">
                <Text fw={500} size="sm" truncate>
                  {member}
                </Text>
              </Group>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default MemberRail;
