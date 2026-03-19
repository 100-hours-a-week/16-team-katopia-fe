export type ReadStateParticipant = {
  memberId: string;
  lastReadMessageId: number;
  acknowledgedAt?: string;
};

export function normalizeReadStateParticipants(
  payload: unknown,
): ReadStateParticipant[] {
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const wrappedData =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;
  const source = wrappedData ?? record;

  const participantsSource = Array.isArray(source.participants)
    ? source.participants
    : [source];

  return participantsSource.reduce<ReadStateParticipant[]>((acc, participant) => {
    if (!participant || typeof participant !== "object") return acc;

    const item = participant as Record<string, unknown>;
    const memberId = item.memberId;
    const lastReadMessageId = item.lastReadMessageId;

    if (memberId == null || lastReadMessageId == null) return acc;

    const numericLastReadMessageId = Number(lastReadMessageId);
    if (
      !Number.isFinite(numericLastReadMessageId) ||
      numericLastReadMessageId <= 0
    ) {
      return acc;
    }

    acc.push({
      memberId: String(memberId),
      lastReadMessageId: numericLastReadMessageId,
      acknowledgedAt:
        typeof item.acknowledgedAt === "string" ? item.acknowledgedAt : undefined,
    });

    return acc;
  }, []);
}

export function mergeReadStateParticipants(
  prev: Record<string, ReadStateParticipant>,
  nextParticipants: ReadStateParticipant[],
) {
  if (nextParticipants.length === 0) return prev;

  const merged = { ...prev };

  nextParticipants.forEach((participant) => {
    const previous = merged[participant.memberId];
    if (
      !previous ||
      participant.lastReadMessageId >= previous.lastReadMessageId
    ) {
      merged[participant.memberId] = participant;
    }
  });

  return merged;
}
