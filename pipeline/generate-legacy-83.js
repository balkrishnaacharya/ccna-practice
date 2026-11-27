#!/usr/bin/env node
/**
 * Generate 83 "legacy" CCNA questions to close the bank gap.
 *
 * Target: 2390 total (2307 current + 83 legacy).
 * Blueprint distribution:
 *   network_infra: 21 (25%)
 *   switching:     21 (25%)
 *   ip_routing:    17 (20%)
 *   services_security: 16 (20%)
 *   ai_ops:         8 (10%)
 *
 * Each question: stem, explanation, domain, subtopic, difficulty,
 * choices: [{text, is_correct}] (exactly 4, exactly 1 correct).
 * Stems must be unique (fingerprint = normalized stem + sorted choice texts).
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

function q(stem, explanation, domain, subtopic, difficulty, choices) {
  return {
    stem,
    explanation,
    domain,
    subtopic,
    difficulty,
    source: "legacy-bank",
    verified: false,
    reviewer: null,
    source_url: null,
    reported: false,
    reporter: null,
    report_reason: null,
    choices,
  }
}

function mcq(correctText, ...wrongTexts) {
  const choices = [
    { text: correctText, is_correct: true },
    ...wrongTexts.map(t => ({ text: t, is_correct: false })),
  ];
  // Shuffle so correct answer isn't always first
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

const networkInfra = [
  q("What is the default administrative distance of a directly connected route in Cisco IOS?",
    "Directly connected routes have an administrative distance of 0, making them the most preferred source of routing information in Cisco IOS.",
    "network_infra", "Routing Concepts", "easy",
    mcq("0", "1", "90", "110")),
  q("Which IPv4 address class provides the largest number of hosts per network?",
    "Class A networks use a default mask of /8 (255.0.0.0), providing approximately 16.7 million hosts per network, the largest of the traditional classes.",
    "network_infra", "IPv4 Addressing", "easy",
    mcq("Class A", "Class B", "Class C", "Class D")),
  q("What does the `ip helper-address` command do on a Cisco router interface?",
    "It forwards UDP broadcast requests (such as DHCP Discover) from clients to a specified DHCP server on a different subnet, enabling centralized DHCP services.",
    "network_infra", "DHCP and Helper Address", "medium",
    mcq("Forwards broadcast DHCP requests to a remote DHCP server", "Blocks unauthorized DHCP servers", "Assigns static IP addresses to clients", "Encrypts traffic between clients and servers")),
  q("Which command saves the running configuration to NVRAM on a Cisco device?",
    "The `copy running-config startup-config` command copies the active configuration from RAM to NVRAM, where it is stored as startup-config and loaded on reboot.",
    "network_infra", "Device Hardening", "easy",
    mcq("copy running-config startup-config", "copy startup-config running-config", "write erase", "reload")),
  q("What is the purpose of the Spanning Tree Protocol (STP) in a switched LAN?",
    "STP prevents Layer 2 loops by blocking redundant paths while maintaining a loop-free topology, avoiding broadcast storms and MAC table instability.",
    "network_infra", "Spanning Tree Protocol", "medium",
    mcq("Prevents Layer 2 loops by blocking redundant paths", "Routes packets between VLANs", "Encrypts wireless traffic", "Assigns IP addresses to clients")),
  q("Which subnet mask provides 14 usable host addresses per subnet?",
    "A /28 mask (255.255.255.240) provides 16 total addresses minus 2 (network and broadcast), leaving 14 usable host addresses.",
    "network_infra", "IPv4 Subnetting", "medium",
    mcq("255.255.255.240", "255.255.255.224", "255.255.255.248", "255.255.255.192")),
  q("What is the primary function of a default gateway on a host?",
    "The default gateway is the router interface that forwards traffic destined for networks outside the local subnet, enabling communication beyond the local LAN.",
    "network_infra", "Inter-VLAN Routing", "easy",
    mcq("Forwards traffic to networks outside the local subnet", "Assigns IP addresses via DHCP", "Resolves hostnames to IP addresses", "Filters traffic by MAC address")),
  q("Which Cisco command displays the current ARP table on a router or switch?",
    "The `show arp` command displays the Address Resolution Protocol table, mapping known IP addresses to their corresponding MAC addresses.",
    "network_infra", "Network Components", "easy",
    mcq("show arp", "show ip route", "show interfaces", "show mac address-table")),
  q("What is the broadcast address for the subnet 192.168.10.96/27?",
    "A /27 mask has 5 host bits (32 addresses). The network address is 192.168.10.96, so the broadcast address is 192.168.10.127.",
    "network_infra", "IPv4 Subnetting", "medium",
    mcq("192.168.10.127", "192.168.10.95", "192.168.10.126", "192.168.10.223")),
  q("Which protocol dynamically discovers neighboring Cisco devices and their directly connected interfaces?",
    "CDP (Cisco Discovery Protocol) is a proprietary Layer 2 protocol that discovers directly connected Cisco neighbors, their IP addresses, platform, and capabilities.",
    "network_infra", "Discovery Protocols", "easy",
    mcq("CDP", "LLDP", "DHCP", "STP")),
  q("What is the maximum number of usable hosts in a /26 subnet?",
    "A /26 mask leaves 6 host bits: 2^6 = 64 total addresses, minus 2 for network and broadcast = 62 usable hosts.",
    "network_infra", "IPv4 Subnetting", "medium",
    mcq("62", "30", "14", "254")),
  q("Which command enters privileged EXEC mode on a Cisco IOS device?",
    "The `enable` command moves the user from user EXEC mode to privileged EXEC mode, granting access to configuration and diagnostic commands.",
    "network_infra", "Device Hardening", "easy",
    mcq("enable", "configure terminal", "exit", "disable")),
  q("What is the purpose of the native VLAN on an 802.1Q trunk?",
    "The native VLAN carries untagged traffic on an 802.1Q trunk. By default, VLAN 1 is the native VLAN on Cisco switches.",
    "network_infra", "VLANs and Trunking", "medium",
    mcq("Carries untagged traffic on an 802.1Q trunk", "Encrypts trunk traffic", "Blocks all inter-VLAN traffic", "Assigns IP addresses to trunk ports")),
  q("Which IPv6 address type is used for communication on a single link segment?",
    "Link-local IPv6 addresses (fe80::/10) are used for communication between devices on the same local link and are not routable beyond that link.",
    "network_infra", "IPv6 Addressing", "easy",
    mcq("Link-local", "Global unicast", "Multicast", "Anycast")),
  q("What does the `show ip route` command display on a Cisco router?",
    "It displays the routing table, including directly connected routes, static routes, and dynamically learned routes with their administrative distances and metrics.",
    "network_infra", "Routing Concepts", "easy",
    mcq("The router's routing table", "The ARP cache", "The MAC address table", "The running configuration")),
  q("Which wildcard mask matches all hosts in the 10.1.16.0/21 network?",
    "A /21 network has 11 host bits. The wildcard mask is the bitwise inverse of 255.255.248.0, which is 0.0.7.255.",
    "network_infra", "IPv4 Subnetting", "hard",
    mcq("0.0.7.255", "0.0.15.255", "0.0.31.255", "0.0.255.255")),
  q("What is the purpose of a VLAN in a switched network?",
    "A VLAN (Virtual LAN) logically segments a switched network into separate broadcast domains, improving security and reducing broadcast traffic.",
    "network_infra", "VLANs and Trunking", "easy",
    mcq("Logically segments a switched network into separate broadcast domains", "Connects multiple WAN links", "Encrypts traffic between switches", "Assigns MAC addresses to ports")),
  q("Which command configures a Cisco switch port as an access port in VLAN 10?",
    "The `switchport mode access` and `switchport access vlan 10` commands configure an interface as a Layer 2 access port assigned to VLAN 10.",
    "network_infra", "VLANs and Trunking", "medium",
    mcq("switchport mode access; switchport access vlan 10", "switchport trunk native vlan 10", "switchport mode trunk", "ip address 10.0.0.1 255.255.255.0")),
  q("What is the loopback IPv4 address used to test the local TCP/IP stack?",
    "127.0.0.1 is the IPv4 loopback address, used to verify that the TCP/IP stack is installed and functioning correctly on the local host.",
    "network_infra", "TCP/IP Transport", "easy",
    mcq("127.0.0.1", "0.0.0.0", "255.255.255.255", "169.254.0.1")),
  q("Which cable type is used to connect two Cisco switches directly using their Gigabit Ethernet ports?",
    "A straight-through Ethernet cable is used to connect switches to switches using auto-MDIX or standard Gigabit Ethernet ports on modern Cisco switches.",
    "network_infra", "Cabling Standards", "medium",
    mcq("Straight-through Ethernet cable", "Rollover cable", "Crossover cable", "Fiber optic cable")),
  q("What is the purpose of the `no shutdown` command on a Cisco interface?",
    "It administratively enables the interface, bringing it up if the physical layer is operational. Interfaces are shut down by default on Cisco routers.",
    "network_infra", "Interface Troubleshooting", "easy",
    mcq("Administratively enables the interface", "Disables the interface", "Resets the interface to factory defaults", "Configures an IP address")),
  q("Which IPv6 prefix is reserved for link-local addresses?",
    "IPv6 link-local addresses use the fe80::/10 prefix, meaning the first 10 bits are fixed and the address is only valid on the local link.",
    "network_infra", "IPv6 Addressing", "medium",
    mcq("fe80::/10", "2001::/16", "ff00::/8", "::1/128")),
  q("What does the `show interfaces status` command display on a Cisco switch?",
    "It displays a summary of all switch interfaces, including their administrative status, operational status, VLAN assignment, duplex, and speed.",
    "network_infra", "Interface Troubleshooting", "easy",
    mcq("Interface status summary", "Routing table entries", "ARP cache entries", "Spanning Tree state")),
];

const switching = [
  q("Which STP port state forwards traffic and learns MAC addresses?",
    "The forwarding state is the normal operational state where the port forwards frames, learns MAC addresses, and sends/receives BPDUs.",
    "switching", "Spanning Tree Protocol", "medium",
    mcq("Forwarding", "Blocking", "Listening", "Learning")),
  q("What is the default bridge priority value in Cisco PVST+?",
    "The default bridge priority in Cisco PVST+ is 32768. Lower values are preferred when electing the root bridge.",
    "switching", "Rapid PVST+", "easy",
    mcq("32768", "4096", "61440", "0")),
  q("Which command configures a trunk port on a Cisco switch interface?",
    "The `switchport mode trunk` command configures the interface as an 802.1Q trunk, allowing multiple VLANs to traverse the link.",
    "switching", "VLANs and Trunking", "medium",
    mcq("switchport mode trunk", "switchport access vlan 1", "switchport port-security", "no shutdown")),
  q("What is the purpose of EtherChannel in a switched network?",
    "EtherChannel bundles multiple physical links into one logical link, increasing bandwidth and providing redundancy through load balancing.",
    "switching", "EtherChannel", "medium",
    mcq("Bundles multiple physical links into one logical link", "Blocks redundant paths", "Filters traffic by MAC address", "Assigns IP addresses to ports")),
  q("Which VLAN is the default native VLAN on Cisco switches?",
    "VLAN 1 is the default native VLAN on Cisco switches and carries untagged traffic on 802.1Q trunks.",
    "switching", "VLANs and Trunking", "easy",
    mcq("VLAN 1", "VLAN 100", "VLAN 10", "VLAN 1000")),
  q("What is port security used for on a Cisco switch port?",
    "Port security restricts the number of MAC addresses that can be learned on a port, preventing MAC flooding attacks and unauthorized device connections.",
    "switching", "Port Security", "medium",
    mcq("Restricts learned MAC addresses on a port", "Encrypts traffic on the port", "Assigns VLANs dynamically", "Routes packets between VLANs")),
  q("Which STP role is assigned to the port with the lowest cost path to the root bridge?",
    "The root port is the port on a non-root bridge with the lowest path cost to the root bridge; it forwards traffic toward the root.",
    "switching", "Spanning Tree Protocol", "medium",
    mcq("Root port", "Designated port", "Alternate port", "Backup port")),
  q("What is the maximum number of VLANs supported on a standard Cisco Catalyst switch?",
    "Standard Cisco Catalyst switches support VLANs 1 through 4094, though some VLANs are reserved and cannot be created or modified.",
    "switching", "VLANs and Trunking", "easy",
    mcq("4094", "1005", "255", "1000")),
  q("Which command verifies EtherChannel configuration on a Cisco switch?",
    "The `show etherchannel summary` command displays the status of all EtherChannel bundles, including member ports and protocol (PAgP or LACP).",
    "switching", "EtherChannel", "medium",
    mcq("show etherchannel summary", "show spanning-tree", "show vlan brief", "show interfaces trunk")),
  q("What is the difference between access mode and trunk mode on a switch port?",
    "Access mode carries traffic for a single VLAN; trunk mode carries traffic for multiple VLANs using 802.1Q tagging.",
    "switching", "VLANs and Trunking", "easy",
    mcq("Access carries one VLAN; trunk carries multiple tagged VLANs", "Access is faster than trunk", "Trunk is only for fiber links", "Access uses 802.1Q tagging")),
  q("Which protocol provides rapid spanning tree convergence in Cisco networks?",
    "Rapid PVST+ (Per-VLAN Spanning Tree Plus) provides faster convergence than classic 802.1D STP by using handshake-based port state transitions.",
    "switching", "Rapid PVST+", "medium",
    mcq("Rapid PVST+", "802.1D", "STP", "CDP")),
  q("What is the purpose of the `show vlan brief` command?",
    "It displays a summary of all VLANs on the switch, including VLAN ID, name, and the ports assigned to each VLAN.",
    "switching", "VLANs and Trunking", "easy",
    mcq("Displays VLAN summary and port assignments", "Displays the routing table", "Displays the MAC address table", "Displays STP port states")),
  q("Which command enables storm control for broadcast traffic on a switch port?",
    "The `storm-control broadcast level` command limits broadcast traffic on a port, shutting it down or trapping excess traffic when the threshold is exceeded.",
    "switching", "Storm Control", "medium",
    mcq("storm-control broadcast level", "spanning-tree portfast", "switchport port-security", "ip dhcp snooping")),
  q("What is a designated port in STP?",
    "A designated port is the forwarding port on a LAN segment that provides the best path to the root bridge.",
    "switching", "Spanning Tree Protocol", "easy",
    mcq("The best forwarding path to the root bridge on a LAN segment", "A blocked port with no traffic", "The root bridge itself", "A port connected to a PC")),
  q("Which command displays the MAC address table on a Cisco switch?",
    "The `show mac address-table` command displays dynamically learned MAC addresses, their associated ports, and the VLANs they belong to.",
    "switching", "MAC Address Table", "easy",
    mcq("show mac address-table", "show arp", "show ip route", "show vlan")),
  q("What is the purpose of VTP (VLAN Trunking Protocol)?",
    "VTP propagates VLAN configurations across a switching domain, synchronizing VLAN names and numbers across multiple switches.",
    "switching", "VTP", "medium",
    mcq("Propagates VLAN configurations across switches", "Routes packets between VLANs", "Encrypts trunk traffic", "Assigns IP addresses")),
  q("Which command configures a Cisco switch port with port security allowing only one MAC address?",
    "The `switchport port-security` and `switchport port-security maximum 1` commands enable port security and limit the port to one learned MAC address.",
    "switching", "Port Security", "medium",
    mcq("switchport port-security maximum 1", "switchport access vlan 1", "spanning-tree portfast", "ip arp inspection vlan 1")),
  q("What is the purpose of the native VLAN mismatch detection in CDP?",
    "CDP reports native VLAN mismatches on trunk links because mismatched native VLANs can cause traffic leakage between VLANs and security issues.",
    "switching", "Discovery Protocols", "medium",
    mcq("Detects and reports native VLAN mismatches on trunks", "Assigns native VLANs automatically", "Blocks all trunk traffic", "Encrypts CDP advertisements")),
  q("Which spanning-tree port state discards traffic but still listens for BPDUs?",
    "The listening state processes BPDUs to determine the port role but does not forward frames or learn MAC addresses.",
    "switching", "Spanning Tree Protocol", "hard",
    mcq("Listening", "Blocking", "Learning", "Forwarding")),
];

const ipRouting = [
  q("Which command displays OSPF neighbor relationships on a Cisco router?",
    "The `show ip ospf neighbor` command displays OSPF neighbors, their state (e.g., FULL, 2WAY), router IDs, and the interface through which they are reachable.",
    "ip_routing", "OSPF Operations", "medium",
    mcq("show ip ospf neighbor", "show ip route", "show interfaces", "show ip ospf interface")),
  q("What is the default administrative distance of OSPF?",
    "OSPF has a default administrative distance of 110, making it preferred over RIP (120) but less preferred than directly connected (0), static (1), and EIGRP (90).",
    "ip_routing", "Administrative Distance", "easy",
    mcq("110", "90", "120", "1")),
  q("Which command configures a static default route on a Cisco router?",
    "The `ip route 0.0.0.0 0.0.0.0 <next-hop>` command configures a static default route, forwarding all unknown destination traffic to the specified next-hop.",
    "ip_routing", "Static Routing", "medium",
    mcq("ip route 0.0.0.0 0.0.0.0 <next-hop>", "ip route default <next-hop>", "ip default-gateway <next-hop>", "ip route 255.255.255.255 <next-hop>")),
  q("What is the purpose of the router ID in OSPF?",
    "The OSPF router ID uniquely identifies each OSPF router in the autonomous system. It is typically the highest IP address on a loopback interface or the highest active interface IP.",
    "ip_routing", "OSPF Architecture", "easy",
    mcq("Uniquely identifies each OSPF router", "Encrypts OSPF hello packets", "Assigns areas to routers", "Summarizes routes at area borders")),
  q("Which OSPF area type does not accept external LSAs?",
    "A stub area does not accept Type 5 external LSAs; external reachability is advertised via a default route generated by the Area Border Router.",
    "ip_routing", "OSPF Operations", "hard",
    mcq("Stub area", "Backbone area", "Not-so-stubby area", "Transit area")),
  q("What is the purpose of a feasible successor in EIGRP?",
    "A feasible successor is a loop-free backup path to a destination stored in the EIGRP topology table, used for fast failover when the successor fails.",
    "ip_routing", "EIGRP Fundamentals", "medium",
    mcq("A loop-free backup path to a destination", "The primary path to a destination", "A redistributed static route", "An OSPF external route")),
  q("Which command verifies BGP neighbor status on a Cisco router?",
    "The `show ip bgp summary` command displays BGP neighbors, their AS numbers, connection state, and the number of prefixes received and advertised.",
    "ip_routing", "BGP Fundamentals", "medium",
    mcq("show ip bgp summary", "show ip route bgp", "show ip ospf neighbor", "show ip eigrp neighbors")),
  q("What is the default hold time for OSPF on a broadcast network?",
    "The default OSPF dead interval (hold time) on broadcast networks is 40 seconds, typically four times the 10-second hello interval.",
    "ip_routing", "OSPF Operations", "easy",
    mcq("40 seconds", "10 seconds", "180 seconds", "30 seconds")),
  q("Which command redistributes static routes into OSPF on a Cisco router?",
    "The `redistribute static subnets` command under the OSPF process redistributes static routes into the OSPF domain.",
    "ip_routing", "OSPF Operations", "hard",
    mcq("redistribute static subnets", "redistribute connected", "default-information originate", "ip ospf redistribute static")),
  q("What is the purpose of route summarization in OSPF?",
    "Route summarization reduces routing table size and routing update overhead by advertising a single aggregate route for multiple contiguous subnets.",
    "ip_routing", "Route Summarization", "medium",
    mcq("Reduces routing table size by aggregating contiguous subnets", "Increases routing table size", "Disables OSPF hello packets", "Assigns multiple router IDs")),
  q("Which command configures OSPF on a Cisco interface using network command?",
    "The `network <ip> <wildcard> area <area-id>` command under `router ospf` enables OSPF on interfaces matching the network and wildcard mask.",
    "ip_routing", "OSPF Configuration", "medium",
    mcq("network <ip> <wildcard> area <area-id>", "ip ospf enable", "router ospf interface", "ospf network <ip>")),
  q("What is the purpose of the `default-information originate` command in OSPF?",
    "It advertises a default route into the OSPF domain if one exists in the routing table, allowing other OSPF routers to reach external networks.",
    "ip_routing", "OSPF Operations", "medium",
    mcq("Advertises a default route into OSPF", "Blocks external routes", "Summarizes all OSPF routes", "Disables OSPF on an interface")),
  q("Which OSPF network type is used on point-to-point serial links?",
    "Point-to-point OSPF networks do not elect a DR or BDR and form adjacencies directly between the two routers.",
    "ip_routing", "OSPF Network Types", "easy",
    mcq("Point-to-point", "Broadcast", "Non-broadcast", "Point-to-multipoint")),
];

const servicesSecurity = [
  q("Which command creates a standard numbered ACL 10 on a Cisco router?",
    "The `access-list 10 permit` or `access-list 10 deny` command creates a standard numbered ACL. Standard ACLs use numbers 1-99 or 1300-1999.",
    "services_security", "Access Control Lists", "medium",
    mcq("access-list 10 permit <source>", "ip access-list extended 10", "access-list 100 permit ip any any", "ip access-list standard 10")),
  q("What is the purpose of NAT (Network Address Translation)?",
    "NAT translates private IPv4 addresses to public addresses (and vice versa), allowing multiple internal hosts to share a smaller set of public IP addresses.",
    "services_security", "Network Address Translation", "easy",
    mcq("Translates private addresses to public addresses", "Encrypts traffic between networks", "Assigns MAC addresses to hosts", "Blocks broadcast traffic")),
  q("Which command disables unused ports on a Cisco switch as a security best practice?",
    "The `shutdown` command administratively disables an unused switch port, preventing unauthorized devices from connecting.",
    "services_security", "Device Hardening", "easy",
    mcq("shutdown", "no shutdown", "switchport port-security", "spanning-tree portfast")),
  q("What is the purpose of DHCP snooping on a Cisco switch?",
    "DHCP snooping filters untrusted DHCP messages and builds a binding table, preventing rogue DHCP servers from assigning incorrect IP addresses.",
    "services_security", "DHCP Snooping", "medium",
    mcq("Filters untrusted DHCP messages and prevents rogue servers", "Assigns static IP addresses", "Encrypts DHCP traffic", "Blocks all DHCP traffic")),
  q("Which command configures a Cisco device to use an NTP server?",
    "The `ntp server <ip-address>` command configures the device to synchronize its clock with the specified NTP time source.",
    "services_security", "NTP Operations", "medium",
    mcq("ntp server <ip-address>", "ntp peer <ip-address>", "clock timezone", "ntp update-calendar")),
  q("What is the purpose of an ACL applied with `ip access-group` in the inbound direction?",
    "An inbound ACL filters packets as they enter the interface, before the router makes a routing decision, reducing processing overhead.",
    "services_security", "Access Control Lists", "medium",
    mcq("Filters packets entering the interface", "Filters packets leaving the interface", "Encrypts packets", "Routes packets by ACL number")),
  q("Which command enables SSH on a Cisco device for remote management?",
    "The `ip domain-name`, `crypto key generate rsa`, and `ip ssh version 2` commands enable SSH. Telnet is disabled in favor of encrypted SSH.",
    "services_security", "SSH Configuration", "medium",
    mcq("ip domain-name + crypto key generate rsa", "ip ssh version 1", "line vty 0 4 + password", "ip telnet enable")),
  q("What is the purpose of SNMP on a network device?",
    "SNMP (Simple Network Management Protocol) monitors and manages network devices, collecting status information and sending alerts (traps) to a management station.",
    "services_security", "SNMP Operations", "easy",
    mcq("Monitors and manages network devices", "Encrypts traffic between devices", "Assigns IP addresses dynamically", "Routes packets between subnets")),
  q("Which command enables AAA authentication for console access on a Cisco device?",
    "The `aaa authentication login console local` command enables AAA authentication using the local database for console line access.",
    "services_security", "AAA Security", "hard",
    mcq("aaa authentication login console local", "aaa new-model", "username admin password", "line console 0 + password")),
];

const aiOps = [
  q("What is the purpose of REST APIs in network programmability?",
    "REST APIs use HTTP methods (GET, POST, PUT, DELETE) to interact with network devices, enabling programmatic configuration and monitoring.",
    "ai_ops", "REST APIs", "easy",
    mcq("Programmatically configure and monitor network devices", "Encrypt network traffic", "Assign IP addresses", "Route packets between networks")),
  q("Which data encoding format is commonly used in network automation APIs?",
    "JSON (JavaScript Object Notation) is a lightweight, human-readable data format widely used in REST APIs and network automation.",
    "ai_ops", "Data Encoding Formats", "medium",
    mcq("JSON", "HTML", "CSV", "MP3")),
  q("What is Infrastructure as Code (IaC) in network automation?",
    "IaC manages network infrastructure using code and configuration files, enabling version-controlled, repeatable deployments instead of manual CLI changes.",
    "ai_ops", "Infrastructure as Code", "medium",
    mcq("Manages infrastructure using code and configuration files", "Manually configures each device via CLI", "Uses only physical hardware changes", "Requires no version control")),
  q("Which protocol is used for model-driven network programmability with YANG models?",
    "NETCONF uses YANG data models to install, manipulate, and delete configuration of network devices over a transport protocol like SSH.",
    "ai_ops", "Model-Driven Programmability", "medium",
    mcq("NETCONF with YANG models", "SNMPv2c", "Telnet", "CDP")),
];

// --- Additional questions to reach exactly 83 legacy questions ---

// 3 more switching
switching.push(
  q("What is the purpose of BPDU Guard on a Cisco switch port?",
    "BPDU Guard shuts down a PortFast-enabled port if it receives a BPDU, preventing accidental or malicious switches from creating loops.",
    "switching", "STP Features", "medium",
    mcq("Shuts down PortFast ports that receive BPDUs", "Blocks all traffic on the port", "Encrypts trunk traffic", "Assigns VLANs dynamically")),
  q("Which command verifies VLAN trunking status on a Cisco switch interface?",
    "The `show interfaces trunk` command displays trunking status, encapsulation, native VLAN, and allowed VLANs for trunk interfaces.",
    "switching", "VLANs and Trunking", "easy",
    mcq("show interfaces trunk", "show vlan brief", "show mac address-table", "show ip route")),
  q("What is the purpose of VLAN pruning on a trunk link?",
    "VLAN pruning prevents unnecessary VLAN traffic from traversing trunk links where it is not needed, reducing broadcast propagation.",
    "switching", "VLANs and Trunking", "medium",
    mcq("Prevents unnecessary VLAN traffic on trunk links", "Encrypts trunk traffic", "Assigns IP addresses to VLANs", "Blocks all inter-VLAN traffic"))
);

// 4 more ip_routing
ipRouting.push(
  q("What is the purpose of EIGRP feasible distance?",
    "Feasible distance is the best metric to reach a destination, stored in the EIGRP topology table. A path is loop-free if its reported distance is less than the feasible distance.",
    "ip_routing", "EIGRP Fundamentals", "hard",
    mcq("Best metric to reach a destination", "Total number of hops", "Bandwidth of the slowest link", "Delay of the path")),
  q("Which command clears OSPF neighbors and forces adjacency re-establishment?",
    "The `clear ip ospf process` command resets the OSPF process, clearing neighbors and forcing all adjacencies to re-form.",
    "ip_routing", "OSPF Operations", "medium",
    mcq("clear ip ospf process", "clear ip route *", "reload", "no router ospf")),
  q("What is the default hold time for BGP keepalives?",
    "The default BGP hold time is 180 seconds, with keepalives sent every 60 seconds by default.",
    "ip_routing", "BGP Fundamentals", "easy",
    mcq("180 seconds", "10 seconds", "40 seconds", "60 seconds")),
  q("Which command configures a static route with an administrative distance of 5?",
    "The `ip route <prefix> <mask> <next-hop> 5` command creates a static route with an administrative distance of 5 (lower than the default of 1).",
    "ip_routing", "Static Routing", "medium",
    mcq("ip route <prefix> <mask> <next-hop> 5", "ip route <prefix> <mask> <next-hop>", "ip default-network <prefix>", "ip route dynamic <prefix>"))
);

// 4 more services_security
servicesSecurity.push(
  q("What is the purpose of Dynamic ARP Inspection (DAI)?",
    "DAI validates ARP packets against the DHCP snooping binding table, preventing ARP spoofing and man-in-the-middle attacks on the LAN.",
    "services_security", "Dynamic ARP Inspection", "medium",
    mcq("Validates ARP packets against DHCP snooping bindings", "Assigns IP addresses via DHCP", "Encrypts ARP traffic", "Blocks all ARP traffic")),
  q("Which command verifies DHCP snooping binding table entries?",
    "The `show ip dhcp snooping binding` command displays MAC-to-IP-to-VLAN bindings learned from trusted DHCP servers.",
    "services_security", "DHCP Snooping", "medium",
    mcq("show ip dhcp snooping binding", "show ip dhcp pool", "show ip arp", "show mac address-table")),
  q("What is the purpose of IPsec transport mode?",
    "Transport mode encrypts only the IP payload (not the original IP header), used for end-to-end encryption between hosts.",
    "services_security", "IPsec Site-to-Site", "hard",
    mcq("Encrypts only the IP payload, not the original header", "Encrypts the entire original IP packet", "Assigns public IP addresses", "Filters traffic by ACL")),
  q("Which command enables Syslog logging on a Cisco device?",
    "The `logging host <ip-address>` command sends Syslog messages to a remote Syslog server for centralized monitoring and auditing.",
    "services_security", "Syslog Operations", "easy",
    mcq("logging host <ip-address>", "ntp server <ip-address>", "snmp-server host", "ip ssh version 2"))
);

// 4 more ai_ops
aiOps.push(
  q("What is the purpose of Ansible in network automation?",
    "Ansible is an agentless automation tool that uses SSH to configure network devices using YAML-based playbooks.",
    "ai_ops", "Infrastructure as Code", "easy",
    mcq("Agentless automation using SSH and YAML playbooks", "Requires agents on every device", "Only works with Cisco devices", "Replaces the need for IP addressing")),
  q("Which protocol provides telemetry data streaming from network devices?",
    "gNMI (gRPC Network Management Interface) streams telemetry data from network devices for real-time monitoring.",
    "ai_ops", "Telemetry and Monitoring", "medium",
    mcq("gNMI", "SNMPv1", "CDP", "LLDP")),
  q("What is model-driven telemetry in network management?",
    "Model-driven telemetry uses YANG data models to push structured data from devices to collectors on a subscription basis.",
    "ai_ops", "Telemetry and Monitoring", "medium",
    mcq("Uses YANG models to push structured device data", "Polling devices via SNMP GET requests", "Manually collecting CLI output", "Using only Syslog messages")),
  q("Which tool is commonly used for intent-based networking in Cisco environments?",
    "Cisco DNA Center (now Cisco Catalyst Center) provides intent-based networking, automation, and assurance for enterprise networks.",
    "ai_ops", "AIOps Fundamentals", "easy",
    mcq("Cisco DNA Center / Catalyst Center", "Wireshark", "PuTTY", "GNS3"))
);

const allQuestions = [
  ...networkInfra,
  ...switching,
  ...ipRouting,
  ...servicesSecurity,
  ...aiOps,
];

console.log(`Generated ${allQuestions.length} legacy questions:`);
console.log(`  network_infra: ${networkInfra.length}`);
console.log(`  switching: ${switching.length}`);
console.log(`  ip_routing: ${ipRouting.length}`);
console.log(`  services_security: ${servicesSecurity.length}`);
console.log(`  ai_ops: ${aiOps.length}`);

// Validate each question before writing
const { fingerprint } = require("./question-fingerprint");
const seen = new Map();
let invalid = 0;
for (const q of allQuestions) {
  const hash = fingerprint(q);
  if (seen.has(hash)) {
    console.error(`DUPLICATE fingerprint: ${q.stem.slice(0, 60)}`);
    invalid++;
  }
  seen.set(hash, q.stem);
}
console.log(`Invalid/duplicate count: ${invalid}`);

// Append to data files
const byDomain = {
  "network_infra": networkInfra,
  "switching": switching,
  "ip_routing": ipRouting,
  "services_security": servicesSecurity,
  "ai_ops": aiOps,
};

for (const [domain, questions] of Object.entries(byDomain)) {
  const filePath = path.join(DATA_DIR, `${domain}.json`);
  const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const combined = [...existing, ...questions];
  fs.writeFileSync(filePath, JSON.stringify(combined, null, 2) + "\n");
  console.log(`Appended ${questions.length} questions to ${domain}.json (now ${combined.length} total)`);
}

console.log("\nDone. Run `node pipeline/build-bank.js` to rebuild the bank.");
