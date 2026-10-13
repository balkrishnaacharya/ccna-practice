const wordsOf = (value) => String(value || "").trim().split(/\s+/).filter(Boolean);
const ipNumber = (ip) => {
  const parts = String(ip || "").split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return parts.reduce((out, n) => ((out << 8) | n) >>> 0, 0);
};
const ipText = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
const maskPrefix = (mask) => {
  const n = ipNumber(mask);
  return n === null ? "?" : n.toString(2).replace(/0/g, "").length;
};
const networkOf = (ip, mask) => {
  const a = ipNumber(ip); const b = ipNumber(mask);
  return a === null || b === null ? null : (a & b) >>> 0;
};

const INTERFACE_ALIASES = [
  [/^(?:gigabitethernet|gigabit|gigab|gig|gi|g)(?=\d)/i, "GigabitEthernet"],
  [/^(?:fastethernet|fast|fa|f)(?=\d)/i, "FastEthernet"],
  [/^(?:ethernet|eth|e)(?=\d)/i, "Ethernet"],
  [/^(?:loopback|lo)(?=\d)/i, "Loopback"],
  [/^(?:port-channel|po)(?=\d)/i, "Port-channel"],
  [/^(?:vlan)(?=\d)/i, "Vlan"],
];

export function normalizeInterfaceName(inputStr, deviceInterfaces = {}) {
  const input = String(inputStr || "").replace(/\s+/g, "").trim();
  if (!input) return null;
  const names = Array.isArray(deviceInterfaces) ? deviceInterfaces.map((item) => typeof item === "string" ? item : item?.name).filter(Boolean) : Object.keys(deviceInterfaces || {});
  const exact = names.find((name) => name.toLowerCase() === input.toLowerCase());
  if (exact) return exact;
  const familyOnly = [
    [/^(?:gigabitethernet|gigabit|gigab|gig|gi|g)$/i, "GigabitEthernet"],
    [/^(?:fastethernet|fast|fa|f)$/i, "FastEthernet"],
    [/^(?:ethernet|eth|e)$/i, "Ethernet"],
    [/^(?:loopback|lo)$/i, "Loopback"],
    [/^(?:port-channel|po)$/i, "Port-channel"],
    [/^vlan$/i, "Vlan"],
  ];
  for (const [pattern, canonical] of familyOnly) {
    if (!pattern.test(input)) continue;
    const matches = names.filter((name) => name.toLowerCase().startsWith(canonical.toLowerCase()));
    if (matches.length === 1) return matches[0];
    if (!matches.length) return canonical;
    return null;
  }
  for (const [pattern, canonical] of INTERFACE_ALIASES) {
    const match = input.match(pattern);
    if (!match) continue;
    const resolved = canonical + input.slice(match[0].length);
    const actual = names.find((name) => name.toLowerCase() === resolved.toLowerCase());
    return actual || resolved;
  }
  const actual = names.find((name) => name.toLowerCase().startsWith(input.toLowerCase()));
  return actual || null;
}

function ensureDeviceState(device) {
  device.interfaces ||= {};
  device.ospf ||= { processId: null, networks: [] };
  device.ospf.networks ||= [];
  device.ipv6Ospf ||= { processId: null, networks: [] };
  device.ipv6Ospf.networks ||= [];
  device.routes ||= [];
  device.ipv6Routes ||= [];
  device.acls ||= {};
  device.extendedAcls ||= {};
  device.vlans ||= [{ id: 1, name: "default", status: "active" }];
  device.dhcpPools ||= {};
  device.dhcpBindings ||= [];
  device.nat ||= { static: [], overload: [] };
  device.aaa ||= { enabled: false, login: null, tacacsServers: {}, radiusServers: {} };
  device.aaa.tacacsServers ||= {};
  device.aaa.radiusServers ||= {};
  device.users ||= {};
  device.lines ||= {};
  device.mode ||= "user";
  device.ipRouting ??= true;
  device.ipv6Routing ??= false;
  device.neighbors ||= [];
  device.cdpEnabled ??= true;
  device.lldpEnabled ??= false;
  device.startupConfig ||= null;
  for (const [name, iface] of Object.entries(device.interfaces)) {
    iface.name ||= name;
    iface.status ||= "up";
    iface.adminUp ??= true;
    iface.ip ||= "";
    iface.mask ||= "";
    iface.ipv6 ||= "";
    iface.ipv6Prefix ??= null;
    iface.ipv6LinkLocal ||= "";
    iface.mtu ||= 1500;
    iface.hello ||= 10;
    iface.dead ||= 40;
    iface.switchportMode ||= "access";
    iface.nativeVlan ||= 1;
    iface.allowedVlans ||= [1];
    iface.accessVlan ||= 1;
    iface.channelGroup ??= null;
    iface.channelMode ??= null;
    iface.helperAddress ??= null;
    iface.portSecurityMax ||= 1;
    iface.portSecuritySticky ??= false;
    iface.macCount ||= 1;
    iface.violation ??= false;
    iface.natRole ??= null;
    iface.ospfProcess ??= null;
    iface.ospfArea ??= null;
    iface.ospfMtuIgnore ??= false;
    iface.accessGroups ||= {};
  }
  return device;
}

