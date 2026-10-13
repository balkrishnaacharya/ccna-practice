const fs = require('fs');

const questions = [
  {
    stem: "What is the primary function of a Layer 2 switch in an enterprise campus network?",
    explanation: "A Layer 2 switch forwards Ethernet frames using MAC addresses stored in its CAM table. It operates at the Data Link layer and provides microsegmentation by creating separate collision domains for each port. Routers operate at Layer 3 to forward packets between different IP subnets.",
    domain: "network_infra",
    subtopic: "Network Components",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Forward frames based on destination MAC addresses", is_correct: true },
      { text: "Route packets based on destination IP addresses", is_correct: false },
      { text: "Perform network address translation between subnets", is_correct: false },
      { text: "Filter traffic using stateful inspection rules", is_correct: false }
    ]
  },
  {
    stem: "Which architectural design combines the distribution and core layers into a single tier?",
    explanation: "A collapsed core design merges the core and distribution layers into a single switch tier. This topology is recommended for smaller enterprise campus networks to reduce hardware costs and operational complexity. Three-tier designs retain dedicated distribution and core switches for larger scalability.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Collapsed core topology", is_correct: true },
      { text: "Spine-leaf architecture", is_correct: false },
      { text: "Three-tier hierarchical model", is_correct: false },
      { text: "Hub-and-spoke WAN design", is_correct: false }
    ]
  },
  {
    stem: "In a modern data center spine-leaf architecture, how do leaf switches connect to the rest of the fabric?",
    explanation: "In a spine-leaf design, every leaf switch connects to every spine switch, but leaf switches never connect to other leaf switches directly. This ensures predictable, consistent low latency across the fabric with equal-cost multipathing (ECMP). Spine switches also do not connect directly to other spine switches.",
    domain: "network_infra",
    subtopic: "Spine-Leaf Architecture",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Every leaf connects to every spine switch", is_correct: true },
      { text: "Leaves connect directly to adjacent leaf switches", is_correct: false },
      { text: "Leaves connect only to a designated primary spine switch", is_correct: false },
      { text: "Leaves connect through an access-aggregation ring", is_correct: false }
    ]
  },
  {
    stem: "Which type of optical fiber is optimized for high-bandwidth transmissions over long distances exceeding 2 kilometers?",
    explanation: "Single-mode fiber (SMF) uses a narrow core (around 9 microns) and a laser light source to transmit signals over long distances with minimal modal dispersion. In contrast, multimode fiber (MMF) has a larger core (50 or 62.5 microns) and is typically used for shorter campus or data center runs under 500 meters.",
    domain: "network_infra",
    subtopic: "Physical Media",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Single-mode fiber (SMF)", is_correct: true },
      { text: "Multimode fiber (MMF)", is_correct: false },
      { text: "Shielded twisted-pair (STP)", is_correct: false },
      { text: "Unshielded twisted-pair (UTP)", is_correct: false }
    ]
  },
  {
    stem: "What is the maximum power delivered by the Power over Ethernet Plus (802.3at) standard at the PSE port?",
    explanation: "The IEEE 802.3at standard, also known as PoE+, delivers up to 30.0 Watts of DC power at the Power Sourcing Equipment (PSE) port, guaranteeing at least 25.5 Watts at the Powered Device (PD). Standard 802.3af delivers 15.4 Watts at the PSE port. Newer 802.3bt standards provide 60W or 90W for higher draw devices.",
    domain: "network_infra",
    subtopic: "PoE Standards",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "30.0 Watts", is_correct: true },
      { text: "15.4 Watts", is_correct: false },
      { text: "60.0 Watts", is_correct: false },
      { text: "90.0 Watts", is_correct: false }
    ]
  },
  {
    stem: "Which symptom typically indicates a duplex mismatch between two connected Ethernet interfaces?",
    explanation: "When one side is configured for full-duplex and the other for half-duplex, the half-duplex side will experience late collisions and runts because it detects transmissions during its own transmission window. The full-duplex side will typically log FCS/CRC errors. Link down state or no carrier errors indicate physical layer disconnects.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Late collisions on the half-duplex interface", is_correct: true },
      { text: "Immediate line protocol down status", is_correct: false },
      { text: "Broadcast storms traversing the link", is_correct: false },
      { text: "Complete cessation of ARP requests", is_correct: false }
    ]
  },
  {
    stem: "What is the default TCP flags sequence during a standard three-way handshake?",
    explanation: "A TCP connection is established using a three-way handshake: the client sends a SYN packet, the server responds with SYN-ACK, and the client finishes the handshake with an ACK packet. After this sequence, reliable bidirectional data transmission can begin.",
    domain: "network_infra",
    subtopic: "TCP/IP Transport",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "SYN, SYN-ACK, ACK", is_correct: true },
      { text: "ACK, SYN, ACK", is_correct: false },
      { text: "SYN, ACK, FIN", is_correct: false },
      { text: "RST, SYN, ACK", is_correct: false }
    ]
  },
  {
    stem: "How many usable host IP addresses are available in a /28 IPv4 subnet?",
    explanation: "A /28 subnet has 32 - 28 = 4 host bits. The total number of addresses is 2^4 = 16, and subtracting 2 for the network and broadcast addresses leaves 14 usable host addresses.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "14", is_correct: true },
      { text: "16", is_correct: false },
      { text: "30", is_correct: false },
      { text: "6", is_correct: false }
    ]
  },
  {
    stem: "Which address range is designated for private network addressing under RFC 1918 for Class B networks?",
    explanation: "RFC 1918 reserves 172.16.0.0 through 172.31.255.255 (a /12 block) for private networks in the historical Class B range. The range 10.0.0.0/8 corresponds to Class A, while 192.168.0.0/16 corresponds to Class B private space.",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "172.16.0.0 to 172.31.255.255", is_correct: true },
      { text: "172.16.0.0 to 172.32.255.255", is_correct: false },
      { text: "10.0.0.0 to 10.255.255.255", is_correct: false },
      { text: "192.168.0.0 to 192.168.255.255", is_correct: false }
    ]
  },
  {
    stem: "What prefix designates an IPv6 Link-Local address?",
    explanation: "IPv6 link-local addresses always start with the prefix FE80::/10 (typically appearing as fe80::). These addresses are mandatory on all IPv6-enabled interfaces and are used exclusively for communication within the local broadcast domain. They are not routable outside the local link.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "FE80::/10", is_correct: true },
      { text: "FC00::/7", is_correct: false },
      { text: "2000::/3", is_correct: false },
      { text: "FF00::/8", is_correct: false }
    ]
  },
  {
    stem: "Which wireless deployment architecture uses CAPWAP tunnels to split MAC layer processing between an AP and a controller?",
    explanation: "A Split-MAC architecture divides 802.11 processing between the lightweight access point (LAP) and the centralized wireless LAN controller (WLC). Real-time frames like beacons and ACKs are handled by the LAP, while association, authentication, and management are forwarded via CAPWAP to the WLC.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Split-MAC architecture with Lightweight APs", is_correct: true },
      { text: "Autonomous AP deployment", is_correct: false },
      { text: "Ad-hoc peer-to-peer Wi-Fi network", is_correct: false },
      { text: "Bridge mode mesh network", is_correct: false }
    ]
  },
  {
    stem: "What mode allows a Cisco Lightweight AP to locally switch client data traffic if the WAN link to its WLC fails?",
    explanation: "FlexConnect mode (formerly known as H-REAP) enables lightweight access points at branch offices to switch client data frames locally on the local subnet. If connection to the central WLC drops, the AP can continue to provide local connectivity and authentication without interruption.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "FlexConnect mode", is_correct: true },
      { text: "Sniffer mode", is_correct: false },
      { text: "Rogue detector mode", is_correct: false },
      { text: "Bridge mode", is_correct: false }
    ]
  },
  {
    stem: "Which field in the IPv4 header prevents packets from endlessly circulating in a routing loop?",
    explanation: "The Time to Live (TTL) field is an 8-bit counter decremented by 1 at every router hop. When the TTL reaches 0, the router drops the packet and sends an ICMP Time Exceeded message back to the sender, preventing permanent routing loops.",
    domain: "network_infra",
    subtopic: "IPv4 Header",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Time to Live (TTL)", is_correct: true },
      { text: "Differentiated Services Code Point (DSCP)", is_correct: false },
      { text: "Header Checksum", is_correct: false },
      { text: "Identification", is_correct: false }
    ]
  },
  {
    stem: "Which IPv6 header field serves the equivalent role of the IPv4 Time to Live (TTL) field?",
    explanation: "In IPv6, the Hop Limit field is an 8-bit integer decremented by each router that forwards the packet. Just like IPv4 TTL, when the Hop Limit reaches 0, the packet is discarded and an ICMPv6 Hop Limit Exceeded message is returned.",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Hop Limit", is_correct: true },
      { text: "Flow Label", is_correct: false },
      { text: "Next Header", is_correct: false },
      { text: "Traffic Class", is_correct: false }
    ]
  },
  {
    stem: "In an EUI-64 IPv6 address generation process, which modifications are made to a 48-bit MAC address?",
    explanation: "To convert a 48-bit MAC address into a 64-bit interface identifier, the 16-bit hex sequence 0xFFFE is inserted into the exact middle of the MAC. Additionally, the 7th bit of the first byte (the universal/local bit) is inverted (flipped).",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Insert 0xFFFE into the middle and invert the 7th bit", is_correct: true },
      { text: "Insert 0xEEEE into the middle and set the 8th bit to 1", is_correct: false },
      { text: "Append 0xFFFF to the end and invert the first bit", is_correct: false },
      { text: "Prepend 0xFE80 and leave all MAC bits untouched", is_correct: false }
    ]
  },
  {
    stem: "What is the network address of the subnet containing the host IP 192.168.10.145/27?",
    explanation: "A /27 subnet has a mask of 255.255.255.224, giving a block size of 32 (256 - 224). The subnet boundaries are 0, 32, 64, 96, 128, 160, etc. Since 145 lies between 128 and 159, the network address is 192.168.10.128.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "192.168.10.128", is_correct: true },
      { text: "192.168.10.144", is_correct: false },
      { text: "192.168.10.96", is_correct: false },
      { text: "192.168.10.0", is_correct: false }
    ]
  },
  {
    stem: "Which protocol operates over UDP port 67 and port 68 for automatic IP configuration?",
    explanation: "The Dynamic Host Configuration Protocol (DHCP) uses UDP port 67 for the server and UDP port 68 for the client. Clients broadcast DHCPDISCOVER messages to discover available servers on the local segment.",
    domain: "network_infra",
    subtopic: "Network Services",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "DHCP", is_correct: true },
      { text: "DNS", is_correct: false },
      { text: "SNMP", is_correct: false },
      { text: "TFTP", is_correct: false }
    ]
  },
  {
    stem: "What is the primary characteristic of UDP compared to TCP?",
    explanation: "User Datagram Protocol (UDP) is a connectionless, best-effort transport protocol with low overhead. Unlike TCP, UDP does not provide sequencing, acknowledgments, or flow control, making it ideal for delay-sensitive real-time voice and video streams.",
    domain: "network_infra",
    subtopic: "TCP/IP Transport",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Connectionless with no guarantee of delivery", is_correct: true },
      { text: "Connection-oriented with positive acknowledgments", is_correct: false },
      { text: "Provides byte-stream windowing and error retransmissions", is_correct: false },
      { text: "Negotiates maximum segment size (MSS) prior to sending", is_correct: false }
    ]
  },
  {
    stem: "Which connector type is commonly used with Category 6 unshielded twisted-pair (UTP) copper cabling?",
    explanation: "RJ-45 (Registered Jack 45) is the 8-pin modular connector standardized for Ethernet over twisted-pair copper cables like Cat5e, Cat6, and Cat6a. LC, SC, and ST are optical fiber connectors.",
    domain: "network_infra",
    subtopic: "Physical Media",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "RJ-45", is_correct: true },
      { text: "LC connector", is_correct: false },
      { text: "SC connector", is_correct: false },
      { text: "BNC connector", is_correct: false }
    ]
  },
  {
    stem: "What is the broadcast address for the subnet 10.1.4.0/22?",
    explanation: "A /22 mask is 255.255.252.0. The third octet has a block size of 4 (256 - 252). The subnet spans 10.1.4.0 through 10.1.7.255, making 10.1.7.255 the directed broadcast address.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "10.1.7.255", is_correct: true },
      { text: "10.1.4.255", is_correct: false },
      { text: "10.1.15.255", is_correct: false },
      { text: "10.1.255.255", is_correct: false }
    ]
  },
  {
    stem: "Which wireless frequency band provides more non-overlapping 20 MHz channels to minimize co-channel interference?",
    explanation: "The 5 GHz frequency band offers up to 24 or more non-overlapping 20 MHz channels, depending on regulatory domain and DFS support. By contrast, the 2.4 GHz band provides only three non-overlapping channels (channels 1, 6, and 11 in North America), making it much more susceptible to congestion and co-channel interference.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "5 GHz band", is_correct: true },
      { text: "2.4 GHz band", is_correct: false },
      { text: "900 MHz band", is_correct: false },
      { text: "60 GHz band", is_correct: false }
    ]
  },
  {
    stem: "What is the purpose of the Point-to-Point Protocol over Ethernet (PPPoE) in WAN broadband access?",
    explanation: "PPPoE encapsulates PPP frames inside Ethernet frames, enabling service providers to implement user authentication, session accounting, and link configuration over a shared Ethernet transport like DSL. It allows telcos to manage customer credentials using standard RADIUS or TACACS+ mechanisms.",
    domain: "network_infra",
    subtopic: "WAN Architectures",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Provide authentication and session management over Ethernet", is_correct: true },
      { text: "Establish an encrypted IPsec tunnel over the public internet", is_correct: false },
      { text: "Dynamically route BGP prefixes across multiple ISPs", is_correct: false },
      { text: "Aggregate multiple physical serial links into a single logical channel", is_correct: false }
    ]
  },
  {
    stem: "Which command shows detailed hardware statistics, including input/output errors, CRC errors, and duplex status on a Cisco switch port?",
    explanation: "The command `show interfaces [interface-id]` displays complete operational parameters and counters for an interface. This includes speed, duplex, packet counts, runt/giant errors, CRC errors, and input/output drops.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "show interfaces GigabitEthernet0/1", is_correct: true },
      { text: "show ip interface brief", is_correct: false },
      { text: "show mac address-table", is_correct: false },
      { text: "show vlan brief", is_correct: false }
    ]
  },
  {
    stem: "What does an IPv4 address beginning with 169.254.X.X signify when observed on a host?",
    explanation: "The 169.254.0.0/16 prefix is reserved for Automatic Private IP Addressing (APIPA) / Link-Local addressing. A host self-assigns an address from this range when it is configured for DHCP but fails to receive a response from a DHCP server on the local network.",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "The host failed to obtain an IP from a DHCP server (APIPA)", is_correct: true },
      { text: "The host is connected to a public cloud VPC network", is_correct: false },
      { text: "The host is using a reserved multicast class D address", is_correct: false },
      { text: "The host has received a rogue DHCP reservation", is_correct: false }
    ]
  },
  {
    stem: "Which IPv6 multicast address represents all IPv6 routers on the local link?",
    explanation: "The address FF02::2 is the link-local all-routers multicast address in IPv6. All IPv6 routers listen on this group address for Router Solicitation messages from hosts. FF02::1 represents all IPv6 nodes.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "FF02::2", is_correct: true },
      { text: "FF02::1", is_correct: false },
      { text: "FF02::5", is_correct: false },
      { text: "FF02::1:FF00::/104", is_correct: false }
    ]
  },
  {
    stem: "In a three-tier hierarchical network design, what is the primary role of the Core layer?",
    explanation: "The core layer acts as the high-speed network backbone. Its main objective is to switch packets as fast as possible between distribution blocks with low latency and high availability, without performing CPU-intensive tasks like packet filtering or ACL inspection.",
    domain: "network_infra",
    subtopic: "Campus Architectures",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Provide high-speed, low-latency transport between distribution blocks", is_correct: true },
      { text: "Perform granular security filtering and quality of service tagging", is_correct: false },
      { text: "Terminate end-user client connections and apply 802.1X security", is_correct: false },
      { text: "Distribute IP addresses via DHCP and act as the default gateway", is_correct: false }
    ]
  },
  {
    stem: "Which standard defines Power over Ethernet (PoE) providing up to 15.4 Watts per port?",
    explanation: "IEEE 802.3af was the original Power over Ethernet standard ratified in 2003, supplying up to 15.4 W at the PSE port. The newer 802.3at (PoE+) provides 30 W, while 802.3bt (4PPoE) offers up to 60 W (Type 3) and 90 W (Type 4).",
    domain: "network_infra",
    subtopic: "PoE Standards",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "IEEE 802.3af", is_correct: true },
      { text: "IEEE 802.3at", is_correct: false },
      { text: "IEEE 802.3bt", is_correct: false },
      { text: "IEEE 802.11ax", is_correct: false }
    ]
  },
  {
    stem: "What is the maximum distance supported by standard 1000BASE-T Gigabit Ethernet over Category 5e UTP cabling?",
    explanation: "1000BASE-T over Cat5e or Cat6 UTP cabling supports a maximum segment length of 100 meters (approximately 328 feet). This includes up to 90 meters of horizontal solid-core cabling and 10 meters of patch cords.",
    domain: "network_infra",
    subtopic: "Physical Media",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "100 meters", is_correct: true },
      { text: "50 meters", is_correct: false },
      { text: "250 meters", is_correct: false },
      { text: "500 meters", is_correct: false }
    ]
  },
  {
    stem: "Which layer of the OSI model is responsible for logical addressing and packet routing across inter-network boundaries?",
    explanation: "The Network layer (Layer 3) handles logical addressing (such as IPv4 and IPv6) and path determination across routed networks. The Data Link layer (Layer 2) handles physical MAC addressing on local segments.",
    domain: "network_infra",
    subtopic: "OSI Reference Model",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Network layer (Layer 3)", is_correct: true },
      { text: "Data Link layer (Layer 2)", is_correct: false },
      { text: "Transport layer (Layer 4)", is_correct: false },
      { text: "Session layer (Layer 5)", is_correct: false }
    ]
  },
  {
    stem: "What frame check sequence error typically occurs when a frame is corrupt or damaged in transit across a copper cable?",
    explanation: "A Cyclic Redundancy Check (CRC) error occurs when the mathematical checksum calculated by the receiving switch port does not match the FCS field in the Ethernet trailer. High CRC errors are usually caused by bad physical cables, electromagnetic interference, or faulty transceiver modules.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "CRC / FCS error", is_correct: true },
      { text: "Late collision error", is_correct: false },
      { text: "Buffer overrun error", is_correct: false },
      { text: "Carrier transition error", is_correct: false }
    ]
  },
  {
    stem: "Which protocol is used by Cisco Discovery Protocol (CDP) and LLDP to share device information?",
    explanation: "Both CDP and LLDP are Layer 2 neighbor discovery protocols that encapsulate advertisements directly into Data Link layer frames without requiring an IP stack. They multicast advertisements on local segments to discover adjacent device types, software versions, and port IDs.",
    domain: "network_infra",
    subtopic: "Discovery Protocols",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Direct Layer 2 multicast frames", is_correct: true },
      { text: "Layer 3 UDP broadcast packets", is_correct: false },
      { text: "Layer 4 TCP unicast connections", is_correct: false },
      { text: "ICMP echo discovery messages", is_correct: false }
    ]
  },
  {
    stem: "Which command enables Link Layer Discovery Protocol (LLDP) globally on a Cisco IOS-XE switch?",
    explanation: "The global configuration command `lldp run` turns on LLDP processing on the switch. Unlike CDP, which is enabled by default on Cisco equipment, LLDP is an open IEEE standard (802.1AB) that often requires explicit global activation.",
    domain: "network_infra",
    subtopic: "Discovery Protocols",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "lldp run", is_correct: true },
      { text: "lldp enable", is_correct: false },
      { text: "lldp transmit and receive", is_correct: false },
      { text: "enable lldp-discovery", is_correct: false }
    ]
  },
  {
    stem: "What is the function of the Service Set Identifier (SSID) in an 802.11 wireless network?",
    explanation: "An SSID is a human-readable text string (up to 32 characters) that uniquely identifies a specific wireless local area network. Access points broadcast the SSID in 802.11 beacon frames so wireless clients can identify and select the desired wireless network.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Identifies the name of the wireless network for clients", is_correct: true },
      { text: "Acts as the encryption master key for WPA3 handshakes", is_correct: false },
      { text: "Specifies the radio frequency channel allocated to the BSS", is_correct: false },
      { text: "Designates the VLAN ID assigned to the AP trunk interface", is_correct: false }
    ]
  },
  {
    stem: "Which wireless topology feature combines multiple Basic Service Sets (BSSs) connected by a common Distribution System (DS)?",
    explanation: "An Extended Service Set (ESS) consists of two or more interconnected Basic Service Sets (BSSs) sharing the same SSID across a common wired Distribution System. This allows wireless clients to roam seamlessly between access points without dropping their network session.",
    domain: "network_infra",
    subtopic: "Wireless Fundamentals",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Extended Service Set (ESS)", is_correct: true },
      { text: "Independent Basic Service Set (IBSS)", is_correct: false },
      { text: "Personal Area Network (PAN)", is_correct: false },
      { text: "Mesh Portal Cluster (MPC)", is_correct: false }
    ]
  },
  {
    stem: "Which encapsulation method is used to transport client traffic between an AP and a central WLC in a unified wireless network?",
    explanation: "Control and Provisioning of Wireless Access Points (CAPWAP) is the standard protocol used between lightweight APs and WLCs. It creates two tunnels: a control tunnel over UDP port 5246 (secured with DTLS) and a data tunnel over UDP port 5247 for client payload frames.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "CAPWAP data tunnel (UDP 5247)", is_correct: true },
      { text: "GRE point-to-point tunnel (IP proto 47)", is_correct: false },
      { text: "IPsec transport mode (ESP proto 50)", is_correct: false },
      { text: "VXLAN overlay tunnel (UDP 4789)", is_correct: false }
    ]
  },
  {
    stem: "What is the usable host range for a host configured on network 172.16.80.0/20?",
    explanation: "A /20 subnet has a subnet mask of 255.255.240.0, which has an increment of 16 in the third octet. The network spans 172.16.80.0 through 172.16.95.255. The usable host addresses are 172.16.80.1 through 172.16.95.254.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "172.16.80.1 to 172.16.95.254", is_correct: true },
      { text: "172.16.80.1 to 172.16.80.254", is_correct: false },
      { text: "172.16.80.1 to 172.16.87.254", is_correct: false },
      { text: "172.16.80.1 to 172.16.111.254", is_correct: false }
    ]
  },
  {
    stem: "How many subnets and hosts per subnet are created by subnetting 192.168.1.0/24 with a /29 mask?",
    explanation: "Borrowing from /24 to /29 gives 29 - 24 = 5 borrowed subnet bits, yielding 2^5 = 32 subnets. With 3 host bits remaining (32 - 29 = 3), each subnet has 2^3 - 2 = 6 usable hosts per subnet.",
    domain: "network_infra",
    subtopic: "IPv4 Subnetting",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "32 subnets with 6 usable hosts each", is_correct: true },
      { text: "16 subnets with 14 usable hosts each", is_correct: false },
      { text: "64 subnets with 2 usable hosts each", is_correct: false },
      { text: "8 subnets with 30 usable hosts each", is_correct: false }
    ]
  },
  {
    stem: "Which IPv6 address represents the equivalent of IPv4 loopback (127.0.0.1)?",
    explanation: "The IPv6 loopback address is ::1 (or 0:0:0:0:0:0:0:1 in uncompressed format). It is used by a node to send packets to itself for local testing and internal IPC.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "::1", is_correct: true },
      { text: "::", is_correct: false },
      { text: "FE80::1", is_correct: false },
      { text: "FF01::1", is_correct: false }
    ]
  },
  {
    stem: "What is the prefix range for IPv6 Unique Local Addresses (ULA) specified in RFC 4193?",
    explanation: "Unique Local Addresses use the block FC00::/7 (which encompasses FC00::/8 and FD00::/8). They are analogous to IPv4 RFC 1918 private addresses and are meant for local routing within an organization without being routed over the public internet.",
    domain: "network_infra",
    subtopic: "IPv6 Addressing",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "FC00::/7", is_correct: true },
      { text: "2000::/3", is_correct: false },
      { text: "FE80::/10", is_correct: false },
      { text: "FF00::/8", is_correct: false }
    ]
  },
  {
    stem: "Which transceiver form-factor supports 40 Gigabit Ethernet connections over fiber or DAC cabling?",
    explanation: "QSFP+ (Quad Small Form-factor Pluggable Plus) is the compact, hot-swappable transceiver standard designed for 40 Gbps data links by bundling four 10 Gbps lanes. SFP supports 1 Gbps, and SFP+ supports 10 Gbps.",
    domain: "network_infra",
    subtopic: "Physical Media",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "QSFP+", is_correct: true },
      { text: "SFP+", is_correct: false },
      { text: "GBIC", is_correct: false },
      { text: "XFP", is_correct: false }
    ]
  },
  {
    stem: "Which mechanism allows an Ethernet switch port in 'err-disabled' state to automatically recover after a configured period?",
    explanation: "The command `errdisable recovery cause [cause]` along with `errdisable recovery interval [seconds]` allows a switch to automatically re-enable ports placed into err-disabled state (e.g. from BPDU guard or port security violations) without manual administrator intervention.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "errdisable recovery cause all", is_correct: true },
      { text: "auto-recovery error-state enable", is_correct: false },
      { text: "switchport recovery timer", is_correct: false },
      { text: "service auto-restart interfaces", is_correct: false }
    ]
  },
  {
    stem: "What is the default aging time of dynamic MAC address table entries on a Cisco Catalyst switch?",
    explanation: "By default, dynamic MAC entries learned by a Cisco Catalyst switch age out after 300 seconds (5 minutes) of inactivity. If no frames with that source MAC arrive within that duration, the switch flushes the entry to keep the CAM table up to date.",
    domain: "network_infra",
    subtopic: "Switch Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "300 seconds (5 minutes)", is_correct: true },
      { text: "60 seconds (1 minute)", is_correct: false },
      { text: "600 seconds (10 minutes)", is_correct: false },
      { text: "3600 seconds (1 hour)", is_correct: false }
    ]
  },
  {
    stem: "Which field in the TCP header is used by the receiver to inform the sender how many bytes of data it can accept before receiving an acknowledgment?",
    explanation: "The Window Size field in the TCP header dictates the receive window (rwnd). This is the core mechanism of TCP flow control, preventing a fast sender from overwhelming a receiver's buffer space.",
    domain: "network_infra",
    subtopic: "TCP/IP Transport",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Window Size", is_correct: true },
      { text: "Sequence Number", is_correct: false },
      { text: "Acknowledgment Number", is_correct: false },
      { text: "Urgent Pointer", is_correct: false }
    ]
  },
  {
    stem: "Which WAN topology offers the highest redundancy and fault tolerance at the highest implementation cost?",
    explanation: "A full mesh topology connects every site directly to every other site with dedicated circuits. While it provides zero single points of failure and optimal path routing, the circuit count grows exponentially with n*(n-1)/2, making it the most expensive WAN design.",
    domain: "network_infra",
    subtopic: "WAN Architectures",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Full mesh topology", is_correct: true },
      { text: "Hub-and-spoke topology", is_correct: false },
      { text: "Partial mesh topology", is_correct: false },
      { text: "Point-to-point leased line", is_correct: false }
    ]
  },
  {
    stem: "What type of frame is discarded by a switch because its length is less than the minimum 64-byte Ethernet standard?",
    explanation: "A runt frame is an Ethernet frame that is smaller than the IEEE 802.3 minimum size of 64 bytes and has a bad FCS/CRC. Runts are most frequently generated as fragments resulting from network collisions.",
    domain: "network_infra",
    subtopic: "Interface Troubleshooting",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Runt frame", is_correct: true },
      { text: "Giant frame", is_correct: false },
      { text: "Jumbo frame", is_correct: false },
      { text: "Baby giant frame", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco platform provides centralized, intent-based network management, automation, and assurance for campus fabrics?",
    explanation: "Cisco Catalyst Center (formerly Cisco DNA Center) is the enterprise network management and command controller for Cisco Software-Defined Access (SD-Access). It provides automated device provisioning, policy management, and predictive telemetry assurance across campus LANs and WLANs.",
    domain: "network_infra",
    subtopic: "Network Automation Architecture",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Cisco Catalyst Center (DNA Center)", is_correct: true },
      { text: "Cisco Adaptive Security Appliance (ASA)", is_correct: false },
      { text: "Cisco Prime Infrastructure Express", is_correct: false },
      { text: "Cisco Firepower Device Manager", is_correct: false }
    ]
  },
  {
    stem: "In a Next-Generation Firewall (NGFW), what capability distinguishes it from a traditional stateful inspection firewall?",
    explanation: "A Next-Generation Firewall (NGFW) integrates deep packet inspection, application awareness (identifying applications regardless of port), and built-in intrusion prevention systems (IPS). Traditional stateful firewalls inspect only Layer 3 and Layer 4 header attributes like IP addresses and TCP/UDP ports.",
    domain: "network_infra",
    subtopic: "Security Devices",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Application-level inspection and integrated IPS", is_correct: true },
      { text: "Stateful tracking of TCP SYN/ACK flags", is_correct: false },
      { text: "Basic Layer 4 port filtering", is_correct: false },
      { text: "Static NAT address translation", is_correct: false }
    ]
  },
  {
    stem: "Which standard defines 802.11ax wireless technology, commonly known as Wi-Fi 6?",
    explanation: "IEEE 802.11ax is branded by the Wi-Fi Alliance as Wi-Fi 6. It introduces Orthogonal Frequency-Division Multiple Access (OFDMA), Target Wake Time (TWT), and 1024-QAM to dramatically increase network efficiency and client density in congested environments.",
    domain: "network_infra",
    subtopic: "Wireless Standards",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Wi-Fi 6 (802.11ax)", is_correct: true },
      { text: "Wi-Fi 5 (802.11ac)", is_correct: false },
      { text: "Wi-Fi 4 (802.11n)", is_correct: false },
      { text: "Wi-Fi 6E (802.11be)", is_correct: false }
    ]
  },
  {
    stem: "What feature in Wi-Fi 6 allows multiple clients with different bandwidth requirements to transmit simultaneously on the same channel?",
    explanation: "OFDMA (Orthogonal Frequency-Division Multiple Access) subdivides a single Wi-Fi channel into smaller frequency allocations called Resource Units (RUs). This allows the access point to communicate with multiple clients in parallel in both uplink and downlink, drastically cutting latency.",
    domain: "network_infra",
    subtopic: "Wireless Standards",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "OFDMA (Orthogonal Frequency-Division Multiple Access)", is_correct: true },
      { text: "CSMA/CA (Carrier Sense Multiple Access with Collision Avoidance)", is_correct: false },
      { text: "MIMO beamforming arrays", is_correct: false },
      { text: "Dynamic Frequency Selection (DFS)", is_correct: false }
    ]
  },
  {
    stem: "Which parameter is dynamically negotiated using TCP MSS (Maximum Segment Size)?",
    explanation: "The TCP MSS dictates the maximum amount of payload data (excluding IP and TCP headers) that a host can receive in a single TCP segment. During the initial three-way handshake, each host advertises its MSS, which is typically derived from the interface MTU minus 40 bytes (for IPv4).",
    domain: "network_infra",
    subtopic: "TCP/IP Transport",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "The maximum payload data size in a single TCP segment", is_correct: true },
      { text: "The total size of the Ethernet frame including preamble", is_correct: false },
      { text: "The maximum number of TCP segments sent without an ACK", is_correct: false },
      { text: "The maximum allowable transmission delay across a WAN link", is_correct: false }
    ]
  }
];

const path = require('path');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'data/network_infra.json'), JSON.stringify(questions, null, 2));
console.log(`Generated ${questions.length} network_infra questions.`);
