/**
 * Subnet calculator — pure JS, bitwise operations on 32-bit unsigned integers.
 * No external dependencies.
 */

/** Convert dotted-decimal IPv4 string to 32-bit unsigned integer. */
export function ipToInt(ip) {
  if (typeof ip !== "string") return null;
  const parts = ip.trim().split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return null;
  }
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

/** Convert 32-bit unsigned integer to dotted-decimal IPv4 string. */
export function intToIp(intVal) {
  const n = intVal >>> 0;
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
}

export function isValidCidr(prefix) {
  return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
}

export function toBinaryIp(ipOrInt) {
  const n = typeof ipOrInt === "string" ? ipToInt(ipOrInt) : ipOrInt >>> 0;
  if (n === null || n === undefined) return null;
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
    .map((o) => o.toString(2).padStart(8, "0"))
    .join(".");
}

export function getAddressClass(ip) {
  const n = ipToInt(ip);
  if (n === null) return null;
  const first = (n >>> 24) & 0xff;
  if (first >= 1 && first <= 126) return "A";
  if (first === 127) return "Loopback";
  if (first >= 128 && first <= 191) return "B";
  if (first >= 192 && first <= 223) return "C";
  if (first >= 224 && first <= 239) return "D (Multicast)";
  if (first >= 240 && first <= 255) return "E (Reserved)";
  return "Unknown";
}

export function getAddressType(ip) {
  const n = ipToInt(ip);
  if (n === null) return null;
  const first = (n >>> 24) & 0xff;
  const second = (n >>> 16) & 0xff;
  if (first === 10) return "Private (RFC 1918)";
  if (first === 172 && second >= 16 && second <= 31) return "Private (RFC 1918)";
  if (first === 192 && second === 168) return "Private (RFC 1918)";
  if (first === 127) return "Loopback";
  if (first === 169 && second === 254) return "Link-local (APIPA)";
  if (first >= 224 && first <= 239) return "Multicast";
  if (first >= 240) return "Reserved";
  return "Public/Unicast";
}

/** Calculate subnet information from IP + CIDR. */
export function calculateSubnet(ip, cidr) {
  const ipInt = ipToInt(ip);
  if (ipInt === null || !isValidCidr(cidr)) {
    return null;
  }

  const maskInt = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalHosts = cidr === 0 ? 4294967296 : 2 ** (32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : Math.max(0, totalHosts - 2);
  const firstUsableInt = cidr >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastUsableInt = cidr >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;

  const mask = intToIp(maskInt);
  const wildcard = intToIp(wildcardInt);
  const network = intToIp(networkInt);
  const broadcast = intToIp(broadcastInt);

  return {
    ip: intToIp(ipInt),
    cidr,
    cidrNotation: `${network}/${cidr}`,
    network,
    broadcast,
    mask,
    wildcard,
    wildcardCalculation: `255.255.255.255 - ${mask} = ${wildcard}`,
    firstUsable: intToIp(firstUsableInt),
    lastUsable: intToIp(lastUsableInt),
    totalHosts,
    usableHosts,
    hostBits: 32 - cidr,
    networkBits: cidr,
    binaryMask: toBinaryIp(maskInt),
    binaryWildcard: toBinaryIp(wildcardInt),
    binaryNetwork: toBinaryIp(networkInt),
    binaryBroadcast: toBinaryIp(broadcastInt),
    addressClass: getAddressClass(ip),
    addressType: getAddressType(ip),
    isPointToPoint: cidr === 31,
    isSingleHost: cidr === 32,
  };
}

/**
 * Generate subnets inside a network at a new prefix length.
 * Example: listSubnets("192.168.0.0", 24, 26, 4) -> four /26 subnets.
 */
export function listSubnets(networkIp, cidr, newCidr, count = 4) {
  const info = calculateSubnet(networkIp, cidr);
  if (!info || !Number.isInteger(newCidr) || newCidr <= cidr || newCidr > 32) {
    return [];
  }

  const blockSize = 2 ** (32 - newCidr);
  const base = ipToInt(info.network);
  const end = ipToInt(info.broadcast);
  const subnets = [];

  for (let i = 0; i < count; i++) {
    const subnetInt = (base + i * blockSize) >>> 0;
    if (subnetInt > end) break;
    const subnetInfo = calculateSubnet(intToIp(subnetInt), newCidr);
    if (subnetInfo) {
      subnets.push({
        index: i + 1,
        prefix: newCidr,
        network: subnetInfo.network,
        broadcast: subnetInfo.broadcast,
        firstUsable: subnetInfo.firstUsable,
        lastUsable: subnetInfo.lastUsable,
        hosts: subnetInfo.usableHosts,
      });
    }
  }

  return subnets;
}
