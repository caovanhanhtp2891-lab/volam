export const WORLD_ANNOUNCEMENT_MS = 14000;
export interface WorldAnnouncement {
  id: number;
  killer: string;
  victim: string;
  at: number;
}
export function queueWorldKill(
  queue: WorldAnnouncement[],
  killer: string,
  victim: string,
  now: number,
): WorldAnnouncement {
  const clean = (name: string) =>
    name
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 40) || "Vô danh";
  const message = {
    id: (queue.at(-1)?.id ?? 0) + 1,
    killer: clean(killer),
    victim: clean(victim),
    at: Math.max(
      now,
      (queue.at(-1)?.at ?? -WORLD_ANNOUNCEMENT_MS) + WORLD_ANNOUNCEMENT_MS,
    ),
  };
  queue.push(message);
  // Keep the visible entry; bound bursts without extending the queue forever.
  if (queue.length > 6) {
    queue.splice(1, queue.length - 6);
    for (let i = 1; i < queue.length; i++)
      queue[i].at = queue[i - 1].at + WORLD_ANNOUNCEMENT_MS;
  }
  return message;
}
export function currentWorldAnnouncement(
  queue: WorldAnnouncement[],
  now: number,
): WorldAnnouncement | undefined {
  while (queue[0] && now >= queue[0].at + WORLD_ANNOUNCEMENT_MS) queue.shift();
  return queue[0] && now >= queue[0].at ? queue[0] : undefined;
}
export const worldKillText = (message: WorldAnnouncement): string =>
  `[Thế giới] ${message.killer} đã tiêu diệt ${message.victim}!`;
