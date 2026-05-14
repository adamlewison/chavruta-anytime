import { nanoid } from "nanoid";

export function generateRoomUrl(): string {
  const slug = `ChavrutaAnytime-${nanoid(16)}`;
  return `https://meet.jit.si/${slug}`;
}

export function buildPrejoinUrl(meetUrl: string, displayName: string): string {
  const encoded = encodeURIComponent(displayName);
  return `${meetUrl}#config.prejoinPageEnabled=false&userInfo.displayName=${encoded}`;
}
