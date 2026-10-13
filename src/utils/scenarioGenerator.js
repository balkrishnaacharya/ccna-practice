import { showAccessLists, showRunningConfig } from "./iosEngine";

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (values) => values[rand(0, values.length - 1)];

function makeInterface(name, values = {}) {
  return {
    name,
    status: "up",
    adminUp: true,
    ip: "",
    mask: "",
    ipv6: "",
    ipv6Prefix: null,
    ipv6LinkLocal: "",
    mtu: 1500,
    hello: 10,
    dead: 40,
    switchportMode: "access",
    nativeVlan: 1,
    allowedVlans: [1],
    accessVlan: 1,
    channelGroup: null,
    channelMode: null,
    helperAddress: null,
    portSecurityMax: 1,
    portSecuritySticky: false,
    macCount: 1,
    violation: false,
    ...values,
  };
}

function device(name, interfaces = {}, extras = {}) {
  return {
    name,
    mode: "user",
    currentInterface: null,
    ospf: { processId: null, networks: [] },
    routes: [],
    acls: {},
    vlans: [{ id: 1, name: "default", status: "active" }],
    interfaces,
    configLines: [],
    ...extras,
  };
}

const cidrMask = (prefix) => {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return [24, 16, 8, 0].map((shift) => (mask >>> shift) & 255).join(".");
};
const ipToInt = (ip) => ip.split(".").reduce((n, octet) => ((n << 8) | Number(octet)) >>> 0, 0);
const intToIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
const wildcardFor = (mask) => mask.split(".").map((x) => 255 - Number(x)).join(".");
const networkOf = (ip, mask) => intToIp(ipToInt(ip) & ipToInt(mask));
const rule = (id, objective, deviceName, check) => ({ id, objective, device: deviceName, check });

function ospfScenario() {
  const failure = pick(["timers", "mtu", "network"]);
  const hello = pick([5, 10, 15, 20, 30]);
  const dead = hello * 4;
  const mtu = pick([1400, 1492, 1500, 9000]);
  const r1int = makeInterface("GigabitEthernet0/0", { ip: "10.0.12.1", mask: "255.255.255.252", hello, dead, mtu });
  const r2int = makeInterface("GigabitEthernet0/0", { ip: "10.0.12.2", mask: "255.255.255.252", hello: failure === "timers" ? hello + 1 : hello, dead: failure === "timers" ? dead + 4 : dead, mtu: failure === "mtu" ? mtu - 100 : mtu });
  const r1 = device("R1", { [r1int.name]: r1int }, { ospf: { processId: 1, networks: [{ ip: "10.0.12.0", wildcard: "0.0.0.3", area: 0 }] } });
  const r2 = device("R2", { [r2int.name]: r2int }, { ospf: { processId: 1, networks: failure === "network" ? [] : [{ ip: "10.0.12.0", wildcard: "0.0.0.3", area: 0 }] } });
  const check = (devices) => {
    const a = devices.R1.interfaces[r1int.name]; const b = devices.R2.interfaces[r2int.name];
    const configured = (d, iface) => d.ospf.networks.some((n) => (ipToInt(iface.ip) & ~ipToInt(n.wildcard)) === (ipToInt(n.ip) & ~ipToInt(n.wildcard)) && n.area === 0);
    return a.adminUp && b.adminUp && networkOf(a.ip, a.mask) === networkOf(b.ip, b.mask) && a.hello === b.hello && a.dead === b.dead && a.mtu === b.mtu && configured(devices.R1, a) && configured(devices.R2, b);
  };
  const expected = failure === "timers" ? `Align R2 hello/dead timers with R1 (${hello}/${dead}).`
    : failure === "mtu" ? `Set R2 interface MTU to ${mtu}.` : "Add the matching OSPF network statement on R2.";
  return { title: "OSPF neighbor adjacency", domain: "ip_routing", description: `R1 and R2 share 10.0.12.0/30 but do not form an OSPF adjacency. ${expected}`, devices: { R1: r1, R2: r2 }, validationRules: [rule("ospf-adjacency", "R1 and R2 form an OSPF adjacency", "R1 / R2", check)] };
}

