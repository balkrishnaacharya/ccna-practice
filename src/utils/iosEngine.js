const ipNumber = (ip) => {
  const parts = ip.split(".").map(Number);
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
const lines = (value) => (value || "").split(/\s+/).filter(Boolean);

function resolveInterface(device, requested) {
  const key = requested.toLowerCase().replace(/^(gi|gig)\s*/, "gigabitethernet").replace(/^(fa|fast)\s*/, "fastethernet").replace(/^(eth)\s*/, "ethernet");
  return Object.keys(device.interfaces).find((name) => name.toLowerCase() === key || name.toLowerCase().startsWith(key)) || null;
}

function promptFor(device) {
  if (device.mode === "privileged") return `${device.name}#`;
  if (device.mode === "config") return `${device.name}(config)#`;
  if (device.mode === "interface") return `${device.name}(config-if)#`;
  if (device.mode === "router") return `${device.name}(config-router)#`;
  return `${device.name}>`;
}

function ospfNetworksInterface(device, iface) {
  const address = ipNumber(iface.ip);
  return address !== null && device.ospf.networks.some((entry) => {
    const net = ipNumber(entry.ip); const wildcard = ipNumber(entry.wildcard);
    return net !== null && wildcard !== null && ((address & ~wildcard) >>> 0) === ((net & ~wildcard) >>> 0);
  });
}

function canFormOspf(devices, name, iface) {
  return Object.entries(devices).some(([otherName, other]) => otherName !== name && Object.values(other.interfaces).some((peer) =>
    peer.adminUp && peer.status === "up" && networkOf(iface.ip, iface.mask) !== null && networkOf(iface.ip, iface.mask) === networkOf(peer.ip, peer.mask) &&
    iface.hello === peer.hello && iface.dead === peer.dead && iface.mtu === peer.mtu &&
    other.ospf.processId !== null && ospfNetworksInterface(other, peer) && name &&
    devices[name].ospf.processId !== null && ospfNetworksInterface(devices[name], iface)
  ));
}

function showIpInterfaceBrief(device) {
  const rows = ["Interface              IP-Address      OK? Method Status                Protocol"];
  for (const iface of Object.values(device.interfaces)) rows.push(`${iface.name.padEnd(23)} ${(iface.ip || "unassigned").padEnd(15)} YES manual ${iface.adminUp ? iface.status : "administratively down"}          ${iface.status === "up" && iface.adminUp ? "up" : "down"}`);
  return rows.join("\n");
}

function showRunningConfig(device) {
  const out = [`hostname ${device.name}`];
  for (const iface of Object.values(device.interfaces)) {
    out.push(`interface ${iface.name}`);
    if (iface.ip) out.push(` ip address ${iface.ip} ${iface.mask}`);
    if (iface.ipv6) out.push(` ipv6 address ${iface.ipv6}/${iface.ipv6Prefix}`);
    if (!iface.adminUp) out.push(" shutdown");
    if (iface.switchportMode === "trunk") {
      out.push(" switchport mode trunk", ` switchport trunk native vlan ${iface.nativeVlan}`, ` switchport trunk allowed vlan ${iface.allowedVlans.join(",")}`);
    }
    if (iface.channelGroup) out.push(` channel-group ${iface.channelGroup} mode ${iface.channelMode}`);
    if (iface.helperAddress) out.push(` ip helper-address ${iface.helperAddress}`);
    if (iface.mtu !== 1500) out.push(` ip mtu ${iface.mtu}`);
    if (iface.hello !== 10) out.push(` ip ospf hello-interval ${iface.hello}`);
    if (iface.dead !== 40) out.push(` ip ospf dead-interval ${iface.dead}`);
    if (iface.portSecuritySticky || iface.portSecurityMax !== 1) out.push(` switchport port-security maximum ${iface.portSecurityMax}`, ...(iface.portSecuritySticky ? [" switchport port-security mac-address sticky"] : []));
    out.push("!");
  }
  if (device.ospf.processId !== null) {
    out.push(`router ospf ${device.ospf.processId}`);
    for (const item of device.ospf.networks) out.push(` network ${item.ip} ${item.wildcard} area ${item.area}`);
    out.push("!");
  }
  for (const [num, entries] of Object.entries(device.acls)) for (const item of entries) out.push(`access-list ${num} ${item.action} ${item.ip}${item.wildcard ? ` ${item.wildcard}` : ""}`);
  for (const route of device.routes) out.push(`ip route ${route.network} ${route.mask} ${route.nextHop} ${route.distance}`);
  for (const iface of Object.values(device.interfaces)) if (iface.switchportMode === "interface" && iface.helperAddress) out.push(` ip helper-address ${iface.helperAddress}`);
  return out.join("\n");
}

function showRoutes(device) {
  const rows = ["Codes: C - connected, S - static, O - OSPF", ""];
  for (const iface of Object.values(device.interfaces)) if (iface.adminUp && iface.status === "up" && iface.ip && iface.mask) rows.push(`C    ${networkOf(iface.ip, iface.mask) === null ? iface.ip : ipText(networkOf(iface.ip, iface.mask))}/${maskPrefix(iface.mask)} is directly connected, ${iface.name}`);
  for (const route of [...device.routes].sort((a, b) => a.distance - b.distance)) rows.push(`S*   ${route.network}/${maskPrefix(route.mask)} [${route.distance}/${route.distance === 1 ? 0 : 1}] via ${route.nextHop}`);
  return rows.join("\n");
}

function runShow(devices, name, input) {
  const device = devices[name]; const cmd = input.toLowerCase().replace(/\s+/g, " ").trim();
  if (cmd === "show ip interface brief") return showIpInterfaceBrief(device);
  if (cmd === "show ipv6 interface brief") return ["Interface              IPv6-Address                         Status", ...Object.values(device.interfaces).map((i) => `${i.name.padEnd(23)} ${(i.ipv6 ? `${i.ipv6}/${i.ipv6Prefix}` : "unassigned").padEnd(38)} ${i.adminUp ? i.status : "administratively down"}`)].join("\n");
  if (cmd === "show ip ospf neighbor") {
    const rows = ["Neighbor ID     Pri   State           Dead Time   Address         Interface"];
    if (Object.values(device.interfaces).some((iface) => canFormOspf(devices, name, iface))) {
      const peers = Object.entries(devices).filter(([peerName]) => peerName !== name);
      for (const [peerName, peer] of peers) for (const local of Object.values(device.interfaces)) {
        const remote = Object.values(peer.interfaces).find((iface) => canFormOspf({ [name]: device, [peerName]: peer }, name, local) && networkOf(local.ip, local.mask) === networkOf(iface.ip, iface.mask));
        if (remote) rows.push(`${remote.ip.padEnd(16)} 1     FULL/DR         00:00:34    ${remote.ip.padEnd(15)} ${local.name}`);
      }
    }
    return rows.join("\n");
  }
  if (cmd === "show ip route") return showRoutes(device);
  if (cmd === "show running-config" || cmd === "show run") return showRunningConfig(device);
  if (cmd === "show vlan brief") return ["VLAN Name                             Status    Ports", ...device.vlans.map((v) => `${String(v.id).padEnd(5)} ${v.name.padEnd(32)} ${v.status}    `)].join("\n");
  if (cmd === "show interfaces trunk") {
    const trunks = Object.values(device.interfaces).filter((i) => i.switchportMode === "trunk");
    if (!trunks.length) return "No interfaces trunking";
    return ["Port        Mode         Encapsulation  Status        Native vlan", ...trunks.map((i) => `${i.name.padEnd(12)} on           802.1q         trunking      ${i.nativeVlan}`), "", "Port        Vlans allowed on trunk", ...trunks.map((i) => `${i.name.padEnd(12)} ${i.allowedVlans.join(",")}`)].join("\n");
  }
  if (cmd.startsWith("ping ")) {
    const target = cmd.split(/\s+/).at(-1);
    const reachable = Object.values(devices).some((d) => Object.values(d.interfaces).some((i) => i.adminUp && i.status === "up" && i.ip && i.mask && networkOf(i.ip, i.mask) === networkOf(target, i.mask)));
    return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\n${reachable ? "!!!!!\nSuccess rate is 100 percent (5/5)" : ".....\nSuccess rate is 0 percent (0/5)"}`;
  }
  return `% Unrecognized show command: ${input}`;
}

function applyConfig(device, cmd) {
  const words = lines(cmd); const first = words[0]?.toLowerCase();
  const iface = device.currentInterface ? device.interfaces[device.currentInterface] : null;
  if (first === "ip" && words[1] === "address" && iface && words.length >= 4) { iface.ip = words[2]; iface.mask = words[3]; return ""; }
  if (first === "ipv6" && words[1] === "address" && iface && words[2]) {
    const [address, prefix] = words[2].split("/");
    iface.ipv6 = address;
    iface.ipv6Prefix = Number(prefix || words[3] || 64);
    return "";
  }
  if (first === "ip" && words[1] === "mtu" && iface) { iface.mtu = Number(words[2]); return ""; }
  if (first === "ip" && words[1] === "ospf" && iface && ["hello-interval", "dead-interval"].includes(words[2])) { iface[words[2] === "hello-interval" ? "hello" : "dead"] = Number(words[3]); return ""; }
  if (first === "ip" && words[1] === "helper-address" && iface) { iface.helperAddress = words[2]; return ""; }
  if (cmd === "no ip helper-address" && iface) { iface.helperAddress = null; return ""; }
  if (cmd === "no shutdown" && iface) { iface.adminUp = true; if (iface.violation && iface.portSecurityMax >= iface.macCount) { iface.violation = false; iface.status = "up"; } else if (iface.status === "administratively down") iface.status = "up"; return ""; }
  if (cmd === "shutdown" && iface) { iface.adminUp = false; iface.status = "administratively down"; return ""; }
  if (cmd === "switchport mode trunk" && iface) { iface.switchportMode = "trunk"; return ""; }
  if (first === "switchport" && words[1] === "trunk" && words[2] === "native" && words[3] === "vlan" && iface) { iface.nativeVlan = Number(words[4]); if (!device.vlans.some((v) => v.id === iface.nativeVlan)) device.vlans.push({ id: iface.nativeVlan, name: `VLAN${iface.nativeVlan}`, status: "active" }); return ""; }
  if (first === "switchport" && words[1] === "trunk" && words[2] === "allowed" && words[3] === "vlan" && iface) {
    const add = words[4] === "add"; const remove = words[4] === "remove"; const source = (add || remove ? words[5] : words[4]) || "";
    const values = source.split(",").flatMap((part) => part.split("-").map(Number)).filter(Number.isFinite);
    if (source === "all") iface.allowedVlans = device.vlans.map((v) => v.id);
    else if (add) iface.allowedVlans = [...new Set([...iface.allowedVlans, ...values])];
    else if (remove) iface.allowedVlans = iface.allowedVlans.filter((id) => !values.includes(id));
    else iface.allowedVlans = values;
    return "";
  }
  if (first === "channel-group" && iface) { iface.channelGroup = Number(words[1]); iface.channelMode = words[3] || "on"; return ""; }
  if (first === "switchport" && words[1] === "port-security" && words[2] === "maximum" && iface) { iface.portSecurityMax = Number(words[3]); if (iface.portSecurityMax >= iface.macCount) iface.violation = false; return ""; }
  if (cmd === "switchport port-security mac-address sticky" && iface) { iface.portSecuritySticky = true; return ""; }
  if (first === "router" && words[1] === "ospf") { device.ospf.processId = Number(words[2]); device.mode = "router"; return ""; }
  if (first === "network" && device.mode === "router" && words.length >= 5 && words[3] === "area") {
    device.ospf.networks = device.ospf.networks.filter((item) => item.ip !== words[1]); device.ospf.networks.push({ ip: words[1], wildcard: words[2], area: Number(words[4]) }); return "";
  }
  if (first === "access-list" && words.length >= 4) {
    const num = words[1]; const action = words[2].toLowerCase(); const ip = words[3]; const wildcard = words[4] || null;
    device.acls[num] = (device.acls[num] || []).filter((entry) => !(entry.action === action && entry.ip === ip));
    device.acls[num].push({ action, ip, wildcard }); return "";
  }
  if (first === "no" && words[1] === "access-list") { delete device.acls[words[2]]; return ""; }
  if (first === "ip" && words[1] === "route" && words.length >= 5) {
    const route = { network: words[2], mask: words[3], nextHop: words[4], distance: Number(words[5] || 1) };
    device.routes = device.routes.filter((r) => !(r.network === route.network && r.mask === route.mask && r.nextHop === route.nextHop)); device.routes.push(route); return "";
  }
  if (first === "no" && words[1] === "ip" && words[2] === "route") { device.routes = device.routes.filter((r) => !(r.network === words[3] && r.mask === words[4])); return ""; }
  if (first === "no" && words[1] === "network" && device.mode === "router") { device.ospf.networks = device.ospf.networks.filter((n) => n.ip !== words[2]); return ""; }
  return `% Invalid input detected at '^' marker. Check command syntax.`;
}

export function getPrompt(device) { return promptFor(device); }

export function executeCommand(devices, deviceName, rawCommand) {
  const device = devices[deviceName]; const command = rawCommand.trim();
  if (!device || !command) return { output: "", prompt: device ? promptFor(device) : "Router>" };
  const cmd = command.toLowerCase().replace(/\s+/g, " ");
  let output = "";
  if (cmd === "?" || cmd.endsWith(" ?")) output = "enable  Enter privileged EXEC mode\nconfigure terminal  Enter global configuration mode\nshow  Display system information\nping  Send an echo message\nexit  Exit current mode";
  else if (cmd === "enable") device.mode = "privileged";
  else if (cmd === "disable") device.mode = "user";
  else if (cmd === "configure terminal" || cmd === "conf t") {
    if (device.mode === "privileged" || device.mode === "config") device.mode = "config";
    else output = "% Enter privileged EXEC mode first.";
  } else if (cmd === "end") { device.mode = "privileged"; device.currentInterface = null; }
  else if (cmd === "exit") {
    if (device.mode === "interface" || device.mode === "router") { device.mode = "config"; device.currentInterface = null; }
    else if (device.mode === "config") device.mode = "privileged";
    else if (device.mode === "privileged") device.mode = "user";
  } else if (cmd.startsWith("show ") || cmd.startsWith("ping ")) {
    if (device.mode === "user") output = "% Please enter privileged EXEC mode first.";
    else output = runShow(devices, deviceName, cmd);
  } else if (cmd.startsWith("interface ") && device.mode === "config") {
    const requested = command.slice(command.indexOf(" ") + 1); const resolved = resolveInterface(device, requested);
    if (resolved) { device.currentInterface = resolved; device.mode = "interface"; }
    else output = `% Interface ${requested} not found.`;
  } else if (cmd.startsWith("router ospf ") && device.mode === "config") {
    output = applyConfig(device, cmd);
  } else if (device.mode === "config" || device.mode === "interface" || device.mode === "router") {
    output = applyConfig(device, cmd);
  } else output = `% Invalid command in ${promptFor(device)} mode.`;

  if (!output && (device.mode === "config" || device.mode === "interface" || device.mode === "router")) device.configLines.push(command);
  return { output, prompt: promptFor(device), mode: device.mode };
}

export function gradeScenario(scenario) {
  return scenario.validationRules.map((item) => {
    let passed = false;
    try { passed = Boolean(item.check(scenario.devices)); } catch { passed = false; }
    return { id: item.id, objective: item.objective, device: item.device, passed };
  });
}
