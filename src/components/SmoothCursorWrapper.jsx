import { SmoothCursor } from "./ui/smooth-cursor";

/**
 * Desktop-only smooth cursor.
 *
 * Mounts the magicui SmoothCursor component, which self-gates to fine-pointer
 * (mouse) devices via `(any-hover: hover) and (any-pointer: fine)`. On Android
 * and other touch devices it renders null. The cursor uses pointerEvents: none
 * so it never blocks clicks on buttons, links, or inputs.
 */
export default function SmoothCursorWrapper() {
  return <SmoothCursor />;
}