function trunkScenario() {
  const issue = pick(["native", "allowed"]); const native = rand(2, 50); let required = rand(10, 90);
  if (required === native) required = required === 90 ? 89 : required + 1;
  const sw1 = device("SW1", { "GigabitEthernet0/1": makeInterface("GigabitEthernet0/1", { switchportMode: "trunk", nativeVlan: native, allowedVlans: [1, native, required] }) }, { vlans: [{ id: 1, name: "default", status: "active" }, { id: native, name: "USERS", status: "active" }, { id: required, name: "VOICE", status: "active" }] });
  const sw2 = device("SW2", { "GigabitEthernet0/1": makeInterface("GigabitEthernet0/1", { switchportMode: "trunk", nativeVlan: issue === "native" ? native + 1 : native, allowedVlans: issue === "allowed" ? [1, native] : [1, native, required] }) }, { vlans: sw1.vlans.map((v) => ({ ...v })) });
  const check = (ds) => { const a = ds.SW1.interfaces["GigabitEthernet0/1"]; const b = ds.SW2.interfaces["GigabitEthernet0/1"]; return a.switchportMode === "trunk" && b.switchportMode === "trunk" && a.nativeVlan === b.nativeVlan && a.allowedVlans.includes(required) && b.allowedVlans.includes(required); };
  return { title: "802.1Q trunk and VLAN mismatch", domain: "switching", description: `Hosts on VLAN ${required} cannot cross the SW1–SW2 trunk. Inspect the native VLAN and allowed VLAN list.`, devices: { SW1: sw1, SW2: sw2 }, validationRules: [rule("trunk-vlans", `Trunk carries VLAN ${required} with matching native VLAN`, "SW1 / SW2", check)] };
}

function subnetScenario() {
  const prefix = pick([24, 25, 26, 27]); const mask = cidrMask(prefix); const base = (10 << 24) | (rand(1, 220) << 16) | (rand(0, 15) << 8);
  const net = intToIp(base & ipToInt(mask)); const hostIp = intToIp((ipToInt(net) + rand(2, (1 << (32 - prefix)) - 2)) >>> 0); const correctGw = intToIp((ipToInt(net) + 1) >>> 0);
  const wrongIp = intToIp((ipToInt(net) + (1 << (32 - prefix)) + 2) >>> 0);
  const r1 = device("R1", { "GigabitEthernet0/0": makeInterface("GigabitEthernet0/0", { ip: wrongIp, mask }) }, { routes: [{ network: "0.0.0.0", mask: "0.0.0.0", nextHop: "192.0.2.1", distance: 1 }] });
  const check = (ds) => { const i = ds.R1.interfaces["GigabitEthernet0/0"]; return i.ip === correctGw && i.mask === mask && networkOf(i.ip, i.mask) === net; };
  return { title: "IPv4 subnet and gateway mismatch", domain: "network_infra", description: `Host ${hostIp}/${prefix} uses ${correctGw} as its gateway, but the router interface is misaddressed. Restore the LAN gateway address.`, devices: { R1: r1 }, validationRules: [rule("gateway-address", `R1 LAN interface is ${correctGw}/${prefix}`, "R1", check)] };
}

function ipv6Scenario() {
  const segment = rand(1, 0xfffe).toString(16); const prefix = 64;
  const correctGw = `2001:db8:${segment}::1`; const hostIp = `2001:db8:${segment}::${rand(2, 0xfffe).toString(16)}`; const wrongIp = `2001:db8:${segment}:1::1`;
  const correctLinkLocal = "fe80::1"; const wrongLinkLocal = `fe80::${rand(2, 99)}`;
  const r1 = device("R1", { "GigabitEthernet0/0": makeInterface("GigabitEthernet0/0", { ipv6: wrongIp, ipv6Prefix: prefix, ipv6LinkLocal: wrongLinkLocal }) });
  const check = (ds) => { const i = ds.R1.interfaces["GigabitEthernet0/0"]; return i.ipv6 === correctGw && i.ipv6Prefix === prefix && i.ipv6LinkLocal === correctLinkLocal; };
  return { title: "IPv6 global and link-local prefix mismatch", domain: "network_infra", description: `Host ${hostIp}/${prefix} uses ${correctGw} as its gateway. Correct the router global unicast address and restore its expected link-local address ${correctLinkLocal}.`, devices: { R1: r1 }, validationRules: [rule("ipv6-gateway-address", `R1 has ${correctGw}/${prefix} and link-local ${correctLinkLocal}`, "R1", check)] };
}

