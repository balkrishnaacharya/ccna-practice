/**
 * Subnet calculator — pure JS, bitwise operations on 32-bit integers.
 * No external dependencies.
 */

/**
 * Convert dotted-decimal IPv4 string to 32-bit unsigned integer.
 * Returns null if invalid.
 */
export function ipToInt(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return null;
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Convert 32-bit unsigned integer to dotted-decimal IPv4 string.
 */
export function intToIp(intVal) {
  return [
    (intVal >>> 24) & 0xff,
    (intVal >>> 16) & 0xff,
    (intVal >>> 8) & 0xff,
    intVal & 0xff,
  ].join(".");
}

/**
 * Validate a CIDR prefix (1-32).
 */
export function isValidCidr(prefix) {
  return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
}

/**
 * Calculate subnet information from IP + CIDR.
 * Returns an object with all derived values, or null if input is invalid.
 */
export function calculateSubnet(ip, cidr) {
  const ipInt = ipToInt(ip);
  if (ipInt === null || !isValidCidr(cidr)) {
    return null;
  }

  // Build subnet mask from CIDR
  let maskInt;
  if (cidr === 0) {
    maskInt = 0;
  } else {
    maskInt = (0xffffffff << (32 - cidr)) >>> 0;
  }

  const networkInt = ipInt & maskInt;
  const broadcastInt = networkInt | (~maskInt >>> 0);
  const wildcardInt = ~maskInt >>> 0;

  const totalHosts = 1 << (32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : totalHosts - 2;
  const firstUsable = cidr >= 31 ? networkInt : networkInt + 1;
  const lastUsable = cidr >= 31 ? broadcastInt : broadcastInt - 1;

  const mask = intToIp(maskInt);
  const wildcard = intToIp(wildcardInt);
  const network = intToIp(networkInt);
  const broadcast = intToIp(broadcastInt);

  return {
    ip,
    cidr,
    network,
    broadcast,
    mask,
    wildcard,
    firstUsable: intToIp(firstUsable),
    lastUsable: intToIp(lastUsable),
    totalHosts,
    usableHosts,
    isPointToPoint: cidr === 31,
    isSingleHost: cidr === 32,
  };
}

/**
 * Generate the first N subnets within a given network.
 * Used for the /24 example table.
 */
export function listSubnets(networkIp, cidr, newCidr, count = 4) {
  const info = calculateSubnet(networkIp, cidr);
  if (!info || newCidr <= cidr) {
    return [];
  }

  const blockSize = 1 << (32 - newCidr);
  const networkInt = ipToInt(info.network);
  const subnets = [];

  for (let i = 0; i < count; i++) {
    const subnetInt = networkInt + i * blockSize;
    if (subnetInt > ipToInt(info.broadcast)) break;
    const subnetInfo = calculateSubnet(intToIp(subnetInt), newCidr);
    if (subnetInfo) {
      subnets.push({
        index: i + 1,
        network: subnetInfo.network,
        broadcast: subnetInfo.broadcast,
        firstUsable: subnetInfo.firstUsable,
        lastUsable: subnetInfo.lastUsable,
      });
    }
  }

  return subnets;
}
