const fs = require("fs");
const path = require("path");

const questions = [
  {
    stem: "When a router receives an IP packet, how does it select the best path from the routing table when multiple matching routes exist?",
    explanation: "A router always selects the route with the longest prefix match (most specific subnet mask, highest prefix length), regardless of administrative distance or metric.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The route with the lowest administrative distance", is_correct: false },
      { text: "The route with the lowest metric", is_correct: false },
      { text: "The route with the longest prefix match (most specific mask)", is_correct: true },
      { text: "The route learned most recently", is_correct: false }
    ]
  },
  {
    stem: "What is the administrative distance of an internal EIGRP route in Cisco IOS?",
    explanation: "Internal EIGRP routes have an administrative distance of 90. External EIGRP routes have an AD of 170, and EIGRP summary routes have an AD of 5.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "1", is_correct: false },
      { text: "90", is_correct: true },
      { text: "110", is_correct: false },
      { text: "120", is_correct: false }
    ]
  },
  {
    stem: "What is the administrative distance of OSPF routes in Cisco IOS?",
    explanation: "OSPF has a default administrative distance of 110 for all internal and external routes.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "90", is_correct: false },
      { text: "100", is_correct: false },
      { text: "110", is_correct: true },
      { text: "120", is_correct: false }
    ]
  },
  {
    stem: "What is the administrative distance of an external BGP (eBGP) route?",
    explanation: "eBGP routes have an administrative distance of 20, whereas internal BGP (iBGP) routes have an administrative distance of 200.",
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
    stem: "What is the purpose of configuring a floating static route on a Cisco router?",
    explanation: "A floating static route is a static route configured with an administrative distance higher than the primary routing protocol (e.g. AD 120 vs OSPF 110). It remains dormant and only enters the routing table if the primary route fails.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "To load-balance traffic equally across two ISP connections", is_correct: false },
      { text: "To act as a backup route that activates only when the primary dynamic route is withdrawn", is_correct: true },
      { text: "To advertise the default gateway into the local OSPF area", is_correct: false },
      { text: "To dynamically calculate link metrics using bandwidth and delay", is_correct: false }
    ]
  },
  {
    stem: "Which command configures a floating static route to 10.0.0.0/8 with next-hop 192.168.1.1 and an administrative distance of 150?",
    explanation: "The command `ip route 10.0.0.0 255.0.0.0 192.168.1.1 150` defines the network, mask, next-hop IP, and sets the administrative distance to 150 (higher than standard static route AD 1).",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ip route 10.0.0.0 255.0.0.0 192.168.1.1 metric 150", is_correct: false },
      { text: "ip route 10.0.0.0 255.0.0.0 192.168.1.1 150", is_correct: true },
      { text: "ip static 10.0.0.0/8 192.168.1.1 distance 150", is_correct: false },
      { text: "ip route backup 10.0.0.0 255.0.0.0 192.168.1.1 150", is_correct: false }
    ]
  },
  {
    stem: "What is the IPv6 default static route syntax in Cisco IOS?",
    explanation: "The IPv6 default route is `::/0` (representing all IPv6 addresses and prefix lengths). The command `ipv6 route ::/0 <next-hop>` configures a default static route.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ipv6 route default <next-hop>", is_correct: false },
      { text: "ipv6 route ::/0 <next-hop>", is_correct: true },
      { text: "ipv6 route 0.0.0.0/0 <next-hop>", is_correct: false },
      { text: "ipv6 default-gateway <next-hop>", is_correct: false }
    ]
  },
  {
    stem: "How does OSPF calculate the cost metric for an interface by default?",
    explanation: "OSPF calculates interface cost using the formula: Cost = Reference Bandwidth / Interface Bandwidth. The default reference bandwidth is 100 Mbps (10^8 bps).",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Cost = Hop count to destination router", is_correct: false },
      { text: "Cost = Reference Bandwidth / Interface Bandwidth", is_correct: true },
      { text: "Cost = Interface MTU / Packet Delay", is_correct: false },
      { text: "Cost = Reliability * 256 + Load", is_correct: false }
    ]
  },
  {
    stem: "Why is it recommended to adjust the OSPF auto-cost reference bandwidth on modern enterprise networks?",
    explanation: "Because the default reference bandwidth is 100 Mbps, FastEthernet (100 Mbps), GigabitEthernet (1 Gbps), and 10-GigabitEthernet (10 Gbps) all compute to a cost of 1. Changing the reference bandwidth using `auto-cost reference-bandwidth` allows OSPF to differentiate between higher-speed links.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "To prevent OSPF routers from forming neighbor adjacencies across Ethernet", is_correct: false },
      { text: "To allow OSPF to assign distinct, accurate metrics to links faster than 100 Mbps", is_correct: true },
      { text: "To enable automatic multicast summarization between areas", is_correct: false },
      { text: "To lower CPU utilization during Dijkstra SPF recalculation", is_correct: false }
    ]
  },
  {
    stem: "What command changes the OSPF reference bandwidth to 10000 Mbps (10 Gbps)?",
    explanation: "Under `router ospf <process>`, the command `auto-cost reference-bandwidth 10000` sets the reference bandwidth to 10,000 Mbps.",
    domain: "ip_routing",
    subtopic: "OSPF Configuration",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "ospf reference-bandwidth 10000", is_correct: false },
      { text: "auto-cost reference-bandwidth 10000", is_correct: true },
      { text: "ip ospf cost 10000", is_correct: false },
      { text: "bandwidth reference 10000m", is_correct: false }
    ]
  },
  {
    stem: "What is the order of precedence for electing an OSPF Router ID (RID) on a Cisco router?",
    explanation: "OSPF selects the Router ID in this order: 1) Manually configured `router-id` command; 2) Highest IPv4 address on any active loopback interface; 3) Highest IPv4 address on any active physical interface.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Physical interface -> Loopback -> router-id command", is_correct: false },
      { text: "router-id command -> Highest loopback IP -> Highest physical interface IP", is_correct: true },
      { text: "Lowest MAC address -> Highest IP address -> Loopback", is_correct: false },
      { text: "System hostname hash -> Loopback -> Default gateway IP", is_correct: false }
    ]
  },
  {
    stem: "Why are loopback interfaces preferred over physical interfaces for determining an OSPF Router ID?",
    explanation: "Loopback interfaces are virtual software interfaces that never go down unless manually shut down. This ensures the OSPF Router ID remains stable even if physical links flap.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Loopback interfaces have a default OSPF cost of 0", is_correct: false },
      { text: "Loopback interfaces are always up/up, providing stability and preventing RID changes", is_correct: true },
      { text: "Loopback interfaces bypass OSPF authentication checks", is_correct: false },
      { text: "Loopback interfaces do not require an IP subnet mask", is_correct: false }
    ]
  },
  {
    stem: "In an OSPF multiaccess broadcast network, what criteria determines which router becomes the Designated Router (DR)?",
    explanation: "The router with the highest OSPF interface priority (default 1, range 0–255) becomes the DR. If priorities are equal, the router with the highest Router ID (RID) is elected DR.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Lowest Router ID", is_correct: false },
      { text: "Highest interface priority, followed by highest Router ID as tiebreaker", is_correct: true },
      { text: "Longest uptime in the area", is_correct: false },
      { text: "Smallest number of connected neighbor adjacencies", is_correct: false }
    ]
  },
  {
    stem: "What happens when an interface is configured with `ip ospf priority 0` on an OSPF broadcast network?",
    explanation: "Setting OSPF interface priority to 0 makes the router ineligible to become either the Designated Router (DR) or Backup Designated Router (BDR). It will always remain a DROther.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The router is automatically elected as the DR", is_correct: false },
      { text: "The router becomes completely ineligible to become DR or BDR", is_correct: true },
      { text: "The interface stops sending and receiving OSPF Hello packets", is_correct: false },
      { text: "The interface cost is calculated as 0", is_correct: false }
    ]
  },
  {
    stem: "Which multicast IP address is used by OSPF DROther routers to send Link State Updates (LSUs) to the DR and BDR?",
    explanation: "DROther routers send updates to 224.0.0.6 (AllDRouters). The DR sends updates back to all routers using 224.0.0.5 (AllSPFRouters).",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "224.0.0.5", is_correct: false },
      { text: "224.0.0.6", is_correct: true },
      { text: "224.0.0.9", is_correct: false },
      { text: "224.0.0.10", is_correct: false }
    ]
  },
  {
    stem: "Which multicast IP address is used by OSPF routers on a segment to reach all OSPF-enabled routers (AllSPFRouters)?",
    explanation: "224.0.0.5 is the AllSPFRouters multicast address. OSPF hello packets and DR updates to normal routers are sent to 224.0.0.5 (or ff02::5 in IPv6).",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "224.0.0.1", is_correct: false },
      { text: "224.0.0.5", is_correct: true },
      { text: "224.0.0.6", is_correct: false },
      { text: "224.0.0.13", is_correct: false }
    ]
  },
  {
    stem: "In which OSPF neighbor state do two neighboring routers negotiate Master/Slave roles and determine the initial Database Description (DBD) sequence number?",
    explanation: "In the ExStart state, neighbors establish a master/slave relationship based on the highest Router ID and choose the initial sequence number for exchanging DBD packets.",
    domain: "ip_routing",
    subtopic: "OSPF Neighbor States",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Init state", is_correct: false },
      { text: "2-Way state", is_correct: false },
      { text: "ExStart state", is_correct: true },
      { text: "Exchange state", is_correct: false }
    ]
  },
  {
    stem: "In an OSPF broadcast network, what neighbor state is maintained between two DROther routers that are adjacent on the same segment?",
    explanation: "On multiaccess networks, non-DR/BDR routers (DROthers) only form Full adjacencies with the DR and BDR. Between each other, DROthers remain permanently in the 2-Way state.",
    domain: "ip_routing",
    subtopic: "OSPF Neighbor States",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Down", is_correct: false },
      { text: "Init", is_correct: false },
      { text: "2-Way", is_correct: true },
      { text: "Full", is_correct: false }
    ]
  },
  {
    stem: "What neighbor state indicates that two OSPF routers have fully synchronized their Link State Databases (LSDB)?",
    explanation: "The Full state indicates that neighbor routers have exchanged all LSAs and their link-state databases are 100% identical and synchronized.",
    domain: "ip_routing",
    subtopic: "OSPF Neighbor States",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "2-Way", is_correct: false },
      { text: "Loading", is_correct: false },
      { text: "Exchange", is_correct: false },
      { text: "Full", is_correct: true }
    ]
  },
  {
    stem: "What parameters must match between two OSPF routers on an interface before they can successfully form a neighbor adjacency?",
    explanation: "To form an OSPF adjacency, connecting routers must agree on: Area ID, Subnet/Subnet mask (on broadcast links), Hello and Dead intervals, Area type flags (stub/NSSA), and Authentication credentials.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Area ID, Hello/Dead timers, subnet mask, and stub area flags", is_correct: true },
      { text: "Router ID, interface IP address, and MAC address", is_correct: false },
      { text: "Process ID, administrative distance, and reference bandwidth", is_correct: false },
      { text: "System hostname, software version, and loopback address", is_correct: false }
    ]
  },
  {
    stem: "What are the default OSPF Hello and Dead interval timers on a broadcast Ethernet interface?",
    explanation: "On broadcast and point-to-point networks, the default Hello timer is 10 seconds and the Dead interval is 40 seconds (4 times the hello timer).",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "5 seconds Hello / 15 seconds Dead", is_correct: false },
      { text: "10 seconds Hello / 40 seconds Dead", is_correct: true },
      { text: "30 seconds Hello / 120 seconds Dead", is_correct: false },
      { text: "60 seconds Hello / 180 seconds Dead", is_correct: false }
    ]
  },
  {
    stem: "How does changing an interface to the OSPF point-to-point network type (`ip ospf network point-to-point`) impact DR/BDR election?",
    explanation: "Point-to-point networks do not elect a DR or BDR because there are only two endpoints on the link. This speeds up adjacency formation and eliminates DR maintenance overhead.",
    domain: "ip_routing",
    subtopic: "OSPF Network Types",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It doubles the Hello timer interval to 20 seconds", is_correct: false },
      { text: "It disables DR and BDR election completely on that interface", is_correct: true },
      { text: "It forces the router with the lowest RID to become the DR", is_correct: false },
      { text: "It converts all incoming OSPF packets to unicast", is_correct: false }
    ]
  },
  {
    stem: "In multi-area OSPF, what is the role of an Area Border Router (ABR)?",
    explanation: "An ABR has interfaces attached to two or more different OSPF areas, with at least one interface residing in the backbone area (Area 0). It maintains separate LSDBs for each area and generates Type 3 summary LSAs between areas.",
    domain: "ip_routing",
    subtopic: "OSPF Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A router that connects the OSPF domain to an external BGP autonomous system", is_correct: false },
      { text: "A router with interfaces in Area 0 and at least one other non-backbone area", is_correct: true },
      { text: "A router configured with priority 255 on a broadcast segment", is_correct: false },
      { text: "A router running RIP and OSPF simultaneously with route redistribution", is_correct: false }
    ]
  },
  {
    stem: "What is the role of an Autonomous System Boundary Router (ASBR) in an OSPF network?",
    explanation: "An ASBR redistributes routes from external sources (such as BGP, EIGRP, static routes, or another OSPF process) into the OSPF domain by generating Type 5 External LSAs.",
    domain: "ip_routing",
    subtopic: "OSPF Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It routes traffic between non-backbone areas and Area 0", is_correct: false },
      { text: "It injects routes learned from external routing protocols or static routes into OSPF", is_correct: true },
      { text: "It assigns IP addresses to DHCP clients in remote areas", is_correct: false },
      { text: "It acts as the primary spanning tree root bridge for the backbone VLAN", is_correct: false }
    ]
  },
  {
    stem: "Why must all non-backbone areas connect directly to Area 0 in a standard multi-area OSPF hierarchy?",
    explanation: "OSPF enforces a two-tier loop-free architecture: all inter-area traffic must traverse Area 0 (the backbone). Inter-area routing between non-backbone areas without passing through Area 0 is forbidden to prevent routing loops.",
    domain: "ip_routing",
    subtopic: "OSPF Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Area 0 is the only area capable of running the Dijkstra algorithm", is_correct: false },
      { text: "To maintain a loop-free inter-area routing topology where all inter-area traffic crosses the backbone", is_correct: true },
      { text: "Non-backbone areas cannot use 32-bit subnet masks", is_correct: false },
      { text: "Area 0 dynamically assigns Router IDs to all downstream routers", is_correct: false }
    ]
  },
  {
    stem: "Which command configures OSPFv2 on interface GigabitEthernet0/0 directly without using the global network statement?",
    explanation: "Entering `ip ospf 1 area 0` directly under interface configuration mode enables OSPF process 1 in area 0 on that specific interface. This is modern best practice in Cisco IOS.",
    domain: "ip_routing",
    subtopic: "OSPF Configuration",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "network 10.0.0.0 0.0.0.255 area 0", is_correct: false },
      { text: "ip ospf 1 area 0", is_correct: true },
      { text: "ospf enable process 1 area 0", is_correct: false },
      { text: "router ospf 1 interface gig0/0", is_correct: false }
    ]
  },
  {
    stem: "What command injects a default static route into OSPF and advertises it to all neighbors in the OSPF domain?",
    explanation: "The command `default-information originate` under `router ospf` advertises a Type 5 default route (0.0.0.0/0) into OSPF, provided a default route exists in the local routing table (or unconditionally if the `always` keyword is appended).",
    domain: "ip_routing",
    subtopic: "OSPF Configuration",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "redistribute static default", is_correct: false },
      { text: "default-information originate", is_correct: true },
      { text: "ip route default advertise", is_correct: false },
      { text: "area 0 default-route inject", is_correct: false }
    ]
  },
  {
    stem: "What does the command `passive-interface GigabitEthernet0/1` do under an OSPF routing process?",
    explanation: "The `passive-interface` command suppresses the sending and receiving of OSPF Hello packets on that interface, preventing neighbor adjacencies from forming while still advertising the interface's connected subnet into OSPF.",
    domain: "ip_routing",
    subtopic: "OSPF Configuration",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It shuts down the physical interface completely", is_correct: false },
      { text: "It stops sending OSPF hellos while continuing to advertise the connected subnet", is_correct: true },
      { text: "It lowers the administrative distance of the interface to 255", is_correct: false },
      { text: "It converts the interface to a read-only SNMP monitor port", is_correct: false }
    ]
  },
  {
    stem: "Which command displays all active OSPF neighbor adjacencies along with their current state and interface?",
    explanation: "The command `show ip ospf neighbor` displays the neighbor Router ID, priority, state (e.g. FULL/DR, 2WAY/DROTHER), dead time, interface IP, and local interface.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "show ip route ospf", is_correct: false },
      { text: "show ip ospf neighbor", is_correct: true },
      { text: "show ip protocols", is_correct: false },
      { text: "show ospf adjacencies", is_correct: false }
    ]
  },
  {
    stem: "How does OSPFv3 differ from OSPFv2 regarding how neighbors and links are identified?",
    explanation: "OSPFv3 runs on a per-link basis rather than a per-subnet basis, and neighbors form adjacencies using IPv6 link-local addresses (fe80::/10). In addition, OSPFv3 supports both IPv4 and IPv6 address families.",
    domain: "ip_routing",
    subtopic: "OSPFv3",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "OSPFv3 uses broadcast frames instead of multicast packets", is_correct: false },
      { text: "OSPFv3 runs on a per-link basis and forms adjacencies using IPv6 link-local addresses", is_correct: true },
      { text: "OSPFv3 requires manual static neighbor configuration on all Ethernet links", is_correct: false },
      { text: "OSPFv3 uses hop count as its primary metric instead of cost", is_correct: false }
    ]
  },
  {
    stem: "Which command enables OSPFv3 directly on an interface for IPv6 in area 0?",
    explanation: "The interface configuration command `ospfv3 1 ipv6 area 0` (or `ipv6 ospf 1 area 0`) activates OSPFv3 process 1 for the IPv6 address family on that interface in area 0.",
    domain: "ip_routing",
    subtopic: "OSPFv3",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "network ipv6 2001::/64 area 0", is_correct: false },
      { text: "ospfv3 1 ipv6 area 0", is_correct: true },
      { text: "ipv6 router ospf 1 link area 0", is_correct: false },
      { text: "enable ospfv3 area 0", is_correct: false }
    ]
  },
  {
    stem: "What is the default priority for an HSRP (Hot Standby Router Protocol) router in a standby group?",
    explanation: "The default HSRP priority is 100 (range 1–255). The router with the highest priority is elected as the Active router.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "1", is_correct: false },
      { text: "50", is_correct: false },
      { text: "100", is_correct: true },
      { text: "255", is_correct: false }
    ]
  },
  {
    stem: "What virtual MAC address format is used by HSRP version 1 for group 10?",
    explanation: "HSRP version 1 uses the virtual MAC address format `0000.0c07.acXX`, where XX is the HSRP group number in hexadecimal. For group 10 (0x0a in hex), the MAC is `0000.0c07.ac0a`.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "0000.5e00.010a", is_correct: false },
      { text: "0000.0c07.ac0a", is_correct: true },
      { text: "0000.0c9f.f00a", is_correct: false },
      { text: "0007.b400.010a", is_correct: false }
    ]
  },
  {
    stem: "What virtual MAC address format is used by Virtual Router Redundancy Protocol (VRRP) for VRRP group 1?",
    explanation: "VRRP uses the open-standard virtual MAC address range `0000.5e00.01XX`, where XX is the VRRP group number in hexadecimal. For group 1, the MAC is `0000.5e00.0101`.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "0000.0c07.ac01", is_correct: false },
      { text: "0000.5e00.0101", is_correct: true },
      { text: "0000.0c9f.f001", is_correct: false },
      { text: "0007.b400.0101", is_correct: false }
    ]
  },
  {
    stem: "What is the effect of the `standby 1 preempt` command in HSRP configuration?",
    explanation: "By default, HSRP does not preempt: an active router stays active even if a router with higher priority joins. The `standby <group> preempt` command allows a router with higher priority to immediately assume the Active router role.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "It doubles the frequency of HSRP hello messages", is_correct: false },
      { text: "It allows a higher-priority router to take over the Active role when it comes online", is_correct: true },
      { text: "It forces the standby router to drop all client packets during failover", is_correct: false },
      { text: "It disables virtual MAC address generation", is_correct: false }
    ]
  },
  {
    stem: "Which command configures the virtual IP address 192.168.1.1 for HSRP group 1 on interface GigabitEthernet0/0?",
    explanation: "The interface command `standby 1 ip 192.168.1.1` defines HSRP group 1 and assigns the virtual IP address that hosts will use as their default gateway.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "hsrp 1 ip 192.168.1.1", is_correct: false },
      { text: "standby 1 ip 192.168.1.1", is_correct: true },
      { text: "vrrp 1 address 192.168.1.1", is_correct: false },
      { text: "ip default-gateway standby 192.168.1.1", is_correct: false }
    ]
  },
  {
    stem: "In a Router-on-a-Stick inter-VLAN routing configuration, which command must be applied under subinterface GigabitEthernet0/0.20 to process tagged frames for VLAN 20?",
    explanation: "The subinterface configuration command `encapsulation dot1q 20` enables 802.1Q trunk decapsulation and maps the subinterface to VLAN 20.",
    domain: "ip_routing",
    subtopic: "Inter-VLAN Routing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "switchport access vlan 20", is_correct: false },
      { text: "encapsulation dot1q 20", is_correct: true },
      { text: "vlan tagging 20", is_correct: false },
      { text: "ip dot1q vlan 20", is_correct: false }
    ]
  },
  {
    stem: "What command displays all active routes in the IPv4 routing table that were learned exclusively through OSPF?",
    explanation: "The command `show ip route ospf` filters the routing table to show only routes learned via OSPF (designated by the code 'O', 'O IA', 'O E1', or 'O E2').",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "show ip protocols", is_correct: false },
      { text: "show ip route ospf", is_correct: true },
      { text: "show ip ospf routes", is_correct: false },
      { text: "show routing-table ospf", is_correct: false }
    ]
  },
  {
    stem: "In an OSPF routing table entry, what does the designation 'O IA' represent?",
    explanation: "'O IA' stands for OSPF Inter-Area route. It represents a subnet located in a different OSPF area within the same autonomous system, advertised via Type 3 Summary LSAs by an ABR.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "An internal OSPF intra-area route", is_correct: false },
      { text: "An OSPF inter-area route learned from a different OSPF area", is_correct: true },
      { text: "An external route redistributed into OSPF", is_correct: false },
      { text: "An inactive OSPF route held in standby", is_correct: false }
    ]
  },
  {
    stem: "What is the difference between an OSPF E1 (External Type 1) route and an E2 (External Type 2) route?",
    explanation: "An E1 route adds the internal path cost to the advertised external cost as it traverses the OSPF domain. An E2 route (the default for redistributed routes) maintains a fixed external metric and does not increment internal cost.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "E1 routes use RIP metrics while E2 routes use BGP metrics", is_correct: false },
      { text: "E1 includes internal OSPF path cost plus external cost, whereas E2 reflects only external cost", is_correct: true },
      { text: "E1 routes are summarized while E2 routes are never summarized", is_correct: false },
      { text: "E1 routes have an AD of 90 while E2 routes have an AD of 110", is_correct: false }
    ]
  },
  {
    stem: "Which command shows the OSPF process ID, Router ID, active areas, and routing networks configured on a Cisco router?",
    explanation: "The command `show ip protocols` displays running routing protocol details including administrative distance, active routing processes, Router ID, areas, and passive interfaces.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "show ip protocols", is_correct: true },
      { text: "show ip ospf interface", is_correct: false },
      { text: "show ip route", is_correct: false },
      { text: "show running-config interface", is_correct: false }
    ]
  },
  {
    stem: "What happens if two OSPF routers connected on a point-to-point link are configured with mismatched MTU values?",
    explanation: "When MTUs mismatch, the routers exchange Hello packets and reach 2-Way, but during Database Description (DBD) exchange in the ExStart/Exchange states, the router with the smaller MTU will drop the oversized DBD packet, causing the adjacency to get stuck in ExStart or Exchange.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "The routers will form a full adjacency but drop client traffic", is_correct: false },
      { text: "The adjacency will become stuck in the ExStart or Exchange state", is_correct: true },
      { text: "The router with the larger MTU will automatically fragment all BPDUs", is_correct: false },
      { text: "The routers will renegotiate their Router IDs to resolve the conflict", is_correct: false }
    ]
  },
  {
    stem: "Which command ignores MTU mismatches on an interface to allow an OSPF adjacency to form despite differing MTU settings?",
    explanation: "The interface command `ip ospf mtu-ignore` disables the OSPF MTU verification check in Database Description packets, allowing neighbor adjacencies to reach FULL state.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "mtu bypass enable", is_correct: false },
      { text: "ip ospf mtu-ignore", is_correct: true },
      { text: "no ip mtu check", is_correct: false },
      { text: "ospf allow-asymmetrical-mtu", is_correct: false }
    ]
  },
  {
    stem: "What is the administrative distance of a directly connected network interface that is in the up/up state?",
    explanation: "Directly connected routes have an administrative distance of 0, making them the most trusted route source in the routing table.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "0", is_correct: true },
      { text: "1", is_correct: false },
      { text: "5", is_correct: false },
      { text: "10", is_correct: false }
    ]
  },
  {
    stem: "What is the administrative distance of a static route configured with a next-hop IP address?",
    explanation: "A standard static route has a default administrative distance of 1.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "0", is_correct: false },
      { text: "1", is_correct: true },
      { text: "5", is_correct: false },
      { text: "20", is_correct: false }
    ]
  },
  {
    stem: "What is the administrative distance of internal BGP (iBGP)?",
    explanation: "Internal BGP (iBGP) has an administrative distance of 200, which is intentionally high so that internal routes learned through IGPs (OSPF, EIGRP) are preferred.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "20", is_correct: false },
      { text: "90", is_correct: false },
      { text: "110", is_correct: false },
      { text: "200", is_correct: true }
    ]
  },
  {
    stem: "How does a router determine if equal-cost multi-path (ECMP) routing should be installed for a destination prefix?",
    explanation: "If a routing protocol presents multiple paths to the exact same prefix with identical administrative distance and identical metric, the router installs up to 4 (or 16/32 configured) equal-cost paths into the routing table and load balances traffic across them.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The paths must originate from different autonomous systems", is_correct: false },
      { text: "The paths must have the same prefix length, administrative distance, and metric", is_correct: true },
      { text: "The paths must share the same physical exit interface", is_correct: false },
      { text: "The paths must be configured as floating static routes", is_correct: false }
    ]
  },
  {
    stem: "Which command configures a static default route directing all unmatched IPv4 traffic to next-hop 192.168.10.1?",
    explanation: "The command `ip route 0.0.0.0 0.0.0.0 192.168.10.1` installs a default route (gateway of last resort) pointing to next-hop IP 192.168.10.1.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "ip default-gateway 192.168.10.1", is_correct: false },
      { text: "ip route 0.0.0.0 0.0.0.0 192.168.10.1", is_correct: true },
      { text: "ip route default 192.168.10.1", is_correct: false },
      { text: "gateway 0.0.0.0 192.168.10.1", is_correct: false }
    ]
  },
  {
    stem: "What is the purpose of Gateway Load Balancing Protocol (GLBP) compared to HSRP and VRRP?",
    explanation: "Unlike HSRP and VRRP where only one router actively forwards traffic and standby routers remain idle, GLBP provides active load balancing by assigning different virtual MAC addresses to multiple Active Virtual Forwarders (AVFs) for the same virtual IP.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "GLBP encrypts default gateway packets using TLS", is_correct: false },
      { text: "GLBP enables concurrent active forwarding across multiple routers using virtual MAC load sharing", is_correct: true },
      { text: "GLBP eliminates the requirement for ARP resolution by hosts", is_correct: false },
      { text: "GLBP works exclusively over wide area network frame relay circuits", is_correct: false }
    ]
  },
  {
    stem: "In HSRP, what role is responsible for answering ARP requests sent by hosts for the virtual IP address?",
    explanation: "The Active router in an HSRP group responds to client ARP requests for the virtual IP by returning the HSRP virtual MAC address, and it forwards data packets sent to that virtual MAC.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Standby router", is_correct: false },
      { text: "Active router", is_correct: true },
      { text: "Virtual supervisor", is_correct: false },
      { text: "Root bridge", is_correct: false }
    ]
  },
  {
    stem: "What happens in HSRP if the Active router stops sending Hello packets and the hold timer expires?",
    explanation: "If the Standby router does not receive an HSRP hello packet within the configured holdtime (default 10 seconds), it assumes the Active router has failed and immediately transitions to the Active state.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The standby router reboots the active router using SNMP", is_correct: false },
      { text: "The standby router assumes the active router role and begins forwarding traffic", is_correct: true },
      { text: "All host default gateways are flushed until an administrator logs in", is_correct: false },
      { text: "The standby router converts its interfaces into 802.1Q trunks", is_correct: false }
    ]
  },
  {
    stem: "Which command shows the current state, active router, standby router, and virtual IP address for HSRP groups on a Cisco router?",
    explanation: "The command `show standby` (or `show standby brief`) displays detailed or concise HSRP status, including group number, priority, state, active IP, standby IP, and virtual IP.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "show ip fhrp", is_correct: false },
      { text: "show standby", is_correct: true },
      { text: "show hsrp group", is_correct: false },
      { text: "show vrrp brief", is_correct: false }
    ]
  },
  {
    stem: "What is the function of the `ip route 192.168.0.0 255.255.0.0 Null0` summary route in BGP and OSPF edge configurations?",
    explanation: "A static route pointing to the Null0 interface acts as a discard route. It prevents routing loops during route summarization by dropping packets destined for unassigned subnets within the summary block.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It restarts the routing table process whenever packets match the prefix", is_correct: false },
      { text: "It creates a blackhole discard route preventing routing loops for unassigned summary space", is_correct: true },
      { text: "It forces all traffic in the 192.168.0.0/16 range into an IPsec tunnel", is_correct: false },
      { text: "It assigns IP address 0.0.0.0 to the Null0 loopback interface", is_correct: false }
    ]
  },
  {
    stem: "Which type of route in Cisco IOS has an Administrative Distance of 115?",
    explanation: "Intermediate System to Intermediate System (IS-IS) routes have a default administrative distance of 115.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "OSPF", is_correct: false },
      { text: "IS-IS", is_correct: true },
      { text: "RIP", is_correct: false },
      { text: "EIGRP External", is_correct: false }
    ]
  },
  {
    stem: "What is the administrative distance of Routing Information Protocol (RIP)?",
    explanation: "RIP has a default administrative distance of 120, making it less preferred than OSPF (110) and EIGRP (90).",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "100", is_correct: false },
      { text: "110", is_correct: false },
      { text: "120", is_correct: true },
      { text: "130", is_correct: false }
    ]
  },
  {
    stem: "What does the code 'C' indicate in the output of `show ip route`?",
    explanation: "The code 'C' designates a directly connected network attached to an active interface on the local router.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Custom static route", is_correct: false },
      { text: "Connected network", is_correct: true },
      { text: "Cisco discovery route", is_correct: false },
      { text: "Candidate default route", is_correct: false }
    ]
  },
  {
    stem: "What does the code 'L' indicate in the output of `show ip route` introduced in Cisco IOS 15.0?",
    explanation: "The code 'L' designates a Local host route (/32 in IPv4 or /128 in IPv6) representing the specific IP address assigned to the router's own interface.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Loopback interface route", is_correct: false },
      { text: "Local host route (/32 or /128) representing the interface's assigned IP", is_correct: true },
      { text: "Learned dynamic OSPF route", is_correct: false },
      { text: "LACP aggregate link path", is_correct: false }
    ]
  },
  {
    stem: "What happens when an engineer configures `ip route 10.1.1.0 255.255.255.0 GigabitEthernet0/0` without specifying a next-hop IP address on an Ethernet multiaccess interface?",
    explanation: "Specifying only an Ethernet exit interface makes the router treat the entire subnet as directly connected. For every destination IP in that subnet, the router broadcasts an ARP request, causing excessive ARP traffic and CAM table bloat.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "The router refuses to accept the command with a syntax error", is_correct: false },
      { text: "The router performs proxy ARP for every destination host, causing high ARP overhead", is_correct: true },
      { text: "The router converts GigabitEthernet0/0 to half duplex", is_correct: false },
      { text: "The route is marked inactive and never enters the routing table", is_correct: false }
    ]
  },
  {
    stem: "Which command shows the IPv6 routing table on a Cisco router running dual-stack routing?",
    explanation: "The command `show ipv6 route` displays the complete IPv6 routing table, including connected, static, OSPFv3, and BGP routes.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "show ip route ipv6", is_correct: false },
      { text: "show ipv6 route", is_correct: true },
      { text: "show routing ipv6", is_correct: false },
      { text: "show ip protocols ipv6", is_correct: false }
    ]
  }
];

fs.writeFileSync(
  path.join(__dirname, "../questions-batch-5.json"),
  JSON.stringify(questions, null, 2)
);
console.log(`Generated ${questions.length} questions in questions-batch-5.json`);