function ospfAreaScenario() {
  const third = rand(1, 220); const expectedWildcard = "0.0.0.3"; const issue = pick(["area", "wildcard"]); const badWildcard = issue === "wildcard" ? pick(["0.0.0.0", "0.0.0.255", "0.0.0.7"]) : expectedWildcard; const badArea = issue === "area" ? String(rand(1, 20)) : "0";
  const iface = makeInterface("GigabitEthernet0/0", { ip: `10.${third}.0.1`, mask: "255.255.255.252" });
  const r1 = device("R1", { [iface.name]: iface }, { ospf: { processId: 10, networks: [{ ip: `10.${third}.0.0`, wildcard: badWildcard, area: badArea }] } });
  const check = (ds) => ds.R1.ospf.networks.some((n) => n.ip === `10.${third}.0.0` && n.wildcard === expectedWildcard && String(n.area) === "0") && ds.R1.ospf.networks.filter((n) => n.ip === `10.${third}.0.0`).every((n) => n.wildcard === expectedWildcard && String(n.area) === "0");
  return { title: "OSPF area and wildcard mismatch", domain: "ip_routing", description: `R1 is not advertising 10.${third}.0.0/30 into OSPF area 0. Verify the wildcard mask and area ID.`, devices: { R1: r1 }, validationRules: [rule("ospf-area-wildcard", "OSPF advertises the /30 in area 0 with wildcard 0.0.0.3", "R1", check)] };
}

function sshAclScenario() {
  const host = `198.51.100.${rand(10, 240)}`; const r1 = device("R1", {}, { acls: { 15: [{ action: "deny", ip: host, wildcard: "0.0.0.0" }, { action: "permit", ip: "any", wildcard: null }] }, vtyAccessList: 15 });
  const check = (ds) => {
    const entries = ds.R1.acls[15] || [];
    const accessLists = showAccessLists(ds.R1);
    const runningConfig = showRunningConfig(ds.R1);
    const permit = entries.some((e) => e.action === "permit" && e.ip === host && e.wildcard === "0.0.0.0");
    const blocked = entries.some((e) => e.action === "deny" && e.ip === host);
    return permit && !blocked
      && new RegExp(`^    permit ${host.replaceAll(".", "\\.")} 0\\.0\\.0\\.0$`, "m").test(accessLists)
      && new RegExp(`^access-list 15 permit ${host.replaceAll(".", "\\.")} 0\\.0\\.0\\.0$`, "m").test(runningConfig)
      && !new RegExp(`^    deny ${host.replaceAll(".", "\\.")} 0\\.0\\.0\\.0$`, "m").test(accessLists)
      && !new RegExp(`^access-list 15 deny ${host.replaceAll(".", "\\.")} 0\\.0\\.0\\.0$`, "m").test(runningConfig);
  };
  return { title: "Standard ACL blocks SSH administration", domain: "services_security", description: `Administrators connecting from ${host} cannot reach the VTY lines. ACL 15 contains a blocking entry; repair the standard ACL.`, devices: { R1: r1 }, validationRules: [rule("ssh-standard-acl", `ACL 15 permits administrator ${host}`, "R1", check)] };
}

