import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CELL_SIZE = 32;

function accuracyColor(acc) {
  if (acc === null) return "bg-[#3A342A] border-[#3A342A]";
  if (acc >= 80) return "bg-[#5C6E4E]/60 border-[#5C6E4E]";
  if (acc >= 60) return "bg-[#B8842A]/60 border-[#B8842A]";
  return "bg-[#C1633C]/60 border-[#C1633C]";
}

export default function WeaknessHeatmap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Last 7 days (including today)
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }

  useEffect(() => {
    invoke("get_heatmap_data")
      .then((rows) => {
        setData(rows || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("heatmap failed:", err);
        setLoading(false);
      });
  }, []);

  // Build a map: subtopic -> date -> cell
  const subtopicMap = new Map();
  for (const cell of data) {
    if (!subtopicMap.has(cell.subtopic)) {
      subtopicMap.set(cell.subtopic, new Map());
    }
    subtopicMap.get(cell.subtopic).set(cell.date, cell);
  }

  const subtopics = Array.from(subtopicMap.keys()).sort();

  const getCell = (subtopic, date) => {
    const byDate = subtopicMap.get(subtopic);
    if (!byDate) return null;
    return byDate.get(date) || null;
  };

  const handleCellClick = (subtopic) => {
    navigate(`/quiz?mode=weak&subtopic=${encodeURIComponent(subtopic)}`);
  };

  if (loading) {
    return (
      <Card className="border-border bg-card rounded-2xl p-6 h-64 flex items-center justify-center">
        <CardContent>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#B8842A] border-t-transparent mb-2"></div>
            <p className="text-xs text-muted-foreground">Loading heatmap…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card rounded-2xl p-6">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-semibold text-foreground">
          Weakness Heatmap
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Last 7 days — green ≥80%, gold 60–79%, orange &lt;60%, gray no data
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Day headers */}
          <div className="flex items-end gap-1 mb-2">
            <div className="w-20" /> {/* row label column */}
            {days.map((d) => {
              const date = new Date(d + "T00:00:00");
              return (
                <div
                  key={d}
                  className="text-[10px] text-muted-foreground font-mono w-[32px] text-center"
                >
                  {date.toLocaleDateString(undefined, { weekday: "narrow" })}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {subtopics.map((subtopic) => (
            <div key={subtopic} className="flex items-center gap-1">
              <div className="w-20 text-[10px] text-paper-muted font-mono truncate" title={subtopic}>
                {subtopic}
              </div>
              {days.map((date) => {
                const cell = getCell(subtopic, date);
                const acc = cell ? cell.accuracy : null;
                const isAnswered = cell && cell.answered > 0;
                return (
                  <div
                    key={date}
                    className={cn(
                      "w-[32px] h-[32px] rounded border cursor-pointer transition-colors",
                      accuracyColor(acc),
                      isAnswered ? "hover:scale-110" : "opacity-50",
                    )}
                    onClick={() => isAnswered && handleCellClick(subtopic)}
                    title={cell
                      ? `${subtopic} — ${date}: ${cell.answered} answered, ${cell.accuracy.toFixed(0)}%`
                      : `${subtopic} — ${date}: no data`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
