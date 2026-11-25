import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateSubnet, listSubnets } from "@/lib/subnet";
import { Copy, AlertCircle, CheckCircle2, Calculator } from "lucide-react";

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value && value !== 0) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-paper-muted hover:bg-dark-elevated hover:text-paper transition-colors"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      title={copied ? "Copied" : "Copy"}
    >
      {copied ? <CheckCircle2 className="h-4 w-4 text-sage-light" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function Field({ label, value, mono = true, copy = true }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="space-y-1.5 rounded-lg border border-dark-border bg-dark-bg/40 p-3">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-paper-muted">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className={mono ? "font-mono text-sm font-semibold text-paper break-all" : "text-sm font-semibold text-paper"}>
          {display}
        </span>
        {copy && display !== "—" ? <CopyButton value={display} /> : null}
      </div>
    </div>
  );
}

export default function SubnetCalculator() {
  const [ip, setIp] = useState("192.168.1.10");
  const [cidr, setCidr] = useState("24");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleCalculate(e) {
    e?.preventDefault();
    setError(null);
    const parsedCidr = Number.parseInt(cidr, 10);

    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim())) {
      setError("Invalid IPv4 address format. Use dotted decimal (e.g. 192.168.1.10).");
      setResult(null);
      return;
    }

    if (!Number.isInteger(parsedCidr) || parsedCidr < 0 || parsedCidr > 32) {
      setError("CIDR prefix must be an integer between 0 and 32.");
      setResult(null);
      return;
    }

    const calc = calculateSubnet(ip.trim(), parsedCidr);
    if (!calc) {
      setError("Unable to calculate subnet. Check your input.");
      setResult(null);
      return;
    }

    setResult(calc);
  }

  const subnetExamples = useMemo(() => {
    if (!result) return { title: "", rows: [] };
    // Show meaningful subdivisions: split the current network into 4 smaller subnets when possible.
    let target = result.cidr + 2;
    if (result.cidr >= 30) target = result.cidr; // no room
    if (target > 32) target = 32;
    if (target <= result.cidr) {
      // If no subdivision, show this network as a single row
      return {
        title: `Subnet breakdown (/${result.cidr})`,
        rows: [
          {
            index: 1,
            prefix: result.cidr,
            network: result.network,
            broadcast: result.broadcast,
            firstUsable: result.firstUsable,
            lastUsable: result.lastUsable,
            hosts: result.usableHosts,
          },
        ],
      };
    }
    const rows = listSubnets(result.network, result.cidr, target, 4);
    return { title: `Example: first 4 /${target} subnets inside ${result.cidrNotation}`, rows };
  }, [result]);

  return (
    <div className="space-y-6">
      <Card className="border-dark-border bg-dark-card/95 text-paper rounded-xl">
        <CardHeader className="border-b border-dark-border/60">
          <CardTitle className="text-xl font-serif font-semibold text-paper flex items-center gap-2">
            <Calculator className="h-5 w-5 text-gold" />
            IPv4 Subnet Calculator
          </CardTitle>
          <p className="text-sm text-paper-muted mt-1">
            Enter an IPv4 address and CIDR prefix to calculate network, broadcast, usable range, subnet mask, and wildcard mask.
          </p>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="subnet-ip" className="text-sm font-medium text-paper-muted">
                IPv4 Address
              </Label>
              <Input
                id="subnet-ip"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 192.168.1.10"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full bg-dark-bg border-dark-border text-paper placeholder:text-paper-dim focus-visible:border-gold focus-visible:ring-gold/30"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subnet-cidr" className="text-sm font-medium text-paper-muted">
                CIDR Prefix (/0–/32)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-paper-muted font-mono">/</span>
                <Input
                  id="subnet-cidr"
                  type="number"
                  min={0}
                  max={32}
                  step={1}
                  value={cidr}
                  onChange={(e) => setCidr(e.target.value)}
                  className="w-full bg-dark-bg border-dark-border text-paper placeholder:text-paper-dim focus-visible:border-gold focus-visible:ring-gold/30"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="h-10 px-6 bg-gold hover:bg-gold-hover text-dark-bg font-semibold shadow-gold-glow border border-gold/40"
            >
              Calculate
            </Button>
          </form>

          {error && (
            <div className="flex items-center gap-2 text-sm text-heart-light bg-heart/10 border border-heart/30 rounded-lg px-3 py-2.5" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-dark-border bg-dark-card/95 text-paper rounded-xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-dark-border/60">
            <div>
              <CardTitle className="text-lg font-serif font-semibold text-paper">Results for {result.ip}/{result.cidr}</CardTitle>
              <p className="text-sm text-paper-muted mt-1">
                Network: <span className="font-mono text-gold">{result.cidrNotation}</span> · Class {result.addressClass} · {result.addressType}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => { setResult(null); setError(null); }}
              variant="outline"
              className="border-dark-border text-paper-muted hover:text-paper hover:bg-dark-elevated"
            >
              Clear Results
            </Button>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Network Address" value={result.network} />
              <Field label="Broadcast Address" value={result.broadcast} />
              <Field label="CIDR Notation" value={result.cidrNotation} />
              <Field label="Subnet Mask" value={result.mask} />
              <Field label="Wildcard Mask" value={result.wildcard} />
              <Field label="Wildcard Calculation" value={result.wildcardCalculation} mono={false} copy={false} />
              <Field label="First Usable Host" value={result.firstUsable} />
              <Field label="Last Usable Host" value={result.lastUsable} />
              <Field label="Usable Host Range" value={`${result.firstUsable} – ${result.lastUsable}`} />
              <Field label="Total Addresses" value={result.totalHosts.toLocaleString()} mono />
              <Field label="Usable Hosts" value={result.usableHosts.toLocaleString()} mono />
              <Field label="Network / Host Bits" value={`${result.networkBits} / ${result.hostBits}`} mono />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1.5 rounded-lg border border-dark-border bg-dark-bg/40 p-3">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-paper-muted">Subnet Mask (Binary)</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-semibold text-paper break-all">{result.binaryMask}</span>
                  <CopyButton value={result.binaryMask} />
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border border-dark-border bg-dark-bg/40 p-3">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-paper-muted">Wildcard Mask (Binary)</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-semibold text-paper break-all">{result.binaryWildcard}</span>
                  <CopyButton value={result.binaryWildcard} />
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border border-dark-border bg-dark-bg/40 p-3">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-paper-muted">Network Address (Binary)</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-semibold text-paper break-all">{result.binaryNetwork}</span>
                  <CopyButton value={result.binaryNetwork} />
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border border-dark-border bg-dark-bg/40 p-3">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-paper-muted">Broadcast Address (Binary)</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-semibold text-paper break-all">{result.binaryBroadcast}</span>
                  <CopyButton value={result.binaryBroadcast} />
                </div>
              </div>
            </div>

            {result.isPointToPoint && (
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-sm text-gold">
                Point-to-point link (/31, RFC 3021): both addresses are usable; there is no separate network/broadcast host reservation.
              </div>
            )}
            {result.isSingleHost && (
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-sm text-gold">
                Single host route (/32): identifies exactly one address.
              </div>
            )}

            {subnetExamples.rows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-paper-muted">
                    {subnetExamples.title}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-dark-border">
                  <table className="w-full text-sm">
                    <thead className="bg-dark-bg/60 text-paper-muted">
                      <tr className="text-left border-b border-dark-border">
                        <th className="px-3 py-2 font-medium">#</th>
                        <th className="px-3 py-2 font-medium">Subnet</th>
                        <th className="px-3 py-2 font-medium">Broadcast</th>
                        <th className="px-3 py-2 font-medium">Usable Range</th>
                        <th className="px-3 py-2 font-medium">Usable Hosts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subnetExamples.rows.map((s) => (
                        <tr key={`${s.network}-${s.prefix}-${s.index}`} className="border-b border-dark-border/50 last:border-b-0">
                          <td className="px-3 py-2 font-mono text-paper-muted">{s.index}</td>
                          <td className="px-3 py-2 font-mono text-paper">{s.network}/{s.prefix}</td>
                          <td className="px-3 py-2 font-mono text-paper">{s.broadcast}</td>
                          <td className="px-3 py-2 font-mono text-paper-muted">{s.firstUsable} – {s.lastUsable}</td>
                          <td className="px-3 py-2 font-mono text-paper">{s.hosts.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
