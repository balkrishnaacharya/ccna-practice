const fs = require("fs");
const path = require("path");

const questions = [
  {
    stem: "What is the network address and broadcast address for a host with IP 172.20.100.55/28?",
    explanation: "A /28 mask provides block increments of 16 in the 4th octet. 55 falls between 48 and 63. Thus, the network address is 172.20.100.48 and the broadcast address is 172.20.100.63.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Network: 172.20.100.32, Broadcast: 172.20.100.47", is_correct: false },
      { text: "Network: 172.20.100.48, Broadcast: 172.20.100.63", is_correct: true },
      { text: "Network: 172.20.100.0, Broadcast: 172.20.100.255", is_correct: false },
      { text: "Network: 172.20.100.48, Broadcast: 172.20.100.64", is_correct: false }
    ]
  },
  {
    stem: "Which IEEE standard specifies 802.3bt Type 4 PoE, delivering up to 90 Watts of power per port?",
    explanation: "IEEE 802.3bt Type 4 (also known as 4PPoE) utilizes all four twisted copper pairs to deliver up to 90–100W of power from the switch port to high-draw devices such as digital signage and PTZ dome cameras.",
    domain: "network_infra",
    subtopic: "PoE Standards",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "IEEE 802.3af", is_correct: false },
      { text: "IEEE 802.3at", is_correct: false },
      { text: "IEEE 802.3bt Type 4", is_correct: true },
      { text: "IEEE 802.3bz", is_correct: false }
    ]
  },
  {
    stem: "What is the function of the Flow Label field in an IPv6 header?",
    explanation: "The 20-bit Flow Label field in IPv6 enables routers to identify and provide consistent quality-of-service (QoS) forwarding to packets belonging to the same non-default traffic flow without opening inner packet headers.",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It specifies the next upper-layer protocol header type", is_correct: false },
      { text: "It allows routers to identify and maintain consistent handling for a sequence of packets", is_correct: true },
      { text: "It records the hop count remaining before packet expiration", is_correct: false },
      { text: "It contains the total packet payload length including extension headers", is_correct: false }
    ]
  },
  {
    stem: "Which command on a Cisco router enables the processing and forwarding of IPv6 traffic globally?",
    explanation: "The global configuration command `ipv6 unicast-routing` is mandatory on Cisco IOS routers to turn on IPv6 packet routing. Without it, the router functions only as an IPv6 host on its interfaces.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ipv6 routing enable", is_correct: false },
      { text: "ipv6 unicast-routing", is_correct: true },
      { text: "ip routing ipv6", is_correct: false },
      { text: "system ipv6 forward", is_correct: false }
    ]
  },
  {
    stem: "What does the 'Next Header' field in the IPv6 header indicate?",
    explanation: "The 8-bit Next Header field in IPv6 identifies the type of header immediately following the IPv6 base header. It can point to an upper-layer protocol (like TCP [6] or UDP [17]) or to an IPv6 extension header (like Routing or ESP).",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The MAC address of the next-hop Layer 2 interface", is_correct: false },
      { text: "The protocol type of the following extension header or transport protocol", is_correct: true },
      { text: "The length of the subsequent payload in 32-bit words", is_correct: false },
      { text: "The DSCP priority marking for priority queueing", is_correct: false }
    ]
  },
  {
    stem: "In an enterprise campus three-tier hierarchical design, what is the key responsibility of the core layer?",
    explanation: "The core layer is the high-speed switching backbone of the network. It is designed to switch traffic between distribution blocks as fast as possible without performing packet manipulation or filtering (such as ACLs or QoS policing).",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Inspecting all packets with stateful access lists and deep packet inspection", is_correct: false },
      { text: "Providing high-speed, non-blocking packet transport between distribution layer modules", is_correct: true },
      { text: "Connecting user workstations directly to corporate VLANs", is_correct: false },
      { text: "Allocating dynamic IP addresses to wireless clients", is_correct: false }
    ]
  },
  {
    stem: "What is an advantage of Power over Ethernet (PoE) in an enterprise network installation?",
    explanation: "PoE allows both electrical power and data to be carried across standard Category 5e/6 Ethernet cabling. This eliminates the need for separate AC electrical outlets at the mounting locations of access points, IP cameras, and VoIP phones.",
    domain: "network_infra",
    subtopic: "PoE Standards",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "It doubles the maximum physical cable distance of Ethernet to 200 meters", is_correct: false },
      { text: "It delivers power and data over a single twisted-pair cable, reducing cabling costs", is_correct: true },
      { text: "It replaces optical transceivers on 10-Gigabit backbone links", is_correct: false },
      { text: "It enables automatic VLAN tagging without 802.1Q encapsulation", is_correct: false }
    ]
  },
  {
    stem: "How many subnets and hosts per subnet are created by subnetting 10.0.0.0/8 using a /12 prefix?",
    explanation: "Subnetting /8 to /12 borrows 4 bits for the subnet. 2^4 = 16 subnets. The host bits remaining are 32 - 12 = 20 bits. 2^20 - 2 = 1,048,574 usable host addresses per subnet.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "4 subnets with 65,534 hosts each", is_correct: false },
      { text: "16 subnets with 1,048,574 usable hosts each", is_correct: true },
      { text: "8 subnets with 524,286 hosts each", is_correct: false },
      { text: "16 subnets with 65,534 hosts each", is_correct: false }
    ]
  },
  {
    stem: "Which discovery protocol is an open IEEE industry standard supported across multi-vendor equipment?",
    explanation: "Link Layer Discovery Protocol (LLDP) is defined in IEEE 802.1AB as a vendor-neutral Layer 2 discovery protocol. Cisco Discovery Protocol (CDP) is Cisco-proprietary.",
    domain: "network_infra",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "CDP", is_correct: false },
      { text: "LLDP", is_correct: true },
      { text: "VTP", is_correct: false },
      { text: "DTP", is_correct: false }
    ]
  },
  {
    stem: "Which IPv6 address is designated as the loopback address for the local host?",
    explanation: "The IPv6 loopback address is ::1 (or ::1/128), which is equivalent to 127.0.0.1 in IPv4. It is used by a device to send network packets to itself.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "::", is_correct: false },
      { text: "::1", is_correct: true },
      { text: "fe80::1", is_correct: false },
      { text: "2001::1", is_correct: false }
    ]
  },
  {
    stem: "Which problem can occur when two 2.4 GHz wireless access points with overlapping cells are configured on channel 1 and channel 2?",
    explanation: "Adjacent channel interference occurs because channels 1 and 2 overlap in spectrum. In 2.4 GHz, channels are 5 MHz apart but require 20–22 MHz bandwidth. Only channels 1, 6, and 11 do not overlap.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "DHCP starvation across both access points", is_correct: false },
      { text: "Severe adjacent-channel interference and degraded RF throughput", is_correct: true },
      { text: "Immediate deauthentication of all WPA3 enterprise clients", is_correct: false },
      { text: "Spanning tree loop election across the wireless medium", is_correct: false }
    ]
  },
  {
    stem: "In an enterprise network, what does a collision rate above 1% on an Ethernet switch port typically indicate?",
    explanation: "Collisions should never occur on full-duplex Ethernet connections. If collisions are detected on a modern switch port, it indicates either a duplex mismatch (where one end is set to full duplex and the other to half duplex) or a faulty hub in the collision domain.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A mismatch between configured 802.1Q trunking encapsulation types", is_correct: false },
      { text: "A duplex mismatch on the connection between the switch and attached device", is_correct: true },
      { text: "Excessive IPv6 neighbor solicitation multicasts", is_correct: false },
      { text: "Dynamic ARP inspection blocking untrusted MAC addresses", is_correct: false }
    ]
  },
  {
    stem: "What is the primary function of an endpoint device in network architecture?",
    explanation: "An endpoint device (or host) is a client hardware system — such as a workstation, smartphone, server, or IoT sensor — that originates or terminates application data communications across the network infrastructure.",
    domain: "network_infra",
    subtopic: "Network Components",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "To make forwarding path decisions based on IP destination routing tables", is_correct: false },
      { text: "To originate or terminate user application data communications", is_correct: true },
      { text: "To encapsulate Layer 2 Ethernet frames across wide area network links", is_correct: false },
      { text: "To filter untrusted DHCP offer packets across switch access ports", is_correct: false }
    ]
  },
  {
    stem: "Which statement correctly describes a Cisco FlexConnect wireless architecture deployment?",
    explanation: "In FlexConnect mode, access points deployed at remote branch offices can switch client data traffic locally on the branch LAN when desired, while continuing to receive centralized control plane management from a central WLC across the WAN.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "AP traffic is always tunneled back to the cloud via raw IPsec without a WLC", is_correct: false },
      { text: "Branch APs can switch client traffic locally while maintaining central WLC control", is_correct: true },
      { text: "APs operate strictly without any CAPWAP tunnels or controller association", is_correct: false },
      { text: "Client authentication must be handled exclusively by an on-premises TFTP server", is_correct: false }
    ]
  },
  {
    stem: "What is the effect of configuring `speed 1000` and `duplex full` manually on one end of an Ethernet link while leaving the other end set to auto-negotiate?",
    explanation: "IEEE 802.3 specifications require that auto-negotiation must be used on Gigabit Ethernet links. If one side is hardcoded, the other side will fail to auto-negotiate duplex (often defaulting to half duplex on 10/100, causing a duplex mismatch, or failing to link up on Gigabit).",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Both ends will seamlessly agree on full duplex without any errors", is_correct: false },
      { text: "A duplex or link failure issue is likely to occur due to failed auto-negotiation", is_correct: true },
      { text: "The switch port will shut down automatically due to err-disable state", is_correct: false },
      { text: "The link will automatically upgrade its bandwidth to 10 Gbps", is_correct: false }
    ]
  },
  {
    stem: "Which OSI model layer is responsible for logical addressing, packet fragmentation, and path determination?",
    explanation: "The Network layer (Layer 3) is responsible for logical addressing (e.g. IPv4 and IPv6 addresses), routing between networks, and packet fragmentation.",
    domain: "network_infra",
    subtopic: "OSI Reference Model",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Data Link Layer (Layer 2)", is_correct: false },
      { text: "Network Layer (Layer 3)", is_correct: true },
      { text: "Transport Layer (Layer 4)", is_correct: false },
      { text: "Session Layer (Layer 5)", is_correct: false }
    ]
  },
  {
    stem: "What is the valid usable host range for the subnet 192.168.1.192/27?",
    explanation: "A /27 subnet has 32 host addresses (block increment 32). The network is 192.168.1.192 and the broadcast is 192.168.1.223. The usable host IP range is 192.168.1.193 through 192.168.1.222.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "192.168.1.192 to 192.168.1.223", is_correct: false },
      { text: "192.168.1.193 to 192.168.1.222", is_correct: true },
      { text: "192.168.1.193 to 192.168.1.224", is_correct: false },
      { text: "192.168.1.192 to 192.168.1.255", is_correct: false }
    ]
  },
  {
    stem: "Which address block is reserved by IANA for IPv4 private addressing in Class B networks under RFC 1918?",
    explanation: "RFC 1918 specifies three private IPv4 address blocks: 10.0.0.0/8 (Class A), 172.16.0.0/12 (ranging from 172.16.0.0 to 172.31.255.255, Class B), and 192.168.0.0/16 (Class C).",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "10.0.0.0/8", is_correct: false },
      { text: "172.16.0.0/12", is_correct: true },
      { text: "192.168.0.0/16", is_correct: false },
      { text: "169.254.0.0/16", is_correct: false }
    ]
  },
  {
    stem: "What is an IPv4 Automatic Private IP Addressing (APIPA) address assigned to a Windows or macOS client when DHCP fails?",
    explanation: "When a client cannot contact a DHCP server and has no static configuration, it auto-assigns an APIPA address in the range 169.254.0.1 through 169.254.255.254 with a /16 subnet mask.",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "192.168.1.1", is_correct: false },
      { text: "169.254.x.x /16", is_correct: true },
      { text: "10.255.255.1", is_correct: false },
      { text: "127.0.0.1", is_correct: false }
    ]
  },
  {
    stem: "How does fiber optic multi-mode cabling differ from single-mode cabling regarding its light source?",
    explanation: "Multi-mode fiber (MMF) has a larger core (50 or 62.5 microns) and traditionally uses less expensive light-emitting diodes (LEDs) or Vertical-Cavity Surface-Emitting Lasers (VCSELs). Single-mode fiber uses high-precision solid-state lasers.",
    domain: "network_infra",
    subtopic: "Physical Media",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Multi-mode fiber requires high-power optical gas lasers", is_correct: false },
      { text: "Multi-mode fiber uses lower-cost LEDs or VCSEL light sources", is_correct: true },
      { text: "Multi-mode fiber does not use light and instead uses radio frequency pulses", is_correct: false },
      { text: "Multi-mode fiber cannot carry Gigabit Ethernet traffic", is_correct: false }
    ]
  },
  {
    stem: "Which command shows detailed information about a specific neighbor discovered via CDP, including its IP management address?",
    explanation: "The command `show cdp entry <name>` or `show cdp neighbors detail` reveals detailed neighbor parameters including IPv4/IPv6 addresses, device model, software version, and duplex settings.",
    domain: "network_infra",
    subtopic: "Discovery Protocols",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "show cdp neighbors brief", is_correct: false },
      { text: "show cdp neighbors detail", is_correct: true },
      { text: "show cdp interface", is_correct: false },
      { text: "show cdp traffic", is_correct: false }
    ]
  },
  {
    stem: "In an enterprise network, what is the role of an access point's radio resource management (RRM)?",
    explanation: "Radio Resource Management (RRM) dynamically monitors the RF airspace to optimize channel assignments (DCA), adjust transmit power levels (TPC), and detect coverage holes and rogue access points across an enterprise.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It assigns dynamic VLAN tags to client RADIUS requests", is_correct: false },
      { text: "It dynamically adjusts channels, power levels, and detects RF interference", is_correct: true },
      { text: "It encrypts CAPWAP control messages using TLS certificates", is_correct: false },
      { text: "It maintains spanning tree port states on the switch uplink", is_correct: false }
    ]
  },
  {
    stem: "What happens when a switch port receives an Ethernet frame with an invalid frame check sequence (FCS)?",
    explanation: "When the switch recalculates the FCS and detects a checksum mismatch, the frame is corrupted. The switch discards (drops) the frame immediately and increments the interface CRC error counter.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The switch repairs the corrupted bit using parity memory", is_correct: false },
      { text: "The switch drops the frame and increments the CRC error counter", is_correct: true },
      { text: "The switch forwards the frame to the default gateway", is_correct: false },
      { text: "The switch broadcasts the frame to all VLAN ports", is_correct: false }
    ]
  },
  {
    stem: "Which prefix length is standard for an IPv6 point-to-point link between two routers according to RFC 6164?",
    explanation: "RFC 6164 recommends using a /127 prefix for inter-router point-to-point links. This provides exactly two usable addresses (0 and 1) and prevents ping-pong loop attacks.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "/64", is_correct: false },
      { text: "/127", is_correct: true },
      { text: "/128", is_correct: false },
      { text: "/112", is_correct: false }
    ]
  },
  {
    stem: "In cloud computing, which model delivers complete end-user software applications hosted and managed entirely by the provider over the internet?",
    explanation: "Software as a Service (SaaS) delivers applications over the web (e.g. Cisco Webex, Microsoft 365, Salesforce). The cloud provider handles all underlying infrastructure, operating systems, and application maintenance.",
    domain: "network_infra",
    subtopic: "WAN Architectures",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Infrastructure as a Service (IaaS)", is_correct: false },
      { text: "Platform as a Service (PaaS)", is_correct: false },
      { text: "Software as a Service (SaaS)", is_correct: true },
      { text: "Hardware as a Service (HaaS)", is_correct: false }
    ]
  }
];

fs.writeFileSync(
  path.join(__dirname, "../questions-batch-2.json"),
  JSON.stringify(questions, null, 2)
);
console.log(`Generated ${questions.length} questions in questions-batch-2.json`);
