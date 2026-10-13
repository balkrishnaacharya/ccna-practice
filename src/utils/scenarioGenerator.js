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
  const issue = pick(["native", "allowed"]); const native = rand(2, 50); const required = rand(10, 90);
  const sw1 = device("SW1", { "GigabitEthernet0/1": makeInterface("GigabitEthernet0/1", { switchportMode: "trunk", nativeVlan: native, allowedVlans: [1, native, required] }) }, { vlans: [{ id: 1, name: "default", status: "active" }, { id: native, name: "USERS", status: "active" }, { id: required, name: "VOICE", status: "active" }] });
  const sw2 = device("SW2", { "GigabitEthernet0/1": makeInterface("GigabitEthernet0/1", { switchportMode: "trunk", nativeVlan: issue === "native" ? native + 1 : native, allowedVlans: issue === "allowed" ? [1, native] : [1, native, required] }) }, { vlans: sw1.vlans.map((v) => ({ ...v })) });
  const check = (ds) => { const a = ds.SW1.interfaces["GigabitEthernet0/1"]; const b = ds.SW2.interfaces["GigabitEthernet0/1"]; return a.switchportMode === "trunk" && b.switchportMode === "trunk" && a.nativeVlan === b.nativeVlan && a.allowedVlans.includes(required) && b.allowedVlans.includes(required); };
  return { title: "802.1Q trunk and VLAN mismatch", domain: "switching", description: `Hosts on VLAN ${required} cannot cross the SW1–SW2 trunk. Inspect the native VLAN and allowed VLAN list.`, devices: { SW1: sw1, SW2: sw2 }, validationRules: [rule("trunk-vlans", `Trunk carries VLAN ${required} with matching native VLAN`, "SW1 / SW2", check)] };
}

function subnetScenario() {
  if (Math.random() < 0.5) {
    const prefix = pick([24, 25, 26, 27]); const mask = cidrMask(prefix); const base = (10 << 24) | (rand(1, 220) << 16) | (rand(0, 15) << 8);
    const net = intToIp(base & ipToInt(mask)); const hostIp = intToIp((ipToInt(net) + rand(2, (1 << (32 - prefix)) - 2)) >>> 0); const correctGw = intToIp((ipToInt(net) + 1) >>> 0);
    const wrongIp = intToIp((ipToInt(net) + (1 << (32 - prefix)) + 2) >>> 0);
    const r1 = device("R1", { "GigabitEthernet0/0": makeInterface("GigabitEthernet0/0", { ip: wrongIp, mask }) }, { routes: [{ network: "0.0.0.0", mask: "0.0.0.0", nextHop: "192.0.2.1", distance: 1 }] });
    const check = (ds) => { const i = ds.R1.interfaces["GigabitEthernet0/0"]; return networkOf(i.ip, i.mask) === net && i.ip === correctGw && ds.R1.routes.some((r) => r.network === "0.0.0.0" && r.nextHop === "192.0.2.1"); };
    return { title: "IPv4 subnet and gateway mismatch", domain: "network_infra", description: `Host ${hostIp}/${prefix} uses ${correctGw} as its gateway, but the router interface is misaddressed. Restore the LAN gateway address.`, devices: { R1: r1 }, validationRules: [rule("gateway-address", `R1 LAN interface is ${correctGw}/${prefix}`, "R1", check)] };
  }
  const segment = rand(1, 0xfffe).toString(16); const prefix = pick([64, 72, 80]);
  const correctGw = `2001:db8:${segment}::1`; const hostIp = `2001:db8:${segment}::${rand(2, 0xfffe).toString(16)}`; const wrongIp = `2001:db8:${segment}:1::1`;
  const r1 = device("R1", { "GigabitEthernet0/0": makeInterface("GigabitEthernet0/0", { ipv6: wrongIp, ipv6Prefix: prefix }) });
  const check = (ds) => { const i = ds.R1.interfaces["GigabitEthernet0/0"]; return i.ipv6 === correctGw && i.ipv6Prefix === prefix; };
  return { title: "IPv6 subnet and default gateway mismatch", domain: "network_infra", description: `Host ${hostIp}/${prefix} uses ${correctGw} as its default gateway, but the router LAN interface is addressed in the wrong prefix. Correct the interface address.`, devices: { R1: r1 }, validationRules: [rule("ipv6-gateway-address", `R1 LAN interface is ${correctGw}/${prefix}`, "R1", check)] };
}

function aclScenario() {
  const third = rand(1, 220); const expectedWildcard = "0.0.0.255"; const wrongWildcard = pick(["0.0.0.0", "0.0.1.255", "0.0.0.127"]);
  const r1 = device("R1", {}, { acls: { 10: [{ action: "permit", ip: `192.168.${third}.0`, wildcard: wrongWildcard }] } });
  const check = (ds) => (ds.R1.acls[10] || []).some((e) => e.action === "permit" && e.ip === `192.168.${third}.0` && e.wildcard === expectedWildcard);
  return { title: "Standard ACL wildcard mask", domain: "services_security", description: `Remote management clients in 192.168.${third}.0/24 cannot match ACL 10 correctly. Correct its permit wildcard.`, devices: { R1: r1 }, validationRules: [rule("acl-wildcard", "ACL 10 permits the management /24 with the correct wildcard", "R1", check)] };
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
  const sw1 = device("SW1", { "FastEthernet0/10": makeInterface("FastEthernet0/10", { status: "err-disabled", adminUp: true, portSecurityMax: 1, portSecuritySticky: true, macCount: 2, violation: true }) });
  const check = (ds) => { const i = ds.SW1.interfaces["FastEthernet0/10"]; return i.portSecurityMax >= i.macCount && i.adminUp && i.status === "up" && !i.violation; };
  return { title: "Port security violation", domain: "network_infra", description: "SW1 Fa0/10 is err-disabled after sticky MAC learning exceeded the configured limit. Permit the expected two endpoint MACs and restore the port.", devices: { SW1: sw1 }, validationRules: [rule("port-security", "Port security allows two sticky MACs and the port is operational", "SW1", check)] };
}

const factories = [ospfScenario, trunkScenario, subnetScenario, aclScenario, etherchannelScenario, dhcpScenario, staticRouteScenario, portSecurityScenario];

export function generateScenario() {
  const scenario = pick(factories)();
  for (const current of Object.values(scenario.devices)) {
    const config = [`hostname ${current.name}`];
    for (const iface of Object.values(current.interfaces)) {
      config.push(`interface ${iface.name}`);
      if (iface.ip) config.push(` ip address ${iface.ip} ${iface.mask}`);
      if (iface.ipv6) config.push(` ipv6 address ${iface.ipv6}/${iface.ipv6Prefix}`);
      if (iface.switchportMode === "trunk") config.push(" switchport mode trunk", ` switchport trunk native vlan ${iface.nativeVlan}`, ` switchport trunk allowed vlan ${iface.allowedVlans.join(",")}`);
      if (iface.channelGroup) config.push(` channel-group ${iface.channelGroup} mode ${iface.channelMode}`);
      if (iface.helperAddress) config.push(` ip helper-address ${iface.helperAddress}`);
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
    current.initialRunningConfig = config.join("\n");
  }
  const signature = JSON.stringify({ title: scenario.title, devices: Object.fromEntries(Object.entries(scenario.devices).map(([n, d]) => [n, { interfaces: d.interfaces, ospf: d.ospf, routes: d.routes, acls: d.acls }])) });
  let hash = 2166136261;
  for (const char of signature) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  scenario.id = `${scenario.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${(hash >>> 0).toString(36)}`;
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
