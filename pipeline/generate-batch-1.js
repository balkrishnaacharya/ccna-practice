const fs = require("fs");
const path = require("path");

const questions = [
  {
    stem: "Which IPv6 address type is automatically configured on every IPv6-enabled interface and starts with the prefix fe80::/10?",
    explanation: "Link-local addresses (fe80::/10) are required for neighbor discovery and next-hop routing communications on a single link. They are not routable beyond the local link and are generated automatically or statically configured.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Global Unicast Address", is_correct: false },
      { text: "Unique Local Address", is_correct: false },
      { text: "Link-Local Address", is_correct: true },
      { text: "Anycast Address", is_correct: false }
    ]
  },
  {
    stem: "A network administrator needs a subnet mask for 192.168.10.0 that provides at least 28 usable host addresses per subnet while maximizing the number of subnets. Which prefix should be used?",
    explanation: "A /27 subnet mask uses 5 host bits (2^5 - 2 = 30 usable host addresses). A /28 mask only provides 14 usable hosts (2^4 - 2 = 14), which is insufficient for 28 hosts. Therefore, /27 is the optimal mask.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "/28", is_correct: false },
      { text: "/27", is_correct: true },
      { text: "/26", is_correct: false },
      { text: "/29", is_correct: false }
    ]
  },
  {
    stem: "In a Cisco two-tier collapsed core campus design, which two layers from the three-tier hierarchical model are combined into a single tier?",
    explanation: "In a collapsed core campus architecture, the core layer and distribution layer are merged into a single tier of switches. This reduces cost and complexity in small-to-medium enterprise networks while maintaining access layer segmentation.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Access and Distribution layers", is_correct: false },
      { text: "Core and Distribution layers", is_correct: true },
      { text: "Access and Core layers", is_correct: false },
      { text: "Core and WAN Edge layers", is_correct: false }
    ]
  },
  {
    stem: "What is the primary function of the access layer in a traditional Cisco hierarchical campus network design?",
    explanation: "The access layer connects end-user devices (PCs, printers, IP phones, access points) to the local network and enforces port security and VLAN policies. The distribution layer aggregates access switches and routes traffic, while the core layer provides high-speed transport.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Providing high-speed backbone switching between distribution blocks", is_correct: false },
      { text: "Connecting end-user endpoint devices to the local network infrastructure", is_correct: true },
      { text: "Performing policy-based routing and inter-VLAN routing across buildings", is_correct: false },
      { text: "Terminating external WAN and Internet service provider connections", is_correct: false }
    ]
  },
  {
    stem: "Which standard IEEE 802.3 specification defines Power over Ethernet (PoE) providing up to 15.4 Watts of DC power at the source port?",
    explanation: "IEEE 802.3af defines standard PoE with up to 15.4W at the PSE (providing ~12.95W at the PD). IEEE 802.3at (PoE+) provides up to 30W, and IEEE 802.3bt provides Type 3 (60W) and Type 4 (90W) PoE.",
    domain: "network_infra",
    subtopic: "PoE Standards",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "IEEE 802.3af", is_correct: true },
      { text: "IEEE 802.3at", is_correct: false },
      { text: "IEEE 802.3bt", is_correct: false },
      { text: "IEEE 802.3ab", is_correct: false }
    ]
  },
  {
    stem: "When an engineer inspects a switch interface and observes a high number of CRC errors, which issue is the most likely physical root cause?",
    explanation: "Cyclic Redundancy Check (CRC) errors indicate that frames arrived corrupted. This is typically caused by physical layer issues such as damaged cabling, electromagnetic interference (EMI), loose connectors, or bad transceivers.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Duplex mismatch on the link", is_correct: false },
      { text: "Damaged copper cable, loose connector, or electrical noise", is_correct: true },
      { text: "VLAN ID mismatch between connected access ports", is_correct: false },
      { text: "Mismatched MTU settings between switch interfaces", is_correct: false }
    ]
  },
  {
    stem: "What causes 'late collisions' to increment on an Ethernet interface operating in half-duplex mode?",
    explanation: "A late collision occurs when a collision is detected after the first 512 bits (64 bytes) of the frame have been transmitted. This almost always indicates a duplex mismatch (one end full, one end half) or a cable length exceeding Ethernet distance specifications.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Exceeded broadcast traffic thresholds", is_correct: false },
      { text: "Duplex mismatch or cable length exceeding IEEE specifications", is_correct: true },
      { text: "Subnet mask discrepancy on the local IP interface", is_correct: false },
      { text: "Spanning tree root bridge election in progress", is_correct: false }
    ]
  },
  {
    stem: "How many non-overlapping 20 MHz channels are available in the 2.4 GHz ISM wireless frequency band in North America?",
    explanation: "In North America, the 2.4 GHz band has 11 channels spaced 5 MHz apart. Because each standard channel requires 20–22 MHz of spectral width, only channels 1, 6, and 11 can operate simultaneously without overlapping.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "1", is_correct: false },
      { text: "3 (channels 1, 6, and 11)", is_correct: true },
      { text: "5 (channels 1, 4, 7, 9, 11)", is_correct: false },
      { text: "11 non-overlapping channels", is_correct: false }
    ]
  },
  {
    stem: "Which statement accurately describes the function of CAPWAP in a centralized Cisco Wireless LAN Controller (WLC) deployment?",
    explanation: "Control and Provisioning of Wireless Access Points (CAPWAP) establishes an encrypted control tunnel (UDP 5246) and a data tunnel (UDP 5247) between lightweight APs and the WLC. This allows centralized management and policy enforcement.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It allows access points to route traffic locally without any central controller", is_correct: false },
      { text: "It encapsulates control and client data traffic inside UDP tunnels between APs and WLC", is_correct: true },
      { text: "It acts as a replacement protocol for 802.1Q trunking on edge switches", is_correct: false },
      { text: "It provides Layer 2 spanning tree protection across wireless mesh nodes", is_correct: false }
    ]
  },
  {
    stem: "In a Cisco spine-leaf data center architecture, how are switches cabled according to Clos network principles?",
    explanation: "In a spine-leaf topology, every leaf switch connects to every spine switch, and spine switches never connect to other spine switches. Similarly, leaf switches do not connect to each other directly at Layer 2. This delivers consistent, predictable east-west latency.",
    domain: "network_infra",
    subtopic: "Spine-Leaf Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Spine switches are daisy-chained in a ring to distribute core bandwidth", is_correct: false },
      { text: "Every leaf switch connects to every spine switch, with no spine-to-spine links", is_correct: true },
      { text: "Leaf switches connect directly to adjacent leaf switches to create redundant loops", is_correct: false },
      { text: "Endpoints connect directly to spine switches to minimize hop count", is_correct: false }
    ]
  },
  {
    stem: "Which field in the IPv4 header is decremented by 1 at each Layer 3 router hop to prevent forwarding loops?",
    explanation: "The Time to Live (TTL) field is an 8-bit value that is decremented by each router that processes the packet. If the TTL reaches zero, the router drops the packet and sends an ICMP Time Exceeded message back to the sender.",
    domain: "network_infra",
    subtopic: "IPv4 Header",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Differentiated Services (DiffServ)", is_correct: false },
      { text: "Identification", is_correct: false },
      { text: "Time to Live (TTL)", is_correct: true },
      { text: "Header Checksum", is_correct: false }
    ]
  },
  {
    stem: "In the IPv6 packet header, which 8-bit field is the direct functional equivalent of the IPv4 Time to Live (TTL) field?",
    explanation: "The Hop Limit field in the IPv6 header replaces the IPv4 TTL field. Each router decrements the Hop Limit by 1 before forwarding; if it reaches 0, the packet is discarded and an ICMPv6 Time Exceeded message is returned.",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Traffic Class", is_correct: false },
      { text: "Flow Label", is_correct: false },
      { text: "Next Header", is_correct: false },
      { text: "Hop Limit", is_correct: true }
    ]
  },
  {
    stem: "Which IPv6 multicast address is reserved for sending packets to all IPv6-enabled routers on the local link?",
    explanation: "ff02::2 is the all-routers link-local multicast address. In comparison, ff02::1 reaches all nodes on the link, and ff02::1:ffxx:xxxx is the solicited-node multicast address.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "ff02::1", is_correct: false },
      { text: "ff02::2", is_correct: true },
      { text: "ff02::5", is_correct: false },
      { text: "ff02::a", is_correct: false }
    ]
  },
  {
    stem: "What is the result of using the modified EUI-64 format to generate a 64-bit interface ID from a 48-bit MAC address?",
    explanation: "In modified EUI-64 format, the hex bytes FFFE are inserted into the middle of the 48-bit MAC address (between the OUI and NIC identifier), and the seventh bit (Universal/Local bit) from the left is inverted.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The letters FFFF are inserted and the 8th bit is inverted", is_correct: false },
      { text: "The hex value FFFE is inserted in the middle and the 7th bit is inverted", is_correct: true },
      { text: "A random 16-bit number is appended to the start of the MAC address", is_correct: false },
      { text: "The first 24 bits are replaced with the vendor link-local identifier", is_correct: false }
    ]
  },
  {
    stem: "An engineer configures an IPv4 network address of 172.16.0.0 with a /22 prefix. What is the broadcast address for this subnet?",
    explanation: "A /22 prefix gives 32 - 22 = 10 host bits. The block size in the 3rd octet is 2^(24-22) = 4. The subnet ranges from 172.16.0.0 to 172.16.3.255, making 172.16.3.255 the broadcast address.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "172.16.1.255", is_correct: false },
      { text: "172.16.2.255", is_correct: false },
      { text: "172.16.3.255", is_correct: true },
      { text: "172.16.255.255", is_correct: false }
    ]
  },
  {
    stem: "Which cloud service model provides the customer with virtualized computing resources (VMs, storage, and virtual networking) while the cloud provider manages physical hardware?",
    explanation: "Infrastructure as a Service (IaaS) gives users control over operating systems, storage, deployed applications, and network components while the cloud provider manages data centers, physical servers, and hypervisors.",
    domain: "network_infra",
    subtopic: "WAN Architectures",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Software as a Service (SaaS)", is_correct: false },
      { text: "Platform as a Service (PaaS)", is_correct: false },
      { text: "Infrastructure as a Service (IaaS)", is_correct: true },
      { text: "Function as a Service (FaaS)", is_correct: false }
    ]
  },
  {
    stem: "What is the primary role of Cisco Discovery Protocol (CDP)?",
    explanation: "CDP is a proprietary Cisco Layer 2 protocol that allows directly connected Cisco devices (routers, switches, IP phones) to discover information about each other, including device ID, software version, platform, and connected port.",
    domain: "network_infra",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Providing IP address assignment to DHCP clients", is_correct: false },
      { text: "Discovering directly connected neighboring Cisco hardware devices at Layer 2", is_correct: true },
      { text: "Resolving hostnames to IP addresses across LAN boundaries", is_correct: false },
      { text: "Synchronizing hardware system clocks with atomic time servers", is_correct: false }
    ]
  },
  {
    stem: "Which command enables Link Layer Discovery Protocol (LLDP) globally on a Cisco catalyst switch?",
    explanation: "The global configuration command `lldp run` turns on LLDP on the entire switch. To disable it globally, use `no lldp run`. Individual interfaces can also configure `lldp transmit` and `lldp receive`.",
    domain: "network_infra",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "lldp enable", is_correct: false },
      { text: "lldp run", is_correct: true },
      { text: "lldp start", is_correct: false },
      { text: "service lldp", is_correct: false }
    ]
  },
  {
    stem: "In wireless networking, what is a Basic Service Set Identifier (BSSID)?",
    explanation: "A BSSID is the 48-bit MAC address of the radio interface on the access point that serves a specific Basic Service Set (BSS). It uniquely identifies the wireless cell at Layer 2.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The human-readable text name broadcasted to wireless clients", is_correct: false },
      { text: "The Layer 2 MAC address of the AP radio serving the wireless cell", is_correct: true },
      { text: "The IP address assigned to the wireless LAN controller interface", is_correct: false },
      { text: "The cryptographic security key used for WPA3 SAE association", is_correct: false }
    ]
  },
  {
    stem: "Which standard Wi-Fi frequency band was introduced with Wi-Fi 6E (802.11ax extended)?",
    explanation: "Wi-Fi 6E extends 802.11ax operations into the 6 GHz frequency band (5.925 GHz to 7.125 GHz), providing up to 1200 MHz of clean spectrum with numerous non-overlapping 80 MHz and 160 MHz channels without legacy interference.",
    domain: "network_infra",
    subtopic: "Wireless Standards",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "900 MHz", is_correct: false },
      { text: "2.4 GHz", is_correct: false },
      { text: "5 GHz", is_correct: false },
      { text: "6 GHz", is_correct: true }
    ]
  },
  {
    stem: "What is the purpose of the TCP Three-Way Handshake?",
    explanation: "The TCP 3-way handshake (SYN, SYN-ACK, ACK) establishes a reliable, connection-oriented session between client and server. It synchronizes sequence numbers and negotiates window size and MSS before application payload is transferred.",
    domain: "network_infra",
    subtopic: "TCP/IP Transport",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Negotiating encryption algorithms for secure SSH traffic", is_correct: false },
      { text: "Synchronizing initial sequence numbers and establishing reliable connection state", is_correct: true },
      { text: "Resolving IP addresses to destination Ethernet MAC addresses", is_correct: false },
      { text: "Detecting duplicate IP addresses on the local broadcast domain", is_correct: false }
    ]
  },
  {
    stem: "How does UDP differ fundamentally from TCP at the transport layer?",
    explanation: "UDP is a lightweight, connectionless transport protocol that does not guarantee delivery, packet sequencing, or flow control. It has lower overhead (8-byte header vs 20-byte TCP header), making it ideal for real-time traffic like voice and video.",
    domain: "network_infra",
    subtopic: "TCP/IP Transport",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "UDP requires acknowledgments for every transmitted segment", is_correct: false },
      { text: "UDP is connectionless and does not provide reliability or sequence tracking", is_correct: true },
      { text: "UDP dynamically negotiates window sizes using sliding window algorithms", is_correct: false },
      { text: "UDP uses a 32-byte header compared to TCP's 20-byte header", is_correct: false }
    ]
  },
  {
    stem: "Which well-known transport layer protocol and destination port does DNS primarily use for standard client domain name resolution queries?",
    explanation: "DNS clients use UDP port 53 for standard name queries because of low overhead and fast response times. DNS uses TCP port 53 for zone transfers between servers or when responses exceed 512 bytes.",
    domain: "network_infra",
    subtopic: "Network Services",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "TCP port 67", is_correct: false },
      { text: "UDP port 53", is_correct: true },
      { text: "TCP port 80", is_correct: false },
      { text: "UDP port 69", is_correct: false }
    ]
  },
  {
    stem: "What is the maximum transmission unit (MTU) size for a standard Ethernet frame payload?",
    explanation: "The default standard Ethernet MTU is 1500 bytes. This specifies the maximum IP packet size that can be encapsulated in the Ethernet frame without fragmentation.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "1492 bytes", is_correct: false },
      { text: "1500 bytes", is_correct: true },
      { text: "1518 bytes", is_correct: false },
      { text: "9000 bytes", is_correct: false }
    ]
  },
  {
    stem: "What happens when an IP packet size exceeds the MTU of an egress interface and the 'Don't Fragment' (DF) bit is set in the IPv4 header?",
    explanation: "When a packet exceeds MTU and has DF=1, the router cannot fragment it. The router drops the packet and responds to the source IP with an ICMP Type 3 Code 4 message ('Fragmentation Needed and DF set'), which enables Path MTU Discovery (PMTUD).",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The router fragments the packet anyway and ignores the DF bit", is_correct: false },
      { text: "The router drops the packet and sends an ICMP Fragmentation Needed message", is_correct: true },
      { text: "The router buffers the packet until bandwidth increases", is_correct: false },
      { text: "The packet is compressed to fit the egress interface MTU", is_correct: false }
    ]
  },
  {
    stem: "What IPv6 address prefix is designated for Unique Local Addresses (ULA), which are comparable to IPv4 private addresses?",
    explanation: "Unique Local Addresses use the fc00::/7 prefix (specifically fd00::/8 is commonly deployed for locally assigned unique local addresses). They are not routable on the public Internet.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "2001::/16", is_correct: false },
      { text: "fc00::/7", is_correct: true },
      { text: "fe80::/10", is_correct: false },
      { text: "ff00::/8", is_correct: false }
    ]
  },
  {
    stem: "Which IPv6 address represents the unspecified address used by hosts before they obtain an address?",
    explanation: "The unspecified address is ::/128 (all zeros). A host uses this address as its source address when performing Duplicate Address Detection (DAD) or before obtaining a valid address.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "::1", is_correct: false },
      { text: "::", is_correct: true },
      { text: "fe80::1", is_correct: false },
      { text: "ff02::1", is_correct: false }
    ]
  },
  {
    stem: "How many usable host IP addresses are provided by a /29 subnet mask in IPv4?",
    explanation: "A /29 subnet has 32 - 29 = 3 host bits. The total addresses are 2^3 = 8. Subtracting 2 for the network and broadcast addresses leaves 6 usable host addresses.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "4", is_correct: false },
      { text: "6", is_correct: true },
      { text: "8", is_correct: false },
      { text: "14", is_correct: false }
    ]
  },
  {
    stem: "What is the network address for an IP address of 10.10.45.130 with a subnet mask of 255.255.255.192 (/26)?",
    explanation: "A /26 subnet has an increment of 64 in the fourth octet (256 - 192 = 64). The subnets in the fourth octet are .0, .64, .128, .192. Since 130 is between 128 and 191, the network address is 10.10.45.128.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "10.10.45.64", is_correct: false },
      { text: "10.10.45.128", is_correct: true },
      { text: "10.10.45.192", is_correct: false },
      { text: "10.10.45.0", is_correct: false }
    ]
  },
  {
    stem: "What is the solicited-node multicast address prefix used in IPv6 Neighbor Discovery?",
    explanation: "The solicited-node multicast address prefix is ff02::1:ff00:0/104. The low-order 24 bits of the interface's unicast address are appended to this prefix to form the complete solicited-node multicast address.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "ff02::1/64", is_correct: false },
      { text: "ff02::1:ff00:0/104", is_correct: true },
      { text: "fe80::1/10", is_correct: false },
      { text: "ff05::2/16", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco WLC deployment mode places all client data frame encapsulation into CAPWAP tunnels back to the central controller while control frames are also processed centrally?",
    explanation: "Centralized (local mode) is the traditional WLC deployment where all AP client traffic is tunneled across the WAN or campus via CAPWAP to the controller. The controller terminates CAPWAP and bridges traffic into local VLANs.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Autonomous Mode", is_correct: false },
      { text: "Centralized (Local) Mode", is_correct: true },
      { text: "FlexConnect Local Switching Mode", is_correct: false },
      { text: "Bridge / Mesh Mode", is_correct: false }
    ]
  },
  {
    stem: "When deploying wireless APs in a multi-floor enterprise building, why is 5 GHz preferred over 2.4 GHz for high-density client environments?",
    explanation: "The 5 GHz spectrum offers up to 25 non-overlapping 20 MHz channels (compared to just 3 in 2.4 GHz) and shorter signal propagation, allowing for tighter channel reuse and drastically reduced co-channel interference in dense spaces.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "5 GHz signals penetrate concrete walls much better than 2.4 GHz signals", is_correct: false },
      { text: "5 GHz has significantly more non-overlapping channels and less interference", is_correct: true },
      { text: "5 GHz requires lower transmit power from the access point", is_correct: false },
      { text: "5 GHz client devices do not require 802.11 beacons or probe requests", is_correct: false }
    ]
  },
  {
    stem: "In an Ethernet interface output, what does an increasing 'runts' counter indicate?",
    explanation: "A runt is a frame that is smaller than the minimum legal IEEE 802.3 Ethernet frame size of 64 bytes. Runts are typically caused by collisions in half-duplex links, faulty network cards, or malfunctioning cable connections.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Frames that exceed 1518 bytes in total length", is_correct: false },
      { text: "Frames that are smaller than the minimum 64-byte Ethernet frame length", is_correct: true },
      { text: "Frames discarded due to access control list match rules", is_correct: false },
      { text: "Broadcast frames that loop between access layer switches", is_correct: false }
    ]
  },
  {
    stem: "What does an increasing 'giants' counter on a Cisco switch interface indicate?",
    explanation: "Giants are frames received that exceed the maximum permissible frame length (typically 1518 bytes for untagged frames, or 1522 bytes with 802.1Q tags) without being valid jumbo frames. They indicate MTU mismatch or bad NIC drivers.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Packets arriving faster than the ASIC buffer can process", is_correct: false },
      { text: "Frames that exceed the maximum configured Ethernet MTU size", is_correct: true },
      { text: "Frames containing malformed TCP sequence numbers", is_correct: false },
      { text: "Broadcast storms generated by duplicate spanning tree BPDUs", is_correct: false }
    ]
  },
  {
    stem: "Which command shows whether an interface negotiated full duplex or half duplex on a Cisco switch?",
    explanation: "The command `show interfaces <id>` or `show interfaces status` displays port speed, duplex state (e.g. a-full or half), VLAN assignment, and operational link status.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "show ip protocols", is_correct: false },
      { text: "show interfaces status", is_correct: true },
      { text: "show vlan brief", is_correct: false },
      { text: "show mac address-table", is_correct: false }
    ]
  },
  {
    stem: "What is the binary representation of the IPv4 subnet mask 255.255.240.0?",
    explanation: "255 is 11111111, 255 is 11111111, 240 is 11110000, and 0 is 00000000. In total, there are 8 + 8 + 4 = 20 contiguous ones, representing a /20 mask.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "11111111.11111111.11000000.00000000", is_correct: false },
      { text: "11111111.11111111.11110000.00000000", is_correct: true },
      { text: "11111111.11111111.11111000.00000000", is_correct: false },
      { text: "11111111.11111111.11100000.00000000", is_correct: false }
    ]
  },
  {
    stem: "What is the primary benefit of deploying a Cisco SD-WAN architecture compared to traditional MPLS WAN circuits?",
    explanation: "Cisco SD-WAN decouples control plane and data plane, allowing dynamic traffic steering across multiple transport circuits (MPLS, broadband Internet, 5G LTE) based on real-time latency, jitter, and application SLAs.",
    domain: "network_infra",
    subtopic: "WAN Architectures",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Elimination of all routing protocols across customer branch offices", is_correct: false },
      { text: "Centralized policy management and dynamic application path selection over multiple transports", is_correct: true },
      { text: "Requirement to maintain physical leased lines with a single service provider", is_correct: false },
      { text: "Enforcement of Layer 2 spanning tree topology across global sites", is_correct: false }
    ]
  },
  {
    stem: "Which protocol in the TCP/IP suite provides error reporting and diagnostic queries (such as ping and traceroute) for IPv4?",
    explanation: "Internet Control Message Protocol (ICMP) is used by network devices to send error messages and operational information, such as Echo Request/Reply (Type 8/0) and Destination Unreachable (Type 3).",
    domain: "network_infra",
    subtopic: "Network Services",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "IGMP", is_correct: false },
      { text: "ICMP", is_correct: true },
      { text: "SNMP", is_correct: false },
      { text: "ARP", is_correct: false }
    ]
  },
  {
    stem: "How many usable host addresses are available in a /23 IPv4 network?",
    explanation: "A /23 network has 32 - 23 = 9 host bits. 2^9 = 512 total addresses. Subtracting 2 (network and broadcast) yields 510 usable host addresses.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "254", is_correct: false },
      { text: "510", is_correct: true },
      { text: "512", is_correct: false },
      { text: "1022", is_correct: false }
    ]
  },
  {
    stem: "What is the function of the Service Set Identifier (SSID) in an 802.11 wireless network?",
    explanation: "The SSID is a case-sensitive alphanumeric text string (up to 32 characters) that serves as the human-readable network name allowing clients to identify and connect to a specific wireless network.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The cryptographic encryption key used by the WPA2 pre-shared key", is_correct: false },
      { text: "The human-readable network name identifying the wireless LAN", is_correct: true },
      { text: "The 48-bit MAC address of the access point antenna port", is_correct: false },
      { text: "The VLAN tag assigned to trunk links between AP and switch", is_correct: false }
    ]
  },
  {
    stem: "Which PoE standard is known as PoE+ and provides up to 30 Watts of power from the power sourcing equipment (PSE)?",
    explanation: "IEEE 802.3at is PoE+, providing up to 30W at the switch port (PSE) and guaranteeing at least 25.5W at the powered device (PD). This supports devices like PTZ cameras and dual-radio 802.11ax APs.",
    domain: "network_infra",
    subtopic: "PoE Standards",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "IEEE 802.3af", is_correct: false },
      { text: "IEEE 802.3at", is_correct: true },
      { text: "IEEE 802.3bt Type 3", is_correct: false },
      { text: "IEEE 802.3bt Type 4", is_correct: false }
    ]
  },
  {
    stem: "Which mechanism in IPv6 allows a host to automatically configure its own global unicast address without a stateful DHCPv6 server?",
    explanation: "Stateless Address Autoconfiguration (SLAAC) allows a device to learn its IPv6 network prefix and default gateway from Router Advertisement (RA) messages sent by local routers, and generate its own 64-bit interface identifier.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "DHCPv6 Relay", is_correct: false },
      { text: "SLAAC (Stateless Address Autoconfiguration)", is_correct: true },
      { text: "NAT64", is_correct: false },
      { text: "6to4 Tunneling", is_correct: false }
    ]
  },
  {
    stem: "When an engineer sees 'input errors' incrementing alongside 'CRC errors' on a FastEthernet interface, what is the most common cause?",
    explanation: "Input errors aggregate problems such as CRC errors, runts, giants, and frame alignment errors. When CRC and input errors increment together, physical cabling defects, bad patch cables, or electrical noise are almost always the cause.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Incorrect default gateway configured on the host", is_correct: false },
      { text: "Defective physical media, connector, or electrical noise", is_correct: true },
      { text: "Mismatched OSPF hello timer interval", is_correct: false },
      { text: "Port security violation discarding incoming frames", is_correct: false }
    ]
  },
  {
    stem: "What is the purpose of an Extended Service Set (ESS) in 802.11 wireless deployments?",
    explanation: "An ESS connects two or more Basic Service Sets (BSSs) together using a shared wired Distribution System (DS) under a common SSID. This enables wireless client roaming across multiple access points without losing network connectivity.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Connecting multiple wireless clients to a single AP without a router", is_correct: false },
      { text: "Combining multiple BSS cells under one SSID to allow client roaming", is_correct: true },
      { text: "Providing point-to-point wireless bridging between two remote buildings", is_correct: false },
      { text: "Isolating guest wireless traffic from internal corporate VLANs", is_correct: false }
    ]
  },
  {
    stem: "Which IPv4 address class uses the default subnet mask 255.0.0.0 (/8)?",
    explanation: "Class A addresses (1.0.0.0 to 126.0.0.0) use a default /8 mask. Class B uses /16 (255.255.0.0), and Class C uses /24 (255.255.255.0).",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Class A", is_correct: true },
      { text: "Class B", is_correct: false },
      { text: "Class C", is_correct: false },
      { text: "Class D", is_correct: false }
    ]
  },
  {
    stem: "In an enterprise network, what is the role of an Next-Generation Firewall (NGFW)?",
    explanation: "An NGFW provides stateful inspection alongside deep packet inspection, application visibility and control (Layer 7), integrated intrusion prevention (IPS), and threat intelligence beyond traditional port/protocol filtering.",
    domain: "network_infra",
    subtopic: "Security Devices",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Aggregating Layer 2 VLAN trunks between access switches", is_correct: false },
      { text: "Performing Layer 7 application inspection, intrusion prevention, and advanced threat filtering", is_correct: true },
      { text: "Terminating physical telephone cables into VoIP SIP gateways", is_correct: false },
      { text: "Converting single-mode optical fiber signals into copper 1000BASE-T", is_correct: false }
    ]
  },
  {
    stem: "What is the primary advantage of single-mode optical fiber (SMF) over multi-mode optical fiber (MMF)?",
    explanation: "Single-mode fiber uses a narrow core (~9 microns) through which a laser transmits a single ray of light. This virtually eliminates modal dispersion, allowing much greater transmission distances (tens of kilometers) compared to MMF.",
    domain: "network_infra",
    subtopic: "Physical Media",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "SMF uses inexpensive LED light sources instead of lasers", is_correct: false },
      { text: "SMF supports much longer transmission distances with lower modal dispersion", is_correct: true },
      { text: "SMF has a significantly larger core diameter that is easier to terminate", is_correct: false },
      { text: "SMF is immune to bend radius restrictions and physical damage", is_correct: false }
    ]
  },
  {
    stem: "Which field in the TCP header controls flow control by indicating the number of bytes the receiver is willing to accept?",
    explanation: "The Window Size field (16 bits) in the TCP header is used by the receiver to inform the sender how much buffer space is available, enabling dynamic sliding window flow control.",
    domain: "network_infra",
    subtopic: "TCP/IP Transport",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Sequence Number", is_correct: false },
      { text: "Acknowledgment Number", is_correct: false },
      { text: "Window Size", is_correct: true },
      { text: "Urgent Pointer", is_correct: false }
    ]
  },
  {
    stem: "What is the purpose of the 802.11 association process between a wireless client and an access point?",
    explanation: "Association occurs after 802.11 authentication. It registers the client with the access point's BSS, allowing the AP to allocate memory buffers and map client frames to the appropriate distribution system VLAN.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It assigns an IPv4 address to the wireless station via DHCP", is_correct: false },
      { text: "It establishes the Layer 2 connection mapping the client to the AP's radio cell", is_correct: true },
      { text: "It resolves DNS hostnames for web traffic initiated by the client", is_correct: false },
      { text: "It measures optical loss on the upstream switch trunk port", is_correct: false }
    ]
  },
  {
    stem: "An administrator connects to a Cisco switch and types `show lldp neighbors`. What information is presented in the output?",
    explanation: "The `show lldp neighbors` command displays neighbor chassis ID/name, local interface, capability codes, neighbor port identifier, and hold time for all directly connected LLDP-enabled devices.",
    domain: "network_infra",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "A list of IP routing table entries learned via dynamic routing", is_correct: false },
      { text: "Details of directly connected neighboring devices advertising via IEEE 802.1AB", is_correct: true },
      { text: "Active spanning tree root bridge priorities across all VLANs", is_correct: false },
      { text: "DHCP lease bindings and client MAC address mappings", is_correct: false }
    ]
  }
];

fs.writeFileSync(
  path.join(__dirname, "../questions-batch-1.json"),
  JSON.stringify(questions, null, 2)
);
console.log(`Generated ${questions.length} questions in questions-batch-1.json`);