function promptFor(device) {
  if (device.mode === "privileged") return `${device.name}#`;
  if (device.mode === "config") return `${device.name}(config)#`;
  if (device.mode === "interface") return `${device.name}(config-if)#`;
  if (device.mode === "router" || device.mode === "router-v6") return `${device.name}(config-router)#`;
  if (device.mode === "dhcp") return `${device.name}(dhcp-config)#`;
  if (device.mode === "vlan") return `${device.name}(config-vlan)#`;
  if (device.mode === "acl-standard") return `${device.name}(config-std-nacl)#`;
  if (device.mode === "acl-extended") return `${device.name}(config-ext-nacl)#`;
  if (device.mode === "server-tacacs") return `${device.name}(config-server-tacacs)#`;
  if (device.mode === "server-radius") return `${device.name}(config-server-radius)#`;
  if (device.mode === "line") return `${device.name}(config-line)#`;
  return `${device.name}>`;
}

function ospfNetworksInterface(device, iface) {
  const address = ipNumber(iface.ip);
  const matchingNetwork = device.ospf.networks.some((entry) => {
    const net = ipNumber(entry.ip); const wildcard = ipNumber(entry.wildcard);
    return address !== null && net !== null && wildcard !== null && ((address & ~wildcard) >>> 0) === ((net & ~wildcard) >>> 0);
  });
  return matchingNetwork || (iface.ospfProcess === device.ospf.processId && iface.ospfProcess !== null);
}

function canFormOspf(devices, name, iface) {
  return Object.entries(devices).some(([otherName, rawOther]) => {
    if (otherName === name) return false;
    const other = ensureDeviceState(rawOther);
    return Object.values(other.interfaces).some((peer) => peer.adminUp && peer.status === "up" &&
      networkOf(iface.ip, iface.mask) !== null && networkOf(iface.ip, iface.mask) === networkOf(peer.ip, peer.mask) &&
      iface.hello === peer.hello && iface.dead === peer.dead && (iface.mtu === peer.mtu || iface.ospfMtuIgnore || peer.ospfMtuIgnore) &&
      other.ospf.processId !== null && ospfNetworksInterface(other, peer) &&
      devices[name].ospf.processId !== null && ospfNetworksInterface(devices[name], iface) &&
      (iface.ospfArea === null || peer.ospfArea === null || iface.ospfArea === peer.ospfArea));
  });
}

function showIpInterfaceBrief(device) {
  const rows = ["Interface              IP-Address      OK? Method Status                Protocol"];
  for (const iface of Object.values(device.interfaces)) rows.push(`${iface.name.padEnd(23)} ${(iface.ip || "unassigned").padEnd(15)} YES manual ${iface.adminUp ? iface.status : "administratively down"}          ${iface.status === "up" && iface.adminUp ? "up" : "down"}`);
  return rows.join("\n");
}

function showInterface(device, requested) {
  const name = normalizeInterfaceName(requested, device.interfaces);
  const iface = name && device.interfaces[name];
  if (!iface) return `% Interface ${requested} not found.`;
  return [
    `${iface.name} is ${iface.adminUp ? iface.status : "administratively down"}, line protocol is ${iface.status === "up" && iface.adminUp ? "up" : "down"}`,
    `  Internet address is ${iface.ip ? `${iface.ip}/${maskPrefix(iface.mask)}` : "not set"}`,
    iface.ipv6 ? `  IPv6 address is ${iface.ipv6}/${iface.ipv6Prefix}` : "",
    iface.ipv6LinkLocal ? `  IPv6 link-local address is ${iface.ipv6LinkLocal}` : "",
    `  MTU ${iface.mtu} bytes, BW 1000000 Kbit/sec`,
    `  Duplex ${iface.duplex || "auto"}, speed ${iface.speed || "auto"}`,
    iface.switchportMode ? `  Switchport mode: ${iface.switchportMode}` : "",
    iface.helperAddress ? `  DHCP relay address ${iface.helperAddress}` : "",
    iface.channelGroup ? `  Channel group ${iface.channelGroup} mode ${iface.channelMode}` : "",
  ].filter(Boolean).join("\n");
}

function showRoutes(device, ipv6 = false) {
  if (ipv6) return ["IPv6 Routing Table - default", ...device.ipv6Routes.map((r) => `S   ${r.prefix} [${r.distance || 1}] via ${r.nextHop}`)].join("\n");
  const rows = ["Codes: C - connected, S - static, O - OSPF", ""];
  for (const iface of Object.values(device.interfaces)) if (iface.adminUp && iface.status === "up" && iface.ip && iface.mask) rows.push(`C    ${ipText(networkOf(iface.ip, iface.mask))}/${maskPrefix(iface.mask)} is directly connected, ${iface.name}`);
  for (const route of [...device.routes].sort((a, b) => a.distance - b.distance)) rows.push(`S*   ${route.network}/${maskPrefix(route.mask)} [${route.distance}/${route.distance === 1 ? 0 : 1}] via ${route.nextHop}`);
  return rows.join("\n");
}

