import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { DOMAINS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function DomainSelector({ domains = [], onSelectDomain }) {
  const domainList = domains.length > 0 ? domains : Object.entries(DOMAINS);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {domainList.map(([key, info]) => {
        const progress = Math.min(100, Math.floor(Math.random() * 100));
        return (
          <Card
            key={key}
            asChild
            className={cn(
              "border-border bg-card hover:border-primary transition-colors duration-200 ease-out group",
            )}
          >
            <Link
              to={`/quiz?domain=${key}`}
              className="block h-full"
              onClick={(e) => {
                e.preventDefault();
                onSelectDomain?.(key);
              }}
            >
              <CardHeader className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {info.label || key}
                  </CardTitle>
                  <span className="text-xs font-mono text-muted-foreground">
                    {progress}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-2">
                <div className="w-full bg-muted rounded-full h-1.5">
                  <Progress value={progress} className="h-1.5 bg-primary" />
                </div>
              </CardContent>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
