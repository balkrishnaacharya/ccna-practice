import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ITEM_POOL_ID = "pool";

export default function DragDropQuestion({ question, onComplete }) {
  const [items, setItems] = useState([...question.items]);
  const [placed, setPlaced] = useState({}); // itemId -> groupIndex
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // If dropped on a group, record placement
    if (overId.startsWith("group-")) {
      const groupIndex = parseInt(overId.replace("group-", ""), 10);
      setPlaced((prev) => ({ ...prev, [activeId]: groupIndex }));
    } else {
      // Dropped back to pool
      setPlaced((prev) => {
        const next = { ...prev };
        delete next[activeId];
        return next;
      });
    }
  };

  const handleCheck = () => {
    const totalItems = question.items.length;
    let correctCount = 0;

    question.items.forEach((item) => {
      const groupIndex = placed[item];
      if (groupIndex !== undefined) {
        const correctItems = question.groups[groupIndex].correct;
        if (correctItems.includes(item)) {
          correctCount++;
        }
      }
    });

    const finalScore = Math.round((correctCount / totalItems) * 100);
    setScore(finalScore);
    setChecking(true);
    onComplete?.(finalScore, correctCount, totalItems);
  };

  const isItemCorrect = (itemId, groupIndex) => {
    const group = question.groups[groupIndex];
    return group && group.correct.includes(itemId);
  };

  return (
    <Card className="border-border bg-card rounded-xl overflow-hidden">
      <CardHeader className="px-6 py-4">
        <CardTitle className="font-serif text-lg font-semibold text-foreground">
          {question.stem}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {/* Item Pool */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Drag items to the correct group:
            </h3>
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const groupIndex = placed[item];
                  const isPlaced = groupIndex !== undefined;
                  return (
                    <SortableItem
                      key={item}
                      id={item}
                      value={item}
                      isPlaced={isPlaced}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </div>

          {/* Groups */}
          <div className="grid gap-4">
            {question.groups.map((group, groupIndex) => (
              <div
                key={groupIndex}
                id={`group-${groupIndex}`}
                className="p-4 rounded-xl border-2 border-border bg-[#181815]/30"
              >
                <h3 className="text-sm font-semibold text-paper mb-3">
                  {group.label}
                </h3>
                <div className="flex flex-wrap gap-2 min-h-[60px]">
                  {question.items
                    .filter((item) => placed[item] === groupIndex)
                    .map((item) => (
                      <div
                        key={item}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono border bg-[#181815]/50 text-paper"
                        style={{
                          borderColor: isItemCorrect(item, groupIndex)
                            ? "#22c55e"
                            : checking
                              ? "#ef4444"
                              : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {item}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {checking && score !== null && (
            <div className="mt-6 p-4 rounded-xl border bg-[#181815]/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-paper">Score</span>
                <span className="text-lg font-mono font-bold">
                  {score}%
                </span>
              </div>
            </div>
          )}

          {!checking && score === null && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleCheck} disabled={Object.keys(placed).length === 0}>
                Check Answers
              </Button>
            </div>
          )}
        </DndContext>
      </CardContent>
    </Card>
  );
}

function SortableItem({ id, value, isPlaced }) {
  const attributes = useSortable({ id });
  const listener = useSensor(PointerSensor);
  const { setNodeRef, transform, transition } = attributes;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="px-3 py-1.5 rounded-lg bg-[#181815]/50 border border-[#4A443A]/40 text-paper text-xs font-mono cursor-pointer hover:bg-[#4A443A]/30 transition-colors"
      {...listener.attributes}
    >
      {value}
    </div>
  );
}
