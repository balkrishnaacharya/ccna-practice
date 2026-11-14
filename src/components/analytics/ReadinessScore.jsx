import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const COLOR_MAP = {
  heart: { circle: "#ef4444", label: "text-heart-light", badge: "destructive" },
  gold: { circle: "#B8842A", label: "text-gold", badge: "warning" },
  sage: { circle: "#5C6E4E", label: "text-sage-light", badge: "secondary" },
};

export default function ReadinessScore({ score }) {
  if (!score) return null;

  const colorInfo = COLOR_MAP[score.color] || COLOR_MAP.gold;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score.value / 100) * circumference;

  return (
    <Card className="border-border bg-card rounded-2xl p-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-semibold text-foreground">
          Readiness Score
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke={colorInfo.circle}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center top-0 left-0 w-full h-full">
              <span className="text-3xl font-bold text-foreground">{score.value}%</span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-1">
                {score.label}
              </span>
            </div>
          </div>

          <Badge variant={colorInfo.badge} className="text-xs font-semibold px-3 py-1 mb-4">
            {score.label}
          </Badge>

          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Domain accuracy</span>
              <span className="font-mono">{score.domainScore}%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Recency bonus</span>
              <span className="font-mono">+{score.recencyBonus}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Consistency</span>
              <span className="font-mono">+{score.consistencyScore}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