function webAclScenario() {
  const server = `203.0.113.${rand(5, 240)}`;
  const r1 = device("R1", {}, { extendedAcls: { "web-filter": [{ action: "deny", protocol: "tcp", source: "any", destination: `host ${server} eq 80` }, { action: "deny", protocol: "tcp", source: "any", destination: `host ${server} eq 443` }] } });
  const check = (ds) => {
    const entries = ds.R1.extendedAcls["web-filter"] || [];
    const accessLists = showAccessLists(ds.R1);
    const runningConfig = showRunningConfig(ds.R1);
    const exactPermit = (port) => entries.some((e) => e.action === "permit" && e.protocol === "tcp" && e.source === "any" && e.destination === `host ${server} eq ${port}`);
    const accessListsHas = (port) => new RegExp(`^    permit tcp any host ${server.replaceAll(".", "\\.")} eq ${port}$`, "m").test(accessLists);
    const configHas = (port) => new RegExp(`^ permit tcp any host ${server.replaceAll(".", "\\.")} eq ${port}$`, "m").test(runningConfig);
    return ["80", "443"].every((port) => exactPermit(port) && accessListsHas(port) && configHas(port));
  };
  return { title: "Extended ACL blocks HTTP and HTTPS", domain: "services_security", description: `Users cannot access web server ${server} on TCP ports 80 and 443. Inspect and repair the named extended ACL.`, devices: { R1: r1 }, validationRules: [rule("web-extended-acl", `Permit TCP/80 and TCP/443 to ${server}`, "R1", check)] };
}

function natScenario() {
  const local = `10.20.${rand(1, 200)}.10`; const global = `198.51.100.${rand(10, 240)}`;
  const r1 = device("R1", {
    "GigabitEthernet0/0": makeInterface("GigabitEthernet0/0", { ip: "10.20.0.1", mask: "255.255.0.0", natRole: "outside" }),
    "GigabitEthernet0/1": makeInterface("GigabitEthernet0/1", { ip: "198.51.100.1", mask: "255.255.255.0", natRole: "inside" }),
  }, { acls: { 20: [{ action: "permit", ip: "10.20.0.0", wildcard: "0.0.255.255" }] }, nat: { static: [{ local, global }], overload: [{ acl: "20", interface: "GigabitEthernet0/0", enabled: true }] } });
  const check = (ds) => {
    const d = ds.R1; const ins = Object.values(d.interfaces).find((i) => i.name === "GigabitEthernet0/0"); const outs = Object.values(d.interfaces).find((i) => i.name === "GigabitEthernet0/1");
    return ins.natRole === "inside" && outs.natRole === "outside" && d.nat.static.some((n) => n.local === local && n.global === global) && d.nat.overload.some((n) => n.acl === "20" && n.interface.toLowerCase().includes("0/1") && n.enabled);
  };
  return { title: "Static NAT and PAT interface assignment", domain: "services_security", description: `Inside hosts need static mapping ${local} → ${global} and PAT through the public interface. The inside/outside roles and overload interface are reversed.`, devices: { R1: r1 }, validationRules: [rule("nat-roles", "NAT inside/outside roles and PAT interface are correct", "R1", check)] };
}

function sviScenario() {
  const subnet = rand(10, 220); const correctIp = `192.168.${subnet}.1`;
  const svi = makeInterface("Vlan10", { ip: `192.168.${subnet + 1}.1`, mask: "255.255.255.0", status: "down", adminUp: false, switchportMode: null, accessVlan: 1 });
  const sw1 = device("SW1", { Vlan10: svi }, { vlans: [{ id: 1, name: "default", status: "active" }, { id: 20, name: "USERS", status: "active" }] });
  const check = (ds) => { const d = ds.SW1; const i = d.interfaces.Vlan10; return d.vlans.some((v) => v.id === 10) && i.ip === correctIp && i.mask === "255.255.255.0" && i.adminUp && i.status === "up"; };
  return { title: "SVI address and VLAN assignment", domain: "switching", description: `Management SVI VLAN 10 should use ${correctIp}/24, but VLAN 10 is missing and the SVI has an incorrect address and is shut down.`, devices: { SW1: sw1 }, validationRules: [rule("svi-vlan-ip", `Create VLAN 10 and bring up SVI ${correctIp}/24`, "SW1", check)] };
}

