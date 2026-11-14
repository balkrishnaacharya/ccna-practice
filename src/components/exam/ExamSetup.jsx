import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DOMAINS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function ExamSetup({ onStartExam }) {
  const [selectedDomains, setSelectedDomains] = useState(new Set(Object.keys(DOMAINS)));
  const [difficulty, setDifficulty] = useState("mixed");
  const [timeLimit, setTimeLimit] = useState("120");

  const toggleDomain = (domain) => {
    const next = new Set(selectedDomains);
    if (next.has(domain)) next.delete(domain);
    else next.add(domain);
    setSelectedDomains(next);
  };

  const handleStart = () => {
    onStartExam?.({
      domains: Array.from(selectedDomains),
      difficulty,
      timeLimit: parseInt(timeLimit, 10),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-semibold text-foreground tracking-tight">
          Exam Setup
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your practice exam
        </p>
      </div>

      <Tabs defaultValue="domain" className="w-full max-w-md">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="domain">Domain Mix</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
        </TabsList>

        <TabsContent value="domain" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select domains to include in your exam
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DOMAINS).map(([key, info]) => (
              <label
                key={key}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer group",
                )}
              >
                <Checkbox
                  checked={selectedDomains.has(key)}
                  onCheckedChange={() => toggleDomain(key)}
                  className="text-primary"
                />
                <span className="text-sm text-foreground font-medium">
                  {info.label}
                </span>
              </label>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-4">
          <Select
            value={difficulty}
            onValueChange={setDifficulty}
            className="w-full"
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Select
            value={timeLimit}
            onValueChange={setTimeLimit}
            className="w-full"
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
              <SelectItem value="120">120 minutes</SelectItem>
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleStart}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        size="lg"
        disabled={selectedDomains.size === 0}
      >
        Start Exam
      </Button>
    </div>
  );
}
