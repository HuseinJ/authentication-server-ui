import { notifications } from '#lib/notifications/notifications.store';

export async function copyToClipboard(text: string, what: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    notifications.success(`Copied ${what}.`);
    return true;
  } catch {
    notifications.warning(`Copy failed. Select the ${what} and copy it manually.`);
    return false;
  }
}
