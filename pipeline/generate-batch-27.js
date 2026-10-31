#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const questions = [
  // ==========================================
  // NETWORK_INFRA (14 questions)
  // ==========================================
  {
    stem: "Which set of IPv4 address ranges is reserved by RFC 1918 for private enterprise networks?",
    explanation: "RFC 1918 specifies three private IPv4 blocks: 10.0.0.0/8 (10.0.0.0 to 10.255.255.255), 172.16.0.0/12 (172.16.0.0 to 172.31.255.255), and 192.168.0.0/16 (192.168.0.0 to 192.168.255.255).",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16", is_correct: true },
      { text: "10.0.0.0/8, 172.16.0.0/16, and 192.168.1.0/24", is_correct: false },
      { text: "127.0.0.0/8, 169.254.0.0/16, and 224.0.0.0/4", is_correct: false },
      { text: "100.64.0.0/10, 192.0.2.0/24, and 198.51.100.0/24", is_correct: false }
    ]
  },
  {
    stem: "For the subnet 192.168.1.64/26, what is the valid range of assignable host IPv4 addresses?",
    explanation: "A /26 mask has a block size of 64 (256 - 192 = 64). For subnet 192.168.1.64/26, the network ID is 192.168.1.64, the broadcast is 192.168.1.127, and usable host addresses range from 192.168.1.65 to 192.168.1.126.",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "192.168.1.65 through 192.168.1.126", is_correct: true },
      { text: "192.168.1.64 through 192.168.1.127", is_correct: false },
      { text: "192.168.1.65 through 192.168.1.128", is_correct: false },
      { text: "192.168.1.33 through 192.168.1.62", is_correct: false }
    ]
  },
  {
    stem: "Which layer of the OSI 7-layer reference model is responsible for data encryption, character code translation, and data compression?",
    explanation: "Layer 6 (Presentation Layer) handles syntax and semantics of information exchanged between applications, including character formatting (ASCII/EBCDIC), data compression, and cryptographic encryption/decryption (such as TLS/SSL presentation).",
    domain: "network_infra",
    subtopic: "OSI Reference Model",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Presentation Layer (Layer 6)", is_correct: true },
      { text: "Session Layer (Layer 5)", is_correct: false },
      { text: "Transport Layer (Layer 4)", is_correct: false },
      { text: "Application Layer (Layer 7)", is_correct: false }
    ]
  },
  {
    stem: "What is the correct Protocol Data Unit (PDU) nomenclature at Layers 4, 3, 2, and 1 of the OSI model, in descending order?",
    explanation: "At Layer 4 (Transport) the PDU is a Segment; at Layer 3 (Network) it is a Packet; at Layer 2 (Data Link) it is a Frame; and at Layer 1 (Physical) it is Bits.",
    domain: "network_infra",
    subtopic: "OSI Reference Model",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Segment, Packet, Frame, Bits", is_correct: true },
      { text: "Packet, Segment, Frame, Bits", is_correct: false },
      { text: "Frame, Packet, Segment, Bits", is_correct: false },
      { text: "Segment, Frame, Packet, Bits", is_correct: false }
    ]
  },
  {
    stem: "In a modern data center two-tier Spine-Leaf (Clos) topology, why are spine switches strictly prohibited from interconnecting directly to each other?",
    explanation: "In spine-leaf architecture, all leaves connect to all spines, but spines never connect to spines and leaves never connect to leaves. This guarantees consistent, predictable 2-hop East-West latency between any two endpoints in the fabric.",
    domain: "network_infra",
    subtopic: "Spine-Leaf Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "To guarantee a consistent and predictable maximum two-hop latency between any pair of endpoints in the fabric", is_correct: true },
      { text: "To prevent Spanning Tree Protocol from disabling redundant spine uplink ports", is_correct: false },
      { text: "Because spine switches lack hardware MAC address learning tables", is_correct: false },
      { text: "To reduce fiber cabling weight across overhead data center tray ladders", is_correct: false }
    ]
  },
  {
    stem: "In VXLAN EVPN spine-leaf data center fabrics, what technologies standardly serve as the control plane overlay and transport underlay respectively?",
    explanation: "In modern VXLAN fabrics, MP-BGP EVPN serves as the control plane overlay for advertising MAC and IP reachability, while an interior gateway protocol (such as OSPF or IS-IS) provides the underlying routed IP transport underlay.",
    domain: "network_infra",
    subtopic: "Spine-Leaf Architecture",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "MP-BGP EVPN for the control plane overlay, and an IGP (like OSPF or IS-IS) for the routed IP underlay", is_correct: true },
      { text: "Spanning Tree Protocol for the overlay, and static routing for the underlay", is_correct: false },
      { text: "RIPv2 for the control plane overlay, and MPLS LDP for the underlay", is_correct: false },
      { text: "EIGRP for the control plane overlay, and GRE tunnels for the underlay", is_correct: false }
    ]
  },
  {
    stem: "What is the defining design characteristic of a Two-Tier Collapsed Core campus network architecture?",
    explanation: "In a collapsed core topology (frequently used in smaller-to-medium enterprise campuses), the Core and Distribution layers are combined into a single logical tier of switches, connecting directly to Access layer switches.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The functions of the Core layer and Distribution layer are combined into a single tier of switches", is_correct: true },
      { text: "Access switches are directly connected to Internet service provider edge routers", is_correct: false },
      { text: "Distribution switches are replaced with unmanaged Layer 2 workgroup hubs", is_correct: false },
      { text: "All Layer 3 routing is moved entirely to cloud-hosted virtual appliances", is_correct: false }
    ]
  },
  {
    stem: "In enterprise hierarchical campus networks, what is the role of First Hop Redundancy Protocols (FHRP) implemented at the Distribution layer?",
    explanation: "FHRPs (such as HSRP and VRRP) provide default gateway redundancy for access layer hosts. Two or more distribution switches share a virtual IP and MAC address, ensuring automatic failover if the primary default gateway fails.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Providing transparent default gateway failover to LAN endpoints by presenting a shared virtual IP and MAC address across redundant switches", is_correct: true },
      { text: "Dynamic bandwidth aggregation across dissimilar physical Ethernet cables using LACP", is_correct: false },
      { text: "Assigning automated 802.1X security credentials to rogue wireless client stations", is_correct: false },
      { text: "Synchronizing hardware system clocks using Stratum 1 atomic time servers", is_correct: false }
    ]
  },
  {
    stem: "A workstation can successfully ping external IP addresses (such as 8.8.8.8) but cannot open websites by domain name (such as www.cisco.com). What is the root cause?",
    explanation: "Successful IP connectivity confirms Layer 1 through Layer 3 routing and NAT work properly. Inability to access services by hostname indicates a DNS resolution failure (misconfigured, unreachable, or blocked DNS server).",
    domain: "network_infra",
    subtopic: "Client Connectivity Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The workstation has an unconfigured, incorrect, or unreachable DNS server address", is_correct: true },
      { text: "The default gateway router has an invalid ARP cache entry for 8.8.8.8", is_correct: false },
      { text: "The switch port connecting the workstation has entered err-disabled state", is_correct: false },
      { text: "The local network interface card has an MTU size mismatch", is_correct: false }
    ]
  },
  {
    stem: "Two hosts connected to the same switch in VLAN 20 cannot ping each other, although both have valid IP addresses. The switch ports are configured as Private VLAN (PVLAN) Isolated ports. Why is traffic blocked?",
    explanation: "In Private VLANs, Isolated ports cannot communicate with other Isolated ports within the same secondary VLAN; they are permitted to communicate only with Promiscuous ports (such as the router default gateway).",
    domain: "network_infra",
    subtopic: "Client Connectivity Troubleshooting",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Isolated ports in a Private VLAN are restricted from communicating directly with any other isolated ports in the same secondary VLAN", is_correct: true },
      { text: "Isolated ports cannot transmit broadcast ARP requests unless proxy ARP is enabled globally", is_correct: false },
      { text: "Isolated ports disable Layer 2 frame forwarding until an 802.1Q trunk is negotiated", is_correct: false },
      { text: "The switch drops frames because both hosts share the same virtual MAC address", is_correct: false }
    ]
  },
  {
    stem: "What is the primary difference between a dedicated cloud interconnect circuit (such as AWS Direct Connect or Azure ExpressRoute) and an IPsec VPN over the public Internet?",
    explanation: "Dedicated cloud interconnect circuits provide private physical connectivity bypassing the public Internet, offering consistent low-latency performance and high throughput, whereas IPsec VPNs traverse best-effort public Internet paths with variable jitter.",
    domain: "network_infra",
    subtopic: "Cloud Connectivity",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Cloud interconnect circuits bypass the public Internet via private dedicated connections, providing predictable latency and SLAs", is_correct: true },
      { text: "Cloud interconnect circuits operate exclusively over 802.11ax wireless links", is_correct: false },
      { text: "IPsec VPNs do not support cryptographic data encryption across WAN links", is_correct: false },
      { text: "Cloud interconnect circuits eliminate the need for enterprise BGP routing tables", is_correct: false }
    ]
  },
  {
    stem: "Which cloud computing deployment model provides consumers with complete control over application runtime code and data, while the cloud provider manages servers, OS patching, and network infrastructure?",
    explanation: "PaaS (Platform as a Service) provides the hardware, OS, and runtime environment so developers can focus strictly on building and deploying applications without managing the underlying operating system or virtualization.",
    domain: "network_infra",
    subtopic: "Cloud Connectivity",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Platform as a Service (PaaS)", is_correct: true },
      { text: "Infrastructure as a Service (IaaS)", is_correct: false },
      { text: "Software as a Service (SaaS)", is_correct: false },
      { text: "Function as an Appliance (FaaA)", is_correct: false }
    ]
  },
  {
    stem: "In an IPv4 packet header, what occurs if a packet's size exceeds an egress link's MTU and the Don't Fragment (DF) bit in the Flags field is set to 1?",
    explanation: "When the DF bit is set to 1, routers are forbidden from fragmenting the packet. If the packet exceeds the outbound link MTU, the router discards it and returns an ICMP Type 3 Code 4 (Fragmentation Needed and DF set) message to the sender, facilitating Path MTU Discovery.",
    domain: "network_infra",
    subtopic: "IPv4 Header",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "The router drops the packet and transmits an ICMP Fragmentation Needed message back to the sender", is_correct: true },
      { text: "The router compresses the payload using LZW compression to fit the MTU", is_correct: false },
      { text: "The router clears the DF flag and fragments the packet into 576-byte pieces", is_correct: false },
      { text: "The router forwards the oversized packet unmodified onto the physical media", is_correct: false }
    ]
  },
  {
    stem: "Which field in the IPv6 base header performs the equivalent operational function of the IPv4 'Protocol' field, specifying the payload type or next extension header?",
    explanation: "The Next Header field in IPv6 identifies the protocol immediately following the IPv6 header (such as TCP [6], UDP [17], or an IPv6 extension header like Routing or Fragmentation).",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Next Header", is_correct: true },
      { text: "Traffic Class", is_correct: false },
      { text: "Flow Label", is_correct: false },
      { text: "Payload Length", is_correct: false }
    ]
  },

  // ==========================================
  // SWITCHING (14 questions)
  // ==========================================
  {
    stem: "What action does a Cisco Catalyst switch port take when storm control is configured with 'storm-control action trap'?",
    explanation: "The `storm-control action trap` command directs the switch to generate and send an SNMP trap message to configured management servers whenever traffic exceeds the defined storm control rising threshold.",
    domain: "switching",
    subtopic: "Storm Control",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It generates an SNMP trap message to network management stations when the storm threshold is exceeded", is_correct: true },
      { text: "It permanently disables the port and shuts down the transceiver laser", is_correct: false },
      { text: "It redirects excess broadcast packets to the default gateway router via proxy ARP", is_correct: false },
      { text: "It resets the switch to factory default running configuration", is_correct: false }
    ]
  },
  {
    stem: "When a switch port with 'storm-control action shutdown' exceeds its broadcast threshold, into what state does the port transition, and how can it be recovered?",
    explanation: "The port is placed into `err-disabled` state. It can be brought back up manually by executing `shutdown` followed by `no shutdown` on the interface, or automatically using the `errdisable recovery cause storm-control` feature.",
    domain: "switching",
    subtopic: "Storm Control",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It enters err-disabled state and can be restored via shutdown/no shutdown or automated errdisable recovery timers", is_correct: true },
      { text: "It enters spanning-tree blocking state and recovers automatically after 50 seconds", is_correct: false },
      { text: "It reboots the switch supervisor engine immediately", is_correct: false },
      { text: "It changes the port mode from access to dynamic auto", is_correct: false }
    ]
  },
  {
    stem: "Which standard IEEE 802.11 management frame is periodically broadcast by an Access Point to advertise its BSSID, supported data rates, and SSID to wireless clients?",
    explanation: "Beacon frames are 802.11 management frames broadcast periodically (typically every 102.4 ms) by APs to announce their presence, radio parameters, security suites, and network identifiers (SSID).",
    domain: "switching",
    subtopic: "Wireless Client Onboarding",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Beacon frame", is_correct: true },
      { text: "Probe Request frame", is_correct: false },
      { text: "Association Request frame", is_correct: false },
      { text: "RTS (Request to Send) frame", is_correct: false }
    ]
  },
  {
    stem: "In an enterprise 802.1X/EAP wireless onboarding exchange, which protocol encapsulates authentication messages between the wireless client (supplicant) and the Access Point/WLC (authenticator)?",
    explanation: "EAP over LAN (EAPoL, defined in IEEE 802.1X) encapsulates Extensible Authentication Protocol (EAP) messages between the client station and the authenticator over the local Layer 2 wireless link.",
    domain: "switching",
    subtopic: "Wireless Client Onboarding",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "EAPoL (EAP over LAN)", is_correct: true },
      { text: "RADIUS accounting packets", is_correct: false },
      { text: "TACACS+ authorization packets", is_correct: false },
      { text: "IPsec tunnel mode ESP packets", is_correct: false }
    ]
  },
  {
    stem: "What is a Routed Port on a Cisco multilayer Catalyst switch, and how is it configured?",
    explanation: "A routed port is a physical switch interface that acts like a router port with an assigned IP address. It is configured by disabling Layer 2 switching on the physical interface with the `no switchport` command.",
    domain: "switching",
    subtopic: "Layer 3 Switching",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "A physical port configured with 'no switchport' that operates as a Layer 3 interface with an assigned IP address", is_correct: true },
      { text: "A virtual logical interface associated with a VLAN (SVI)", is_correct: false },
      { text: "A trunk port carrying multiple tagged 802.1Q VLANs", is_correct: false },
      { text: "A SPAN destination port dedicated to wireshark packet monitoring", is_correct: false }
    ]
  },
  {
    stem: "In Cisco Express Forwarding (CEF) architecture on multilayer switches, what two critical hardware data structures are maintained to enable line-rate wire-speed packet switching?",
    explanation: "CEF relies on two hardware tables: the Forwarding Information Base (FIB, derived directly from the IP routing table for IP lookups) and the Adjacency Table (derived from the ARP table for Layer 2 next-hop MAC rewrites).",
    domain: "switching",
    subtopic: "Layer 3 Switching",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Forwarding Information Base (FIB) and Adjacency Table", is_correct: true },
      { text: "Routing Information Base (RIB) and Spanning Tree Topology Database", is_correct: false },
      { text: "MAC Address Table and TCAM Flow Record Table", is_correct: false },
      { text: "OSPF Link-State Database and CDP Neighbor Table", is_correct: false }
    ]
  },
  {
    stem: "How does Remote SPAN (RSPAN) differ from standard Local SPAN on Cisco Catalyst switches?",
    explanation: "Local SPAN mirrors traffic strictly between interfaces on the same physical switch chassis. RSPAN allows monitored traffic to be mirrored across intermediate switches across a dedicated, non-routable RSPAN VLAN to a destination port on a different switch.",
    domain: "switching",
    subtopic: "Packet Capture",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "RSPAN transports mirrored traffic across intermediate trunked switches over a dedicated RSPAN VLAN to a remote switch port", is_correct: true },
      { text: "RSPAN encrypts captured payloads using AES-256 before writing to a local flash USB drive", is_correct: false },
      { text: "RSPAN mirrors only Layer 3 IP headers and discards all payload data", is_correct: false },
      { text: "Local SPAN requires a dedicated Gigabit router subinterface", is_correct: false }
    ]
  },
  {
    stem: "What are the three violation modes available in Cisco switchport port-security?",
    explanation: "Cisco port security supports three violation actions: `protect` (drops unauthorized frames silently), `restrict` (drops unauthorized frames and sends syslog/SNMP alerts), and `shutdown` (drops frames and err-disables the interface).",
    domain: "switching",
    subtopic: "Port Security",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "protect, restrict, and shutdown", is_correct: true },
      { text: "permit, deny, and reject", is_correct: false },
      { text: "isolate, monitor, and disable", is_correct: false },
      { text: "block, forward, and inspect", is_correct: false }
    ]
  },
  {
    stem: "What is the operational behavior of a switch port configured with 'switchport port-security violation restrict' when an unauthorized MAC address is detected?",
    explanation: "Under `restrict` mode, frames from the unauthorized MAC are dropped, the security violation counter increments, and an SNMP trap / syslog notification is generated, but the port remains operational for authorized MAC addresses.",
    domain: "switching",
    subtopic: "Port Security",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It drops frames from the unauthorized MAC, increments the violation counter, and generates an alert, while leaving the port up", is_correct: true },
      { text: "It immediately err-disables the switch interface and turns the port LED amber", is_correct: false },
      { text: "It drops the frames silently without logging or incrementing violation counters", is_correct: false },
      { text: "It reconfigures the port as an 802.1Q trunk", is_correct: false }
    ]
  },
  {
    stem: "When a Cisco IP Phone is connected to a switch port configured with an access VLAN and a voice VLAN, how does the IP phone format VoIP packets transmitted toward the switch?",
    explanation: "The IP phone tags voice traffic with an 802.1Q header containing the Voice VLAN ID and sets the 802.1p priority (Class of Service) to 5. Data traffic from a connected PC is passed through untagged into the access VLAN.",
    domain: "switching",
    subtopic: "Voice VLANs",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "It inserts an 802.1Q tag with the Voice VLAN ID and sets the 802.1p Class of Service (CoS) value to 5", is_correct: true },
      { text: "It transmits untagged frames and relies on switch ingress ACLs to assign QoS tags", is_correct: false },
      { text: "It encapsulates packets within a CAPWAP tunnel to the default gateway", is_correct: false },
      { text: "It fragments VoIP frames into 64-byte cells", is_correct: false }
    ]
  },
  {
    stem: "Which command completely disables Dynamic Trunking Protocol (DTP) frame transmission on an interface configured as an 802.1Q trunk?",
    explanation: "The `switchport nonegotiate` interface command disables DTP frame transmission on a switch port that has been statically configured in trunk or access mode (`switchport mode trunk` or `switchport mode access`).",
    domain: "switching",
    subtopic: "DTP Negotiation",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "switchport nonegotiate", is_correct: true },
      { text: "no dtp enable", is_correct: false },
      { text: "switchport dtp disable", is_correct: false },
      { text: "no switchport trunk negotiation", is_correct: false }
    ]
  },
  {
    stem: "What are the default transmission interval and holdtime values for Cisco Discovery Protocol (CDP)?",
    explanation: "By default, CDP sends periodic advertisements every 60 seconds and has a holdtime of 180 seconds before purging an expired neighbor record.",
    domain: "switching",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Transmission interval = 60 seconds, Holdtime = 180 seconds", is_correct: true },
      { text: "Transmission interval = 30 seconds, Holdtime = 120 seconds", is_correct: false },
      { text: "Transmission interval = 10 seconds, Holdtime = 40 seconds", is_correct: false },
      { text: "Transmission interval = 5 seconds, Holdtime = 15 seconds", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco IOS verification command provides detailed information about an LLDP neighbor, including its system description, capabilities, and management IP address?",
    explanation: "The `show lldp neighbors detail` command displays comprehensive details about each LLDP neighbor, including full device description, operating system version, enabled capabilities, and management addresses.",
    domain: "switching",
    subtopic: "Discovery Protocols",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "show lldp neighbors detail", is_correct: true },
      { text: "show lldp interface detail", is_correct: false },
      { text: "show cdp entry *", is_correct: false },
      { text: "show running-config interface lldp", is_correct: false }
    ]
  },
  {
    stem: "When an Ethernet switch receives a frame on an access port, which header field does it examine to populate its MAC address forwarding table?",
    explanation: "A switch dynamically learns MAC addresses by inspecting the Source MAC address of every incoming frame and mapping that address to the port and VLAN where it arrived.",
    domain: "switching",
    subtopic: "Switch Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Source MAC address", is_correct: true },
      { text: "Destination MAC address", is_correct: false },
      { text: "EtherType field", is_correct: false },
      { text: "Frame Check Sequence (FCS)", is_correct: false }
    ]
  },

  // ==========================================
  // IP_ROUTING (11 questions)
  // ==========================================
  {
    stem: "When configuring an IPv6 static route using a Link-Local address (FE80::/10) as the next hop, why must the local exit interface also be explicitly specified?",
    explanation: "Because Link-Local addresses are scoped strictly to the local physical link and may be reused across multiple interfaces on the same router, the router cannot determine which outgoing interface to use without explicit specification.",
    domain: "ip_routing",
    subtopic: "IPv6 Static Routing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Link-Local addresses are link-scoped and ambiguous without an explicit local egress interface", is_correct: true },
      { text: "Link-Local addresses lack a host identifier portion", is_correct: false },
      { text: "OSPFv3 requires exit interfaces to calculate Dijkstra shortest paths", is_correct: false },
      { text: "IPv6 static routes fail without an 802.1Q subinterface tag", is_correct: false }
    ]
  },
  {
    stem: "What is the correct Cisco IOS command syntax to configure a default IPv6 static route forwarding traffic to next-hop address 2001:db8:acad:1::1?",
    explanation: "In IPv6, the default route is represented by `::/0` (prefix length 0). The command is `ipv6 route ::/0 <next-hop>`. (Note: `ipv6 unicast-routing` must also be enabled globally).",
    domain: "ip_routing",
    subtopic: "IPv6 Static Routing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ipv6 route ::/0 2001:db8:acad:1::1", is_correct: true },
      { text: "ipv6 route 0.0.0.0/0 2001:db8:acad:1::1", is_correct: false },
      { text: "ip route default 2001:db8:acad:1::1", is_correct: false },
      { text: "ipv6 static route any 2001:db8:acad:1::1", is_correct: false }
    ]
  },
  {
    stem: "Which global configuration command activates an OSPFv2 routing process with process ID 10 on a Cisco router?",
    explanation: "In Cisco IOS, `router ospf <process-id>` enters OSPF configuration mode. The process ID is a locally significant positive integer (1-65535) and does not need to match neighboring routers.",
    domain: "ip_routing",
    subtopic: "OSPF Configuration",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "router ospf 10", is_correct: true },
      { text: "ip routing ospf 10", is_correct: false },
      { text: "network ospf 10", is_correct: false },
      { text: "enable ospf process 10", is_correct: false }
    ]
  },
  {
    stem: "In OSPF, what is the order of precedence a router uses to determine its 32-bit OSPF Router ID (RID)?",
    explanation: "OSPF determines its RID using: 1) Explicitly configured `router-id <id>` command, 2) Highest IPv4 address on any active loopback interface, 3) Highest IPv4 address on any active physical interface.",
    domain: "ip_routing",
    subtopic: "OSPF Configuration",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "1: Configured 'router-id' command, 2: Highest IP on active loopback, 3: Highest IP on active physical interface", is_correct: true },
      { text: "1: Highest IP on physical interface, 2: Highest IP on loopback, 3: Configured 'router-id' command", is_correct: false },
      { text: "1: Lowest IP on active loopback, 2: Lowest IP on physical interface, 3: MAC address hash", is_correct: false },
      { text: "1: System hostname MD5 digest, 2: Configured 'router-id' command, 3: Default gateway IP", is_correct: false }
    ]
  },
  {
    stem: "What are the default OSPF hello and dead timer intervals on broadcast and point-to-point network types?",
    explanation: "On broadcast (e.g. Ethernet) and point-to-point links, OSPF sends Hellos every 10 seconds, and the Dead interval is 4 times the Hello interval (40 seconds).",
    domain: "ip_routing",
    subtopic: "OSPF Network Types",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Hello: 10 seconds, Dead: 40 seconds", is_correct: true },
      { text: "Hello: 30 seconds, Dead: 120 seconds", is_correct: false },
      { text: "Hello: 5 seconds, Dead: 15 seconds", is_correct: false },
      { text: "Hello: 60 seconds, Dead: 180 seconds", is_correct: false }
    ]
  },
  {
    stem: "On which two OSPF network types does OSPF automatically elect a Designated Router (DR) and Backup Designated Router (BDR)?",
    explanation: "DR and BDR elections take place on multi-access network types where multiple routers share a common segment: Broadcast (such as Ethernet) and Non-Broadcast Multi-Access (NBMA). Point-to-point and point-to-multipoint do not elect a DR/BDR.",
    domain: "ip_routing",
    subtopic: "OSPF Network Types",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Broadcast and Non-Broadcast Multi-Access (NBMA)", is_correct: true },
      { text: "Point-to-Point and Point-to-Multipoint", is_correct: false },
      { text: "Loopback and Point-to-Point", is_correct: false },
      { text: "Broadcast and Point-to-Multipoint Non-Broadcast", is_correct: false }
    ]
  },
  {
    stem: "In an IPv6-only network running OSPFv3 where no IPv4 addresses are configured on any interfaces, how must the OSPFv3 Router ID (RID) be established?",
    explanation: "OSPFv3 still uses a 32-bit dotted-decimal number for its Router ID. If no IPv4 addresses exist on the router's interfaces, OSPFv3 cannot automatically select an RID and will not start until the administrator manually assigns one using the `router-id` command.",
    domain: "ip_routing",
    subtopic: "OSPFv3",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It must be configured manually using the 32-bit dotted-decimal 'router-id' command, or the process will fail to start", is_correct: true },
      { text: "It is automatically generated by taking the first 32 bits of the router's IPv6 Link-Local address", is_correct: false },
      { text: "It is derived from the chassis serial number converted to hex", is_correct: false },
      { text: "It defaults to 0.0.0.0 and allows neighbors to establish adjacencies anonymously", is_correct: false }
    ]
  },
  {
    stem: "What is the difference between a next-hop static route and a directly attached static route in Cisco IOS?",
    explanation: "A next-hop static route specifies the IP address of the neighboring router (`ip route 10.0.0.0 255.0.0.0 192.168.1.1`). A directly attached static route specifies only the outgoing exit interface (`ip route 10.0.0.0 255.0.0.0 G0/1`), causing the router to issue ARP requests for every destination host.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A next-hop route specifies the neighboring router's IP address, while a directly attached route specifies only the local exit interface", is_correct: true },
      { text: "A directly attached route has an AD of 90, while a next-hop route has an AD of 110", is_correct: false },
      { text: "A next-hop route is only valid for serial interfaces, while directly attached is for Ethernet only", is_correct: false },
      { text: "A next-hop route enables proxy ARP, while directly attached disables ARP", is_correct: false }
    ]
  },
  {
    stem: "What is the default Administrative Distance (AD) of External BGP (EBGP) routes in Cisco IOS?",
    explanation: "In Cisco IOS, External BGP (EBGP) routes have an Administrative Distance of 20, making them highly preferred over interior routing protocols like OSPF (110) and EIGRP Internal (90). Internal BGP (IBGP) has an AD of 200.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "20", is_correct: true },
      { text: "90", is_correct: false },
      { text: "110", is_correct: false },
      { text: "200", is_correct: false }
    ]
  },
  {
    stem: "How is a floating static route created in Cisco IOS to serve as an automatic backup to an OSPF dynamic route?",
    explanation: "A floating static route is configured with an Administrative Distance higher than the primary route (e.g., OSPF is AD 110, so configuring `ip route ... 120`). It stays out of the routing table until the primary OSPF route disappears.",
    domain: "ip_routing",
    subtopic: "Floating Static Routes",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "By configuring a static route with an administrative distance higher than 110 (such as 120 or 200)", is_correct: true },
      { text: "By setting the static route metric to 0 with 'ip route ... metric 0'", is_correct: false },
      { text: "By appending the 'track' keyword without an administrative distance value", is_correct: false },
      { text: "By applying an outbound distribute-list to the primary interface", is_correct: false }
    ]
  },
  {
    stem: "A network engineer configures subinterface G0/0.10 on a router for inter-VLAN routing, but clients in VLAN 10 cannot ping their gateway. Which configuration omission on the subinterface will prevent 802.1Q tagged frames from being processed?",
    explanation: "For a router subinterface to process 802.1Q tagged frames for a specific VLAN, the subinterface must be explicitly bound to that VLAN tag using the `encapsulation dot1q <vlan-id>` command before assigning its IP address.",
    domain: "ip_routing",
    subtopic: "Inter-VLAN Routing",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Missing 'encapsulation dot1q 10' command on the subinterface", is_correct: true },
      { text: "Missing 'switchport mode trunk' on the router physical interface", is_correct: false },
      { text: "Missing 'ip nat inside' on the parent physical interface", is_correct: false },
      { text: "Missing 'spanning-tree portfast' on the router subinterface", is_correct: false }
    ]
  },

  // ==========================================
  // SERVICES_SECURITY (11 questions)
  // ==========================================
  {
    stem: "In the Cisco AAA (Authentication, Authorization, and Accounting) security framework, what is the specific role of the Accounting component?",
    explanation: "Accounting gathers and logs session metrics, including commands executed by administrators, login/logout timestamps, and packet/byte counts for billing, reporting, and forensic auditing.",
    domain: "services_security",
    subtopic: "AAA Security",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Tracking and recording user actions, executed commands, and session duration for compliance and auditing", is_correct: true },
      { text: "Verifying the identity of the user via password or digital certificate", is_correct: false },
      { text: "Granting or restricting access permissions to specific privileged exec commands", is_correct: false },
      { text: "Encrypting management sessions across SSH connections", is_correct: false }
    ]
  },
  {
    stem: "In DHCPv4 lease renewal timers, at what percentage of the total lease duration does a client send its initial unicast DHCPREQUEST (T1 timer) to renew its IP address?",
    explanation: "In DHCPv4, the T1 renewal timer defaults to 50% of the lease duration, at which point the client sends a unicast DHCPREQUEST to the leasing DHCP server. If unacknowledged, at T2 (87.5% of lease), it broadcasts a DHCPREQUEST to any server.",
    domain: "services_security",
    subtopic: "DHCP Operations",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "50% of the lease time", is_correct: true },
      { text: "25% of the lease time", is_correct: false },
      { text: "75% of the lease time", is_correct: false },
      { text: "87.5% of the lease time", is_correct: false }
    ]
  },
  {
    stem: "Which two UDP port numbers are utilized by standard IPv4 DHCP for server listening and client listening respectively?",
    explanation: "DHCPv4 uses UDP port 67 for the server (which listens for client DISCOVER/REQUEST messages) and UDP port 68 for the client (which receives OFFER/ACK messages).",
    domain: "services_security",
    subtopic: "DHCP and Helper Address",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Server listens on UDP port 67; Client listens on UDP port 68", is_correct: true },
      { text: "Server listens on UDP port 68; Client listens on UDP port 67", is_correct: false },
      { text: "Server listens on TCP port 53; Client listens on UDP port 53", is_correct: false },
      { text: "Server listens on UDP port 161; Client listens on UDP port 162", is_correct: false }
    ]
  },
  {
    stem: "Which DNS resource record type is used to map a domain hostname directly to an IPv6 address?",
    explanation: "An 'A' record maps a hostname to an IPv4 address. An 'AAAA' (quad-A) record maps a hostname to a 128-bit IPv6 address.",
    domain: "services_security",
    subtopic: "DNS Record Types",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "AAAA record", is_correct: true },
      { text: "A record", is_correct: false },
      { text: "CNAME record", is_correct: false },
      { text: "PTR record", is_correct: false }
    ]
  },
  {
    stem: "Which DNS resource record type designates the priority and domain name of the mail server responsible for receiving emails for an enterprise domain?",
    explanation: "An MX (Mail Exchange) record specifies the mail server responsible for accepting incoming email messages on behalf of a recipient's domain, accompanied by a preference number.",
    domain: "services_security",
    subtopic: "DNS Record Types",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "MX record", is_correct: true },
      { text: "SOA record", is_correct: false },
      { text: "NS record", is_correct: false },
      { text: "TXT record", is_correct: false }
    ]
  },
  {
    stem: "In site-to-site IPsec VPN negotiation, what is the primary objective of IKE Phase 1?",
    explanation: "IKE Phase 1 establishes a secure, authenticated, and encrypted bi-directional management tunnel (IKE SA) between the two peer gateways, which is subsequently used to securely negotiate Phase 2 IPsec SAs.",
    domain: "services_security",
    subtopic: "IPsec Site-to-Site",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Authenticating the peer gateways and establishing an encrypted management tunnel (IKE SA)", is_correct: true },
      { text: "Transmitting user data packets across GRE encapsulation headers", is_correct: false },
      { text: "Exchanging dynamic OSPF routing updates directly across cleartext TCP sockets", is_correct: false },
      { text: "Assigning dynamic DHCP IP addresses to remote teleworker client PCs", is_correct: false }
    ]
  },
  {
    stem: "What is the primary difference in security capabilities between IPsec Encapsulating Security Payload (ESP) and Authentication Header (AH)?",
    explanation: "ESP (IP protocol 50) provides confidentiality (encryption), data integrity, and authentication. AH (IP protocol 51) provides data integrity and authentication only; it does NOT encrypt payload data.",
    domain: "services_security",
    subtopic: "IPsec Site-to-Site",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "ESP provides data confidentiality (encryption) along with integrity and authentication, whereas AH does not encrypt data payloads", is_correct: true },
      { text: "AH provides encryption while ESP provides only digital signatures", is_correct: false },
      { text: "ESP operates only in transport mode, while AH operates only in tunnel mode", is_correct: false },
      { text: "AH works through NAT devices, while ESP is completely incompatible with NAT", is_correct: false }
    ]
  },
  {
    stem: "When deploying IPv6 Router Advertisement (RA) Guard on a Layer 2 switch, which port role must be assigned to interfaces connected to legitimate network routers?",
    explanation: "IPv6 RA Guard defines two port roles: `trusted` (ports connected to legitimate routers where RA messages are permitted) and `untrusted` (ports connected to end-user clients where incoming RA messages are dropped).",
    domain: "services_security",
    subtopic: "IPv6 RA Guard",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "trusted", is_correct: true },
      { text: "untrusted", is_correct: false },
      { text: "promiscuous", is_correct: false },
      { text: "delegated", is_correct: false }
    ]
  },
  {
    stem: "Which well-known transport layer protocol and port number does Network Time Protocol (NTP) use for time synchronization?",
    explanation: "Network Time Protocol (NTP) operates over UDP port 123.",
    domain: "services_security",
    subtopic: "NTP Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "UDP port 123", is_correct: true },
      { text: "TCP port 123", is_correct: false },
      { text: "UDP port 161", is_correct: false },
      { text: "TCP port 8080", is_correct: false }
    ]
  },
  {
    stem: "What is the function of the Cisco IOS command 'ip nat inside source static 192.168.1.50 203.0.113.10'?",
    explanation: "This command configures Static NAT, creating a permanent, one-to-one bidirectional mapping between an internal private IP address (192.168.1.50) and an external public IP address (203.0.113.10).",
    domain: "services_security",
    subtopic: "Network Address Translation",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It creates a permanent 1-to-1 static NAT translation between private IP 192.168.1.50 and public IP 203.0.113.10", is_correct: true },
      { text: "It maps an entire subnet of hosts to public IP 203.0.113.10 using dynamic PAT port overloading", is_correct: false },
      { text: "It blocks all traffic originated from public IP 203.0.113.10 destined for 192.168.1.50", is_correct: false },
      { text: "It redirects port 80 HTTP traffic to port 443 HTTPS on host 192.168.1.50", is_correct: false }
    ]
  },
  {
    stem: "What is the default, unwritten action that occurs at the very end of every Cisco IOS IPv4 Access Control List (ACL)?",
    explanation: "Every Cisco ACL concludes with an implicit `deny ip any any` (or `deny any` in standard ACLs). If a packet does not match any configured permit statement, it is silently discarded.",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "An implicit deny statement that drops all unmatched packets ('deny ip any any')", is_correct: true },
      { text: "An implicit permit statement that forwards all unmatched packets ('permit ip any any')", is_correct: false },
      { text: "An automated logging trap sent to the syslog server for every unmatched packet", is_correct: false },
      { text: "An ICMP Redirect message sent back to the default gateway", is_correct: false }
    ]
  },

  // ==========================================
  // AI_OPS (5 questions)
  // ==========================================
  {
    stem: "In Cisco Software-Defined Access (SD-Access), what constitutes the Underlay network versus the Overlay network?",
    explanation: "The underlay consists of the physical networking hardware and routed IP fabric (typically IS-IS or OSPF) providing basic IP reachability. The overlay is the logical virtualized network (using VXLAN for data plane encapsulation and LISP for control plane) running on top.",
    domain: "ai_ops",
    subtopic: "Controller-Based Management",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Underlay is the physical routed IP network; Overlay is the virtualized logical topology encapsulated via VXLAN tunnels", is_correct: true },
      { text: "Underlay is the cloud dashboard GUI; Overlay is the copper cabling connecting access switches", is_correct: false },
      { text: "Underlay handles Layer 7 inspection; Overlay handles physical fiber optics", is_correct: false },
      { text: "Underlay is the remote branch WAN; Overlay is the enterprise data center SAN", is_correct: false }
    ]
  },
  {
    stem: "What is the core distinction between Declarative and Imperative configuration management paradigms in network automation?",
    explanation: "Declarative tools (like Terraform and Ansible) describe the desired final state of the system without specifying how to achieve it. Imperative tools describe the exact sequence of individual commands required to reach the target state.",
    domain: "ai_ops",
    subtopic: "Infrastructure as Code",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Declarative specifies the desired end-state; Imperative specifies the sequential step-by-step procedures to achieve it", is_correct: true },
      { text: "Declarative requires Python runtime; Imperative requires Bash shell exclusively", is_correct: false },
      { text: "Declarative runs only on edge switches; Imperative runs only on core routers", is_correct: false },
      { text: "Declarative requires proprietary licensing; Imperative is always open source", is_correct: false }
    ]
  },
  {
    stem: "Why is Model-Driven Streaming Telemetry superior to legacy SNMP polling for large-scale enterprise network monitoring?",
    explanation: "Streaming telemetry is push-based, streaming structured data (modeled in YANG) continuously at sub-second intervals directly from network ASICs. SNMP is pull-based, requiring periodic polling requests that burden device CPUs and miss transient spikes.",
    domain: "ai_ops",
    subtopic: "Telemetry and Monitoring",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It pushes real-time, continuous YANG-structured data at high frequency without the CPU overhead of repetitive polling requests", is_correct: true },
      { text: "It replaces Ethernet cabling with optical satellite links", is_correct: false },
      { text: "It converts all binary packets into plain-text ASCII log files", is_correct: false },
      { text: "It operates without requiring IP addresses on network interfaces", is_correct: false }
    ]
  },
  {
    stem: "In network AIOps platforms, how does machine-learning-based Anomaly Detection assist with dynamic baseline drift?",
    explanation: "Rather than relying on static alert thresholds (e.g. CPU > 80%), ML algorithms learn normal diurnal traffic patterns, seasons, and shifts, dynamically adjusting alert baselines to detect real anomalies while eliminating false positives.",
    domain: "ai_ops",
    subtopic: "AIOps Fundamentals",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It continuously learns operational patterns and dynamically adjusts threshold boundaries to identify genuine deviations while suppressing false alerts", is_correct: true },
      { text: "It automatically purchases replacement hardware switches when interface errors exceed 5%", is_correct: false },
      { text: "It converts IPv4 routing protocols to BGP without human intervention", is_correct: false },
      { text: "It reboots all distribution switches simultaneously when memory usage reaches 50%", is_correct: false }
    ]
  },
  {
    stem: "When utilizing an LLM to generate network configuration changes, why is automated pre-flight validation (such as using Batfish or pyATS) critical in a NetDevOps pipeline?",
    explanation: "Automated pre-flight validation models and tests configuration changes against a digital twin or virtual representation before deployment, detecting AI hallucinations, syntax bugs, or potential routing blackholes before production impact.",
    domain: "ai_ops",
    subtopic: "AI Output Validation",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "To verify syntax and simulate forwarding behavior against a network model, catching hallucinations or routing loops prior to production deployment", is_correct: true },
      { text: "To compress configuration text files so they fit onto 1.44 MB floppy disks", is_correct: false },
      { text: "To translate Cisco IOS CLI syntax into proprietary mainframe assembly code", is_correct: false },
      { text: "To encrypt the running configuration with a single-use OTP password", is_correct: false }
    ]
  }
];

const batchPath = path.join(__dirname, 'batches', 'seed-27-volume.json');
fs.writeFileSync(batchPath, JSON.stringify(questions, null, 2) + '\n');
console.log(`Generated ${questions.length} questions in ${batchPath}`);