function discoveryScenario() {
  const issue = pick(["cdp", "lldp"]); const disabledDevice = pick(["SW1", "SW2"]);
  const sw1 = device("SW1", {}, { cdpEnabled: issue === "cdp" ? disabledDevice !== "SW1" : true, lldpEnabled: issue === "lldp" ? disabledDevice !== "SW1" : true });
  const sw2 = device("SW2", {}, { cdpEnabled: issue === "cdp" ? disabledDevice !== "SW2" : true, lldpEnabled: issue === "lldp" ? disabledDevice !== "SW2" : true });
  const check = (ds) => [ds.SW1, ds.SW2].every((d) => issue === "cdp" ? d.cdpEnabled : d.lldpEnabled);
  const protocol = issue.toUpperCase();
  return { title: "CDP and LLDP neighbor discovery", domain: "ai_ops", description: `The operations team cannot discover the adjacent switch. ${protocol} is disabled on ${disabledDevice}; enable it and validate neighbor discovery.`, devices: { SW1: sw1, SW2: sw2 }, validationRules: [rule("neighbor-discovery", `${protocol} is enabled on both switches`, "SW1 / SW2", check)] };
}

function aaaScenario() {
  const expectedKey = `CCNA-${rand(100, 999)}-${rand(10, 99)}`; const badKey = `BAD-${rand(100, 999)}`;
  const r1 = device("R1", {}, { aaa: { enabled: true, login: { name: "default", group: "radius", local: true }, tacacsServers: { tac1: { address: `192.0.2.${rand(10, 240)}`, key: badKey, expectedKey } }, radiusServers: {} } });
  const check = (ds) => ds.R1.aaa.enabled && ds.R1.aaa.login?.group === "tacacs+" && ds.R1.aaa.tacacsServers.tac1?.key === expectedKey;
  return { title: "TACACS+ key and AAA login mismatch", domain: "services_security", description: `VTY authentication is configured for the wrong AAA method, and TACACS+ shared-key validation fails. Use the scenario's authorized key ${expectedKey} and correct the login method.`, devices: { R1: r1 }, validationRules: [rule("aaa-tacacs", "AAA uses TACACS+ with the matching server shared key", "R1", check)] };
}

function etherchannelScenario() {
  const mode1 = pick(["active", "passive"]); const mode2 = mode1 === "active" ? "on" : "passive";
  const sw1 = device("SW1", { "GigabitEthernet0/1": makeInterface("GigabitEthernet0/1", { channelGroup: 1, channelMode: mode1 }), "GigabitEthernet0/2": makeInterface("GigabitEthernet0/2", { channelGroup: 1, channelMode: mode1 }) });
  const sw2 = device("SW2", { "GigabitEthernet0/1": makeInterface("GigabitEthernet0/1", { channelGroup: 1, channelMode: mode2 }), "GigabitEthernet0/2": makeInterface("GigabitEthernet0/2", { channelGroup: 1, channelMode: mode2 }) });
  const check = (ds) => { const a = ds.SW1.interfaces["GigabitEthernet0/1"]; const b = ds.SW2.interfaces["GigabitEthernet0/1"]; return a.channelGroup === 1 && b.channelGroup === 1 && a.channelMode === "active" && ["active", "passive"].includes(b.channelMode); };
  return { title: "LACP EtherChannel mismatch", domain: "switching", description: "The SW1–SW2 port-channel is down. Inspect LACP active/passive negotiation on both ends.", devices: { SW1: sw1, SW2: sw2 }, validationRules: [rule("lacp-channel", "Both ends negotiate LACP (active on at least one side)", "SW1 / SW2", check)] };
}

function dhcpScenario() {
  const correct = `10.${rand(1, 200)}.${rand(0, 250)}.${pick([2, 10, 254])}`; const wrong = `172.16.${rand(1, 200)}.${rand(1, 254)}`;
  const r1 = device("R1", { "GigabitEthernet0/1": makeInterface("GigabitEthernet0/1", { ip: "192.168.40.1", mask: "255.255.255.0", helperAddress: wrong }) });
  const check = (ds) => ds.R1.interfaces["GigabitEthernet0/1"].helperAddress === correct;
  return { title: "DHCP relay helper address", domain: "services_security", description: `Clients on 192.168.40.0/24 receive no leases. The DHCP server is ${correct}; inspect the relay on R1.`, devices: { R1: r1 }, validationRules: [rule("dhcp-helper", `R1 relays DHCP to ${correct}`, "R1", check)] };
}

