import { Loader2 } from "lucide-react";

export default function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="flex items-center gap-2 text-paper-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-mono tracking-wide">Loading...</span>
      </div>
    </div>
  );
}
