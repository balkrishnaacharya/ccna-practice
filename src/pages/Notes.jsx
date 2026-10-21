import { useMemo, useState } from "react";

function parseIpv4(value) {
  const parts = value.trim().split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const octets = parts.map(Number);
  if (octets.some((part) => part > 255)) return null;
  return octets.reduce((result, octet) => ((result << 8) | octet) >>> 0, 0);
}

function formatIpv4(value) {
  const ip = value >>> 0;
  return [ip >>> 24, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255].join(".");
}

function prefixMask(prefix) {
  if (prefix === 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

function maskForPrefix(prefix) {
  return formatIpv4(prefixMask(prefix));
}

function hostCount(prefix) {
  return 2 ** (32 - prefix);
}

function calculateSubnet(ipText, prefixText) {
  const ip = parseIpv4(ipText);
  if (!/^\d+$/.test(prefixText)) return null;
  const prefix = Number(prefixText);
  if (ip === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
  const mask = prefixMask(prefix);
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const totalHosts = hostCount(prefix);
  const usableHosts = prefix >= 31 ? 0 : totalHosts - 2;
  return {
    network: formatIpv4(network),
    broadcast: formatIpv4(broadcast),
    firstHost: usableHosts ? formatIpv4(network + 1) : "—",
    lastHost: usableHosts ? formatIpv4(broadcast - 1) : "—",
    totalHosts: totalHosts.toLocaleString(),
    usableHosts: usableHosts.toLocaleString(),
    wildcard: formatIpv4(~mask >>> 0),
    mask: formatIpv4(mask),
  };
}

function complementMask(value) {
  const parsed = parseIpv4(value);
  return parsed === null ? null : formatIpv4(~parsed >>> 0);
}

function ResultCard({ title, value }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface/60 p-3 space-y-1">
      <p className="text-xs text-paper-dim font-sans">{title}</p>
      <p className="break-all font-mono text-sm font-medium text-gold">{value}</p>
    </div>
  );
}

export default function Notes() {
  const [ip, setIp] = useState("192.168.1.10");
  const [prefix, setPrefix] = useState("24");
  const [subnetMask, setSubnetMask] = useState("255.255.255.0");
  const [wildcardMask, setWildcardMask] = useState("0.0.0.255");
  const subnet = useMemo(() => calculateSubnet(ip, prefix), [ip, prefix]);
  const maskWildcard = useMemo(() => complementMask(subnetMask), [subnetMask]);
  const wildcardSubnet = useMemo(() => complementMask(wildcardMask), [wildcardMask]);
  const cidrRows = useMemo(() => Array.from({ length: 25 }, (_, index) => {
    const cidr = index + 8;
    const total = hostCount(cidr);
    return { cidr, mask: maskForPrefix(cidr), total, usable: Math.max(0, total - 2) };
  }), []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-paper">
          Study Notes &amp; Calculators
        </h1>
        <p className="mt-1 text-sm text-paper-muted font-sans">
          IPv4 subnetting and wildcard calculations running 100% locally.
        </p>
      </header>

      <section className="space-y-5 rounded-2xl border border-dark-border bg-dark-card p-6 shadow-dock sm:p-7">
        <div>
          <h2 className="font-serif text-xl font-semibold text-paper">Subnet Calculator</h2>
          <p className="mt-0.5 text-xs text-paper-dim">Enter an IPv4 address and CIDR prefix.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-medium text-paper-muted">IPv4 address
            <input
              value={ip}
              onChange={(event) => setIp(event.target.value)}
              inputMode="decimal"
              placeholder="192.168.1.10"
              className="w-full rounded-xl border border-dark-border bg-dark-surface px-3.5 py-2.5 font-mono text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-paper-muted">CIDR prefix
            <input
              type="number"
              min="0"
              max="32"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              className="w-full rounded-xl border border-dark-border bg-dark-surface px-3.5 py-2.5 font-mono text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </label>
        </div>
        {subnet ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            <ResultCard title="Network address" value={`${subnet.network}/${prefix}`} />
            <ResultCard title="Broadcast address" value={subnet.broadcast} />
            <ResultCard title="First host" value={subnet.firstHost} />
            <ResultCard title="Last host" value={subnet.lastHost} />
            <ResultCard title="Subnet mask" value={subnet.mask} />
            <ResultCard title="Wildcard mask" value={subnet.wildcard} />
            <ResultCard title="Total addresses" value={subnet.totalHosts} />
            <ResultCard title="Usable hosts" value={subnet.usableHosts} />
          </div>
        ) : (
          <p role="alert" className="text-xs text-heart-light bg-heart/15 p-3 rounded-xl border border-heart/30">
            Enter a valid IPv4 address and a prefix from 0 to 32.
          </p>
        )}
      </section>

      <section className="space-y-5 rounded-2xl border border-dark-border bg-dark-card p-6 shadow-dock sm:p-7">
        <div>
          <h2 className="font-serif text-xl font-semibold text-paper">Wildcard Mask Calculator</h2>
          <p className="mt-0.5 text-xs text-paper-dim">Each value is the bitwise complement of the other.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-xs font-medium text-paper-muted">Subnet mask
            <input
              value={subnetMask}
              onChange={(event) => setSubnetMask(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-dark-border bg-dark-surface px-3.5 py-2.5 font-mono text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <span className="block pt-1.5 text-xs font-mono font-semibold text-gold">
              Wildcard: {maskWildcard ?? "Invalid IPv4 mask"}
            </span>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-paper-muted">Wildcard mask
            <input
              value={wildcardMask}
              onChange={(event) => setWildcardMask(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-dark-border bg-dark-surface px-3.5 py-2.5 font-mono text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <span className="block pt-1.5 text-xs font-mono font-semibold text-gold">
              Subnet mask: {wildcardSubnet ?? "Invalid IPv4 wildcard"}
            </span>
          </label>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-dark-border bg-dark-card p-6 shadow-dock sm:p-7">
        <div>
          <h2 className="font-serif text-xl font-semibold text-paper">CIDR Reference</h2>
          <p className="mt-0.5 text-xs text-paper-dim">Subnet masks and address/usable-host counts for /8 through /32.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-dark-border">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-dark-surface text-paper-dim">
              <tr>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">CIDR</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Subnet mask</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Addresses</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Usable hosts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-borderSubtle">
              {cidrRows.map((row) => (
                <tr key={row.cidr} className="hover:bg-dark-surface/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-semibold text-gold">/{row.cidr}</td>
                  <td className="px-4 py-2.5 font-mono text-paper">{row.mask}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-paper-muted">{row.total.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-paper">{row.usable.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