function showRunningConfig(device) {
  const out = [`hostname ${device.name}`];
  if (device.ipRouting) out.push("ip routing");
  if (device.ipv6Routing) out.push("ipv6 unicast-routing");
  if (device.cdpEnabled === false) out.push("no cdp run");
  if (device.lldpEnabled) out.push("lldp run");
  if (device.aaa.enabled) out.push("aaa new-model");
  if (device.aaa.login) out.push(`aaa authentication login ${device.aaa.login.name} group ${device.aaa.login.group}${device.aaa.login.local ? " local" : ""}`);
  for (const [name, user] of Object.entries(device.users)) out.push(`username ${name} secret ${user.secret}`);
  for (const iface of Object.values(device.interfaces)) {
    out.push(`interface ${iface.name}`);
    if (iface.ip) out.push(` ip address ${iface.ip} ${iface.mask}`);
  if (iface.ipv6) out.push(` ipv6 address ${iface.ipv6}/${iface.ipv6Prefix}`);
    if (iface.ipv6LinkLocal) out.push(` ipv6 address ${iface.ipv6LinkLocal} link-local`);
    if (!iface.adminUp) out.push(" shutdown");
    if (iface.switchportMode) out.push(` switchport mode ${iface.switchportMode}`);
    if (iface.switchportMode === "access") out.push(` switchport access vlan ${iface.accessVlan}`);
    if (iface.switchportMode === "trunk") out.push(` switchport trunk native vlan ${iface.nativeVlan}`, ` switchport trunk allowed vlan ${iface.allowedVlans.join(",")}`);
    if (iface.channelGroup) out.push(` channel-group ${iface.channelGroup} mode ${iface.channelMode}`);
    if (iface.helperAddress) out.push(` ip helper-address ${iface.helperAddress}`);
    if (iface.mtu !== 1500) out.push(` ip mtu ${iface.mtu}`);
    if (iface.hello !== 10) out.push(` ip ospf hello-interval ${iface.hello}`);
    if (iface.dead !== 40) out.push(` ip ospf dead-interval ${iface.dead}`);
    if (iface.ospfProcess) out.push(` ip ospf ${iface.ospfProcess} area ${iface.ospfArea}`);
    if (iface.ospfMtuIgnore) out.push(" ip ospf mtu-ignore");
    if (iface.natRole) out.push(` ip nat ${iface.natRole}`);
    for (const [direction, acl] of Object.entries(iface.accessGroups || {})) out.push(` ip access-group ${acl} ${direction}`);
    if (iface.portSecuritySticky || iface.portSecurityMax !== 1 || iface.portSecurityEnabled) {
      out.push(" switchport port-security", ` switchport port-security maximum ${iface.portSecurityMax}`);
      if (iface.portSecuritySticky) out.push(" switchport port-security mac-address sticky");
      out.push(` switchport port-security violation ${iface.portSecurityViolation || "shutdown"}`);
    }
    if (iface.duplex) out.push(` duplex ${iface.duplex}`);
    if (iface.speed) out.push(` speed ${iface.speed}`);
    out.push("!");
  }
  if (device.ospf.processId !== null) {
    out.push(`router ospf ${device.ospf.processId}`);
    for (const item of device.ospf.networks) out.push(` network ${item.ip} ${item.wildcard} area ${item.area}`);
    out.push("!");
  }
  if (device.ipv6Ospf.processId !== null) out.push(`ipv6 router ospf ${device.ipv6Ospf.processId}`);
  for (const vlan of device.vlans) if (vlan.id !== 1 || vlan.name !== "default") out.push(`vlan ${vlan.id}`, ` name ${vlan.name}`);
  for (const [name, pool] of Object.entries(device.dhcpPools)) out.push(`ip dhcp pool ${name}`, ...(pool.network ? [` network ${pool.network}`] : []), ...(pool.defaultRouter ? [` default-router ${pool.defaultRouter}`] : []), ...(pool.dnsServer ? [` dns-server ${pool.dnsServer}`] : []));
  for (const [num, entries] of Object.entries(device.acls)) for (const item of entries) out.push(`access-list ${num} ${item.action} ${item.ip}${item.wildcard ? ` ${item.wildcard}` : ""}`);
  for (const [name, entries] of Object.entries(device.extendedAcls)) { out.push(`ip access-list extended ${name}`); for (const item of entries) out.push(` ${item.action} ${item.protocol} ${item.source} ${item.destination}`); }
  for (const route of device.routes) out.push(`ip route ${route.network} ${route.mask} ${route.nextHop} ${route.distance}`);
  for (const route of device.ipv6Routes) out.push(`ipv6 route ${route.prefix} ${route.nextHop}`);
  for (const entry of device.nat.static) out.push(`ip nat inside source static ${entry.local} ${entry.global}`);
  for (const entry of device.nat.overload) out.push(`ip nat inside source list ${entry.acl} interface ${entry.interface} overload`);
  for (const [name, server] of Object.entries(device.aaa.tacacsServers)) out.push(`tacacs server ${name}`, ` address ipv4 ${server.address || "0.0.0.0"}`, ` key ${server.key || ""}`);
  for (const [name, server] of Object.entries(device.aaa.radiusServers)) out.push(`radius server ${name}`, ` address ipv4 ${server.address || "0.0.0.0"}`, ` key ${server.key || ""}`);
  for (const [line, config] of Object.entries(device.lines)) out.push(`line ${line}`, ...(config.transport ? [` transport input ${config.transport}`] : []), ...(config.loginLocal ? [" login local"] : []), ...(config.accessClass ? [` access-class ${config.accessClass} ${config.accessDirection || "in"}`] : []));
  if (device.vtyAccessList && !Object.values(device.lines).some((line) => line.accessClass)) out.push("line vty 0 4", ` access-class ${device.vtyAccessList} in`);
  return out.join("\n");
}

function showNeighbors(devices, name, detail = false, protocol = "cdp") {
  const device = devices[name];
  if (protocol === "lldp" && !device.lldpEnabled) return "No LLDP neighbors found";
  if (protocol === "cdp" && !device.cdpEnabled) return "No CDP neighbors found";
  const peers = Object.entries(devices).filter(([peerName]) => peerName !== name);
  if (!peers.length) return "No neighbors found";
  if (detail) return peers.map(([peerName, peer]) => `Device ID: ${peerName}\nPlatform: Cisco IOS Simulator\nLocal Interface: ${Object.keys(devices[name].interfaces)[0] || "unknown"}\nPort ID: ${Object.keys(peer.interfaces)[0] || "unknown"}\nHoldtime: 142 sec`).join("\n\n");
  return ["Device ID       Local Intrfce     Holdtme    Capability  Platform  Port ID", ...peers.map(([peerName, peer]) => `${peerName.padEnd(16)} ${Object.keys(devices[name].interfaces)[0] || "Gi0/0"}       142        R S I       IOS       ${Object.keys(peer.interfaces)[0] || "Gi0/0"}`)].join("\n");
}