function staticRouteScenario() {
  const nextHop = `10.0.${rand(1, 254)}.2`; const wrong = `10.0.${rand(1, 254)}.3`;
  const r1 = device("R1", {}, { routes: [{ network: "203.0.113.0", mask: "255.255.255.0", nextHop: wrong, distance: pick([1, 200]) }] });
  const check = (ds) => {
    const routes = ds.R1.routes.filter((r) => r.network === "203.0.113.0" && r.mask === "255.255.255.0");
    return routes.some((r) => r.nextHop === nextHop && r.distance === 1) && !routes.some((r) => r.nextHop !== nextHop && r.distance <= 1);
  };
  return { title: "Static and floating route failure", domain: "ip_routing", description: `The preferred path to 203.0.113.0/24 is unavailable because the static route has the wrong next hop or administrative distance. Correct it to ${nextHop} with AD 1.`, devices: { R1: r1 }, validationRules: [rule("static-route", `Install 203.0.113.0/24 via ${nextHop} with AD 1`, "R1", check)] };
}

function portSecurityScenario() {
  const max = rand(1, 2); const macCount = max + rand(1, 2);
  const sw1 = device("SW1", { "FastEthernet0/10": makeInterface("FastEthernet0/10", { status: "err-disabled", adminUp: true, portSecurityEnabled: true, portSecurityMax: max, portSecuritySticky: true, macCount, violation: true }) });
  const check = (ds) => { const i = ds.SW1.interfaces["FastEthernet0/10"]; return i.portSecurityEnabled && i.portSecuritySticky && i.portSecurityMax >= i.macCount && i.adminUp && i.status === "up" && !i.violation; };
  return { title: "Port security violation", domain: "network_infra", description: `SW1 Fa0/10 is err-disabled after sticky MAC learning exceeded the limit of ${max}. Permit the ${macCount} expected endpoint MACs and restore the port.`, devices: { SW1: sw1 }, validationRules: [rule("port-security", `Port security allows ${macCount} sticky MACs and the port is operational`, "SW1", check)] };
}

const factories = [ospfScenario, ospfAreaScenario, trunkScenario, subnetScenario, ipv6Scenario, sshAclScenario, webAclScenario, etherchannelScenario, dhcpScenario, staticRouteScenario, portSecurityScenario, natScenario, sviScenario, discoveryScenario, aaaScenario];

