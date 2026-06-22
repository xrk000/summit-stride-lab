const avatarModules = import.meta.glob<{ default: string }>("@/assets/avatars/*.jpg", { eager: true });

const avatarMap: Record<string, string> = {};
for (const path in avatarModules) {
  const id = path.match(/([^/]+)\.jpg$/)?.[1];
  if (id) avatarMap[id] = avatarModules[path].default;
}

export const AVAILABLE_AVATAR_IDS = Object.keys(avatarMap).sort();

export function getAvatarUrl(avatarId: string | null | undefined): string | undefined {
  if (!avatarId) return undefined;
  return avatarMap[avatarId];
}
