#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const questions = [
  // ==========================================
  // NETWORK_INFRA (14 questions)
  // ==========================================
  {
    stem: "Which 8-bit field in the IPv6 header serves an equivalent purpose to the IPv4 Time to Live (TTL) field by preventing packets from circulating indefinitely?",
    explanation: "The Hop Limit field in the IPv6 header is an 8-bit field decremented by 1 at each router hop. If it reaches zero, the packet is discarded and an ICMPv6 Time Exceeded message is returned to the source, exactly matching IPv4 TTL behavior.",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Hop Limit", is_correct: true },
      { text: "Traffic Class", is_correct: false },
      { text: "Flow Label", is_correct: false },
      { text: "Next Header", is_correct: false }
    ]
  },
  {
    stem: "What is the primary function of the 20-bit Flow Label field in an IPv6 packet header?",
    explanation: "The 20-bit Flow Label field identifies packets belonging to a specific unidirectional flow from a source to a destination, allowing intermediate routers to apply uniform handling (like QoS or ECMP path pinning) without inspecting upper-layer transport headers.",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Enables routers to identify and provide consistent QoS or ECMP treatment to packets within the same flow without deep packet inspection", is_correct: true },
      { text: "Indicates the transport layer protocol encapsulated immediately following the base IPv6 header", is_correct: false },
      { text: "Defines the explicit path and sequence of intermediate hop addresses the packet must traverse", is_correct: false },
      { text: "Carries fragmentation offset and reassembly identification parameters for datagrams exceeding path MTU", is_correct: false }
    ]
  },
  {
    stem: "In an IPv6 header, which field indicates either the transport layer protocol (such as TCP or UDP) or the presence of an extension header immediately following the base header?",
    explanation: "The Next Header field (8 bits) in IPv6 replaces the IPv4 'Protocol' field. It specifies the type of header immediately following the IPv6 header, which may be an IPv6 extension header (e.g., Routing, Fragment, ESP) or an upper-layer protocol like TCP (6) or UDP (17).",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Next Header", is_correct: true },
      { text: "Traffic Class", is_correct: false },
      { text: "Payload Length", is_correct: false },
      { text: "Extension Pointer", is_correct: false }
    ]
  },
  {
    stem: "A network administrator troubleshoots a workstation that fails to reach internet resources. Running 'ipconfig' reveals an IPv4 address of 169.254.120.45 with subnet mask 255.255.0.0. What is the root cause of this addressing state?",
    explanation: "An address in the 169.254.0.0/16 range is an Automatic Private IP Addressing (APIPA) address. Operating systems automatically assign an APIPA link-local address when DHCP discovery requests fail to receive a DHCP offer.",
    domain: "network_infra",
    subtopic: "Client Connectivity Troubleshooting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The client timed out attempting to locate and obtain an IP address from a DHCP server", is_correct: true },
      { text: "The default gateway router rejected the client's ARP request due to an access list violation", is_correct: false },
      { text: "A duplicate static IP address was detected on the local subnet by gratuitous ARP", is_correct: false },
      { text: "The DNS server supplied an invalid gateway address causing an automatic fallback route", is_correct: false }
    ]
  },
  {
    stem: "A technician notices that users connected to a 1000BASE-T switch port experience intermittent link flapping and high CRC errors. Testing reveals excessive near-end crosstalk (NEXT). Which physical layer issue is the most likely cause?",
    explanation: "Near-end crosstalk (NEXT) is typically caused by untwisting wire pairs excessively at the termination point (patch panel or RJ-45 modular plug), exceeding the recommended 0.5-inch maximum untwist standard (TIA/EIA-568).",
    domain: "network_infra",
    subtopic: "Client Connectivity Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Excessive untwisting of copper wire pairs during cable termination at the patch panel or connector", is_correct: true },
      { text: "Exceeding the maximum 10-meter attenuation limit for single-mode fiber patch cords", is_correct: false },
      { text: "Misconfigured full-duplex auto-negotiation between the NIC and the switch", is_correct: false },
      { text: "Incorrect subnet masking applied to the host operating system virtual adapter", is_correct: false }
    ]
  },
  {
    stem: "Which IPv4 address block is designated by RFC 5737 specifically for documentation and educational materials, ensuring it is non-routable on the public Internet?",
    explanation: "RFC 5737 reserves three blocks for documentation: TEST-NET-1 (192.0.2.0/24), TEST-NET-2 (198.51.100.0/24), and TEST-NET-3 (203.0.113.0/24). These blocks are filtered and never routed across the public Internet.",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "192.0.2.0/24", is_correct: true },
      { text: "100.64.0.0/10", is_correct: false },
      { text: "169.254.0.0/16", is_correct: false },
      { text: "198.18.0.0/15", is_correct: false }
    ]
  },
  {
    stem: "An ISP assigns Carrier-Grade NAT (CGNAT) addresses to residential subscribers. Which IPv4 address space specified in RFC 6598 is dedicated for this purpose?",
    explanation: "RFC 6598 allocates the Shared Address Space 100.64.0.0/10 for Carrier-Grade NAT (CGNAT) / Large Scale NAT (LSN) deployments between ISP infrastructure and customer premises equipment.",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "100.64.0.0/10", is_correct: true },
      { text: "172.16.0.0/12", is_correct: false },
      { text: "192.88.99.0/24", is_correct: false },
      { text: "198.51.100.0/24", is_correct: false }
    ]
  },
  {
    stem: "Which Wi-Fi amendment introduces Orthogonal Frequency-Division Multiple Access (OFDMA), Target Wake Time (TWT), and operates simultaneously across the 2.4 GHz and 5 GHz frequency bands?",
    explanation: "IEEE 802.11ax (branded as Wi-Fi 6) introduced OFDMA (subdividing channels into resource units for concurrent multi-client transmission), Target Wake Time (TWT) for client power savings, and operates in both 2.4 GHz and 5 GHz bands (and 6 GHz for Wi-Fi 6E).",
    domain: "network_infra",
    subtopic: "Wireless Standards",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "IEEE 802.11ax", is_correct: true },
      { text: "IEEE 802.11ac", is_correct: false },
      { text: "IEEE 802.11n", is_correct: false },
      { text: "IEEE 802.11be", is_correct: false }
    ]
  },
  {
    stem: "What maximum channel bandwidth does the IEEE 802.11ac (Wi-Fi 5) standard support through mandatory or optional channel bonding?",
    explanation: "IEEE 802.11ac defines mandatory 80 MHz channel widths and optional 160 MHz (either contiguous 160 MHz or non-contiguous 80+80 MHz) bonding exclusively in the 5 GHz spectrum.",
    domain: "network_infra",
    subtopic: "Wireless Standards",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "160 MHz", is_correct: true },
      { text: "80 MHz", is_correct: false },
      { text: "320 MHz", is_correct: false },
      { text: "40 MHz", is_correct: false }
    ]
  },
  {
    stem: "In a traditional Cisco three-tier hierarchical campus network architecture, which layer is responsible for policy routing, access control list (ACL) packet filtering, and boundary definition between broadcast domains?",
    explanation: "The distribution layer acts as the boundary between the access layer and core layer, aggregating wiring closets, terminating Layer 2 broadcast domains, enforcing security filtering via ACLs, and performing inter-VLAN routing.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Distribution layer", is_correct: true },
      { text: "Core layer", is_correct: false },
      { text: "Access layer", is_correct: false },
      { text: "Collapsed core layer", is_correct: false }
    ]
  },
  {
    stem: "Under what operational constraint is a collapsed core (two-tier) campus design recommended over a full three-tier hierarchical architecture?",
    explanation: "A two-tier collapsed core design combines the distribution and core layers into a single switching layer. It is recommended for smaller or medium-sized campus networks to lower capital equipment cost, reduce cabling complexity, and simplify management without sacrificing basic redundancy.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "In small to medium-sized campuses where traffic volume does not warrant dedicated core switches, reducing cost and complexity", is_correct: true },
      { text: "When WAN edge routing protocols require deterministic link-state area border router boundaries on every switch", is_correct: false },
      { text: "To eliminate the need for redundant uplink connections from access switches to aggregation points", is_correct: false },
      { text: "When zero-trust 802.1X authentication must be terminated exclusively on chassis-based core equipment", is_correct: false }
    ]
  },
  {
    stem: "What value does the IPv4 Header Length (IHL) field contain when an IPv4 datagram has no optional header fields attached?",
    explanation: "The IHL field specifies header length in 32-bit (4-byte) words. The minimum IPv4 header is 20 bytes long. 20 bytes divided by 4 equals 5, so the IHL value is binary 0101 (decimal 5).",
    domain: "network_infra",
    subtopic: "IPv4 Header",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "5 (representing five 32-bit words, or 20 bytes)", is_correct: true },
      { text: "20 (representing total bytes directly in decimal)", is_correct: false },
      { text: "4 (representing four 32-bit words, or 16 bytes)", is_correct: false },
      { text: "1 (representing one base header segment)", is_correct: false }
    ]
  },
  {
    stem: "Which 3-bit flag combination in the IPv4 header signals that a packet has been fragmented and that additional fragments belonging to the same original datagram are following?",
    explanation: "In the 3-bit IPv4 Flags field, bit 0 is reserved (0), bit 1 is Don't Fragment (DF), and bit 2 is More Fragments (MF). When MF is set to 1, it indicates that more fragments follow. The final fragment has MF set to 0 with a non-zero Fragment Offset.",
    domain: "network_infra",
    subtopic: "IPv4 Header",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "More Fragments (MF) bit set to 1", is_correct: true },
      { text: "Don't Fragment (DF) bit set to 1", is_correct: false },
      { text: "Reserved bit set to 1", is_correct: false },
      { text: "Both DF and MF bits set to 1 simultaneously", is_correct: false }
    ]
  },
  {
    stem: "In modern data center leaf-spine architectures, why is all east-west traffic guaranteed predictable and consistent latency between any arbitrary pair of access servers?",
    explanation: "In a leaf-spine network, every leaf switch connects to every spine switch, and spine switches do not interconnect with each other. Consequently, any server attached to leaf A communicating with a server on leaf B traverses exactly two hops (leaf -> spine -> leaf), guaranteeing deterministic latency.",
    domain: "network_infra",
    subtopic: "Spine-Leaf Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Every leaf switch connects directly to every spine switch, ensuring all leaf-to-leaf paths are exactly two hops", is_correct: true },
      { text: "Spine switches run Spanning Tree Protocol to block redundant links and eliminate frame jitter", is_correct: false },
      { text: "Leaf switches establish direct horizontal inter-switch trunks across adjacent server racks", is_correct: false },
      { text: "Traffic between servers is forwarded exclusively at Layer 2 without IP routing encapsulation", is_correct: false }
    ]
  },

  // ==========================================
  // SWITCHING (14 questions)
  // ==========================================
  {
    stem: "A network engineer connects two Cisco Catalyst switches using an Ethernet cable. Switch 1 is configured with 'switchport mode dynamic desirable'. What mode must be configured on Switch 2 for the link to become an 802.1Q trunk?",
    explanation: "Dynamic Desirable actively seeks to form a trunk. If the opposite side is set to 'trunk', 'dynamic desirable', or 'dynamic auto', DTP negotiations succeed and the port transitions to trunking state.",
    domain: "switching",
    subtopic: "DTP Negotiation",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Dynamic auto, dynamic desirable, or trunk", is_correct: true },
      { text: "Only dynamic desirable", is_correct: false },
      { text: "Only access mode", is_correct: false },
      { text: "Access or nonegotiate mode", is_correct: false }
    ]
  },
  {
    stem: "What happens when an engineer configures 'switchport nonegotiate' on a switch interface configured with 'switchport mode dynamic auto'?",
    explanation: "The 'switchport nonegotiate' command disables DTP frame transmission. However, Cisco IOS rejects this command if the port is in dynamic mode (auto or desirable). It requires the port to be statically set to 'switchport mode trunk' or 'switchport mode access' first.",
    domain: "switching",
    subtopic: "DTP Negotiation",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "The switch rejects the command because nonegotiate is only supported on static trunk or access ports", is_correct: true },
      { text: "The port permanently negotiates access mode with its connected neighbor", is_correct: false },
      { text: "The port converts immediately to an 802.1Q trunk without sending DTP packets", is_correct: false },
      { text: "The port enters an err-disabled state due to a DTP mode conflict", is_correct: false }
    ]
  },
  {
    stem: "Which DTP mode combination on two interconnected Cisco switch ports results in an operational mode of access rather than a trunk?",
    explanation: "When both sides are configured as 'dynamic auto', neither side actively initiates trunk negotiation. Both sides passively listen for DTP frames, resulting in both interfaces remaining as access ports.",
    domain: "switching",
    subtopic: "DTP Negotiation",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Dynamic auto on both ends", is_correct: true },
      { text: "Dynamic desirable on both ends", is_correct: false },
      { text: "Dynamic desirable connected to dynamic auto", is_correct: false },
      { text: "Trunk connected to dynamic auto", is_correct: false }
    ]
  },
  {
    stem: "A switch administrator configures 'storm-control broadcast level 20.0 10.0' on an access port. How does the switch respond to incoming broadcast traffic?",
    explanation: "When broadcast traffic exceeds 20.0% of total interface bandwidth (rising threshold), the switch drops incoming broadcast packets. It resumes normal forwarding once broadcast volume falls below 10.0% of bandwidth (falling threshold).",
    domain: "switching",
    subtopic: "Storm Control",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It blocks broadcast traffic when volume exceeds 20.0% bandwidth until traffic falls back below 10.0%", is_correct: true },
      { text: "It places the interface into err-disabled state when broadcast traffic exceeds 20.0% bandwidth", is_correct: false },
      { text: "It shapes broadcast traffic between a minimum rate of 10% and maximum rate of 20%", is_correct: false },
      { text: "It sends an SNMP trap at 10% utilization and shuts down the port at 20% utilization", is_correct: false }
    ]
  },
  {
    stem: "Which optional parameter can be appended to a Cisco IOS storm-control interface command to force the interface into err-disable when the configured threshold is breached?",
    explanation: "By default, storm-control merely drops offending packets when the threshold is reached. Configuring 'storm-control action shutdown' causes the switch to disable the port and transition it to err-disabled state upon a storm violation.",
    domain: "switching",
    subtopic: "Storm Control",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "action shutdown", is_correct: true },
      { text: "action errdisable", is_correct: false },
      { text: "action trap-only", is_correct: false },
      { text: "action drop", is_correct: false }
    ]
  },
  {
    stem: "When an IP phone is connected to an access port configured with 'switchport voice vlan 150', how does the Cisco switch inform the IP phone of its voice VLAN assignment?",
    explanation: "Cisco switches send CDP (or LLDP-MED in multi-vendor environments) packets to the attached IP phone, instructing the phone to tag voice packets with VLAN 150 and an 802.1p priority (typically CoS 5).",
    domain: "switching",
    subtopic: "Voice VLANs",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Via Cisco Discovery Protocol (CDP) or LLDP-MED packet exchanges", is_correct: true },
      { text: "Through DHCP Option 82 metadata injected into the initial lease request", is_correct: false },
      { text: "By transmitting 802.1Q DTP negotiation frames directly to the phone OS", is_correct: false },
      { text: "Through Gratuitous ARP broadcasts emitted by the switch virtual interface", is_correct: false }
    ]
  },
  {
    stem: "An engineer inspects the running configuration of a Cisco switch interface: 'switchport mode access', 'switchport access vlan 10', 'switchport voice vlan 20'. How are frames from a PC daisy-chained to the IP phone handled by the switch?",
    explanation: "Untagged traffic from the PC passes through the IP phone's internal switch and arrives untagged at the access switch port, where it is mapped to access VLAN 10. Voice packets are tagged with VLAN 20 by the phone.",
    domain: "switching",
    subtopic: "Voice VLANs",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "PC traffic arrives untagged and is placed into data VLAN 10", is_correct: true },
      { text: "PC traffic is automatically encapsulated into voice VLAN 20 with CoS 0", is_correct: false },
      { text: "PC traffic is tagged with VLAN 0 and discarded by default", is_correct: false },
      { text: "PC traffic is blocked until the phone completes 802.1X authentication", is_correct: false }
    ]
  },
  {
    stem: "Which standard, vendor-neutral Layer 2 discovery protocol operates under the IEEE 802.1AB standard and allows heterogeneous network devices to advertise identity and capabilities?",
    explanation: "Link Layer Discovery Protocol (LLDP) is standardized under IEEE 802.1AB. It is a vendor-neutral Layer 2 protocol used by network devices to advertise their identity, capabilities, and neighbors.",
    domain: "switching",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "LLDP (Link Layer Discovery Protocol)", is_correct: true },
      { text: "CDP (Cisco Discovery Protocol)", is_correct: false },
      { text: "EDP (Extreme Discovery Protocol)", is_correct: false },
      { text: "FDP (Foundry Discovery Protocol)", is_correct: false }
    ]
  },
  {
    stem: "Which LLDP extension is specifically designed for automated communication between network infrastructure devices and voice/video endpoints like IP phones and wireless access points?",
    explanation: "LLDP-MED (Media Endpoint Discovery) is an extension of LLDP that supports voice VLAN configuration, power management (PoE), QoS policy assignment, and physical inventory location data for endpoints.",
    domain: "switching",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "LLDP-MED (Media Endpoint Discovery)", is_correct: true },
      { text: "LLDP-QoS", is_correct: false },
      { text: "LLDP-PoE", is_correct: false },
      { text: "LLDP-TLV", is_correct: false }
    ]
  },
  {
    stem: "On a Cisco multilayer switch, what is the key difference between a Switch Virtual Interface (SVI) and a routed port configured with 'no switchport'?",
    explanation: "An SVI is a logical Layer 3 interface representing a VLAN (e.g., 'interface Vlan10') that routes traffic for multiple physical Layer 2 access or trunk ports. A routed port ('no switchport') converts an individual physical interface into a dedicated Layer 3 interface with its own IP address.",
    domain: "switching",
    subtopic: "Layer 3 Switching",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "An SVI routes traffic for multiple Layer 2 ports in a VLAN, whereas a routed port is an individual physical interface operating directly at Layer 3", is_correct: true },
      { text: "An SVI operates only with static routes, whereas a routed port can participate in dynamic routing protocols like OSPF", is_correct: false },
      { text: "An SVI requires 'no switchport' to accept an IP address, whereas a routed port accepts IP configuration in default mode", is_correct: false },
      { text: "An SVI supports hardware-based CEF forwarding, whereas a routed port forces CPU process switching", is_correct: false }
    ]
  },
  {
    stem: "What global configuration command is mandatory on a Cisco Catalyst switch to enable hardware routing of IPv4 packets between SVIs?",
    explanation: "On many Cisco Catalyst multilayer switches, Layer 3 routing is disabled by default. The global configuration command 'ip routing' must be entered to enable the routing engine and forward packets between SVIs.",
    domain: "switching",
    subtopic: "Layer 3 Switching",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ip routing", is_correct: true },
      { text: "router enable", is_correct: false },
      { text: "ip forward-protocol", is_correct: false },
      { text: "switchport routing", is_correct: false }
    ]
  },
  {
    stem: "When configuring local Switched Port Analyzer (SPAN) on a Cisco switch to capture traffic for analysis, what restriction applies to the destination monitoring port?",
    explanation: "A SPAN destination interface receives copied traffic for packet capture tools. It disables Layer 2 protocols (STP, CDP, VTP, DTP) and cannot transmit ordinary ingress user traffic unless explicitly configured with the 'ingress' parameter.",
    domain: "switching",
    subtopic: "Packet Capture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The destination port does not forward ordinary user traffic and ignores incoming Layer 2 control protocols", is_correct: true },
      { text: "The destination port must reside in the same VLAN as the source monitoring interface", is_correct: false },
      { text: "The destination port must be configured as an 802.1Q trunk port carrying native VLAN 1", is_correct: false },
      { text: "The destination port can only monitor traffic in the rx (receive) direction", is_correct: false }
    ]
  },
  {
    stem: "Which SPAN feature encapsulates mirrored traffic into a dedicated RSPAN VLAN across intermediary Layer 2 trunk switches to reach an analyzer connected on a remote switch?",
    explanation: "Remote SPAN (RSPAN) uses a specially designated RSPAN VLAN to carry captured traffic across standard 802.1Q trunk links from the source switch to a destination switch hosting the network analyzer.",
    domain: "switching",
    subtopic: "Packet Capture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "RSPAN (Remote SPAN)", is_correct: true },
      { text: "ERSPAN (Encapsulated Remote SPAN)", is_correct: false },
      { text: "VSPAN (VLAN-based SPAN)", is_correct: false },
      { text: "FlowSPAN", is_correct: false }
    ]
  },
  {
    stem: "What action does a switch take on a port configured with port security violation mode 'restrict' when an unauthorized MAC address sends a frame?",
    explanation: "In 'restrict' mode, the switch drops frames with unauthorized MAC addresses, generates an SNMP trap and syslog message, and increments the security violation counter, but leaves the port in an operational 'up' state without shutting it down.",
    domain: "switching",
    subtopic: "Port Security",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Drops the offending traffic, logs a syslog message, and increments the violation counter without disabling the port", is_correct: true },
      { text: "Immediately puts the port into err-disabled state and turns off the interface LED", is_correct: false },
      { text: "Silently drops unauthorized frames without logging or incrementing violation counters", is_correct: false },
      { text: "Temporarily suspends the port for 300 seconds before automatically recovering", is_correct: false }
    ]
  },

  // ==========================================
  // IP_ROUTING (11 questions)
  // ==========================================
  {
    stem: "A network engineer configures a backup static route on a Cisco router: 'ip route 192.168.50.0 255.255.255.0 10.1.1.2 130'. The primary path to 192.168.50.0/24 is learned via OSPF. What is this backup configuration called?",
    explanation: "A floating static route is a static route configured with an administrative distance higher than the primary routing protocol (OSPF AD is 110; this route has AD 130). It remains dormant and only installs into the routing table when the primary OSPF route fails.",
    domain: "ip_routing",
    subtopic: "Floating Static Routes",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Floating static route", is_correct: true },
      { text: "Recursive static route", is_correct: false },
      { text: "Fully specified static route", is_correct: false },
      { text: "Summary static route", is_correct: false }
    ]
  },
  {
    stem: "What will cause a floating static route pointing to an Ethernet next-hop address to fail to activate when the remote router's interface goes down, assuming no link-loss forwarding is present?",
    explanation: "If the next-hop IP is reachable across an intermediate Layer 2 switch, the local router's Ethernet link remains 'up/up' even if the remote router fails. Without IP SLA tracking or BFD, the router cannot detect upstream link failure, preventing dynamic route cutover.",
    domain: "ip_routing",
    subtopic: "Floating Static Routes",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "The local outgoing interface remains up/up because it connects to an intermediate switch, requiring IP SLA tracking to detect next-hop failure", is_correct: true },
      { text: "The administrative distance of a floating static route cannot exceed the maximum OSPF metric value of 65535", is_correct: false },
      { text: "Static routes cannot floatingly back up dynamic routing protocols on multiaccess interfaces", is_correct: false },
      { text: "ARP cache entries never expire for static route next hops unless manually cleared", is_correct: false }
    ]
  },
  {
    stem: "What is the default Administrative Distance (AD) of an internal EIGRP route on a Cisco IOS router?",
    explanation: "On Cisco IOS routers, internal EIGRP routes have a default administrative distance of 90. External EIGRP routes have an AD of 170.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "90", is_correct: true },
      { text: "110", is_correct: false },
      { text: "100", is_correct: false },
      { text: "120", is_correct: false }
    ]
  },
  {
    stem: "A router learns identical prefix 172.20.0.0/16 from RIP (AD 120), OSPF (AD 110), and external BGP (AD 20). Which route will the router install into its active routing table?",
    explanation: "When a router receives paths to the exact same prefix with identical prefix lengths from multiple routing sources, it selects the route with the lowest Administrative Distance. External BGP has an AD of 20, beating OSPF (110) and RIP (120).",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The external BGP route, because it possesses the lowest administrative distance (20)", is_correct: true },
      { text: "The OSPF route, because link-state protocols take precedence over distance-vector protocols", is_correct: false },
      { text: "The RIP route, because hop count calculation takes precedence over bandwidth metrics", is_correct: false },
      { text: "All three routes, load-balancing traffic via unequal cost multipathing", is_correct: false }
    ]
  },
  {
    stem: "Which command configures a static default route in IPv6 pointing to next-hop address 2001:db8:acad:1::1 on a Cisco router?",
    explanation: "In IPv6, the default route is written as '::/0' (all zeroes with prefix length /0). The correct syntax is 'ipv6 route ::/0 2001:db8:acad:1::1'.",
    domain: "ip_routing",
    subtopic: "IPv6 Static Routing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ipv6 route ::/0 2001:db8:acad:1::1", is_correct: true },
      { text: "ip route ::/0 2001:db8:acad:1::1", is_correct: false },
      { text: "ipv6 route 0.0.0.0/0 2001:db8:acad:1::1", is_correct: false },
      { text: "ipv6 default-gateway 2001:db8:acad:1::1", is_correct: false }
    ]
  },
  {
    stem: "When configuring an IPv6 static route where the next hop is a link-local address (fe80::/10), why must the exit interface also be specified in the command?",
    explanation: "Because link-local addresses are non-unique and valid only within a specific local link, multiple router interfaces could have neighbors with identical or ambiguous link-local addresses. Specifying the exit interface resolves the link scope.",
    domain: "ip_routing",
    subtopic: "IPv6 Static Routing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Link-local addresses are scoped to a single link, making the exit interface required to resolve which physical link the address belongs to", is_correct: true },
      { text: "Link-local addresses do not generate Neighbor Discovery cache entries without exit interface binding", is_correct: false },
      { text: "Cisco Express Forwarding (CEF) is unable to allocate an adjacency rewrite string without an outgoing interface", is_correct: false },
      { text: "The IPv6 Hop Limit cannot be decremented unless explicitly associated with an egress port", is_correct: false }
    ]
  },
  {
    stem: "In OSPFv2, which network type elects both a Designated Router (DR) and a Backup Designated Router (BDR), and uses a default hello interval of 10 seconds?",
    explanation: "The OSPF Broadcast network type (default on Ethernet interfaces) elects a DR and BDR to minimize adjacency overhead on multiaccess segments, and uses 10-second Hello and 40-second Dead timers.",
    domain: "ip_routing",
    subtopic: "OSPF Network Types",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Broadcast", is_correct: true },
      { text: "Point-to-point", is_correct: false },
      { text: "Non-broadcast multi-access (NBMA)", is_correct: false },
      { text: "Point-to-multipoint", is_correct: false }
    ]
  },
  {
    stem: "What occurs when two OSPF routers connected across a point-to-point Ethernet link are configured with 'ip ospf network point-to-point'?",
    explanation: "On an OSPF point-to-point network type, DR/BDR election is completely bypassed. The routers form a direct full adjacency with each other, speeding up convergence and simplifying LSDB exchange.",
    domain: "ip_routing",
    subtopic: "OSPF Network Types",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The routers bypass DR and BDR elections and establish a direct Full adjacency", is_correct: true },
      { text: "The routers require manual neighbor statements to exchange Link State Advertisements", is_correct: false },
      { text: "The Hello interval increases from 10 seconds to 30 seconds automatically", is_correct: false },
      { text: "The interfaces drop all multicast traffic and communicate solely via unicast", is_correct: false }
    ]
  },
  {
    stem: "How does OSPFv3 differ fundamentally from OSPFv2 regarding interface addressing and routing configuration?",
    explanation: "OSPFv3 is enabled directly on interfaces using 'ospf 1 area 0' (or 'ipv6 ospf 1 area 0'), runs per-link rather than per-subnet, and uses IPv6 link-local addresses for neighbor adjacencies and next-hop forwarding.",
    domain: "ip_routing",
    subtopic: "OSPFv3",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "OSPFv3 is configured per-interface rather than via global network statements and forms neighbor adjacencies using link-local addresses", is_correct: true },
      { text: "OSPFv3 uses 128-bit router IDs instead of traditional 32-bit dotted-decimal numbers", is_correct: false },
      { text: "OSPFv3 removes support for Areas, requiring all routers to participate in a flat backbone", is_correct: false },
      { text: "OSPFv3 uses TCP port 89 for transport rather than raw IP protocol 89", is_correct: false }
    ]
  },
  {
    stem: "In OSPFv3, what format is still strictly required for the Router ID (RID)?",
    explanation: "Even though OSPFv3 routes IPv6 networks, the OSPFv3 Router ID remains a 32-bit value represented in standard dotted-decimal IPv4 format (e.g., 1.1.1.1). If no IPv4 address exists on the router, the RID must be configured manually.",
    domain: "ip_routing",
    subtopic: "OSPFv3",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "A 32-bit value in standard IPv4 dotted-decimal format", is_correct: true },
      { text: "A 128-bit hexadecimal IPv6 link-local address format", is_correct: false },
      { text: "A 64-bit EUI-64 formatted identifier derived from the router MAC", is_correct: false },
      { text: "An arbitrary text string up to 64 ASCII characters", is_correct: false }
    ]
  },
  {
    stem: "During the OSPF neighbor adjacency process, in which state do two routers exchange Database Description (DBD) packets to describe their local Link-State Databases?",
    explanation: "In the Exchange state, routers send Database Description (DBD) packets describing the contents of their LSDB. In ExStart they elect master/slave; in Loading they send LSR/LSU packets; and in Full they are synchronized.",
    domain: "ip_routing",
    subtopic: "OSPF Neighbor States",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Exchange", is_correct: true },
      { text: "ExStart", is_correct: false },
      { text: "Loading", is_correct: false },
      { text: "Init", is_correct: false }
    ]
  },

  // ==========================================
  // SERVICES_SECURITY (11 questions)
  // ==========================================
  {
    stem: "Which switch security feature intercepts and inspects IPv6 Router Advertisement (RA) messages on Layer 2 access ports to prevent unauthorized rogue routers from advertising prefixes or default gateways?",
    explanation: "IPv6 RA Guard (Router Advertisement Guard) operates at Layer 2 to inspect RA messages. When configured on access ports connecting to clients, it drops unauthorized RA packets, protecting the network from rogue gateway and SLAAC spoofing attacks.",
    domain: "services_security",
    subtopic: "IPv6 RA Guard",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "IPv6 RA Guard", is_correct: true },
      { text: "Dynamic ARP Inspection", is_correct: false },
      { text: "DHCPv6 Snooping Guard", is_correct: false },
      { text: "IPv6 Source Guard", is_correct: false }
    ]
  },
  {
    stem: "An administrator wants to configure IPv6 RA Guard policy 'BLOCK-ROGUE' on access VLANs 20 and 30 using Cisco IOS-XE. Which configuration snippet achieves this?",
    explanation: "In Cisco IOS-XE, RA Guard policies are attached to VLANs using the command 'ipv6 nd raguard attach-policy <policy-name> vlan <vlan-ids>' (or applied directly to target switch interfaces).",
    domain: "services_security",
    subtopic: "IPv6 RA Guard",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "ipv6 nd raguard attach-policy BLOCK-ROGUE vlan 20,30", is_correct: true },
      { text: "ipv6 raguard enable vlan 20-30 policy BLOCK-ROGUE", is_correct: false },
      { text: "switchport ipv6 router-advertisement filter 20,30", is_correct: false },
      { text: "ipv6 router-snoop attach BLOCK-ROGUE 20,30", is_correct: false }
    ]
  },
  {
    stem: "A client on subnet 10.1.20.0/24 needs to obtain an IP lease from a central DHCP server at 10.1.100.5. What command must be configured on the client's router default gateway interface?",
    explanation: "The 'ip helper-address 10.1.100.5' command on the router's incoming interface turns the router into a DHCP relay agent. It receives client UDP broadcast requests on port 67 and forwards them as unicast packets to the specified DHCP server.",
    domain: "services_security",
    subtopic: "DHCP and Helper Address",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ip helper-address 10.1.100.5", is_correct: true },
      { text: "ip dhcp-server 10.1.100.5", is_correct: false },
      { text: "ip forward-dhcp 10.1.100.5", is_correct: false },
      { text: "ip dhcp relay destination 10.1.100.5", is_correct: false }
    ]
  },
  {
    stem: "Besides DHCP (ports 67 and 68), which UDP service broadcast does the Cisco 'ip helper-address' command forward by default?",
    explanation: "By default, 'ip helper-address' forwards 8 UDP broadcast protocols: TFTP (69), DNS (53), Time (37), TACACS (49), BOOTP/DHCP server (67), BOOTP/DHCP client (68), NetBIOS Name Server (137), and NetBIOS Datagram Server (138).",
    domain: "services_security",
    subtopic: "DHCP and Helper Address",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "DNS (port 53) and TFTP (port 69)", is_correct: true },
      { text: "SNMP (port 161) and Syslog (port 514)", is_correct: false },
      { text: "NTP (port 123) and RIP (port 520)", is_correct: false },
      { text: "HTTPS (port 443) and SSH (port 22)", is_correct: false }
    ]
  },
  {
    stem: "Which protocol provides encrypted, authenticated file copy over an SSH connection, running by default over TCP port 22?",
    explanation: "SFTP (SSH File Transfer Protocol) and SCP (Secure Copy Protocol) both run over SSH (TCP port 22), providing encrypted transmission and authentication for file management. FTP (21) and TFTP (69) transmit in plaintext.",
    domain: "services_security",
    subtopic: "Secure File Transfer",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "SFTP (Secure File Transfer Protocol)", is_correct: true },
      { text: "TFTP (Trivial File Transfer Protocol)", is_correct: false },
      { text: "FTP (File Transfer Protocol)", is_correct: false },
      { text: "Telnet with ZMODEM", is_correct: false }
    ]
  },
  {
    stem: "What is the primary operational difference between FTPS and SFTP?",
    explanation: "FTPS is standard FTP wrapped with TLS encryption, using multiple ports (command port 21 plus data ports). SFTP is a completely different protocol built as an extension to SSH, using a single encrypted channel over TCP port 22.",
    domain: "services_security",
    subtopic: "Secure File Transfer",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "FTPS relies on FTP over SSL/TLS requiring separate control and data ports, whereas SFTP runs entirely inside an SSH session over port 22", is_correct: true },
      { text: "FTPS uses symmetric SSH keys while SFTP requires X.509 public key infrastructure certificates", is_correct: false },
      { text: "SFTP does not support user authentication, relying strictly on network IP access control lists", is_correct: false },
      { text: "FTPS operates at Layer 4 UDP while SFTP operates at Layer 4 TCP", is_correct: false }
    ]
  },
  {
    stem: "What is the correct chronological four-step message sequence exchanged between a client and a DHCP server during address leasing?",
    explanation: "The DHCP lease process follows the DORA acronym: Discover (client broadcast), Offer (server unicast/broadcast), Request (client broadcast), Acknowledgment (server unicast/broadcast).",
    domain: "services_security",
    subtopic: "DHCP Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Discover, Offer, Request, Acknowledgment (DORA)", is_correct: true },
      { text: "Discover, Request, Offer, Acknowledgment", is_correct: false },
      { text: "Solicit, Advertise, Request, Reply", is_correct: false },
      { text: "Offer, Discover, Request, Confirm", is_correct: false }
    ]
  },
  {
    stem: "Which DNS record type maps a domain hostname to an IPv6 address?",
    explanation: "An AAAA ('quad-A') record maps a hostname to a 128-bit IPv6 address. In contrast, an A record maps to a 32-bit IPv4 address, a PTR record handles reverse lookups, and an MX record points to mail exchange servers.",
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
    stem: "What DNS record type functions as an alias that directs a hostname query to another canonical hostname rather than directly to an IP address?",
    explanation: "A Canonical Name (CNAME) record is an alias record in DNS that points one domain name to another domain name (the canonical name), which is then resolved by looking up its A or AAAA record.",
    domain: "services_security",
    subtopic: "DNS Record Types",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "CNAME record", is_correct: true },
      { text: "NS record", is_correct: false },
      { text: "SOA record", is_correct: false },
      { text: "TXT record", is_correct: false }
    ]
  },
  {
    stem: "What underlying database does Dynamic ARP Inspection (DAI) rely on by default to validate Address Resolution Protocol packets on untrusted switch ports?",
    explanation: "DAI relies on the DHCP snooping binding database (or user-configured ARP ACLs) to verify that the sender MAC address and sender IP address in an ARP message match a legitimate, known lease.",
    domain: "services_security",
    subtopic: "Dynamic ARP Inspection",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The DHCP snooping binding database", is_correct: true },
      { text: "The switch MAC address forwarding table", is_correct: false },
      { text: "The local CEF adjacency table", is_correct: false },
      { text: "The 802.1X RADIUS session cache", is_correct: false }
    ]
  },
  {
    stem: "Which Wi-Fi Protected Access 3 (WPA3) protocol replaces the vulnerable Pre-Shared Key (PSK) 4-way handshake to protect against offline dictionary attacks?",
    explanation: "WPA3-Personal replaces PSK with Simultaneous Authentication of Equals (SAE), based on the Dragonfly key exchange protocol. SAE provides forward secrecy and renders passive eavesdropping and offline dictionary attacks ineffective.",
    domain: "services_security",
    subtopic: "Wireless Security",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Simultaneous Authentication of Equals (SAE)", is_correct: true },
      { text: "Extensible Authentication Protocol - TLS (EAP-TLS)", is_correct: false },
      { text: "Temporal Key Integrity Protocol (TKIP)", is_correct: false },
      { text: "Protected Extensible Authentication Protocol (PEAP)", is_correct: false }
    ]
  },

  // ==========================================
  // AI_OPS (5 questions)
  // ==========================================
  {
    stem: "In a cloud-managed networking architecture such as Cisco Meraki, what is the separation between the control/management plane and the data plane?",
    explanation: "In cloud-managed networks, the management and control plane functions reside centrally in the cloud dashboard, while the data plane remains distributed locally on on-premises switches, APs, and security appliances to forward client packets without cloud latency.",
    domain: "ai_ops",
    subtopic: "Cloud-Managed Networking",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Management and control are centralized in the cloud, while the data plane remains local on physical devices", is_correct: true },
      { text: "All user data frames are tunneled through the cloud provider before local delivery", is_correct: false },
      { text: "The data plane runs in cloud VMs while physical devices only function as management monitors", is_correct: false },
      { text: "Control and data planes are merged into physical firmware, with cloud serving only for periodic billing", is_correct: false }
    ]
  },
  {
    stem: "What key characteristic distinguishes declarative Infrastructure as Code (IaC) tools like Terraform from imperative configuration scripts?",
    explanation: "Declarative IaC allows engineers to define the desired end state of infrastructure (what it should look like), and the tool automatically determines the steps to achieve it. Imperative scripts require defining the exact sequence of CLI commands and steps to execute.",
    domain: "ai_ops",
    subtopic: "Infrastructure as Code",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Declarative tools specify the desired end state, leaving the tool to compute required changes, whereas imperative tools require explicit procedural commands", is_correct: true },
      { text: "Declarative tools can only configure cloud instances, while imperative tools configure physical Cisco switches", is_correct: false },
      { text: "Declarative tools require Python code execution, whereas imperative tools use YAML or JSON formatting", is_correct: false },
      { text: "Declarative tools do not maintain state files, whereas imperative tools require central state tracking", is_correct: false }
    ]
  },
  {
    stem: "In software-defined controller-based architectures like Cisco Catalyst Center (formerly DNA Center), which communication channel connects the controller to managed network devices such as switches and routers?",
    explanation: "Southbound APIs (SBIs) connect the SDN controller to physical network elements using protocols like NETCONF, RESTCONF, SSH, and SNMP. Northbound APIs (NBIs) connect the controller upward to business applications and orchestration platforms.",
    domain: "ai_ops",
    subtopic: "Controller-Based Management",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Southbound APIs (SBIs)", is_correct: true },
      { text: "Northbound APIs (NBIs)", is_correct: false },
      { text: "Eastbound orchestration buses", is_correct: false },
      { text: "Westbound telemetry sockets", is_correct: false }
    ]
  },
  {
    stem: "How does model-driven streaming telemetry fundamentally improve on traditional SNMP polling for real-time network monitoring and AIOps analytics?",
    explanation: "Unlike periodic SNMP polling (pull model) which creates CPU spikes and delayed visibility, streaming telemetry uses a push model where devices continuously stream structured YANG-modeled data at near real-time intervals over gRPC or NETCONF.",
    domain: "ai_ops",
    subtopic: "Telemetry and Monitoring",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It uses a push model that continuously streams structured, YANG-modeled data in near real time, eliminating polling overhead and latency", is_correct: true },
      { text: "It replaces TCP with UDP broadcast packets to eliminate network transmission handshakes", is_correct: false },
      { text: "It requires manual MIB compiling on every network collector before receiving metric alerts", is_correct: false },
      { text: "It only sends operational updates when an interface experiences a physical link-down event", is_correct: false }
    ]
  },
  {
    stem: "When using generative AI agents to draft network configuration changes for production routers, why is automated pre-deployment syntax validation and synthetic testing essential?",
    explanation: "LLMs can produce confident hallucinations, syntax errors, or subtle logical misconfigurations (like inverted ACL logic or invalid route targets). Automated linting, syntax validation, and sandbox digital twin simulation ensure safety before touching production gear.",
    domain: "ai_ops",
    subtopic: "AI Output Validation",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "To protect against model hallucinations, inverted ACL logic, and unsupported syntax before applying configurations to production devices", is_correct: true },
      { text: "Because AI models cannot output Cisco IOS configuration without an intermediary Python parser", is_correct: false },
      { text: "To satisfy IEEE 802.1X cryptographic requirements for machine-generated CLI scripts", is_correct: false },
      { text: "Because modern routers reject any SSH session initiated by an automated process", is_correct: false }
    ]
  }
];

const batchPath = path.join(__dirname, 'batches', 'seed-23-volume.json');
fs.writeFileSync(batchPath, JSON.stringify(questions, null, 2) + '\n');
console.log(`Generated ${questions.length} questions in ${batchPath}`);
