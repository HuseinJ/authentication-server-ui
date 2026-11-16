const UNITS = [
  { seconds: 86400, name: 'day' },
  { seconds: 3600, name: 'hour' },
  { seconds: 60, name: 'minute' },
  { seconds: 1, name: 'second' }
];

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return 'Not set';
  const unit = UNITS.find((candidate) => totalSeconds % candidate.seconds === 0) ?? UNITS[3];
  const amount = totalSeconds / unit.seconds;
  return `${amount} ${unit.name}${amount === 1 ? '' : 's'}`;
}
