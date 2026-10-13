const fs = require('fs');
const path = require('path');

const questions = [
  {
    stem: "When a router receives a packet with multiple matching routes of varying prefix lengths in its routing table, which route is selected to forward the packet?",
    explanation: "Routers always select the route with the longest prefix match (most specific subnet mask), regardless of administrative distance or metric. Administrative distance is only evaluated when comparing identical prefixes learned via different routing protocols. If the packet destination matches both a /24 and a /28 route, the /28 route is selected.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "The route with the longest prefix match (most specific mask)", is_correct: true },
      { text: "The route with the lowest administrative distance", is_correct: false },
      { text: "The route with the lowest metric cost", is_correct: false },
      { text: "The route that was learned most recently", is_correct: false }
    ]
  },
  {
    stem: "What is the default Administrative Distance (AD) of an internal EIGRP route?",
    explanation: "Internal EIGRP routes have a default administrative distance of 90 on Cisco routers. By comparison, OSPF has an AD of 110, RIP has an AD of 120, and static routes have an AD of 1. External EIGRP routes carry an AD of 170.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "90", is_correct: true },
      { text: "110", is_correct: false },
      { text: "120", is_correct: false },
      { text: "100", is_correct: false }
    ]
  },
  {
    stem: "What is the default Administrative Distance of an OSPF route?",
    explanation: "OSPF routes are installed into the routing table with a default administrative distance of 110. Administrative distance indicates the believability of a routing source. Lower AD values are prioritized over higher AD values when competing for the same route.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "110", is_correct: true },
      { text: "90", is_correct: false },
      { text: "115", is_correct: false },
      { text: "120", is_correct: false }
    ]
  },
  {
    stem: "Which command configures an IPv4 floating static default route with an administrative distance of 130?",
    explanation: "The command `ip route 0.0.0.0 0.0.0.0 192.168.1.1 130` specifies a default route with an administrative distance of 130 appended at the end. Because its AD is higher than dynamic routing protocols like OSPF (110) or EIGRP (90), it remains inactive in the routing table until the primary route fails.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "ip route 0.0.0.0 0.0.0.0 192.168.1.1 130", is_correct: true },
      { text: "ip route 0.0.0.0 0.0.0.0 192.168.1.1 distance 130", is_correct: false },
      { text: "ip route default 192.168.1.1 metric 130", is_correct: false },
      { text: "ip default-network 192.168.1.1 130", is_correct: false }
    ]
  },
  {
    stem: "In a Router-on-a-Stick configuration, which command binds subinterface GigabitEthernet0/0.30 to VLAN 30 using 802.1Q trunking?",
    explanation: "The command `encapsulation dot1Q 30` configures the subinterface to process 802.1Q tagged frames for VLAN 30. This must be configured before assigning an IP address to the subinterface. The physical parent interface must remain administratively up without an IP address.",
    domain: "ip_routing",
    subtopic: "Inter-VLAN Routing",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "encapsulation dot1Q 30", is_correct: true },
      { text: "switchport trunk native vlan 30", is_correct: false },
      { text: "vlan 30 dot1q bind", is_correct: false },
      { text: "switchport access vlan 30", is_correct: false }
    ]
  },
  {
    stem: "How is the OSPFv2 Router ID (RID) determined if it is not manually configured via the `router-id` command?",
    explanation: "If no manual router-id is configured, OSPF chooses the highest IPv4 address among all active loopback interfaces. If no loopback interfaces exist, it selects the highest IPv4 address among active physical interfaces in up/up state. Once elected, the RID does not change unless OSPF is reloaded or cleared.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Highest IPv4 address on any active loopback interface", is_correct: true },
      { text: "Lowest IPv4 address on any active physical interface", is_correct: false },
      { text: "Highest MAC address among all participating interfaces", is_correct: false },
      { text: "The IP address of the interface connecting to Area 0", is_correct: false }
    ]
  },
  {
    stem: "Which destination multicast address is used by OSPF DR and BDR routers to receive Link-State Updates on a broadcast network?",
    explanation: "All DR and BDR routers listen on 224.0.0.6 (AllDRouters) to receive link-state advertisements sent by DROther routers. In turn, the DR sends updates to all non-DR routers on 224.0.0.5 (AllSPFRouters). This division prevents duplicate LSA flooding across multiaccess networks.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "224.0.0.6", is_correct: true },
      { text: "224.0.0.5", is_correct: false },
      { text: "224.0.0.9", is_correct: false },
      { text: "224.0.0.10", is_correct: false }
    ]
  },
  {
    stem: "What occurs when the interface command `ip ospf priority 0` is configured on an OSPF broadcast network interface?",
    explanation: "Setting the OSPF interface priority to 0 disqualifies that router from participating in the DR or BDR election on that subnet. The router becomes permanently ineligible to act as DR or BDR and remains in the DROther role. The default OSPF priority is 1.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "The router is prevented from becoming a DR or BDR on that segment", is_correct: true },
      { text: "The router is immediately elected as the primary DR", is_correct: false },
      { text: "The interface stops sending and receiving OSPF Hello packets", is_correct: false },
      { text: "The OSPF cost on that interface is set to zero", is_correct: false }
    ]
  },
  {
    stem: "What is the formula used by Cisco IOS to calculate the default OSPF interface cost?",
    explanation: "The default OSPF cost formula is Reference Bandwidth divided by Interface Bandwidth, with a default reference bandwidth of 100 Mbps (10^8 bps). Under this default, FastEthernet (100 Mbps), GigabitEthernet (1 Gbps), and 10 Gbps interfaces all evaluate to an equal cost of 1. Modifying the reference bandwidth with `auto-cost reference-bandwidth` is required for higher-speed links.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Reference Bandwidth (100 Mbps) / Interface Bandwidth", is_correct: true },
      { text: "Interface Bandwidth / 1000", is_correct: false },
      { text: "Interface Delay + Interface Bandwidth / 256", is_correct: false },
      { text: "Hop Count * Administrative Distance", is_correct: false }
    ]
  },
  {
    stem: "Which command changes the OSPF reference bandwidth to 100 Gbps across a router to distinguish Gigabit and 10G interfaces?",
    explanation: "The command `auto-cost reference-bandwidth 100000` (in Mbps) or `10000` configures the reference bandwidth to accurately differentiate between 1G, 10G, and 40G interfaces. For 100 Gbps, configuring 100000 ensures high-speed links have distinct, non-zero proportional metrics. This command must be configured identically on all routers in the OSPF domain.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "auto-cost reference-bandwidth 100000", is_correct: true },
      { text: "ospf cost-multiplier 100000", is_correct: false },
      { text: "ip ospf reference-cost 100g", is_correct: false },
      { text: "metric-bandwidth reference 100000", is_correct: false }
    ]
  },
  {
    stem: "What is the primary effect of configuring `passive-interface GigabitEthernet0/1` under an OSPF process?",
    explanation: "The `passive-interface` command suppresses OSPF Hello packet transmission out of the specified interface, preventing neighbor relationships from forming on that link. However, the subnet associated with the interface is still included in LSAs and advertised to other OSPF routers. This is standard practice on interfaces facing end-user access networks.",
    domain: "ip_routing",
    subtopic: "OSPF Configuration",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Suppresses Hello packets while continuing to advertise the connected subnet", is_correct: true },
      { text: "Completely removes the subnet from all OSPF advertisements", is_correct: false },
      { text: "Converts the interface into a silent OSPF stub area", is_correct: false },
      { text: "Disables link-state acknowledgments on the interface", is_correct: false }
    ]
  },
  {
    stem: "Which OSPF neighbor state indicates that bidirectional communication has been established because each router sees itself in the other's Hello packet?",
    explanation: "The 2-Way state is reached when a router receives a Hello packet from a neighbor that includes its own Router ID in the neighbor list. On broadcast networks, the DR and BDR election occurs during the 2-Way state. Drother routers remain in 2-Way state with other Drothers.",
    domain: "ip_routing",
    subtopic: "OSPF Neighbor States",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "2-Way", is_correct: true },
      { text: "Init", is_correct: false },
      { text: "ExStart", is_correct: false },
      { text: "Loading", is_correct: false }
    ]
  },
  {
    stem: "In which OSPF neighbor state do routers elect the master and slave roles and agree upon the initial Database Description (DBD) sequence number?",
    explanation: "The ExStart state is where master/slave negotiation occurs prior to exchanging DBD packets. The router with the higher Router ID becomes the master and controls the polling and sequence numbers. Once master/slave negotiation completes, routers transition to the Exchange state.",
    domain: "ip_routing",
    subtopic: "OSPF Neighbor States",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "ExStart", is_correct: true },
      { text: "Exchange", is_correct: false },
      { text: "Loading", is_correct: false },
      { text: "Init", is_correct: false }
    ]
  },
  {
    stem: "What are the default Hello and Dead intervals on an OSPF broadcast network type?",
    explanation: "On standard OSPF broadcast and point-to-point networks, the default Hello timer is 10 seconds and the Dead interval is 4 times the Hello timer, which is 40 seconds. Both timers must match exactly between two routers for an OSPF adjacency to form.",
    domain: "ip_routing",
    subtopic: "OSPF Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Hello: 10 seconds, Dead: 40 seconds", is_correct: true },
      { text: "Hello: 30 seconds, Dead: 120 seconds", is_correct: false },
      { text: "Hello: 5 seconds, Dead: 15 seconds", is_correct: false },
      { text: "Hello: 60 seconds, Dead: 180 seconds", is_correct: false }
    ]
  },
  {
    stem: "Which virtual MAC address format is utilized by HSRP version 1?",
    explanation: "HSRP version 1 uses the virtual MAC address format 0000.0c07.acXX, where XX is the two-digit hex HSRP group number (groups 0–255). HSRP version 2 uses 0000.0c9f.fXXX to support groups up to 4095. This virtual MAC is used by hosts as their default gateway ARP entry.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "0000.0c07.acXX", is_correct: true },
      { text: "0000.0c9f.fXXX", is_correct: false },
      { text: "0000.5e00.01XX", is_correct: false },
      { text: "0007.b400.XXYY", is_correct: false }
    ]
  },
  {
    stem: "What is the standard virtual MAC address prefix used by VRRP (Virtual Router Redundancy Protocol) for IPv4?",
    explanation: "VRRP uses the standardized MAC address format 0000.5e00.01XX, where XX represents the VRRP virtual router identifier (VRID) in hexadecimal. VRRP is an open IETF standard (RFC 5798), whereas HSRP is Cisco proprietary.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "0000.5e00.01XX", is_correct: true },
      { text: "0000.0c07.acXX", is_correct: false },
      { text: "0000.0c9f.fXXX", is_correct: false },
      { text: "0005.73a0.00XX", is_correct: false }
    ]
  },
  {
    stem: "What command enables an HSRP router with a higher configured priority to immediately reclaim the Active role when it recovers?",
    explanation: "The command `standby [group] preempt` allows a router with higher priority to immediately assume the Active router role from a lower-priority router. Without the preempt command, the currently active router remains active even if a router with higher priority comes online.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "standby 1 preempt", is_correct: true },
      { text: "standby 1 takeover", is_correct: false },
      { text: "standby 1 priority-override", is_correct: false },
      { text: "standby 1 active-force", is_correct: false }
    ]
  },
  {
    stem: "What is the default priority of a router in an HSRP standby group?",
    explanation: "The default HSRP priority on a Cisco router interface is 100. If priorities are equal, the router with the highest configured IP address on the interface is elected as the Active router. Administrators increase priority (e.g. to 110) to designate a preferred active gateway.",
    domain: "ip_routing",
    subtopic: "FHRP (HSRP/VRRP)",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "100", is_correct: true },
      { text: "1", is_correct: false },
      { text: "50", is_correct: false },
      { text: "128", is_correct: false }
    ]
  },
  {
    stem: "Which command configures an IPv6 default route pointing to next-hop address 2001:DB8:ACAD:1::1?",
    explanation: "In IPv6, a default route is written as `::/0` (representing all zeros prefix and prefix length). The command `ipv6 route ::/0 2001:DB8:ACAD:1::1` installs a static default gateway for all unlisted IPv6 destinations.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "ipv6 route ::/0 2001:DB8:ACAD:1::1", is_correct: true },
      { text: "ip route ::/0 2001:DB8:ACAD:1::1", is_correct: false },
      { text: "ipv6 default-gateway 2001:DB8:ACAD:1::1", is_correct: false },
      { text: "ipv6 route default 2001:DB8:ACAD:1::1", is_correct: false }
    ]
  },
  {
    stem: "When configuring a static route using a link-local IPv6 next-hop address, what additional parameter is mandatory?",
    explanation: "Because link-local addresses (FE80::/10) are ambiguous and can exist identically across multiple interfaces, the exit interface must be specified alongside the next-hop address (e.g., `ipv6 route ::/0 GigabitEthernet0/0 fe80::1`). Without the exit interface, the router cannot determine which local link reaches the neighbor.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "The local exit interface must be explicitly specified", is_correct: true },
      { text: "An administrative distance greater than 200 must be set", is_correct: false },
      { text: "The global unicast address of the loopback must be appended", is_correct: false },
      { text: "The EUI-64 keyword must be included at the end", is_correct: false }
    ]
  },
  {
    stem: "What command displays the current contents of the IPv4 routing table on a Cisco IOS-XE router?",
    explanation: "The command `show ip route` prints the complete IP routing table, displaying codes for route sources (such as C for connected, S for static, O for OSPF, D for EIGRP), administrative distances, metrics, next-hops, and uptime. It is the primary operational command for verifying path installation and gateway selection.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "show ip route", is_correct: true },
      { text: "show ip protocols", is_correct: false },
      { text: "show ip rib summary", is_correct: false },
      { text: "show routing-table ipv4", is_correct: false }
    ]
  },
  {
    stem: "In the routing table entry `O 10.2.0.0/16 [110/65] via 192.168.1.2`, what do the numbers 110 and 65 represent?",
    explanation: "In Cisco routing table bracket notation `[x/y]`, the first number `x` is the Administrative Distance (110 for OSPF), and the second number `y` is the protocol Metric or cumulative cost (65). This allows network engineers to quickly determine route preference and path cost.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "110 is Administrative Distance and 65 is Metric (Cost)", is_correct: true },
      { text: "110 is Hop Count and 65 is Administrative Distance", is_correct: false },
      { text: "110 is Bandwidth and 65 is Delay", is_correct: false },
      { text: "110 is MTU size and 65 is Link Reliability", is_correct: false }
    ]
  },
  {
    stem: "Which autonomous system routing protocol uses the AS_PATH attribute as its primary loop prevention mechanism?",
    explanation: "Border Gateway Protocol (BGP) prepends its own Autonomous System Number (ASN) to the AS_PATH attribute when advertising prefixes to external peers. If a router receives an update containing its own ASN within the AS_PATH list, it drops the update to prevent routing loops.",
    domain: "ip_routing",
    subtopic: "BGP Fundamentals",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "BGP (Border Gateway Protocol)", is_correct: true },
      { text: "OSPF (Open Shortest Path First)", is_correct: false },
      { text: "EIGRP (Enhanced Interior Gateway Routing Protocol)", is_correct: false },
      { text: "IS-IS (Intermediate System to Intermediate System)", is_correct: false }
    ]
  },
  {
    stem: "What is the administrative distance of an External BGP (eBGP) route compared to an Internal BGP (iBGP) route?",
    explanation: "eBGP routes have an administrative distance of 20, making them highly preferred over interior gateway protocols like OSPF and EIGRP. Conversely, iBGP routes have a high administrative distance of 200, ensuring interior dynamic IGP paths are preferred internally.",
    domain: "ip_routing",
    subtopic: "Administrative Distance",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "eBGP has an AD of 20, while iBGP has an AD of 200", is_correct: true },
      { text: "eBGP has an AD of 200, while iBGP has an AD of 20", is_correct: false },
      { text: "Both eBGP and iBGP share a default AD of 110", is_correct: false },
      { text: "eBGP has an AD of 90, while iBGP has an AD of 170", is_correct: false }
    ]
  },
  {
    stem: "Which command verifies all active OSPF neighbor adjacencies, their current states, and their interface roles?",
    explanation: "The command `show ip ospf neighbor` lists all discovered OSPF neighbors along with their neighbor ID, current state (e.g. FULL/DR, FULL/BDR, 2WAY/DROTHER), dead timer countdown, and local connecting interface. It is the vital first command for diagnosing OSPF peering issues.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "show ip ospf neighbor", is_correct: true },
      { text: "show ip ospf database", is_correct: false },
      { text: "show ip ospf interface brief", is_correct: false },
      { text: "show ip route ospf", is_correct: false }
    ]
  },
  {
    stem: "Which requirement must be satisfied for two directly connected routers to successfully establish an OSPF adjacency?",
    explanation: "For OSPF neighbors to form an adjacency, they must reside on the same IP subnet, belong to the same OSPF Area, match Hello and Dead interval timers, have matching area type flags (such as stub flags), and match authentication credentials. A mismatch in any of these parameters halts adjacency formation.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Matching subnet, area ID, and Hello/Dead timers", is_correct: true },
      { text: "Identical Router IDs configured on both routers", is_correct: false },
      { text: "Identical OSPF process ID numbers on both routers", is_correct: false },
      { text: "Identical interface physical bandwidth settings", is_correct: false }
    ]
  },
  {
    stem: "What happens if two routers in the same OSPF area are accidentally configured with identical Router IDs?",
    explanation: "Duplicate Router IDs prevent proper link-state database synchronization and cause severe routing instability. While neighbors might briefly reach 2-Way or ExStart state, they will generate continuous syslog error messages and fail to exchange LSAs correctly.",
    domain: "ip_routing",
    subtopic: "OSPF Troubleshooting",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "LSA exchange fails and routers log duplicate router-id error messages", is_correct: true },
      { text: "The router with the higher IP automatically renumbers its Router ID to 0.0.0.0", is_correct: false },
      { text: "The routers share a single virtual IP address similar to HSRP", is_correct: false },
      { text: "One router is demoted to a passive stub router automatically", is_correct: false }
    ]
  },
  {
    stem: "What OSPF network type is configured by default on an Ethernet interface?",
    explanation: "By default, Cisco IOS configures all Ethernet interfaces with the Broadcast OSPF network type. This network type uses multicast for Hellos (224.0.0.5) and conducts DR and BDR elections to reduce the number of adjacencies across multiaccess media.",
    domain: "ip_routing",
    subtopic: "OSPF Network Types",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Broadcast", is_correct: true },
      { text: "Point-to-point", is_correct: false },
      { text: "Non-broadcast multi-access (NBMA)", is_correct: false },
      { text: "Point-to-multipoint", is_correct: false }
    ]
  },
  {
    stem: "Which command configures an interface to operate as an OSPF point-to-point link, eliminating DR and BDR elections?",
    explanation: "The interface command `ip ospf network point-to-point` changes the OSPF network type from broadcast to point-to-point. This eliminates DR/BDR election overhead and speeds up adjacency establishment on dedicated two-router links.",
    domain: "ip_routing",
    subtopic: "OSPF Network Types",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "ip ospf network point-to-point", is_correct: true },
      { text: "ip ospf mode p2p", is_correct: false },
      { text: "neighbor point-to-point enable", is_correct: false },
      { text: "ospf link-type dedicated", is_correct: false }
    ]
  },
  {
    stem: "What is the primary role of an Area Border Router (ABR) in an OSPF multi-area network?",
    explanation: "An Area Border Router (ABR) connects one or more non-backbone areas to the backbone area (Area 0). An ABR maintains separate link-state databases for each area it attaches to and originates Type 3 Summary LSAs into adjacent areas to advertise inter-area routes.",
    domain: "ip_routing",
    subtopic: "OSPF Architecture",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Connects non-backbone areas to Area 0 and generates Type 3 summary LSAs", is_correct: true },
      { text: "Redistributes external non-OSPF routes into the OSPF domain", is_correct: false },
      { text: "Acts as the permanent Designated Router for all multi-access subnets", is_correct: false },
      { text: "Calculates BGP path metrics for autonomous system boundaries", is_correct: false }
    ]
  },
  {
    stem: "What is an Autonomous System Boundary Router (ASBR) in an OSPF deployment?",
    explanation: "An ASBR is a router that redistributes routes learned from another routing protocol (such as BGP, EIGRP, or static routes) into the OSPF domain. An ASBR generates Type 5 External LSAs to distribute these external destinations throughout OSPF areas.",
    domain: "ip_routing",
    subtopic: "OSPF Architecture",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "A router that redistributes external routes into the OSPF domain using Type 5 LSAs", is_correct: true },
      { text: "A router located exclusively within Area 0 backbone", is_correct: false },
      { text: "A router configured with passive interfaces on all physical ports", is_correct: false },
      { text: "A designated backup router for HSRP default gateway failover", is_correct: false }
    ]
  },
  {
    stem: "Which command directly enables OSPFv3 on an interface for IPv6 in Area 0?",
    explanation: "In OSPFv3, routing is enabled directly on interfaces rather than under the router process with network statements. The command `ospf 1 ipv6 area 0` or `ipv6 ospf 1 area 0` immediately activates OSPFv3 processing for that interface.",
    domain: "ip_routing",
    subtopic: "OSPFv3",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "ipv6 ospf 1 area 0", is_correct: true },
      { text: "network 2001:db8::/32 area 0", is_correct: false },
      { text: "router ospfv3 area 0 enable", is_correct: false },
      { text: "ipv6 routing ospf area 0", is_correct: false }
    ]
  },
  {
    stem: "What requirement must be met before an OSPFv3 process can start routing on a router configured exclusively with IPv6 addresses?",
    explanation: "OSPFv3 still requires a 32-bit IPv4-formatted Router ID (such as 1.1.1.1) to identify the router. If the router has no IPv4 addresses configured, the administrator must manually assign a Router ID using the `router-id` command under the OSPFv3 process.",
    domain: "ip_routing",
    subtopic: "OSPFv3",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "A 32-bit Router ID must be manually configured under the OSPFv3 process", is_correct: true },
      { text: "An IPv4 default route must be configured in global configuration", is_correct: false },
      { text: "Dual-stack tunneling must be activated on the egress interface", is_correct: false },
      { text: "The router must be joined to the FF02::1 multicast group statically", is_correct: false }
    ]
  },
  {
    stem: "Which metric does Cisco's Enhanced Interior Gateway Routing Protocol (EIGRP) use by default to determine the best path?",
    explanation: "By default, EIGRP uses bandwidth (slowest link on the path) and cumulative delay (sum of delays) to calculate its composite metric (using K1=1, K3=1, and K2=K4=K5=0). Reliability, load, and MTU are not included in default metric calculations.",
    domain: "ip_routing",
    subtopic: "EIGRP Fundamentals",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Minimum Bandwidth and Cumulative Delay", is_correct: true },
      { text: "Hop Count and MTU size", is_correct: false },
      { text: "Interface Cost and Reference Bandwidth", is_correct: false },
      { text: "Packet Loss and Jitter statistics", is_correct: false }
    ]
  },
  {
    stem: "In EIGRP terminology, what is a Feasible Successor?",
    explanation: "A Feasible Successor is a backup path that satisfies the Feasibility Condition: its Reported Distance (RD) must be strictly less than the Feasible Distance (FD) of the current Successor route. Because it satisfies this condition, the Feasible Successor can be installed immediately without recalculation if the primary path fails.",
    domain: "ip_routing",
    subtopic: "EIGRP Fundamentals",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "A loop-free backup route whose Reported Distance is lower than the current Feasible Distance", is_correct: true },
      { text: "The primary route currently installed in the routing table", is_correct: false },
      { text: "A neighboring router that has formed an active adjacency in Area 0", is_correct: false },
      { text: "A static route configured with an administrative distance of 255", is_correct: false }
    ]
  },
  {
    stem: "Which command configures a static host route for an individual server located at IP address 10.5.20.15 via next-hop 192.168.10.1?",
    explanation: "A host route matches a single IP address using a 32-bit mask (255.255.255.255 or /32). The command `ip route 10.5.20.15 255.255.255.255 192.168.10.1` ensures that traffic destined exclusively for that host takes the designated path.",
    domain: "ip_routing",
    subtopic: "Static Routing",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "ip route 10.5.20.15 255.255.255.255 192.168.10.1", is_correct: true },
      { text: "ip route 10.5.20.15 255.255.255.0 192.168.10.1", is_correct: false },
      { text: "ip host 10.5.20.15 gateway 192.168.10.1", is_correct: false },
      { text: "ip route host 10.5.20.15 192.168.10.1", is_correct: false }
    ]
  },
  {
    stem: "What mechanism is used by Distance Vector routing protocols to prevent loops by disallowing route advertisements back out the interface where they were learned?",
    explanation: "Split Horizon dictates that a router must never advertise routing information back out of the same interface through which it originally learned that information. This fundamental rule prevents basic two-node routing loops in distance vector networks.",
    domain: "ip_routing",
    subtopic: "Routing Concepts",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Split Horizon", is_correct: true },
      { text: "Route Poisoning", is_correct: false },
      { text: "Hold-Down Timers", is_correct: false },
      { text: "Counting to Infinity", is_correct: false }
    ]
  },
  {
    stem: "What does the route code 'C' indicate when viewing the output of the `show ip route` command?",
    explanation: "The code 'C' identifies a directly connected network assigned to an active interface on the local router. Connected routes have an administrative distance of 0 and represent links directly attached to the router.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Directly connected network", is_correct: true },
      { text: "Candidate default route", is_correct: false },
      { text: "Cisco Discovery Protocol route", is_correct: false },
      { text: "Converged OSPF route", is_correct: false }
    ]
  },
  {
    stem: "What does the route code 'L' indicate in modern Cisco IOS routing tables?",
    explanation: "The code 'L' designates a Local host route (/32 in IPv4 or /128 in IPv6) representing the specific IP address configured on the router's own interface. Local routes allow the router's control plane to efficiently process traffic addressed directly to itself.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Local host route representing the router's own interface IP", is_correct: true },
      { text: "Learned dynamic route via Link-State Protocol", is_correct: false },
      { text: "Loopback virtual interface route", is_correct: false },
      { text: "Legacy RIP route", is_correct: false }
    ]
  },
  {
    stem: "What happens when a packet's destination does not match any entry in the routing table and no default route is configured?",
    explanation: "If no matching route exists and there is no default route (gateway of last resort) installed, the router discards the packet. It then generates an ICMP Destination Host or Network Unreachable message back to the source IP address.",
    domain: "ip_routing",
    subtopic: "Routing Table Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "The packet is dropped and an ICMP Destination Unreachable message is returned", is_correct: true },
      { text: "The packet is broadcast out all active interfaces in the default VLAN", is_correct: false },
      { text: "The packet is buffered until a dynamic routing update arrives", is_correct: false },
      { text: "The packet is forwarded to the lowest IP loopback interface", is_correct: false }
    ]
  }
];

fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'data/ip_routing.json'), JSON.stringify(questions, null, 2));
console.log(`Generated ${questions.length} ip_routing questions.`);
