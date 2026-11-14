import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateSubnet, listSubnets } from "@/lib/subnet";
import { Copy, AlertCircle, CheckCircle2 } from "lucide-react";

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      size="icon"
      className="ml-2 hover:bg-muted"
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );
}

export default function SubnetCalculator() {
  const [ip, setIp] = useState("192.168.1.0");
  const [cidr, setCidr] = useState("24");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleCalculate() {
    setError(null);
    const parsedCidr = parseInt(cidr, 10);

    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      setError("Invalid IPv4 address format.");
      setResult(null);
      return;
    }

    if (!Number.isInteger(parsedCidr) || parsedCidr < 1 || parsedCidr > 32) {
      setError("CIDR must be between 1 and 32.");
      setResult(null);
      return;
    }

    const calc = calculateSubnet(ip, parsedCidr);
    if (!calc) {
      setError("Unable to calculate subnet. Check your input.");
      setResult(null);
      return;
    }

    setResult(calc);
  }

  if (!result) {
    return (
      <Card className="border-border bg-card rounded-xl p-6">
        <CardHeader>
          <CardTitle className="text-lg font-serif font-semibold text-foreground">
            Subnet Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="subnet-ip" className="text-sm font-medium text-muted-foreground">
              IP Address
            </Label>
            <Input
              id="subnet-ip"
              type="text"
              placeholder="e.g. 192.168.1.0"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="subnet-cidr" className="text-sm font-medium text-muted-foreground">
              CIDR Prefix (/1–/32)
            </Label>
            <Input
              id="subnet-cidr"
              type="number"
              min={1}
              max={32}
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              className="w-[120px]"
            />
          </div>
          <Button onClick={handleCalculate} className="w-full">
            Calculate
          </Button>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const { subnets: exampleSubnets } = result;
  const subnets = listSubnets(result.network, result.cidr, 24, 4);

  return (
    <Card className="border-border bg-card rounded-xl p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-serif font-semibold text-foreground">
          Subnet Calculator
        </CardTitle>
        <Button
          onClick={() => {
            setResult(null);
            setError(null);
          }}
          variant="outline"
          size="sm"
        >
          New Calculation
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Network Address
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground">{result.network}</span>
              <CopyButton value={result.network} />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Broadcast Address
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground">{result.broadcast}</span>
              <CopyButton value={result.broadcast} />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Subnet Mask
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground">{result.mask}</span>
              <CopyButton value={result.mask} />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Wildcard Mask
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground">{result.wildcard}</span>
              <CopyButton value={result.wildcard} />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              First Usable
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground">{result.firstUsable}</span>
              <CopyButton value={result.firstUsable} />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Last Usable
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground">{result.lastUsable}</span>
              <CopyButton value={result.lastUsable} />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Hosts
            </span>
            <span className="font-mono font-semibold text-foreground">{result.totalHosts}</span>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Usable Hosts
            </span>
            <span className="font-mono font-semibold text-foreground">{result.usableHosts}</span>
          </div>
        </div>

        {result.isPointToPoint && (
          <div className="bg-[#B8842A]/10 border border-[#B8842A]/30 rounded-lg p-3 text-xs text-[#B8842A]">
            Point-to-point link (/31): both addresses are usable.
          </div>
        )}
        {result.isSingleHost && (
          <div className="bg-[#B8842A]/10 border border-[#B8842A]/30 rounded-lg p-3 text-xs text-[#B8842A]">
            Single host (/32): only one address.
          </div>
        )}

        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Example: First 4 /24 Subnets
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-mono">#</th>
                  <th className="pb-2 font-mono">Network</th>
                  <th className="pb-2 font-mono">Broadcast</th>
                  <th className="pb-2 font-mono">Range</th>
                </tr>
              </thead>
              <tbody>
                {subnets.map((s) => (
                  <tr key={s.index} className="border-b border-border/50">
                    <td className="py-2 font-mono text-muted-foreground">/{s.index}</td>
                    <td className="py-2 font-mono text-foreground">{s.network}</td>
                    <td className="py-2 font-mono text-foreground">{s.broadcast}</td>
                    <td className="py-2 font-mono text-muted-foreground">
                      {s.firstUsable} – {s.lastUsable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
