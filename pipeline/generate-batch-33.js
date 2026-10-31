#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const questions = [
  // ==========================================
  // NETWORK_INFRA (17 questions)
  // ==========================================
  {
    stem: "Which cloud deployment model combines on-premises private infrastructure with public cloud services, allowing data and applications to be shared between them?",
    explanation: "A Hybrid Cloud integrates private on-premises infrastructure (or private cloud) with public cloud services, allowing organizations to balance scalability and security.",
    domain: "network_infra",
    subtopic: "Cloud Connectivity",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Hybrid Cloud", is_correct: true },
      { text: "Public Cloud", is_correct: false },
      { text: "Private Cloud", is_correct: false },
      { text: "Community Cloud", is_correct: false }
    ]
  },
  {
    stem: "In a Software-as-a-Service (SaaS) cloud model (e.g. Microsoft 365), what is the customer's primary responsibility under the shared responsibility model?",
    explanation: "Under SaaS, the cloud service provider manages the application, runtime, OS, and infrastructure. The customer remains responsible for managing their own data, user identities, and access permissions.",
    domain: "network_infra",
    subtopic: "Cloud Connectivity",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Managing data access permissions, user identity administration, and credential governance", is_correct: true },
      { text: "Patching the underlying server hypervisor operating systems", is_correct: false },
      { text: "Maintaining physical data center rack cooling systems", is_correct: false },
      { text: "Configuring BGP routing protocols between data center spine switches", is_correct: false }
    ]
  },
  {
    stem: "Which class of IPv4 addresses is designated by the initial octet range 224.0.0.0 to 239.255.255.255?",
    explanation: "Class D IPv4 addresses (spanning 224.0.0.0 to 239.255.255.255, or 224.0.0.0/4) are reserved exclusively for multicast traffic delivery.",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Class D (Multicast)", is_correct: true },
      { text: "Class A (Unicast)", is_correct: false },
      { text: "Class C (Unicast)", is_correct: false },
      { text: "Class E (Experimental)", is_correct: false }
    ]
  },
  {
    stem: "Which IPv4 address block is designated by RFC 5737 as 'TEST-NET-1' for use in educational documentation and network configuration examples?",
    explanation: "RFC 5737 reserves three blocks for documentation: TEST-NET-1 (192.0.2.0/24), TEST-NET-2 (198.51.100.0/24), and TEST-NET-3 (203.0.113.0/24). These addresses should not appear on the public Internet.",
    domain: "network_infra",
    subtopic: "IPv4 Addressing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "192.0.2.0/24", is_correct: true },
      { text: "10.0.0.0/8", is_correct: false },
      { text: "169.254.0.0/16", is_correct: false },
      { text: "100.64.0.0/10", is_correct: false }
    ]
  },
  {
    stem: "What are the minimum and maximum header sizes in bytes for a standard IPv4 packet header?",
    explanation: "A standard IPv4 header without options is 20 bytes long. With optional fields, it can expand up to a maximum size of 60 bytes (indicated by an IHL value of 15).",
    domain: "network_infra",
    subtopic: "IPv4 Header",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Minimum 20 bytes; Maximum 60 bytes", is_correct: true },
      { text: "Minimum 40 bytes; Maximum 128 bytes", is_correct: false },
      { text: "Minimum 16 bytes; Maximum 32 bytes", is_correct: false },
      { text: "Minimum 8 bytes; Maximum 24 bytes", is_correct: false }
    ]
  },
  {
    stem: "In an IPv4 packet header, which 8-bit field identifies the upper-layer payload protocol (such as ICMP [1], TCP [6], or UDP [17])?",
    explanation: "The Protocol field in the IPv4 header identifies the next-level protocol carried in the payload (1 = ICMP, 6 = TCP, 17 = UDP, 89 = OSPF).",
    domain: "network_infra",
    subtopic: "IPv4 Header",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Protocol field", is_correct: true },
      { text: "Identification field", is_correct: false },
      { text: "Type of Service field", is_correct: false },
      { text: "Flags field", is_correct: false }
    ]
  },
  {
    stem: "In the base 40-byte IPv6 header, what does the 16-bit 'Payload Length' field measure?",
    explanation: "The Payload Length field in IPv6 specifies the length in bytes of everything that follows the 40-byte base header, including any extension headers and the upper-layer payload.",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The length of all extension headers plus upper-layer data in bytes, excluding the fixed 40-byte base header", is_correct: true },
      { text: "The total packet length including the 40-byte base header", is_correct: false },
      { text: "The MTU size of the outgoing physical link in bits", is_correct: false },
      { text: "The length of the Layer 2 Ethernet frame trailer", is_correct: false }
    ]
  },
  {
    stem: "Why does the base IPv6 header omit the Identification, Flags, and Fragment Offset fields present in IPv4?",
    explanation: "In IPv6, intermediate routers do not fragment packets. Fragmentation is performed strictly by the originating sending host using a Fragment Extension Header, streamlining base header processing on routers.",
    domain: "network_infra",
    subtopic: "IPv6 Header",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Because packet fragmentation in IPv6 is handled only by the sending host via extension headers, never by intermediate routers", is_correct: true },
      { text: "Because IPv6 packets cannot exceed 576 bytes in length", is_correct: false },
      { text: "Because all IPv6 networks use ATM fixed 53-byte cell switching", is_correct: false },
      { text: "Because IPv6 relies on TCP to perform all packet segmentation", is_correct: false }
    ]
  },
  {
    stem: "What is the primary operational function of a legacy physical Layer 1 network repeater or hub?",
    explanation: "A Layer 1 repeater or hub electrically amplifies and regenerates incoming physical signals, broadcasting all signals out all other ports within a single shared collision domain.",
    domain: "network_infra",
    subtopic: "Network Components",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Electrically regenerates and repeats signals across all connected ports in a single collision domain", is_correct: true },
      { text: "Maintains a MAC address table to segment collision domains", is_correct: false },
      { text: "Performs IP routing lookups using hardware TCAM tables", is_correct: false },
      { text: "Filters packets based on TCP/UDP port numbers", is_correct: false }
    ]
  },
  {
    stem: "What is an Application-Specific Integrated Circuit (ASIC) in enterprise network switches, and why is it preferred over a general-purpose CPU?",
    explanation: "An ASIC is custom-designed hardware silicon that executes specialized networking functions (such as MAC lookups, IP routing via CEF, and ACL filtering) simultaneously in hardware at wire-speed line rate, with far lower latency than a software CPU.",
    domain: "network_infra",
    subtopic: "Network Components",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Custom silicon designed to perform packet forwarding, filtering, and QoS lookups in hardware at line rate", is_correct: true },
      { text: "A software hypervisor running as an application on top of Linux", is_correct: false },
      { text: "An optical transceiver converting light to radio frequencies", is_correct: false },
      { text: "A battery backup module providing uninterruptible power to switch fans", is_correct: false }
    ]
  },
  {
    stem: "What is the primary function of a Spine switch in a data center two-tier leaf-spine Clos topology?",
    explanation: "Spine switches serve as the high-speed backbone interconnecting every Leaf switch in the fabric, forwarding traffic between leaves without directly connecting to end servers.",
    domain: "network_infra",
    subtopic: "Spine-Leaf Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Providing high-speed backbone routing interconnectivity between all Leaf switches in the fabric", is_correct: true },
      { text: "Directly attaching physical storage arrays and server blade chassis", is_correct: false },
      { text: "Serving as an 802.11ax wireless access controller", is_correct: false },
      { text: "Distributing dynamic DHCP pool addresses to client PCs", is_correct: false }
    ]
  },
  {
    stem: "In modern enterprise leaf-spine data center designs, what is the typical target oversubscription ratio between leaf downlink (server) and uplink (spine) bandwidth?",
    explanation: "Modern leaf-spine fabrics are designed for high throughput, typically targeting oversubscription ratios between 1:1 (completely non-blocking) and 3:1.",
    domain: "network_infra",
    subtopic: "Spine-Leaf Architecture",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Between 1:1 (non-blocking) and 3:1", is_correct: true },
      { text: "20:1 to 50:1", is_correct: false },
      { text: "100:1 to 200:1", is_correct: false },
      { text: "Strictly 1:10", is_correct: false }
    ]
  },
  {
    stem: "In containerized application architectures, what is a container image?",
    explanation: "A container image is an immutable, read-only package containing the application code, runtime engine, system libraries, and dependencies necessary to instantiate a running container.",
    domain: "network_infra",
    subtopic: "Virtualization and Containers",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A read-only, layered template containing application code, runtime libraries, and dependencies required to execute a container", is_correct: true },
      { text: "A snapshot of the host server BIOS firmware", is_correct: false },
      { text: "A graphical screenshot of a running desktop session", is_correct: false },
      { text: "A virtual hard disk file containing a full guest operating system kernel", is_correct: false }
    ]
  },
  {
    stem: "Which Linux kernel feature provides process and network isolation for Docker containers, ensuring each container sees its own virtual network stack?",
    explanation: "Linux Namespaces provide isolated views of system resources (network interfaces, process trees, mount points, IPC), while Control Groups (cgroups) meter and limit resource utilization (CPU, memory).",
    domain: "network_infra",
    subtopic: "Virtualization and Containers",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Linux Namespaces", is_correct: true },
      { text: "Kernel Control Groups (cgroups)", is_correct: false },
      { text: "IPtables NAT rules", is_correct: false },
      { text: "SELinux policies", is_correct: false }
    ]
  },
  {
    stem: "What is a Service Set Identifier (SSID) in IEEE 802.11 wireless networks?",
    explanation: "An SSID is a case-sensitive, human-readable text string of up to 32 alphanumeric characters used to identify a specific Wi-Fi wireless network.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "A human-readable text identifier of up to 32 characters naming a specific wireless network", is_correct: true },
      { text: "The physical 48-bit MAC address of the radio transceiver", is_correct: false },
      { text: "The pre-shared encryption key used in WPA2-Personal", is_correct: false },
      { text: "The IPv4 address of the default gateway router", is_correct: false }
    ]
  },
  {
    stem: "In an outdoor wireless mesh network, what is the architectural distinction between a Root Access Point (RAP) and a Mesh Access Point (MAP)?",
    explanation: "A Root Access Point (RAP) has a physical wired Ethernet connection to the network backbone. A Mesh Access Point (MAP) has no wired backbone link and connects back to the RAP using a dedicated wireless backhaul radio.",
    domain: "network_infra",
    subtopic: "Wireless Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "RAPs have a physical wired connection to the LAN backbone; MAPs connect wirelessly to other APs via wireless backhaul", is_correct: true },
      { text: "RAPs operate only in 2.4 GHz; MAPs operate only in 5 GHz", is_correct: false },
      { text: "MAPs are wired; RAPs are battery-operated mobile devices", is_correct: false },
      { text: "RAPs require an autonomous image; MAPs require a lightweight image", is_correct: false }
    ]
  },
  {
    stem: "In 5 GHz Wi-Fi deployments, what is Dynamic Frequency Selection (DFS) and why is it mandatory on certain channels?",
    explanation: "DFS monitors 5 GHz radio channels for radar signals (such as military or airport weather radar). If radar activity is detected, the AP immediately vacates the channel to avoid interference.",
    domain: "network_infra",
    subtopic: "Wireless Standards",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It detects radar transmissions and dynamically switches channels to prevent interference with radar installations", is_correct: true },
      { text: "It balances client connections across multiple 2.4 GHz channels", is_correct: false },
      { text: "It doubles transmission power when connected clients move far away", is_correct: false },
      { text: "It encrypts beacon frames using 192-bit AES algorithms", is_correct: false }
    ]
  },

  // ==========================================
  // SWITCHING (17 questions)
  // ==========================================
  {
    stem: "How many active physical Ethernet links can participate simultaneously in a single standard Cisco EtherChannel bundle?",
    explanation: "Both Cisco PAgP and standard IEEE 802.3ad LACP support up to 8 active bundled links. LACP allows an additional 8 links to sit in standby mode for failover.",
    domain: "switching",
    subtopic: "EtherChannel",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Up to 8 active links", is_correct: true },
      { text: "Up to 4 active links", is_correct: false },
      { text: "Up to 16 active links", is_correct: false },
      { text: "Up to 32 active links", is_correct: false }
    ]
  },
  {
    stem: "Which set of interface configuration parameters must match identically across all member interfaces before an EtherChannel can successfully bundle?",
    explanation: "All member interfaces must have matching speed, duplex, switchport mode (access or trunk), native VLAN, allowed VLAN list, and STP cost.",
    domain: "switching",
    subtopic: "EtherChannel",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Speed, duplex, switchport mode (access/trunk), native VLAN, and allowed VLAN list", is_correct: true },
      { text: "MAC address, IP address, and chassis serial number", is_correct: false },
      { text: "Oversubscription ratio and MTU size only", is_correct: false },
      { text: "CDP holdtime and SNMP community strings", is_correct: false }
    ]
  },
  {
    stem: "What is the primary difference in performance and resource usage between Process Switching and Cisco Express Forwarding (CEF) on multilayer switches?",
    explanation: "Process switching punts every packet to the main route processor CPU for table lookup, which is slow and CPU-intensive. CEF pre-computes forwarding tables (FIB and Adjacency Table) in specialized hardware ASICs, switching packets at wire speed.",
    domain: "switching",
    subtopic: "Layer 3 Switching",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Process switching punts packets to the main CPU; CEF pre-builds hardware forwarding tables in ASICs for line-rate switching", is_correct: true },
      { text: "Process switching uses hardware ASICs; CEF uses software routing", is_correct: false },
      { text: "CEF is supported only on serial WAN connections; Process switching is for Ethernet", is_correct: false },
      { text: "Process switching caches routes; CEF calculates Dijkstra paths per packet", is_correct: false }
    ]
  },
  {
    stem: "What condition must be satisfied for a Switched Virtual Interface (SVI) to transition to the 'up / up' operational state?",
    explanation: "An SVI (e.g. `interface Vlan 10`) transitions to up/up only if the VLAN exists in the switch database and at least one physical port assigned to that VLAN (access or trunk) is up/up and in the Spanning Tree forwarding state.",
    domain: "switching",
    subtopic: "Layer 3 Switching",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The VLAN must exist, and at least one physical port assigned to that VLAN must be up/up in STP forwarding state", is_correct: true },
      { text: "The switch must be configured in VTP Server mode", is_correct: false },
      { text: "The SVI must be assigned a public IPv4 address from ARIN", is_correct: false },
      { text: "An OSPF neighbor adjacency must already be established", is_correct: false }
    ]
  },
  {
    stem: "In Cisco Switched Port Analyzer (SPAN), can a single physical switch interface be configured simultaneously as both a SPAN source port and a SPAN destination port?",
    explanation: "No. A SPAN destination port is dedicated to transmitting mirrored frames to an analyzer and cannot act as a SPAN source port or participate in standard Layer 2 frame forwarding.",
    domain: "switching",
    subtopic: "Packet Capture",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "No, a port configured as a SPAN destination cannot act as a SPAN source port", is_correct: true },
      { text: "Yes, by configuring 'monitor session 1 source-and-destination'", is_correct: false },
      { text: "Yes, but only on Gigabit Ethernet interfaces", is_correct: false },
      { text: "Yes, provided the port is configured as an 802.1Q trunk", is_correct: false }
    ]
  },
  {
    stem: "When Port Security uses sticky MAC addressing ('switchport port-security mac-address sticky'), what command is necessary to ensure learned MAC addresses persist after a switch reboot?",
    explanation: "Sticky MAC addresses are added to the running-config in RAM. To persist across a reboot or power failure, the administrator must execute `copy running-config startup-config` (or `write memory`).",
    domain: "switching",
    subtopic: "Port Security",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "copy running-config startup-config (or write memory)", is_correct: true },
      { text: "switchport port-security save", is_correct: false },
      { text: "commit port-security flash", is_correct: false },
      { text: "reload in 10", is_correct: false }
    ]
  },
  {
    stem: "On which switch ports should Spanning Tree PortFast be enabled?",
    explanation: "PortFast should be configured only on edge access ports connected directly to end-user workstations, printers, or servers. Enabling it on ports connected to other switches or bridges can cause severe Layer 2 loops.",
    domain: "switching",
    subtopic: "STP Features",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Only on access ports connected directly to end-user host devices, servers, or printers", is_correct: true },
      { text: "On all inter-switch trunk links", is_correct: false },
      { text: "On the SPAN destination monitoring port", is_correct: false },
      { text: "On the physical router subinterfaces", is_correct: false }
    ]
  },
  {
    stem: "What Spanning Tree protection feature prevents alternate or root ports from becoming designated ports due to unidirectional link failures or lost BPDUs?",
    explanation: "STP Loop Guard prevents a non-designated port (root or alternate) from transitioning to a forwarding designated port if BPDUs stop arriving, placing the port into a 'loop-inconsistent' blocking state.",
    domain: "switching",
    subtopic: "STP Features",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Loop Guard", is_correct: true },
      { text: "PortFast", is_correct: false },
      { text: "BPDU Guard", is_correct: false },
      { text: "Root Guard", is_correct: false }
    ]
  },
  {
    stem: "What destination multicast MAC address is specified in IEEE 802.1D Spanning Tree Bridge Protocol Data Units (BPDUs)?",
    explanation: "Standard 802.1D Spanning Tree BPDUs are transmitted to the IEEE standard multicast MAC address 01:80:C2:00:00:00.",
    domain: "switching",
    subtopic: "Spanning Tree Protocol",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "01:80:C2:00:00:00", is_correct: true },
      { text: "01:00:0C:CC:CC:CD", is_correct: false },
      { text: "FF:FF:FF:FF:FF:FF", is_correct: false },
      { text: "01:00:5E:00:00:05", is_correct: false }
    ]
  },
  {
    stem: "What are the default Hello timer and Max Age timer values in IEEE 802.1D Spanning Tree Protocol?",
    explanation: "By default in 802.1D, the Hello timer is 2 seconds, and the Max Age timer is 20 seconds (Forward Delay is 15 seconds).",
    domain: "switching",
    subtopic: "Spanning Tree Protocol",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Hello: 2 seconds; Max Age: 20 seconds", is_correct: true },
      { text: "Hello: 10 seconds; Max Age: 40 seconds", is_correct: false },
      { text: "Hello: 5 seconds; Max Age: 15 seconds", is_correct: false },
      { text: "Hello: 30 seconds; Max Age: 120 seconds", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco IOS interface command configures storm control to suppress broadcast frames when traffic reaches 20% of total port bandwidth?",
    explanation: "The command `storm-control broadcast level 20` sets the rising threshold to 20 percent of port capacity.",
    domain: "switching",
    subtopic: "Storm Control",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "storm-control broadcast level 20", is_correct: true },
      { text: "broadcast-suppression 20 percent", is_correct: false },
      { text: "storm-control limit 20 broadcast", is_correct: false },
      { text: "traffic-shape broadcast 20", is_correct: false }
    ]
  },
  {
    stem: "What is the default VTP domain name on an unconfigured, factory-default Cisco Catalyst switch?",
    explanation: "A newly unboxed or reset Cisco switch has no VTP domain name (it is NULL / unconfigured). It will automatically adopt the domain name of the first VTP advertisement it receives on a trunk port.",
    domain: "switching",
    subtopic: "VTP",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "NULL (unconfigured)", is_correct: true },
      { text: "cisco", is_correct: false },
      { text: "default", is_correct: false },
      { text: "management", is_correct: false }
    ]
  },
  {
    stem: "If a network administrator configures a VTP password on a VTP server switch, what must be done on all other switches in the domain for VLAN synchronization to occur?",
    explanation: "The identical VTP password must be configured on all participating switches in the VTP domain; otherwise, advertisements will fail authentication and VLAN databases will not synchronize.",
    domain: "switching",
    subtopic: "VTP",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The identical VTP password must be manually configured on every participating switch in the domain", is_correct: true },
      { text: "The password is automatically distributed to client switches via CDP", is_correct: false },
      { text: "Client switches must be rebooted into ROMMON mode", is_correct: false },
      { text: "Client switches must be converted to VTP transparent mode", is_correct: false }
    ]
  },
  {
    stem: "In Cisco IP telephony, what 802.1p Class of Service (CoS) priority value is marked by default on VoIP media packets originating from a Cisco IP Phone?",
    explanation: "Voice payload traffic from Cisco IP phones is tagged with 802.1p CoS 5 (high priority), corresponding to DSCP 46 (Expedited Forwarding / EF). Call signaling traffic is typically marked with CoS 3.",
    domain: "switching",
    subtopic: "Voice VLANs",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "CoS 5", is_correct: true },
      { text: "CoS 0", is_correct: false },
      { text: "CoS 3", is_correct: false },
      { text: "CoS 7", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco IOS verification command displays the operational data VLAN and voice VLAN assigned to interface GigabitEthernet0/1?",
    explanation: "The `show interfaces GigabitEthernet0/1 switchport` command displays administrative and operational switchport status, access VLAN, voice VLAN, and trunking parameters.",
    domain: "switching",
    subtopic: "Voice VLANs",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "show interfaces GigabitEthernet0/1 switchport", is_correct: true },
      { text: "show vlan voice", is_correct: false },
      { text: "show ip interface GigabitEthernet0/1", is_correct: false },
      { text: "show voice port GigabitEthernet0/1", is_correct: false }
    ]
  },
  {
    stem: "What is IEEE 802.11r (Fast BSS Transition), and how does it benefit mobile wireless clients using VoIP?",
    explanation: "IEEE 802.11r enables Fast Roaming by allowing cryptographic handshake keys to be pre-cached between APs before a client roams, reducing handover latency to under 50 ms and preventing voice call audio drops.",
    domain: "switching",
    subtopic: "Wireless Client Onboarding",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It pre-caches encryption keys across APs, reducing roaming re-authentication delay to under 50 ms to prevent audio drops", is_correct: true },
      { text: "It doubles channel width from 20 MHz to 40 MHz dynamically", is_correct: false },
      { text: "It allows wireless clients to obtain IP addresses without a DHCP server", is_correct: false },
      { text: "It converts wireless data frames into Bluetooth packets", is_correct: false }
    ]
  },
  {
    stem: "Which Cisco IOS privileged exec command resets all interface packet and error counters to zero across all switch ports?",
    explanation: "The command `clear counters` resets interface statistics (such as input/output packets, CRC errors, and collisions) back to zero, aiding in troubleshooting.",
    domain: "switching",
    subtopic: "Interface Troubleshooting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "clear counters", is_correct: true },
      { text: "reset interface statistics", is_correct: false },
      { text: "zero counters all", is_correct: false },
      { text: "clear interface packet-stats", is_correct: false }
    ]
  },

  // ==========================================
  // IP_ROUTING (13 questions)
  // ==========================================
  {
    stem: "An engineer needs to summarize the four subnets 10.1.0.0/24, 10.1.1.0/24, 10.1.2.0/24, and 10.1.3.0/24 into a single aggregate route. What is the summarized prefix and mask?",
    explanation: "Binary breakdown of the third octet shows 0, 1, 2, and 3 share the first 6 bits (000000xx). 16 + 6 = 22 bits. The summary route is 10.1.0.0/22 with subnet mask 255.255.252.0.",
    domain: "ip_routing",
    subtopic: "Route Summarization",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "10.1.0.0/22 (255.255.252.0)", is_correct: true },
      { text: "10.1.0.0/21 (255.255.248.0)", is_correct: false },
      { text: "10.1.0.0/23 (255.255.254.0)", is_correct: false },
      { text: "10.1.0.0/16 (255.255.0.0)", is_correct: false }
    ]
  },
  {
    stem: "In an OSPF hierarchical multi-area topology, on which two specific router roles can route summarization be configured?",
    explanation: "OSPF does not allow summarization within an area. Route summarization can only be configured on Area Border Routers (ABRs using `area <id> range`) and Autonomous System Boundary Routers (ASBRs using `summary-address`).",
    domain: "ip_routing",
    subtopic: "Route Summarization",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "Area Border Routers (ABRs) and Autonomous System Boundary Routers (ASBRs)", is_correct: true },
      { text: "Internal Backbone Routers and Designated Routers (DRs)", is_correct: false },
      { text: "Backup Designated Routers (BDRs) and Virtual Tunnel Endpoints", is_correct: false },
      { text: "All standard internal routers within any stub area", is_correct: false }
    ]
  },
  {
    stem: "What is a 'Floating Static Route' in Cisco routing?",
    explanation: "A floating static route is a static route configured with an Administrative Distance higher than that of the primary dynamic routing protocol, allowing it to remain dormant until the primary path fails.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "A backup static route configured with a higher Administrative Distance than the primary route", is_correct: true },
      { text: "A static route that points to a dynamic multicast group", is_correct: false },
      { text: "A static route that changes its next-hop IP every 60 seconds", is_correct: false },
      { text: "A route that load-balances traffic across disparate service providers", is_correct: false }
    ]
  },
  {
    stem: "How is a Default Route represented in IPv4 and IPv6 respectively?",
    explanation: "In IPv4, the default route is 0.0.0.0/0 (mask 0.0.0.0). In IPv6, it is represented as ::/0 (prefix length 0).",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "0.0.0.0/0 in IPv4; ::/0 in IPv6", is_correct: true },
      { text: "255.255.255.255/32 in IPv4; ::1/128 in IPv6", is_correct: false },
      { text: "127.0.0.1/8 in IPv4; fe80::/10 in IPv6", is_correct: false },
      { text: "0.0.0.0/32 in IPv4; ::/128 in IPv6", is_correct: false }
    ]
  },
  {
    stem: "What is the default Administrative Distance of an Internal BGP (IBGP) route in Cisco IOS?",
    explanation: "In Cisco IOS, External BGP (EBGP) has an Administrative Distance of 20, while Internal BGP (IBGP) has an Administrative Distance of 200.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "200", is_correct: true },
      { text: "20", is_correct: false },
      { text: "110", is_correct: false },
      { text: "90", is_correct: false }
    ]
  },
  {
    stem: "Which transport layer protocol and destination port are utilized by Border Gateway Protocol (BGP) to establish neighbor peering sessions?",
    explanation: "BGP relies on Transmission Control Protocol (TCP) port 179 to establish reliable, stateful neighbor peering connections.",
    domain: "ip_routing",
    subtopic: "BGP Fundamentals",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "TCP port 179", is_correct: true },
      { text: "UDP port 179", is_correct: false },
      { text: "IP Protocol 89", is_correct: false },
      { text: "UDP port 520", is_correct: false }
    ]
  },
  {
    stem: "What is an Autonomous System (AS) in global Internet routing architecture?",
    explanation: "An Autonomous System is a collection of connected IP routing networks and routers controlled by a single organization (such as an ISP or enterprise) that presents a common routing policy to the Internet.",
    domain: "ip_routing",
    subtopic: "BGP Fundamentals",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "A collection of IP networks and routers under a single administrative domain sharing a unified routing policy", is_correct: true },
      { text: "A physical data center containing at least 1,000 servers", is_correct: false },
      { text: "A cluster of Spanning Tree Root Bridges connected via optical fiber", is_correct: false },
      { text: "A single local area network subnet managed by DHCP", is_correct: false }
    ]
  },
  {
    stem: "Which destination IPv4 multicast address is used by Cisco EIGRP to exchange Hello packets and routing updates?",
    explanation: "EIGRP uses the multicast address 224.0.0.10 for IPv4 (and FF02::A for IPv6).",
    domain: "ip_routing",
    subtopic: "EIGRP Fundamentals",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "224.0.0.10", is_correct: true },
      { text: "224.0.0.5", is_correct: false },
      { text: "224.0.0.9", is_correct: false },
      { text: "224.0.0.6", is_correct: false }
    ]
  },
  {
    stem: "By default, which two network metrics are used by Cisco EIGRP to compute its composite routing metric?",
    explanation: "By default (K1=1, K2=0, K3=1, K4=0, K5=0), EIGRP calculates composite metric using Bandwidth (minimum bandwidth along the path) and Delay (cumulative delay along the path).",
    domain: "ip_routing",
    subtopic: "EIGRP Fundamentals",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Bandwidth and Delay", is_correct: true },
      { text: "Hop Count and Reliability", is_correct: false },
      { text: "MTU and Load", is_correct: false },
      { text: "Cost and Jitter", is_correct: false }
    ]
  },
  {
    stem: "In Cisco Hot Standby Router Protocol (HSRP), what is the primary operational role of the Standby router?",
    explanation: "The Standby router listens to periodic Hellos from the Active router. If the Active router fails or stops sending Hellos, the Standby router immediately assumes the Active role and takes over forwarding.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Monitors the Active router via periodic Hellos and assumes the forwarding role if the Active router fails", is_correct: true },
      { text: "Forwards 50% of user traffic simultaneously with the Active router", is_correct: false },
      { text: "Acts as a primary DNS server for local LAN clients", is_correct: false },
      { text: "Assigns dynamic IP addresses via DHCP Snooping", is_correct: false }
    ]
  },
  {
    stem: "What virtual MAC address prefix format is standardly generated by Virtual Router Redundancy Protocol (VRRPv2)?",
    explanation: "VRRP uses the virtual MAC address format 00-00-5E-00-01-XX, where 'XX' is the VRRP virtual router identifier (VRID) in hexadecimal.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "00-00-5E-00-01-XX (where XX is the VRID in hex)", is_correct: true },
      { text: "00-00-0C-07-AC-XX", is_correct: false },
      { text: "00-07-B4-00-XX-XX", is_correct: false },
      { text: "FF-FF-FF-00-00-01", is_correct: false }
    ]
  },
  {
    stem: "Why does a properly configured floating static route not appear in the output of 'show ip route' while the primary dynamic routing protocol is operational?",
    explanation: "The router installs only the best route to each destination prefix into the routing table. Because the primary protocol has a lower Administrative Distance, it takes precedence and the floating static route is withheld until the primary route fails.",
    domain: "ip_routing",
    subtopic: "Floating Static Routes",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The primary protocol route has a lower Administrative Distance, so the floating route is withheld from the active routing table", is_correct: true },
      { text: "Floating static routes can only be stored on external TFTP servers", is_correct: false },
      { text: "The router interface has an active Spanning Tree blocking state", is_correct: false },
      { text: "The static route was rejected due to an invalid subnet mask", is_correct: false }
    ]
  },
  {
    stem: "What global configuration command is required on a Cisco multilayer Catalyst switch to enable packet routing between Switched Virtual Interfaces (SVIs)?",
    explanation: "On Cisco multilayer switches, Layer 3 IPv4 routing is disabled by default. The `ip routing` command must be executed globally to enable inter-VLAN routing.",
    domain: "ip_routing",
    subtopic: "Inter-VLAN Routing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ip routing", is_correct: true },
      { text: "switchport routing enable", is_correct: false },
      { text: "router enable", is_correct: false },
      { text: "service ip-forwarding", is_correct: false }
    ]
  },

  // ==========================================
  // SERVICES_SECURITY (11 questions)
  // ==========================================
  {
    stem: "What is a Management Information Base (MIB) in Simple Network Management Protocol (SNMP)?",
    explanation: "A MIB is an organized, hierarchical database of managed objects resident on a network device. Each object is identified by an Object Identifier (OID) that can be queried or set by an NMS.",
    domain: "services_security",
    subtopic: "SNMP Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "A hierarchical database of managed object definitions identified by Object Identifiers (OIDs) on a device", is_correct: true },
      { text: "The firmware operating system image stored in router flash memory", is_correct: false },
      { text: "An encrypted tunnel connecting two remote branch offices", is_correct: false },
      { text: "The physical backplane capacity of a chassis switch", is_correct: false }
    ]
  },
  {
    stem: "Which standard TCP destination port is used by SSH File Transfer Protocol (SFTP) for encrypted file management?",
    explanation: "SFTP is an extension of the SSH protocol and operates over standard SSH TCP port 22.",
    domain: "services_security",
    subtopic: "Secure File Transfer",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "TCP port 22", is_correct: true },
      { text: "TCP port 21", is_correct: false },
      { text: "UDP port 69", is_correct: false },
      { text: "TCP port 443", is_correct: false }
    ]
  },
  {
    stem: "What are the standard structural components of a Cisco IOS syslog message (e.g. '%LINK-3-UPDOWN: Interface Gi0/1, changed state to up')?",
    explanation: "A standard Cisco syslog message format consists of: Facility (e.g. LINK), Severity level (e.g. 3), Mnemonic (e.g. UPDOWN), and Message Text description.",
    domain: "services_security",
    subtopic: "Syslog Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Facility, Severity Level, Mnemonic, and Message Text description", is_correct: true },
      { text: "IP Header, TCP Flag, Payload, and FCS Checksum", is_correct: false },
      { text: "Username, Password, Privilege Level, and Timestamp", is_correct: false },
      { text: "Source MAC, Destination MAC, EtherType, and CRC", is_correct: false }
    ]
  },
  {
    stem: "What is the minimum recommended passphrase character length for WPA2-Personal and WPA3-Personal Wi-Fi networks?",
    explanation: "WPA2 and WPA3 Pre-Shared Keys require a minimum of 8 characters (and up to 63 ASCII characters).",
    domain: "services_security",
    subtopic: "Wireless Security",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "8 characters", is_correct: true },
      { text: "4 characters", is_correct: false },
      { text: "16 characters", is_correct: false },
      { text: "32 characters", is_correct: false }
    ]
  },
  {
    stem: "Why is WPA2/WPA3-Enterprise authentication preferred over Pre-Shared Key (Personal) modes in corporate enterprise wireless environments?",
    explanation: "Enterprise mode authenticates each individual user uniquely using 802.1X and RADIUS. This eliminates the security risk of a shared passphrase and allows an employee's wireless access to be revoked instantly when they leave the organization.",
    domain: "services_security",
    subtopic: "Wireless Security",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It authenticates users individually via 802.1X/RADIUS, eliminating shared passwords and enabling individual credential revocation", is_correct: true },
      { text: "It doubles radio frequency transmission distance", is_correct: false },
      { text: "It operates without requiring an Access Point", is_correct: false },
      { text: "It bypasses corporate firewall inspection", is_correct: false }
    ]
  },
  {
    stem: "Which AAA security protocol is Cisco-proprietary, utilizes TCP port 49, and encrypts the entire packet payload rather than just the password?",
    explanation: "TACACS+ is a Cisco-proprietary protocol (RFC 8907) that runs over TCP port 49, completely encrypts the entire packet body, and cleanly separates Authentication, Authorization, and Accounting.",
    domain: "services_security",
    subtopic: "AAA Security",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "TACACS+", is_correct: true },
      { text: "RADIUS", is_correct: false },
      { text: "Diameter", is_correct: false },
      { text: "Kerberos", is_correct: false }
    ]
  },
  {
    stem: "In Cisco IP telephony deployments, what is the role of DHCP Option 150?",
    explanation: "DHCP Option 150 is a Cisco-proprietary option that provides a list of IP addresses for TFTP servers / Cisco Unified Communications Manager (CUCM) to IP phones so they can download firmware and configuration files.",
    domain: "services_security",
    subtopic: "DHCP Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Provides IP phone endpoints with the IP addresses of TFTP / CUCM call-processing servers", is_correct: true },
      { text: "Assigns the subnet mask and default gateway address", is_correct: false },
      { text: "Configures the DNS domain search list", is_correct: false },
      { text: "Specifies the lease duration in seconds", is_correct: false }
    ]
  },
  {
    stem: "How does DHCP Snooping rate-limiting ('ip dhcp snooping limit rate <pps>') protect an access switch from Denial of Service attacks?",
    explanation: "DHCP Snooping rate-limiting limits the number of incoming DHCP packets per second on untrusted ports, preventing attackers from flooding the switch CPU or exhausting the DHCP server pool (DHCP starvation attack).",
    domain: "services_security",
    subtopic: "DHCP Snooping",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Limits incoming DHCP packets per second on untrusted ports to prevent DHCP starvation and CPU exhaustion attacks", is_correct: true },
      { text: "Restricts client download speeds across 802.1Q trunks", is_correct: false },
      { text: "Limits the number of concurrent SSH management sessions", is_correct: false },
      { text: "Prevents routing table overflows from OSPF LSA floods", is_correct: false }
    ]
  },
  {
    stem: "What destination IP and destination MAC address are used by an IPv4 workstation sending a DHCPDISCOVER message?",
    explanation: "Because the client has no IP configuration or knowledge of the network, DHCPDISCOVER is broadcast at Layer 2 (FF:FF:FF:FF:FF:FF) and Layer 3 (255.255.255.255).",
    domain: "services_security",
    subtopic: "DHCP and Helper Address",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Destination IP 255.255.255.255 and destination MAC FF:FF:FF:FF:FF:FF", is_correct: true },
      { text: "Destination IP 0.0.0.0 and destination MAC 00:00:00:00:00:00", is_correct: false },
      { text: "Destination IP 127.0.0.1 and destination MAC 01:80:C2:00:00:00", is_correct: false },
      { text: "Destination IP 224.0.0.1 and destination MAC 01:00:5E:00:00:01", is_correct: false }
    ]
  },
  {
    stem: "In a Cisco extended IPv4 Access Control List statement, which keyword can be used to replace the IP address and wildcard mask '0.0.0.0 255.255.255.255'?",
    explanation: "The keyword `any` is an abbreviation representing any source or destination IPv4 address (`0.0.0.0 255.255.255.255`).",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "any", is_correct: true },
      { text: "host", is_correct: false },
      { text: "all", is_correct: false },
      { text: "wildcard", is_correct: false }
    ]
  },
  {
    stem: "Which interface configuration command limits the rate of incoming ARP packets to 15 packets per second to protect against ARP flooding on a DAI-enabled switch?",
    explanation: "The command `ip arp inspection limit rate 15` restricts incoming ARP packets on an untrusted port to 15 pps; exceeding this threshold places the port into err-disabled state.",
    domain: "services_security",
    subtopic: "Dynamic ARP Inspection",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "ip arp inspection limit rate 15", is_correct: true },
      { text: "arp rate-limit 15", is_correct: false },
      { text: "storm-control arp pps 15", is_correct: false },
      { text: "switchport arp inspection max 15", is_correct: false }
    ]
  }
];

const batchPath = path.join(__dirname, 'batches', 'seed-33-volume.json');
fs.writeFileSync(batchPath, JSON.stringify(questions, null, 2) + '\n');
console.log(`Generated ${questions.length} questions in ${batchPath}`);