export function generateScenario() {
  const scenario = pick(factories)();
  for (const current of Object.values(scenario.devices)) {
    const config = [`hostname ${current.name}`];
    for (const iface of Object.values(current.interfaces)) {
      config.push(`interface ${iface.name}`);
      if (iface.ip) config.push(` ip address ${iface.ip} ${iface.mask}`);
      if (iface.ipv6) config.push(` ipv6 address ${iface.ipv6}/${iface.ipv6Prefix}`);
      if (iface.ipv6LinkLocal) config.push(` ipv6 address ${iface.ipv6LinkLocal} link-local`);
      if (!iface.adminUp) config.push(" shutdown");
      if (iface.switchportMode === "access" && iface.accessVlan !== 1) config.push(` switchport access vlan ${iface.accessVlan}`);
      if (iface.switchportMode === "trunk") config.push(" switchport mode trunk", ` switchport trunk native vlan ${iface.nativeVlan}`, ` switchport trunk allowed vlan ${iface.allowedVlans.join(",")}`);
      if (iface.channelGroup) config.push(` channel-group ${iface.channelGroup} mode ${iface.channelMode}`);
      if (iface.helperAddress) config.push(` ip helper-address ${iface.helperAddress}`);
      if (iface.natRole) config.push(` ip nat ${iface.natRole}`);
      if (iface.portSecurityEnabled) config.push(" switchport port-security");
      if (iface.accessGroups) for (const [direction, acl] of Object.entries(iface.accessGroups)) config.push(` ip access-group ${acl} ${direction}`);
      if (iface.mtu !== 1500) config.push(` ip mtu ${iface.mtu}`);
      if (iface.hello !== 10) config.push(` ip ospf hello-interval ${iface.hello}`);
      if (iface.dead !== 40) config.push(` ip ospf dead-interval ${iface.dead}`);
      if (iface.portSecuritySticky || iface.portSecurityMax !== 1) {
        config.push(` switchport port-security maximum ${iface.portSecurityMax}`);
        if (iface.portSecuritySticky) config.push(" switchport port-security mac-address sticky");
      }
      if (iface.status === "err-disabled") config.push("! port-security violation: err-disabled");
      config.push("!");
    }
    if (current.ospf.processId !== null) {
      config.push(`router ospf ${current.ospf.processId}`);
      for (const item of current.ospf.networks) config.push(` network ${item.ip} ${item.wildcard} area ${item.area}`);
    }
    for (const [number, entries] of Object.entries(current.acls)) for (const entry of entries) config.push(`access-list ${number} ${entry.action} ${entry.ip}${entry.wildcard ? ` ${entry.wildcard}` : ""}`);
    for (const route of current.routes) config.push(`ip route ${route.network} ${route.mask} ${route.nextHop} ${route.distance}`);
    if (current.lldpEnabled) config.push("lldp run");
    if (current.cdpEnabled === false) config.push("no cdp run");
    if (current.vtyAccessList) config.push(`line vty 0 4`, ` access-class ${current.vtyAccessList} in`);
    for (const [poolName, pool] of Object.entries(current.dhcpPools || {})) config.push(`ip dhcp pool ${poolName}`, ...(pool.network ? [` network ${pool.network} ${pool.mask || ""}`] : []), ...(pool.defaultRouter ? [` default-router ${pool.defaultRouter}`] : []), ...(pool.dnsServer ? [` dns-server ${pool.dnsServer}`] : []));
    for (const [name, entries] of Object.entries(current.extendedAcls || {})) { config.push(`ip access-list extended ${name}`); for (const entry of entries) config.push(` ${entry.action} ${entry.protocol} ${entry.source} ${entry.destination}`); }
    for (const entry of current.nat?.static || []) config.push(`ip nat inside source static ${entry.local} ${entry.global}`);
    for (const entry of current.nat?.overload || []) config.push(`ip nat inside source list ${entry.acl} interface ${entry.interface} overload`);
    if (current.aaa?.enabled) config.push("aaa new-model");
    if (current.aaa?.login) config.push(`aaa authentication login ${current.aaa.login.name} group ${current.aaa.login.group}${current.aaa.login.local ? " local" : ""}`);
    for (const [serverName, server] of Object.entries(current.aaa?.tacacsServers || {})) config.push(`tacacs server ${serverName}`, ` address ipv4 ${server.address}`, ` key ${server.key}`);
    for (const [serverName, server] of Object.entries(current.aaa?.radiusServers || {})) config.push(`radius server ${serverName}`, ` address ipv4 ${server.address}`, ` key ${server.key}`);
    for (const vlan of current.vlans) if (vlan.id !== 1 || vlan.name !== "default") config.push(`vlan ${vlan.id}`, ` name ${vlan.name}`);
    current.initialRunningConfig = config.join("\n");
  }
  const signature = JSON.stringify({ title: scenario.title, devices: scenario.devices });
  let hash = 2166136261;
  for (const char of signature) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  scenario.id = `${scenario.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${(hash >>> 0).toString(36)}`;
  scenario.validation_rules_json = JSON.stringify(scenario.validationRules.map(({ id, objective, device }) => ({ id, objective, device })));
  return scenario;
}

export function generateScenarioSet(count = 5, recentIds = []) {
  const recent = new Set(recentIds);
  const candidates = [];
  const seen = new Set();
  for (let i = 0; i < 160 && candidates.length < 50; i++) {
    const scenario = generateScenario();
    if (!seen.has(scenario.id)) { seen.add(scenario.id); candidates.push(scenario); }
  }
  const fresh = candidates.filter((scenario) => !recent.has(scenario.id));
  const pool = fresh.length >= count ? fresh : candidates;
  const result = [];
  const domains = new Set();
  for (const scenario of pool) {
    if (!domains.has(scenario.domain)) { result.push(scenario); domains.add(scenario.domain); }
    if (result.length === count) break;
  }
  for (const scenario of pool) {
    if (result.length === count) break;
    if (!result.some((item) => item.id === scenario.id)) result.push(scenario);
  }
  return result;
}

export const scenarioFactories = factories;