function runShow(devices, name, cmd) {
  const device = ensureDeviceState(devices[name]);
  if (cmd === "show ip interface brief" || cmd === "sh ip int br") return showIpInterfaceBrief(device);
  if (cmd === "show ipv6 interface brief") return ["Interface              IPv6-Address                         Status", ...Object.values(device.interfaces).map((i) => `${i.name.padEnd(23)} ${(i.ipv6 ? `${i.ipv6}/${i.ipv6Prefix}` : "unassigned").padEnd(38)} ${i.adminUp ? i.status : "administratively down"}${i.ipv6LinkLocal ? ` (LL ${i.ipv6LinkLocal})` : ""}`)].join("\n");
  if (cmd === "show ip ospf neighbor") {
    const rows = ["Neighbor ID     Pri   State           Dead Time   Address         Interface"];
    for (const iface of Object.values(device.interfaces)) if (canFormOspf(devices, name, iface)) {
      const peer = Object.entries(devices).find(([peerName, other]) => peerName !== name && Object.values(other.interfaces).some((remote) => networkOf(iface.ip, iface.mask) === networkOf(remote.ip, remote.mask) && remote.hello === iface.hello && remote.dead === iface.dead));
      if (peer) rows.push(`${peer[0].padEnd(16)} 1     FULL/DR         00:00:34    ${iface.ip.padEnd(15)} ${iface.name}`);
    }
    return rows.join("\n");
  }
  if (cmd === "show ip ospf interface") return Object.values(device.interfaces).map((i) => `${i.name} is ${i.adminUp ? i.status : "down"}, Process ID ${i.ospfProcess || device.ospf.processId || "not enabled"}, Area ${i.ospfArea ?? 0}, Hello ${i.hello}, Dead ${i.dead}, MTU ${i.mtu}`).join("\n") || "No OSPF interfaces";
  if (cmd === "show ip route") return showRoutes(device);
  if (cmd === "show ipv6 route") return showRoutes(device, true);
  if (cmd === "show running-config" || cmd === "show run") return showRunningConfig(device);
  if (cmd === "show startup-config") return device.startupConfig || device.initialRunningConfig || " startup-config is empty";
  if (cmd === "show vlan brief" || cmd === "sh vlan br") return ["VLAN Name                             Status    Ports", ...device.vlans.map((v) => `${String(v.id).padEnd(5)} ${v.name.padEnd(32)} ${v.status}    ${Object.values(device.interfaces).filter((i) => i.accessVlan === v.id).map((i) => i.name).join(",")}`)].join("\n");
  if (cmd === "show interfaces trunk") {
    const trunks = Object.values(device.interfaces).filter((i) => i.switchportMode === "trunk");
    if (!trunks.length) return "No interfaces trunking";
    return ["Port        Mode         Encapsulation  Status        Native vlan", ...trunks.map((i) => `${i.name.padEnd(12)} on           802.1q         trunking      ${i.nativeVlan}`), "", "Port        Vlans allowed on trunk", ...trunks.map((i) => `${i.name.padEnd(12)} ${i.allowedVlans.join(",")}`)].join("\n");
  }
  if (cmd === "show interfaces status") return ["Port               Name       Status       Vlan       Duplex  Speed Type", ...Object.values(device.interfaces).map((i) => `${i.name.padEnd(19)}            ${(i.adminUp ? i.status : "disabled").padEnd(13)} ${String(i.accessVlan || "trunk").padEnd(10)} ${(i.duplex || "auto").padEnd(8)} ${i.speed || "auto"}  10/100/1000BaseTX`)].join("\n");
  if (cmd.startsWith("show interfaces ")) return showInterface(device, cmd.slice("show interfaces ".length));
  if (cmd === "show interfaces") return Object.values(device.interfaces).map((i) => showInterface(device, i.name)).join("\n\n");
  if (cmd === "show cdp neighbors" || cmd === "show lldp neighbors") {
    return showNeighbors(devices, name, false, cmd === "show lldp neighbors" ? "lldp" : "cdp");
  }
  if (cmd === "show cdp neighbors detail") return showNeighbors(devices, name, true, "cdp");
  if (cmd === "show ip nat translations") return ["Pro  Inside global       Inside local        Outside local      Outside global", ...device.nat.static.map((n) => `---  ${n.global.padEnd(19)} ${n.local}`)].join("\n");
  if (cmd === "show ip nat statistics") return `Total active translations: ${device.nat.static.length}\nOutside interfaces: ${Object.values(device.interfaces).filter((i) => i.natRole === "outside").map((i) => i.name).join(",") || "none"}\nInside interfaces: ${Object.values(device.interfaces).filter((i) => i.natRole === "inside").map((i) => i.name).join(",") || "none"}`;
  if (cmd === "show access-lists" || cmd === "show ip access-lists") return [...Object.entries(device.acls).flatMap(([n, es]) => es.map((e) => `Standard IP access list ${n}\n    ${e.action} ${e.ip} ${e.wildcard || ""}`)), ...Object.entries(device.extendedAcls).flatMap(([n, es]) => es.map((e) => `Extended IP access list ${n}\n    ${e.action} ${e.protocol} ${e.source} ${e.destination}`))].join("\n") || "No access lists configured";
  if (cmd === "show mac address-table") return ["          Mac Address Table", "Vlan    Mac Address       Type        Ports", ...Object.values(device.interfaces).map((i) => `${String(i.accessVlan).padEnd(8)} 0000.0000.${String(i.macCount).padStart(4, "0")}  STATIC      ${i.name}`)].join("\n");
  if (cmd === "show etherchannel summary") return ["Group  Port-channel  Protocol    Ports", ...Object.values(device.interfaces).filter((i) => i.channelGroup).map((i) => `${i.channelGroup}      Po${i.channelGroup}            ${i.channelMode === "active" || i.channelMode === "passive" ? "LACP" : "-"}         ${i.name}(${i.channelMode === "active" || i.channelMode === "passive" ? "P" : "I"})`)].join("\n");
  if (cmd === "show lacp neighbor") return Object.values(device.interfaces).filter((i) => i.channelGroup).map((i) => `${i.name}: LACP ${i.channelMode}, partner ${i.channelMode === "on" ? "not detected" : "present"}`).join("\n") || "No LACP neighbors";
  if (cmd === "show spanning-tree summary") return `Switch is in rapid-pvst mode\n${device.vlans.length} VLANs\n${Object.keys(device.interfaces).length} interfaces`;
  if (cmd === "show spanning-tree") return device.vlans.map((v) => `VLAN${v.id}\n  Root ID    Priority    ${v.id === 1 ? "This bridge is the root" : "32768"}\n  Bridge ID  Priority    32768 (${v.id})\n  Interface        Role Sts Cost      Prio.Nbr Type\n  ${Object.keys(device.interfaces)[0] || "Gi0/0"}          Desg FWD 4         128.1    P2p`).join("\n\n");
  if (cmd === "show port-security") return Object.values(device.interfaces).filter((i) => i.portSecurityEnabled || i.portSecuritySticky).map((i) => `${i.name}: Security ${i.portSecurityEnabled ? "Enabled" : "Disabled"}, Max ${i.portSecurityMax}, MACs ${i.macCount}, Violation ${i.violation ? "yes" : "no"}`).join("\n") || "Port security is not enabled on any interface";
  if (cmd.startsWith("show port-security interface ")) return showInterface(device, cmd.slice("show port-security interface ".length));
  if (cmd === "show aaa servers") return ["AAA Server Groups", ...Object.entries(device.aaa.tacacsServers).map(([n, s]) => `TACACS+ ${n}: ${s.address || "address not set"}; key ${s.key ? "configured" : "not configured"}`), ...Object.entries(device.aaa.radiusServers).map(([n, s]) => `RADIUS ${n}: ${s.address || "address not set"}; key ${s.key ? "configured" : "not configured"}`)].join("\n");
  if (cmd === "show ip dhcp binding") return ["IP address       Client-ID/Hardware address       Lease expiration", ...device.dhcpBindings.map((b) => `${b.ip.padEnd(17)} ${b.clientId.padEnd(34)} ${b.expires || "Infinite"}`)].join("\n");
  if (cmd.startsWith("ping ")) {
    const target = cmd.split(/\s+/).at(-1);
    const reachable = Object.values(devices).some((d) => Object.values(d.interfaces).some((i) => i.adminUp && i.status === "up" && i.ip && i.mask && networkOf(i.ip, i.mask) === networkOf(target, i.mask)));
    return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\n${reachable ? "!!!!!\nSuccess rate is 100 percent (5/5)" : ".....\nSuccess rate is 0 percent (0/5)"}`;
  }
  if (cmd.startsWith("traceroute ")) return `Type escape sequence to abort.\nTracing the route to ${cmd.split(/\s+/).at(-1)}\n  1  * * *\n  2  Destination reached`;
  return `% Unrecognized show command: ${cmd}`;
}

function canonicalizeCommand(raw) {
  let cmd = String(raw || "").trim().replace(/\s+/g, " ").toLowerCase();
  const aliases = {
    "sh ip int br": "show ip interface brief",
    "show ip int br": "show ip interface brief",
    "sh vlan br": "show vlan brief",
    "sh run": "show running-config",
    "sh ip route": "show ip route",
    "sh ipv6 route": "show ipv6 route",
    "sh ip ospf nei": "show ip ospf neighbor",
    "sh ip ospf neighbor": "show ip ospf neighbor",
    "sh interfaces trunk": "show interfaces trunk",
    "sh int trunk": "show interfaces trunk",
    "sh int status": "show interfaces status",
    "sh interfaces status": "show interfaces status",
    "sh cdp neighbors": "show cdp neighbors",
  };
  if (aliases[cmd]) return aliases[cmd];
  if (cmd === "config t" || cmd === "conf t") return "configure terminal";
  if (cmd.startsWith("sh ")) cmd = `show ${cmd.slice(3)}`;
  return cmd;
}

function applyInterfaceConfig(device, cmd, words) {
  const iface = device.interfaces[device.currentInterface]; const first = words[0];
  if (first === "ip" && words[1] === "address" && words[2] && words[3]) { iface.ip = words[2]; iface.mask = words[3]; return ""; }
  if (first === "ipv6" && words[1] === "address" && words[3] === "link-local") { iface.ipv6LinkLocal = words[2]; return ""; }
  if (first === "ipv6" && words[1] === "address" && words[2]) { const [address, prefix] = words[2].split("/"); iface.ipv6 = address; iface.ipv6Prefix = Number(prefix || words[3] || 64); return ""; }
  if (first === "ip" && words[1] === "helper-address" && words[2]) { iface.helperAddress = words[2]; return ""; }
  if (cmd === "no ip helper-address") { iface.helperAddress = null; return ""; }
  if (cmd === "no shutdown") { iface.adminUp = true; if (iface.violation && iface.portSecurityMax >= iface.macCount) { iface.violation = false; iface.status = "up"; } else if (iface.status === "administratively down" || (iface.name.toLowerCase().startsWith("vlan") && device.vlans.some((v) => v.id === Number(iface.name.slice(4))))) iface.status = "up"; return ""; }
  if (cmd === "shutdown") { iface.adminUp = false; iface.status = "administratively down"; return ""; }
  if (first === "duplex" && ["auto", "full", "half"].includes(words[1])) { iface.duplex = words[1]; return ""; }
  if (first === "speed" && ["auto", "10", "100", "1000"].includes(words[1])) { iface.speed = words[1]; return ""; }
  if (first === "ip" && words[1] === "ospf" && words[2] === "hello-interval") { iface.hello = Number(words[3]); return ""; }
  if (first === "ip" && words[1] === "ospf" && words[2] === "dead-interval") { iface.dead = Number(words[3]); return ""; }
  if (first === "ip" && words[1] === "ospf" && words[2] === "mtu-ignore") { iface.ospfMtuIgnore = true; return ""; }
  if (first === "ip" && words[1] === "ospf" && words[3] === "area") { iface.ospfProcess = Number(words[2]); iface.ospfArea = Number(words[4]); return ""; }
  if (first === "ip" && words[1] === "mtu") { iface.mtu = Number(words[2]); return ""; }
  if (first === "switchport" && words[1] === "mode" && ["access", "trunk"].includes(words[2])) { iface.switchportMode = words[2]; return ""; }
  if (first === "switchport" && words[1] === "access" && words[2] === "vlan") { iface.accessVlan = Number(words[3]); if (!device.vlans.some((v) => v.id === iface.accessVlan)) device.vlans.push({ id: iface.accessVlan, name: `VLAN${iface.accessVlan}`, status: "active" }); return ""; }
  if (first === "switchport" && words[1] === "trunk" && words[2] === "native" && words[3] === "vlan") { iface.nativeVlan = Number(words[4]); return ""; }
  if (first === "switchport" && words[1] === "trunk" && words[2] === "allowed" && words[3] === "vlan") {
    const add = words[4] === "add"; const remove = words[4] === "remove"; const source = (add || remove ? words[5] : words[4]) || "";
    const values = source.split(",").flatMap((part) => { const range = part.split("-").map(Number); return range.length === 2 ? Array.from({ length: Math.max(0, range[1] - range[0] + 1) }, (_, i) => range[0] + i) : range; }).filter(Number.isFinite);
    if (source === "all") iface.allowedVlans = device.vlans.map((v) => v.id);
    else if (add) iface.allowedVlans = [...new Set([...iface.allowedVlans, ...values])];
    else if (remove) iface.allowedVlans = iface.allowedVlans.filter((id) => !values.includes(id));
    else iface.allowedVlans = values;
    return "";
  }
  if (first === "channel-group") { iface.channelGroup = Number(words[1]); iface.channelMode = words[3] || "on"; return ""; }
  if (cmd === "switchport port-security") { iface.portSecurityEnabled = true; return ""; }
  if (first === "switchport" && words[1] === "port-security" && words[2] === "maximum") { iface.portSecurityEnabled = true; iface.portSecurityMax = Number(words[3]); if (iface.portSecurityMax >= iface.macCount) iface.violation = false; return ""; }
  if (first === "switchport" && words[1] === "port-security" && words[2] === "violation" && ["protect", "restrict", "shutdown"].includes(words[3])) { iface.portSecurityViolation = words[3]; return ""; }
  if (cmd === "switchport port-security mac-address sticky") { iface.portSecuritySticky = true; iface.portSecurityEnabled = true; return ""; }
  if (first === "ip" && words[1] === "access-group") { iface.accessGroups[words[3]] = words[2]; return ""; }
  if (first === "ip" && words[1] === "nat" && ["inside", "outside"].includes(words[2])) { iface.natRole = words[2]; return ""; }
  if (cmd === "no switchport port-security") { iface.portSecurityEnabled = false; return ""; }
  return null;
}

function applyGlobalConfig(device, cmd, words, originalCommand) {
  const first = words[0];
  if (first === "hostname" && words[1]) { device.name = words[1]; return ""; }
  if (cmd === "ip routing") { device.ipRouting = true; return ""; }
  if (cmd === "no ip routing") { device.ipRouting = false; return ""; }
  if (cmd === "ipv6 unicast-routing") { device.ipv6Routing = true; return ""; }
  if (cmd === "no ipv6 unicast-routing") { device.ipv6Routing = false; return ""; }
  if (first === "router" && words[1] === "ospf") { device.ospf.processId = Number(words[2]); device.mode = "router"; return ""; }
  if (first === "ipv6" && words[1] === "router" && words[2] === "ospf") { device.ipv6Ospf.processId = Number(words[3]); device.mode = "router-v6"; return ""; }
  if (first === "vlan" && Number.isInteger(Number(words[1]))) { const id = Number(words[1]); if (!device.vlans.some((v) => v.id === id)) device.vlans.push({ id, name: `VLAN${id}`, status: "active" }); device.currentVlan = id; device.mode = "vlan"; return ""; }
  if (first === "ip" && words[1] === "dhcp" && words[2] === "pool") { const poolName = words.slice(3).join(" "); device.dhcpPools[poolName] ||= {}; device.currentDhcpPool = poolName; device.mode = "dhcp"; return ""; }
  if (first === "ip" && words[1] === "nat" && words[2] === "inside" && words[3] === "source" && words[4] === "static") { device.nat.static.push({ local: words[5], global: words[6] }); return ""; }
  if (first === "ip" && words[1] === "nat" && words[2] === "inside" && words[3] === "source" && words[4] === "list") { device.nat.overload.push({ acl: words[5], interface: words[7], enabled: words[8] === "overload" }); return ""; }
  if (first === "no" && words[1] === "ip" && words[2] === "nat" && words[3] === "inside" && words[4] === "source") { device.nat.overload = []; return ""; }
  if (first === "ip" && words[1] === "route" && words.length >= 5) { const route = { network: words[2], mask: words[3], nextHop: words[4], distance: Number(words[5] || 1) }; device.routes = device.routes.filter((r) => !(r.network === route.network && r.mask === route.mask && r.nextHop === route.nextHop)); device.routes.push(route); return ""; }
  if (first === "no" && words[1] === "ip" && words[2] === "route") { device.routes = device.routes.filter((r) => !(r.network === words[3] && r.mask === words[4])); return ""; }
  if (first === "ipv6" && words[1] === "route" && words.length >= 4) { device.ipv6Routes.push({ prefix: words[2], nextHop: words[3], distance: Number(words[4] || 1) }); return ""; }
  if (first === "aaa" && words[1] === "new-model") { device.aaa.enabled = true; return ""; }
  if (first === "aaa" && words[1] === "authentication" && words[2] === "login") { device.aaa.login = { name: words[3], group: words[5], local: words.includes("local") }; return ""; }
  if (first === "tacacs" && words[1] === "server") { const name = words.slice(2).join(" "); device.aaa.tacacsServers[name] ||= {}; device.currentServer = name; device.mode = "server-tacacs"; return ""; }
  if (first === "radius" && words[1] === "server") { const name = words.slice(2).join(" "); device.aaa.radiusServers[name] ||= {}; device.currentServer = name; device.mode = "server-radius"; return ""; }
  if (first === "username" && words[2] === "secret") {
    const match = originalCommand.match(/^username\s+(\S+)\s+secret\s+(.+)$/i);
    device.users[match?.[1] || words[1]] = { secret: match?.[2] || words.slice(3).join(" ") };
    return "";
  }
  if (cmd === "lldp run") { device.lldpEnabled = true; return ""; }
  if (cmd === "no lldp run") { device.lldpEnabled = false; return ""; }
  if (cmd === "cdp run") { device.cdpEnabled = true; return ""; }
  if (cmd === "no cdp run") { device.cdpEnabled = false; return ""; }
  if (first === "no" && words[1] === "access-list") { delete device.acls[words[2]]; return ""; }
  if (first === "no" && words[1] === "ip" && words[2] === "access-list") { const type = words[3]; const name = words.slice(4).join(" "); if (type === "standard") delete device.acls[name]; else delete device.extendedAcls[name]; return ""; }
  if (first === "line" && words[1]) { device.currentLine = words.slice(1).join(" "); device.lines[device.currentLine] ||= {}; device.mode = "line"; return ""; }
  if (first === "ip" && words[1] === "access-list" && ["standard", "extended"].includes(words[2])) { device.currentAcl = words.slice(3).join(" "); if (words[2] === "standard") { device.acls[device.currentAcl] ||= []; device.mode = "acl-standard"; } else { device.extendedAcls[device.currentAcl] ||= []; device.mode = "acl-extended"; } return ""; }
  if (first === "access-list" && words.length >= 4) { const number = words[1]; const action = words[2]; const ip = words[3]; const wildcard = words[4] || null; device.acls[number] ||= []; device.acls[number] = device.acls[number].filter((e) => !(e.action === action && e.ip === ip)); device.acls[number].push({ action, ip, wildcard }); return ""; }
  return null;
}

function applyModeCommand(device, cmd, words, originalCommand) {
  const first = words[0];
  if (device.mode === "interface") return applyInterfaceConfig(device, cmd, words);
  if (device.mode === "router" || device.mode === "router-v6") {
    if (first === "network" && words.length >= 5 && words[3] === "area") { device.ospf.networks = device.ospf.networks.filter((n) => n.ip !== words[1]); device.ospf.networks.push({ ip: words[1], wildcard: words[2], area: words[4] }); return ""; }
    if (first === "area") { device.ospf.areaConfig = { area: words[1], type: words[2] || "normal" }; return ""; }
    if (first === "no" && words[1] === "network") { device.ospf.networks = device.ospf.networks.filter((n) => n.ip !== words[2]); return ""; }
  }
  if (device.mode === "vlan" && first === "name") { const vlan = device.vlans.find((v) => v.id === device.currentVlan); if (vlan) vlan.name = words.slice(1).join(" "); return ""; }
  if (device.mode === "dhcp") {
    const pool = device.dhcpPools[device.currentDhcpPool];
    if (first === "network") { pool.network = words[1]; pool.mask = words[2] || ""; return ""; }
    if (first === "default-router") { pool.defaultRouter = words[1]; return ""; }
    if (first === "dns-server") { pool.dnsServer = words[1]; return ""; }
  }
  if (device.mode === "server-tacacs" || device.mode === "server-radius") {
    const servers = device.mode === "server-tacacs" ? device.aaa.tacacsServers : device.aaa.radiusServers;
    const server = servers[device.currentServer];
    if (first === "address" && words[1] === "ipv4") { server.address = words[2]; return ""; }
    if (first === "key") { server.key = originalCommand.slice(originalCommand.search(/\s/) + 1).trim(); return ""; }
  }
  if (device.mode === "acl-standard") {
    if (["permit", "deny"].includes(first)) { device.acls[device.currentAcl].push({ action: first, ip: words[1], wildcard: words[2] || "0.0.0.0" }); return ""; }
  }
  if (device.mode === "acl-extended") {
    if (["permit", "deny"].includes(first)) { device.extendedAcls[device.currentAcl].push({ action: first, protocol: words[1], source: words.slice(2, 4).join(" "), destination: words.slice(4).join(" ") }); return ""; }
  }
  if (device.mode === "line") {
    const line = device.lines[device.currentLine];
    if (first === "transport" && words[1] === "input") { line.transport = words.slice(2).join(" "); return ""; }
    if (cmd === "login local") { line.loginLocal = true; return ""; }
    if (first === "access-class") { line.accessClass = words[1]; line.accessDirection = words[2] || "in"; device.vtyAccessList = words[1]; return ""; }
  }
  if (device.mode === "config") {
    if (first === "interface" && words[1]) {
      const requested = words.slice(1).join("");
      const resolved = normalizeInterfaceName(requested, device.interfaces);
      if (!resolved || !device.interfaces[resolved]) return `% Interface ${requested} not found.`;
      device.currentInterface = resolved; device.mode = "interface"; return "";
    }
    return applyGlobalConfig(device, cmd, words, originalCommand);
  }
  return null;
}

export function getPrompt(device) { return promptFor(device); }

export function executeCommand(devices, deviceName, rawCommand) {
  const device = devices?.[deviceName];
  if (!device) return { output: "% Device not found.", prompt: "Router>" };
  ensureDeviceState(device);
  const command = String(rawCommand || "").trim();
  if (!command) return { output: "", prompt: promptFor(device), mode: device.mode };
  const cmd = canonicalizeCommand(command);
  const words = wordsOf(cmd);
  let output = "";

  if (cmd === "?" || cmd.endsWith(" ?")) output = "enable  Enter privileged EXEC mode\nconfigure terminal  Enter global configuration mode\nshow  Display system information\nping  Send an echo message\nexit  Exit current mode";
  else if (cmd === "enable") device.mode = "privileged";
  else if (cmd === "disable") device.mode = "user";
  else if (cmd === "configure terminal") {
    if (device.mode === "privileged" || device.mode === "config") device.mode = "config";
    else output = "% Enter privileged EXEC mode first.";
  } else if (cmd === "end") { device.mode = "privileged"; device.currentInterface = null; }
  else if (cmd === "exit") {
    if (["interface", "router", "router-v6", "dhcp", "vlan", "acl-standard", "acl-extended", "server-tacacs", "server-radius", "line"].includes(device.mode)) device.mode = "config";
    else if (device.mode === "config") device.mode = "privileged";
    else if (device.mode === "privileged") device.mode = "user";
    device.currentInterface = null;
  } else if (cmd === "write memory" || cmd === "copy running-config startup-config" || cmd === "copy run start") {
    if (device.mode !== "privileged") output = "% This command requires privileged EXEC mode.";
    else { device.startupConfig = showRunningConfig(device); output = "Building configuration...\n[OK]"; }
  } else if (cmd.startsWith("show ") || cmd.startsWith("ping ") || cmd.startsWith("traceroute ") || cmd.startsWith("test aaa ")) {
    if (device.mode === "user") output = "% Please enter privileged EXEC mode first.";
    else if (cmd.startsWith("test aaa ")) {
      const match = command.match(/^test aaa group (tacacs\+|radius) (\S+) (\S+) legacy$/i);
      if (!match) output = "% Usage: test aaa group <tacacs+|radius> <user> <pass> legacy";
      else {
        const user = Object.entries(device.users).find(([username]) => username.toLowerCase() === match[2].toLowerCase())?.[1];
        const servers = match[1] === "radius" ? device.aaa.radiusServers : device.aaa.tacacsServers;
        const serverReady = Object.values(servers).some((server) => server.address && server.key);
        const matchingKey = Object.values(servers).some((server) => server.address && server.key && (!server.expectedKey || server.key === server.expectedKey));
        const groupMatches = device.aaa.login?.group === match[1] && device.aaa.enabled;
        output = serverReady && matchingKey && groupMatches && user?.secret === match[3] ? "User successfully authenticated" : "User authentication failed";
      }
    } else output = runShow(devices, deviceName, cmd);
  } else {
    const response = applyModeCommand(device, cmd, words, command);
    output = response === null ? `% Invalid input detected at '^' marker. Check command syntax.` : response;
  }

  if (!output && device.configLines && ["config", "interface", "router", "router-v6", "dhcp", "vlan", "acl-standard", "acl-extended", "server-tacacs", "server-radius", "line"].includes(device.mode)) device.configLines.push(command);
  return { output, prompt: promptFor(device), mode: device.mode };
}

export function gradeScenario(scenario) {
  const callbacks = new Map((scenario.validationRules || []).map((item) => [item.id, item.check]));
  let rules = scenario.validationRules || [];
  if (typeof scenario.validation_rules_json === "string") {
    try { rules = JSON.parse(scenario.validation_rules_json); } catch { rules = scenario.validationRules || []; }
  } else if (Array.isArray(scenario.validation_rules_json)) rules = scenario.validation_rules_json;
  return rules.map((item) => {
    let passed = false;
    try { passed = Boolean((item.check || callbacks.get(item.id))?.(scenario.devices)); } catch { passed = false; }
    return { id: item.id, objective: item.objective, device: item.device, passed };
  });
}
