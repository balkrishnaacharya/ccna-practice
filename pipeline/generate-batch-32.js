#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const questions = [
  // ==========================================
  // NETWORK_INFRA (14 questions)
  // ==========================================
  {
    stem: "What is the primary difference in forwarding behavior between a Layer 2 switch and a Layer 3 (Multilayer) switch?",
    explanation: "A Layer 2 switch forwards frames strictly based on destination MAC addresses within a single broadcast domain/VLAN. A Layer 3 switch can forward frames at Layer 2 and also route IP packets between different subnets and VLANs in hardware using ASICs.",
    domain: "network_infra",
    subtopic: "Network Components",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A Layer 2 switch forwards frames strictly based on MAC addresses, while a Layer 3 switch can also route IP packets between subnets in hardware", is_correct: true },
      { text: "A Layer 2 switch uses optical fiber; a Layer 3 switch uses copper exclusively", is_correct: false },
      { text: "A Layer 3 switch disables Spanning Tree Protocol across all ports", is_correct: false },
      { text: "A Layer 2 switch operates without a MAC address table", is_correct: false }
    ]
  },
  {
    stem: "At which layer of the OSI 7-layer reference model does an IP router make its forwarding decisions based on destination logical addresses?",
    explanation: "Routers operate at the Network Layer (Layer 3), inspecting destination IP addresses in packet headers and consulting their routing tables to determine the best path to the destination network.",
    domain: "network_infra",
    subtopic: "OSI Reference Model",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Network Layer (Layer 3)", is_correct: true },
      { text: "Data Link Layer (Layer 2)", is_correct: false },
      { text: "Transport Layer (Layer 4)", is_correct: false },
      { text: "Physical Layer (Layer 1)", is_correct: false }
    ]
  },
  {
    stem: "Which layer of the OSI 7-layer model is responsible for establishing, managing, synchronizing, and gracefully terminating communication dialogues between applications?",
    explanation: "The Session Layer (Layer 5) establishes, manages, and terminates connections (sessions) between local and remote applications, handling dialogue control (simplex, half-duplex, full-duplex) and synchronization checkpoints.",
    domain: "network_infra",
    subtopic: "OSI Reference Model",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Session Layer (Layer 5)", is_correct: true },
      { text: "Transport Layer (Layer 4)", is_correct: false },
      { text: "Presentation Layer (Layer 6)", is_correct: false },
      { text: "Application Layer (Layer 7)", is_correct: false }
    ]
  },
  {
    stem: "In data center VXLAN overlay networks, what is the role of a VXLAN Tunnel Endpoint (VTEP)?",
    explanation: "A VTEP (typically hosted on a Leaf switch or hypervisor vSwitch) originates and terminates VXLAN overlay tunnels, encapsulating Layer 2 Ethernet frames into Layer 3 UDP/IP packets (port 4789) across the underlay fabric.",
    domain: "network_infra",
    subtopic: "Spine-Leaf Architecture",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It encapsulates Layer 2 Ethernet frames into Layer 3 UDP packets across the routed underlay network, and decapsulates them on arrival", is_correct: true },
      { text: "It performs Spanning Tree root bridge elections across Spine switches", is_correct: false },
      { text: "It translates IPv6 packets to IPv4 using stateful CGNAT", is_correct: false },
      { text: "It authenticates wireless mobile clients using 802.1X certificates", is_correct: false }
    ]
  },
  {
    stem: "What is the primary difference in topology and connectivity between a dedicated Point-to-Point leased line (e.g. T1/E1) and an MPLS VPN WAN service?",
    explanation: "A Point-to-Point leased line provides dedicated, unshared bandwidth between two fixed physical customer sites. An MPLS VPN provides any-to-any routed connectivity across a shared service provider backbone using label switching.",
    domain: "network_infra",
    subtopic: "WAN Architectures",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "A leased line connects two specific endpoints with dedicated bandwidth; MPLS VPN provides any-to-any routed connectivity across a service provider network", is_correct: true },
      { text: "MPLS operates strictly over dial-up telephone modems; leased lines use optical lasers", is_correct: false },
      { text: "Leased lines require BGP peering; MPLS VPNs use Spanning Tree", is_correct: false },
      { text: "A leased line provides unencrypted wireless transport; MPLS is always wired", is_correct: false }
    ]
  },
  {
    stem: "In Cisco SD-WAN architecture, what constitutes a Transport Locator (TLOC)?",
    explanation: "A TLOC identifies an attachment point to a WAN transport. It is represented by a 3-tuple: System IP address of the WAN edge router, Transport Color (e.g. mpls, biz-internet), and Encapsulation type (IPsec or GRE).",
    domain: "network_infra",
    subtopic: "WAN Architectures",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "A 3-tuple consisting of the System IP, Transport Color, and Encapsulation type (IPsec or GRE)", is_correct: true },
      { text: "The physical GPS coordinates of the remote branch office", is_correct: false },
      { text: "The MAC address of the core distribution switch", is_correct: false },
      { text: "The BGP Autonomous System Number and router ID pair", is_correct: false }
    ]
  },
  {
    stem: "In a centralized Cisco wireless network, which two standard UDP port numbers are used by the CAPWAP protocol for Control and Data tunnels respectively?",
    explanation: "CAPWAP utilizes UDP port 5246 for its encrypted Control channel (management and configuration) and UDP port 5247 for its Data channel (encapsulating client payload traffic).",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "UDP port 5246 (Control) and UDP port 5247 (Data)", is_correct: true },
      { text: "UDP port 5247 (Control) and UDP port 5246 (Data)", is_correct: false },
      { text: "TCP port 80 (Control) and TCP port 443 (Data)", is_correct: false },
      { text: "UDP port 161 (Control) and UDP port 162 (Data)", is_correct: false }
    ]
  },
  {
    stem: "Which IEEE 802.11 Wi-Fi standard introduced 160 MHz channel bonding, 256-QAM modulation, and operates exclusively in the 5 GHz band?",
    explanation: "IEEE 802.11ac (branded as Wi-Fi 5) operates exclusively in the 5 GHz band, introducing up to 160 MHz channel widths and 256-QAM modulation for gigabit wireless throughput.",
    domain: "network_infra",
    subtopic: "Wireless Standards",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "IEEE 802.11ac", is_correct: true },
      { text: "IEEE 802.11n", is_correct: false },
      { text: "IEEE 802.11g", is_correct: false },
      { text: "IEEE 802.11b", is_correct: false }
    ]
  },
  {
    stem: "Which copper twisted-pair cabling category is certified to support 10 Gigabit Ethernet (10GBASE-T) up to the full standard 100-meter distance?",
    explanation: "Category 6A (Augmented Category 6) is certified to operate at 500 MHz, supporting 10GBASE-T up to the full 100 meters. (Standard Cat 6 supports 10GBASE-T only up to 37–55 meters depending on alien crosstalk).",
    domain: "network_infra",
    subtopic: "Cabling Standards",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Category 6A (Cat 6A)", is_correct: true },
      { text: "Category 5e (Cat 5e)", is_correct: false },
      { text: "Category 3 (Cat 3)", is_correct: false },
      { text: "Category 5 (Cat 5)", is_correct: false }
    ]
  },
  {
    stem: "Why does standard enterprise campus architecture separate the Access layer from the Core layer with an intermediate Distribution layer?",
    explanation: "The Distribution layer aggregates access switch uplinks, enforces routing and security policies, handles inter-VLAN routing, and isolates broadcast domains, preventing local access failures or spanning tree flaps from degrading the campus Core.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "To aggregate access uplinks, enforce security/routing policies, and isolate local broadcast domains from the core", is_correct: true },
      { text: "To allow workstations to negotiate 802.1Q trunks directly with public cloud providers", is_correct: false },
      { text: "To convert optical fiber signals into coaxial cable feeds", is_correct: false },
      { text: "To eliminate the need for Layer 3 default gateway IP addresses", is_correct: false }
    ]
  },
  {
    stem: "How many usable host IPv4 addresses are supported in a network configured with a /22 prefix length (subnet mask 255.255.252.0)?",
    explanation: "A /22 mask leaves 32 - 22 = 10 host bits. Total addresses = 2^10 = 1024. Subtracting network ID and broadcast yields 1024 - 2 = 1022 usable host addresses.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "1,022", is_correct: true },
      { text: "1,024", is_correct: false },
      { text: "510", is_correct: false },
      { text: "2,046", is_correct: false }
    ]
  },
  {
    stem: "Which fiber-optic connector features a round, cylindrical metal ferrule with a twist-lock bayonet coupling mechanism, often used in older campus networks?",
    explanation: "The ST (Straight Tip) connector uses a round 2.5 mm ferrule with a spring-loaded bayonet twist-lock coupling, similar to a BNC connector.",
    domain: "network_infra",
    subtopic: "Physical Media",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "ST (Straight Tip)", is_correct: true },
      { text: "LC (Lucent Connector)", is_correct: false },
      { text: "SC (Subscriber Connector)", is_correct: false },
      { text: "MPO (Multi-fiber Push On)", is_correct: false }
    ]
  },
  {
    stem: "What is the function of the Cisco Identity Services Engine (ISE) in an enterprise network?",
    explanation: "Cisco ISE is a centralized security policy platform that provides AAA services (RADIUS/TACACS+), device profiling, posture checking, guest access management, and role-based access control (RBAC).",
    domain: "network_infra",
    subtopic: "Security Devices",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Acts as a centralized security management server handling AAA, 802.1X policy enforcement, device profiling, and posture evaluation", is_correct: true },
      { text: "Routes BGP packets across high-speed enterprise WAN interconnects", is_correct: false },
      { text: "Provides physical cooling and environmental monitoring for data center racks", is_correct: false },
      { text: "Acts as an authoritative DNS root nameserver", is_correct: false }
    ]
  },
  {
    stem: "What is an IPv6 Anycast address, and how do routers forward packets destined for an Anycast destination?",
    explanation: "An Anycast address is assigned to multiple interfaces across different devices. Routing protocols advertise the address, and routers forward packets to the single topologically nearest device according to routing metrics.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "An address assigned to multiple devices where packets are delivered to the single topologically closest node according to routing metrics", is_correct: true },
      { text: "An address that broadcasts packets to all nodes across the entire local link", is_correct: false },
      { text: "A temporary address generated via APIPA when DHCPv6 fails", is_correct: false },
      { text: "An address reserved strictly for router loopback interfaces", is_correct: false }
    ]
  },

  // ==========================================
  // SWITCHING (14 questions)
  // ==========================================
  {
    stem: "When configuring a SPAN destination port on a Cisco switch, what is the effect of appending the 'encapsulation replicate' keyword?",
    explanation: "The `encapsulation replicate` parameter instructs the SPAN destination port to retain and replicate the original 802.1Q tags and Layer 2 framing on mirrored frames, rather than stripping them.",
    domain: "switching",
    subtopic: "Packet Capture",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It directs the SPAN destination port to preserve and output original 802.1Q VLAN tags and frame encapsulation", is_correct: true },
      { text: "It duplicates all frames to two distinct destination interfaces simultaneously", is_correct: false },
      { text: "It compresses captured packet payloads using gzip compression", is_correct: false },
      { text: "It translates all Ethernet frames into Cisco HDLC packets", is_correct: false }
    ]
  },
  {
    stem: "What action does a switch port take when configured with 'switchport port-security violation protect' and an unauthorized MAC address is detected?",
    explanation: "Under `protect` mode, frames from unauthorized MAC addresses are dropped silently. Unlike `restrict`, violation counters are not incremented, no syslog/SNMP alerts are sent, and the port remains up.",
    domain: "switching",
    subtopic: "Port Security",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It silently drops frames from the unauthorized MAC without incrementing violation counters or generating alerts, keeping the port up", is_correct: true },
      { text: "It drops frames, increments the violation counter, and generates an SNMP trap", is_correct: false },
      { text: "It immediately err-disables the interface and turns off the port LED", is_correct: false },
      { text: "It converts the port into an isolated private VLAN port", is_correct: false }
    ]
  },
  {
    stem: "What are the three port states defined in Rapid Spanning Tree Protocol (RSTP / IEEE 802.1w)?",
    explanation: "RSTP consolidates 802.1D's Disabled, Blocking, and Listening states into a single 'Discarding' state. The three RSTP states are: Discarding, Learning, and Forwarding.",
    domain: "switching",
    subtopic: "Rapid PVST+",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Discarding, Learning, and Forwarding", is_correct: true },
      { text: "Blocking, Listening, and Forwarding", is_correct: false },
      { text: "Disabled, Listening, and Learning", is_correct: false },
      { text: "Filtering, Forwarding, and Flooding", is_correct: false }
    ]
  },
  {
    stem: "In Rapid PVST+ (IEEE 802.1w), how does an Edge Port (configured with PortFast) behave differently from a non-edge trunk port during a link state transition?",
    explanation: "Edge ports transition directly to the Forwarding state upon link-up without generating Topology Change Notifications (TCNs) or causing the switch to flush its MAC address table.",
    domain: "switching",
    subtopic: "Rapid PVST+",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It transitions directly to Forwarding without generating Topology Change Notifications (TCNs) or flushing MAC tables", is_correct: true },
      { text: "It waits 30 seconds in listening state before forwarding frames", is_correct: false },
      { text: "It sends superior BPDUs to negotiate root bridge status", is_correct: false },
      { text: "It shuts down immediately if connected to an IP phone", is_correct: false }
    ]
  },
  {
    stem: "On a switch port with Storm Control enabled, what happens to incoming traffic when broadcast levels drop below the configured falling threshold?",
    explanation: "Once traffic falls below the lower falling threshold, the storm condition is considered cleared, and the switch resumes normal unsuppressed forwarding of all broadcast traffic.",
    domain: "switching",
    subtopic: "Storm Control",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The switch resumes forwarding broadcast traffic normally without rate-limiting suppression", is_correct: true },
      { text: "The switch reboots the supervisor engine to clear memory caches", is_correct: false },
      { text: "The port enters the err-disabled state permanently", is_correct: false },
      { text: "The port changes its duplex mode to half-duplex", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco IOS global configuration command sets the VTP operating mode to Transparent?",
    explanation: "The command `vtp mode transparent` configures the switch in VTP Transparent mode, allowing local VLAN management without syncing to a VTP domain.",
    domain: "switching",
    subtopic: "VTP",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "vtp mode transparent", is_correct: true },
      { text: "vtp transparent enable", is_correct: false },
      { text: "switchport vtp mode transparent", is_correct: false },
      { text: "set vtp mode off", is_correct: false }
    ]
  },
  {
    stem: "In hypervisor virtualization networking, what is a 'Port Group' on a VMware standard vSwitch?",
    explanation: "A port group is a logical configuration container on a vSwitch that applies uniform network policies (VLAN ID tagging, security, traffic shaping, NIC teaming) to all virtual machine virtual NICs connected to it.",
    domain: "switching",
    subtopic: "Virtual Switches",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A logical grouping of virtual ports sharing common network policies, such as VLAN ID, security, and teaming rules", is_correct: true },
      { text: "A physical EtherChannel bundle connecting two host servers", is_correct: false },
      { text: "A hardware ASIC that accelerates storage I/O operations", is_correct: false },
      { text: "An unmanaged virtual workgroup hub inside guest operating systems", is_correct: false }
    ]
  },
  {
    stem: "When a switch port is configured with 'switchport mode access' and 'switchport voice vlan 100', what type of frames are accepted on the access VLAN?",
    explanation: "The access VLAN receives standard untagged Ethernet frames (typically from a workstation connected to the IP phone's PC port). Voice packets from the phone arrive tagged with VLAN 100.",
    domain: "switching",
    subtopic: "Voice VLANs",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Standard untagged data frames from the attached host workstation", is_correct: true },
      { text: "802.1Q tagged frames with priority CoS 5", is_correct: false },
      { text: "Encapsulated GRE tunnel frames only", is_correct: false },
      { text: "Encrypted IPsec ESP packets only", is_correct: false }
    ]
  },
  {
    stem: "In enterprise 802.1X wireless onboarding, what is the role of the EAPOL-Key frame exchange?",
    explanation: "EAPOL-Key frames transport the 4-way handshake messages between the AP and client, confirming possession of the Pairwise Master Key (PMK) and establishing the Pairwise Transient Key (PTK) and Group Temporal Key (GTK) for data encryption.",
    domain: "switching",
    subtopic: "Wireless Client Onboarding",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Transports the 4-way handshake to negotiate and install dynamic encryption keys (PTK and GTK) for wireless data frames", is_correct: true },
      { text: "Requests dynamic IP address lease parameters from the DHCP server", is_correct: false },
      { text: "Transmits system clock time corrections using NTP", is_correct: false },
      { text: "Measures cable propagation delay across the wireless channel", is_correct: false }
    ]
  },
  {
    stem: "What does an interface status of 'GigabitEthernet0/1 is administratively down, line protocol is down' signify on a Cisco switch?",
    explanation: "'Administratively down' means the port has been manually disabled by an administrator using the `shutdown` interface configuration command.",
    domain: "switching",
    subtopic: "Interface Troubleshooting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The interface has been manually disabled with the 'shutdown' command", is_correct: true },
      { text: "The physical cable is unplugged or severed", is_correct: false },
      { text: "The port was disabled due to an 802.1X port-security violation", is_correct: false },
      { text: "There is an active duplex mismatch with the remote device", is_correct: false }
    ]
  },
  {
    stem: "What open IEEE standard protocol serves as the vendor-neutral equivalent to Cisco Discovery Protocol (CDP)?",
    explanation: "Link Layer Discovery Protocol (LLDP), standardized in IEEE 802.1AB, is the open vendor-neutral equivalent to Cisco's proprietary CDP.",
    domain: "switching",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "LLDP (Link Layer Discovery Protocol / IEEE 802.1AB)", is_correct: true },
      { text: "LACP (Link Aggregation Control Protocol)", is_correct: false },
      { text: "SNMP (Simple Network Management Protocol)", is_correct: false },
      { text: "STP (Spanning Tree Protocol)", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco IOS privileged exec command purges all dynamically learned MAC address table entries from switch memory?",
    explanation: "The command `clear mac address-table dynamic` clears all dynamically learned MAC addresses from the CAM table, leaving static entries intact.",
    domain: "switching",
    subtopic: "MAC Address Table",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "clear mac address-table dynamic", is_correct: true },
      { text: "delete mac-address-table all", is_correct: false },
      { text: "clear cam table", is_correct: false },
      { text: "reset mac-table dynamic", is_correct: false }
    ]
  },
  {
    stem: "What occurs if a standard non-PoE network interface card (NIC) is plugged into a Cisco Catalyst switch port configured for Power over Ethernet?",
    explanation: "During initial detection, the switch applies a low probing voltage searching for a 25 kΩ signature resistance. Because non-PoE devices lack this signature, the switch detects no PD and does NOT apply power, operating as a normal Ethernet data port.",
    domain: "switching",
    subtopic: "PoE Standards",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The switch detects no PoE signature resistor and safely withholds power, operating the port as a standard data interface", is_correct: true },
      { text: "The switch delivers 48V DC, damaging the non-PoE network card", is_correct: false },
      { text: "The switch port immediately enters the err-disabled state", is_correct: false },
      { text: "The switch reboots the chassis to prevent electrical short-circuits", is_correct: false }
    ]
  },
  {
    stem: "Which Dynamic Trunking Protocol (DTP) mode actively initiates trunk negotiation frames to convert a link into an 802.1Q trunk?",
    explanation: "`dynamic desirable` actively transmits DTP negotiation frames to initiate trunk formation with the remote switch port.",
    domain: "switching",
    subtopic: "DTP Negotiation",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "dynamic desirable", is_correct: true },
      { text: "dynamic auto", is_correct: false },
      { text: "access", is_correct: false },
      { text: "nonegotiate", is_correct: false }
    ]
  },

  // ==========================================
  // IP_ROUTING (11 questions)
  // ==========================================
  {
    stem: "What is the default Administrative Distance assigned to OSPF external routes (Type 5 LSAs) in Cisco IOS?",
    explanation: "Unlike EIGRP (which uses AD 90 for internal and 170 for external), Cisco IOS assigns an Administrative Distance of 110 to ALL OSPF routes (intra-area, inter-area, and external).",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "110", is_correct: true },
      { text: "170", is_correct: false },
      { text: "90", is_correct: false },
      { text: "20", is_correct: false }
    ]
  },
  {
    stem: "How can a network engineer verify the syntax and presence of a floating static backup route while the primary dynamic route is healthy and active?",
    explanation: "While the primary route is active, a floating static route is suppressed from the routing table (`show ip route`) because of its higher AD. It can be verified by inspecting `show running-config`.",
    domain: "ip_routing",
    subtopic: "Floating Static Routes",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "By examining the running configuration ('show running-config') where the static route and distance are defined", is_correct: true },
      { text: "By checking 'show ip route', where it appears marked with an asterisk", is_correct: false },
      { text: "By inspecting the OSPF Link-State Database", is_correct: false },
      { text: "By running 'show ip ospf neighbor detail'", is_correct: false }
    ]
  },
  {
    stem: "In a Router-on-a-Stick configuration, which command must be configured on a subinterface if it is designated to route untagged traffic on the trunk's Native VLAN 1?",
    explanation: "To route untagged frames received on an 802.1Q trunk's Native VLAN, the subinterface must be configured with `encapsulation dot1q 1 native`.",
    domain: "ip_routing",
    subtopic: "Inter-VLAN Routing",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "encapsulation dot1q 1 native", is_correct: true },
      { text: "switchport trunk native vlan 1", is_correct: false },
      { text: "vlan native 1 untagged", is_correct: false },
      { text: "native vlan enable 1", is_correct: false }
    ]
  },
  {
    stem: "What is a 'recursive lookup' in static routing?",
    explanation: "A recursive static route specifies only a next-hop IP address without an exit interface. The router must perform a primary lookup to match the destination prefix, and a second (recursive) lookup to resolve the exit interface for the next-hop IP.",
    domain: "ip_routing",
    subtopic: "IPv6 Static Routing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A route specifying only a next-hop IP, requiring the router to perform a second routing table lookup to determine the outgoing interface", is_correct: true },
      { text: "A route that automatically creates a loopback address on the destination host", is_correct: false },
      { text: "A route that sends an ICMP Echo Request before forwarding each packet", is_correct: false },
      { text: "A route that loops packets through an external security proxy", is_correct: false }
    ]
  },
  {
    stem: "Which command entered in OSPF router configuration mode disables OSPF Hello advertisements on all router interfaces by default, requiring specific interfaces to be re-enabled?",
    explanation: "The command `passive-interface default` suppresses OSPF Hellos across all interfaces globally within the process. Individual interfaces can then be re-enabled for routing using `no passive-interface <interface>`.",
    domain: "ip_routing",
    subtopic: "OSPF Configuration",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "passive-interface default", is_correct: true },
      { text: "ospf passive all", is_correct: false },
      { text: "no ospf hello global", is_correct: false },
      { text: "default-information originate passive", is_correct: false }
    ]
  },
  {
    stem: "In OSPF neighbor formation, what specific activity takes place during the 'Exchange' state?",
    explanation: "In the Exchange state, routers send Database Description (DBD) packets to each other describing the headers of all LSAs in their local LSDBs to identify which LSAs are missing or outdated.",
    domain: "ip_routing",
    subtopic: "OSPF Neighbor States",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Routers send Database Description (DBD) packets describing the LSA headers in their local link-state databases", is_correct: true },
      { text: "Routers negotiate master/slave roles and initial DBD sequence numbers", is_correct: false },
      { text: "Routers request full LSA payloads using Link-State Request packets", is_correct: false },
      { text: "Routers transmit periodic Hello packets to discover neighbor IDs", is_correct: false }
    ]
  },
  {
    stem: "What are the default OSPF hello and dead intervals on a Point-to-Point serial or Ethernet link?",
    explanation: "On point-to-point network types, the Hello interval defaults to 10 seconds and the Dead interval is 4 times the Hello interval (40 seconds).",
    domain: "ip_routing",
    subtopic: "OSPF Network Types",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Hello: 10 seconds, Dead: 40 seconds", is_correct: true },
      { text: "Hello: 30 seconds, Dead: 120 seconds", is_correct: false },
      { text: "Hello: 5 seconds, Dead: 20 seconds", is_correct: false },
      { text: "Hello: 60 seconds, Dead: 180 seconds", is_correct: false }
    ]
  },
  {
    stem: "What is the role of an OSPF Link-State Acknowledgment (LSAck) packet?",
    explanation: "An LSAck packet explicitly confirms the receipt of Link-State Update (LSU) packets, ensuring that LSA flooding across adjacent OSPF routers is reliable over IP Protocol 89.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Explicitly acknowledges receipt of Link-State Updates (LSUs) to ensure reliable LSA flooding", is_correct: true },
      { text: "Acknowledges client DHCP discovery requests on untrusted ports", is_correct: false },
      { text: "Confirms receipt of BGP TCP SYN packets", is_correct: false },
      { text: "Synchronizes the local system clock with an NTP time server", is_correct: false }
    ]
  },
  {
    stem: "Two adjacent routers on a shared Ethernet link are configured with OSPF. Router A is configured for Area 0, while Router B is configured for Area 1. What will be the outcome?",
    explanation: "OSPF requires neighbor routers on a common subnet to be in the same OSPF area. If area IDs do not match, the routers will discard each other's Hellos and will fail to establish an adjacency.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The routers will drop Hello packets due to an Area ID mismatch and fail to form an adjacency", is_correct: true },
      { text: "The routers will form an adjacency and automatically merge Area 0 and Area 1", is_correct: false },
      { text: "The routers will form an adjacency in 2-Way state only", is_correct: false },
      { text: "Router B will automatically reconfigure its area to match Router A", is_correct: false }
    ]
  },
  {
    stem: "In OSPFv3, how are multiple OSPF processes or address families differentiated across a single shared physical link?",
    explanation: "OSPFv3 includes an 8-bit 'Instance ID' field in its standard packet header, allowing multiple independent OSPFv3 routing instances to run concurrently across the same physical link.",
    domain: "ip_routing",
    subtopic: "OSPFv3",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Using the 8-bit Instance ID field in the OSPFv3 packet header", is_correct: true },
      { text: "Using distinct TCP port numbers for each process", is_correct: false },
      { text: "Using different 802.1Q VLAN tags on the physical link", is_correct: false },
      { text: "By hashing the router's physical MAC address", is_correct: false }
    ]
  },
  {
    stem: "What is the default number of equal-cost paths Cisco IOS installs into the routing table for Equal-Cost Multipath (ECMP) routing?",
    explanation: "By default, Cisco IOS supports up to 4 equal-cost paths for ECMP, which can be tuned up to 16 or 32 using the `maximum-paths` router command.",
    domain: "ip_routing",
    subtopic: "Routing Concepts",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "4 equal-cost paths", is_correct: true },
      { text: "1 single path only", is_correct: false },
      { text: "16 equal-cost paths", is_correct: false },
      { text: "Unlimited paths", is_correct: false }
    ]
  },

  // ==========================================
  // SERVICES_SECURITY (11 questions)
  // ==========================================
  {
    stem: "On a switch configured with DHCP Snooping, which switch ports must be explicitly designated as 'trusted' using the 'ip dhcp snooping trust' command?",
    explanation: "Switch ports that connect to authorized DHCP servers or uplink ports that connect to DHCP relay routers must be configured as trusted, allowing DHCP server responses (OFFER and ACK) to enter the switch.",
    domain: "services_security",
    subtopic: "DHCP Snooping",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Uplink ports connected to authorized DHCP servers or upstream DHCP relay routers", is_correct: true },
      { text: "All access ports connected to end-user desktop computers", is_correct: false },
      { text: "Ports connected to IP phones on the voice VLAN", is_correct: false },
      { text: "The dedicated SPAN destination port", is_correct: false }
    ]
  },
  {
    stem: "Why must the 'ip helper-address' command be configured on the router's local LAN interface (default gateway) rather than on the WAN interface?",
    explanation: "The router must intercept the client's Layer 2/3 broadcast DHCPDISCOVER packet on the incoming LAN access subnet where it originates, before the broadcast is dropped at the router boundary.",
    domain: "services_security",
    subtopic: "DHCP and Helper Address",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "To intercept the client's local broadcast DHCP request on the LAN interface before it is discarded by the router", is_correct: true },
      { text: "Because WAN interfaces cannot process UDP packets", is_correct: false },
      { text: "To encrypt the DHCP payload with IPsec before leaving the LAN", is_correct: false },
      { text: "Because helper addresses are only supported on FastEthernet interfaces", is_correct: false }
    ]
  },
  {
    stem: "Which DNS resource record type defines an alias that maps one domain name to an existing canonical domain name?",
    explanation: "A CNAME (Canonical Name) record is an alias record used in DNS to point one hostname (e.g. www.example.com) to another canonical hostname (e.g. server1.example.com).",
    domain: "services_security",
    subtopic: "DNS Record Types",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "CNAME record", is_correct: true },
      { text: "A record", is_correct: false },
      { text: "MX record", is_correct: false },
      { text: "NS record", is_correct: false }
    ]
  },
  {
    stem: "In IPsec negotiation, what is the role of Diffie-Hellman (DH) key exchange during IKE Phase 1?",
    explanation: "Diffie-Hellman allows two peer gateways to securely generate a shared symmetric secret key over an unsecure public network without transmitting the secret key over the wire.",
    domain: "services_security",
    subtopic: "IPsec Site-to-Site",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Allows two peers to securely generate a shared secret key over an untrusted public network without transmitting the key itself", is_correct: true },
      { text: "Verifies the cryptographic hash of the operating system image file", is_correct: false },
      { text: "Compresses IP payloads using LZW compression algorithms", is_correct: false },
      { text: "Assigns dynamic IP addresses to remote branch routers", is_correct: false }
    ]
  },
  {
    stem: "In hardware-accelerated Cisco Catalyst switches, at what layer does IPv6 RA Guard inspect and filter rogue Router Advertisements at line rate?",
    explanation: "Cisco Catalyst switches implement RA Guard directly in hardware (Data Plane ASICs / TCAM), allowing packets to be inspected and dropped at wire speed without burdening the main switch CPU.",
    domain: "services_security",
    subtopic: "IPv6 RA Guard",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "In hardware TCAM / Data Plane ASICs at wire speed", is_correct: true },
      { text: "In software CPU memory buffers exclusively", is_correct: false },
      { text: "On an external syslog monitoring server", is_correct: false },
      { text: "Inside the flash NVRAM memory card", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco IOS command configures a router to synchronize its system clock with an NTP time server at IP address 192.168.1.10?",
    explanation: "The command `ntp server 192.168.1.10` configures the router in NTP client mode to sync its clock from the specified time server.",
    domain: "services_security",
    subtopic: "NTP Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ntp server 192.168.1.10", is_correct: true },
      { text: "clock set server 192.168.1.10", is_correct: false },
      { text: "ntp sync 192.168.1.10", is_correct: false },
      { text: "service ntp 192.168.1.10", is_correct: false }
    ]
  },
  {
    stem: "When configuring Dynamic PAT (NAT Overload) on a Cisco router, what is the purpose of associating a standard Access Control List (ACL) with the NAT command?",
    explanation: "The ACL defines 'interesting traffic' by matching the inside private source IP addresses that are permitted to undergo NAT translation to the outside public IP address.",
    domain: "services_security",
    subtopic: "Network Address Translation",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It defines which internal private IP addresses are permitted to be translated", is_correct: true },
      { text: "It blocks inbound Telnet access to the router loopback", is_correct: false },
      { text: "It encrypts translated packets with an IPsec transform set", is_correct: false },
      { text: "It allocates public IP addresses to external internet hosts", is_correct: false }
    ]
  },
  {
    stem: "Which transport protocol and default UDP port number are utilized by Syslog to transmit logging events from network devices to an external log server?",
    explanation: "Syslog standardly transmits event messages over UDP port 514.",
    domain: "services_security",
    subtopic: "Network Services",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "UDP port 514", is_correct: true },
      { text: "TCP port 514", is_correct: false },
      { text: "UDP port 161", is_correct: false },
      { text: "TCP port 8080", is_correct: false }
    ]
  },
  {
    stem: "In an extended Cisco IPv4 ACL, what is the function of the 'established' keyword in the statement 'permit tcp any 192.168.1.0 0.0.0.255 established'?",
    explanation: "The `established` keyword matches TCP packets that have the ACK or RST control bit set in their header, allowing return traffic for outbound TCP sessions while blocking inbound connection attempts (SYN packets).",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Matches TCP packets with the ACK or RST flag set, allowing return traffic for established outbound connections", is_correct: true },
      { text: "Allows inbound TCP SYN packets to initiate new web server sessions", is_correct: false },
      { text: "Verifies the cryptographic signature of the TCP payload", is_correct: false },
      { text: "Ensures the connection has been active for at least 60 seconds", is_correct: false }
    ]
  },
  {
    stem: "What is the security objective of executing 'no ip http server' and 'no ip http secure-server' on a production Cisco router?",
    explanation: "These commands disable the integrated HTTP and HTTPS web management servers on the router, closing TCP ports 80 and 443 to eliminate exposure to web interface vulnerabilities and unauthorized web access.",
    domain: "services_security",
    subtopic: "Device Hardening",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Disables the unencrypted HTTP and HTTPS web management services, closing open web ports to prevent web interface exploits", is_correct: true },
      { text: "Blocks all LAN clients from browsing external internet web servers", is_correct: false },
      { text: "Prevents the router from obtaining an IP address via DHCP", is_correct: false },
      { text: "Disables hardware packet routing between VLANs", is_correct: false }
    ]
  },
  {
    stem: "What is the recommended minimum RSA key modulus length in bits when generating SSH server keys ('crypto key generate rsa') on modern Cisco devices?",
    explanation: "Cisco and modern cryptographic guidelines recommend an RSA key modulus of at least 2048 bits for secure SSH operations (1024 bits is legacy; 768 bits is deprecated).",
    domain: "services_security",
    subtopic: "SSH Configuration",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "2048 bits", is_correct: true },
      { text: "512 bits", is_correct: false },
      { text: "768 bits", is_correct: false },
      { text: "128 bits", is_correct: false }
    ]
  },

  // ==========================================
  // AI_OPS (5 questions)
  // ==========================================
  {
    stem: "In network Infrastructure as Code (IaC), what is 'Configuration Drift'?",
    explanation: "Configuration drift occurs when manual CLI or ad-hoc changes are made directly on network devices, causing the actual device configuration to diverge from the source of truth stored in the Git repository.",
    domain: "ai_ops",
    subtopic: "Infrastructure as Code",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "The gradual divergence between the actual device configuration and the declared state stored in the Git repository due to ad-hoc manual changes", is_correct: true },
      { text: "The physical degradation of copper patch cords over multiple years", is_correct: false },
      { text: "The shift in system clock time between NTP stratum servers", is_correct: false },
      { text: "The fluctuation of radio frequency channels in Wi-Fi networks", is_correct: false }
    ]
  },
  {
    stem: "Which transport protocol and standard TCP destination port does the Network Configuration Protocol (NETCONF) use to establish secure management sessions to devices?",
    explanation: "NETCONF (RFC 6241) standardly operates over an encrypted SSH connection using TCP port 830 (or optionally over TLS).",
    domain: "ai_ops",
    subtopic: "Model-Driven Programmability",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "SSH over TCP port 830", is_correct: true },
      { text: "HTTP over TCP port 80", is_correct: false },
      { text: "Telnet over TCP port 23", is_correct: false },
      { text: "TFTP over UDP port 69", is_correct: false }
    ]
  },
  {
    stem: "What is 'Zero-Shot Prompting' when using a Large Language Model (LLM) for network automation or troubleshooting?",
    explanation: "Zero-shot prompting refers to asking the LLM to solve a problem or generate code directly without providing any prior contextual examples or demonstrations in the prompt.",
    domain: "ai_ops",
    subtopic: "Prompt Engineering",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Prompting the model to perform a task directly without providing any examples or reference demonstrations in the prompt", is_correct: true },
      { text: "Executing a script without passing any command-line arguments", is_correct: false },
      { text: "Rebooting a router without saving the running configuration to NVRAM", is_correct: false },
      { text: "Deploying automation without running unit tests", is_correct: false }
    ]
  },
  {
    stem: "Which HTTP request method is used in RESTful APIs to retrieve configuration or operational data from a network controller without modifying server state?",
    explanation: "The HTTP `GET` method is safe and idempotent, used in REST APIs to retrieve resources or data without causing side effects or modifying server state.",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "GET", is_correct: true },
      { text: "POST", is_correct: false },
      { text: "PUT", is_correct: false },
      { text: "DELETE", is_correct: false }
    ]
  },
  {
    stem: "In Model-Driven Telemetry, what is the difference between 'cadence-based' (periodic) telemetry and 'on-change' (event-driven) telemetry?",
    explanation: "Cadence-based telemetry streams structured device data continuously at fixed periodic intervals (e.g. interface counters every 10 seconds). On-change telemetry transmits data only when an operational event or state change occurs (e.g. interface status changes from up to down).",
    domain: "ai_ops",
    subtopic: "Telemetry and Monitoring",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Cadence-based streams data at fixed periodic intervals; on-change streams data only when a state transition or threshold event occurs", is_correct: true },
      { text: "Cadence-based uses UDP; on-change uses TCP exclusively", is_correct: false },
      { text: "Cadence-based runs on switches; on-change runs on firewalls", is_correct: false },
      { text: "Cadence-based requires an optical fiber connection; on-change requires Wi-Fi", is_correct: false }
    ]
  }
];

const batchPath = path.join(__dirname, 'batches', 'seed-32-volume.json');
fs.writeFileSync(batchPath, JSON.stringify(questions, null, 2) + '\n');
console.log(`Generated ${questions.length} questions in ${batchPath}`);
