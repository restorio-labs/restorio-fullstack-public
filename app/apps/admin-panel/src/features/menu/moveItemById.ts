export function moveItemById<T extends { id: string }>(list: T[], id: string, direction: "up" | "down"): T[] | null {
  const index = list.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= list.length) {
    return null;
  }

  const next = [...list];
  const [moved] = next.splice(index, 1);

  next.splice(targetIndex, 0, moved);

  return next;
}
