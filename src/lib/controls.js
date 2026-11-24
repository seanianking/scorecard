import { moveItem } from "@/app/actions/setup";

// Builds the bound reorder/delete actions for one row of an ordered list.
export function rowControls(pageantId, model, list, index, remove, confirmText) {
  const item = list[index];
  return {
    moveUp: moveItem.bind(null, pageantId, model, item.id, "up"),
    moveDown: moveItem.bind(null, pageantId, model, item.id, "down"),
    remove: remove.bind(null, pageantId, item.id),
    confirmText,
    isFirst: index === 0,
    isLast: index === list.length - 1,
  };
}
