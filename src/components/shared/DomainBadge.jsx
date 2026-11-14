import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DomainBadge({ domain, subtopic }) {
  const domainInfo = {
    network_infra: { label: "Network Fundamentals", color: "#B8842A" },
    switching: { label: "Routing & Switching", color: "#5C6E4E" },
    ip_routing: { label: "IP Routing", color: "#B8842A" },
    services_security: { label: "Services & Security", color: "#C1633C" },
    ai_ops: { label: "AI & Ops", color: "#7B9EB2" },
  }[domain];

  const label = domainInfo?.label || domain?.replace(/_/g, " ") || "General";
  const color = domainInfo?.color || "#B8842A";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-mono border-border",
        `border-${color.replace("#", "")} text-${color.replace("#", "")}`,
      )}
    >
      {label}
      {subtopic && <span className="ml-1 text-[10px] opacity-70">{subtopic}</span>}
    </Badge>
  );
}
