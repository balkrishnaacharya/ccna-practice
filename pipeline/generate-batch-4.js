const fs = require("fs");
const path = require("path");

const questions = [
  {
    stem: "What is the effect of configuring `spanning-tree portfast default` in global configuration mode on a Cisco switch?",
    explanation: "The global command `spanning-tree portfast default` automatically enables PortFast on all non-trunking interfaces configured as access ports across the switch.",
    domain: "switching",
    subtopic: "STP Features",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It enables PortFast on all switch interfaces including 802.1Q trunks", is_correct: false },
      { text: "It enables PortFast globally on all operational access switch ports", is_correct: true },
      { text: "It changes the default spanning-tree protocol from PVST+ to RSTP", is_correct: false },
      { text: "It blocks BPDUs on all trunk interfaces connecting to distribution switches", is_correct: false }
    ]
  },
  {
    stem: "What command enables BPDU Guard globally on all PortFast-enabled interfaces?",
    explanation: "The command `spanning-tree portfast bpduguard default` enables BPDU Guard globally on any interface where PortFast is active.",
    domain: "switching",
    subtopic: "STP Features",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "bpduguard enable all", is_correct: false },
      { text: "spanning-tree portfast bpduguard default", is_correct: true },
      { text: "service bpduguard global", is_correct: false },
      { text: "spanning-tree bpduguard on", is_correct: false }
    ]
  },
  {
    stem: "What happens when a switch port configured with BPDU Filter receives a BPDU frame?",
    explanation: "If BPDU Filter is enabled on a port, it stops sending BPDUs. If enabled globally on PortFast ports and a BPDU is received, the port loses PortFast status and reverts to standard STP negotiation.",
    domain: "switching",
    subtopic: "STP Features",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "The port enters the err-disable state immediately", is_correct: false },
      { text: "The port loses PortFast status and behaves as a regular spanning-tree port", is_correct: true },
      { text: "The BPDU is encrypted and forwarded across the management VLAN", is_correct: false },
      { text: "The switch reboots to clear the invalid topology configuration", is_correct: false }
    ]
  },
  {
    stem: "Which command assigns static secure MAC address 0011.2233.4455 to interface GigabitEthernet0/2?",
    explanation: "The command `switchport port-security mac-address 0011.2233.4455` statically binds the specified MAC address to the secure interface.",
    domain: "switching",
    subtopic: "Port Security",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "mac-address-table static 0011.2233.4455 gig0/2", is_correct: false },
      { text: "switchport port-security mac-address 0011.2233.4455", is_correct: true },
      { text: "port-security secure-mac 0011.2233.4455", is_correct: false },
      { text: "switchport secure-address 0011.2233.4455", is_correct: false }
    ]
  },
  {
    stem: "What is the maximum number of secure MAC addresses allowed by default on a port when `switchport port-security` is enabled without additional arguments?",
    explanation: "By default, when port security is enabled on an interface, the maximum number of secure MAC addresses is 1.",
    domain: "switching",
    subtopic: "Port Security",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "1", is_correct: true },
      { text: "2", is_correct: false },
      { text: "10", is_correct: false },
      { text: "Unlimited", is_correct: false }
    ]
  },
  {
    stem: "What is the purpose of the 802.1w Synchronization (Sync) proposal-agreement handshake?",
    explanation: "RSTP uses a rapid proposal and agreement mechanism between switches on point-to-point links. Designated ports negotiate directly with root ports to transition to forwarding in milliseconds without waiting for timer expiration.",
    domain: "switching",
    subtopic: "Rapid PVST+",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It resolves IP addresses to MAC addresses without sending broadcast ARP packets", is_correct: false },
      { text: "It allows point-to-point switch ports to transition rapidly to forwarding via explicit handshake", is_correct: true },
      { text: "It synchronizes NTP clocks across all member switches in a VTP domain", is_correct: false },
      { text: "It negotiates duplex settings when auto-negotiation fails", is_correct: false }
    ]
  },
  {
    stem: "In an RSTP topology, which link type is automatically detected on full-duplex point-to-point connections between switches?",
    explanation: "RSTP detects full-duplex links as Point-to-Point (P2p) link types. Only point-to-point links can use the rapid proposal-agreement handshake. Half-duplex links are classified as Shared.",
    domain: "switching",
    subtopic: "Rapid PVST+",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Shared (Shr)", is_correct: false },
      { text: "Point-to-Point (P2p)", is_correct: true },
      { text: "Broadcast (Brd)", is_correct: false },
      { text: "Multipoint (Mpt)", is_correct: false }
    ]
  },
  {
    stem: "What does the command `show interfaces trunk` show in Cisco IOS?",
    explanation: "The `show interfaces trunk` command displays active 802.1Q trunk interfaces, configured trunking modes, encapsulation type, trunk operational status, native VLAN, and lists of allowed and active VLANs.",
    domain: "switching",
    subtopic: "VLANs and Trunking",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Only physical port speed and duplex settings", is_correct: false },
      { text: "Active trunk ports, trunking modes, native VLANs, and allowed VLAN lists", is_correct: true },
      { text: "Spanning tree root bridge election priorities across all active VLANs", is_correct: false },
      { text: "IP addresses assigned to Switch Virtual Interfaces", is_correct: false }
    ]
  },
  {
    stem: "What is the function of the LACP system priority in an EtherChannel deployment?",
    explanation: "LACP system priority (default 32768) combined with the switch MAC address determines which switch is the master (actor) that decides which physical ports become active when more than 8 ports are configured in a bundle.",
    domain: "switching",
    subtopic: "EtherChannel",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It determines which switch becomes the spanning tree root bridge", is_correct: false },
      { text: "It determines which switch controls port selection in an LACP bundle exceeding 8 ports", is_correct: true },
      { text: "It configures the hashing algorithm used for load distribution across bundle links", is_correct: false },
      { text: "It sets the maximum allowable bandwidth for the port-channel interface", is_correct: false }
    ]
  },
  {
    stem: "Which VTP version introduces support for extended range VLANs (1006 to 4094)?",
    explanation: "VTP version 3 is the only VTP version that supports the propagation and management of extended range VLANs (1006–4094). VTP versions 1 and 2 support only normal range VLANs (1–1005).",
    domain: "switching",
    subtopic: "VTP",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "VTP Version 1", is_correct: false },
      { text: "VTP Version 2", is_correct: false },
      { text: "VTP Version 3", is_correct: true },
      { text: "VTP Version 4", is_correct: false }
    ]
  },
  {
    stem: "How does a switch forward a broadcast Ethernet frame with destination MAC FFFF.FFFF.FFFF?",
    explanation: "A switch floods broadcast frames out all active ports belonging to the same VLAN in which the frame was received, excluding the original incoming port.",
    domain: "switching",
    subtopic: "Switch Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "It discards the broadcast frame to protect network stability", is_correct: false },
      { text: "It forwards the frame out all active interfaces in the same VLAN except the receiving port", is_correct: true },
      { text: "It forwards the frame only to the default gateway router", is_correct: false },
      { text: "It encapsulates the frame in a GRE tunnel to the core switch", is_correct: false }
    ]
  },
  {
    stem: "What is an advantage of cut-through switching compared to store-and-forward switching?",
    explanation: "Cut-through switching reads only the destination MAC address (first 6 bytes) of an incoming frame and immediately begins forwarding, resulting in significantly lower latency.",
    domain: "switching",
    subtopic: "Switch Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "It discards all corrupt frames by checking the CRC before forwarding", is_correct: false },
      { text: "It provides significantly lower latency by beginning transmission before the entire frame is received", is_correct: true },
      { text: "It supports routing between VLANs without needing an SVI", is_correct: false },
      { text: "It eliminates collisions on half-duplex links completely", is_correct: false }
    ]
  },
  {
    stem: "What happens when an administrator enters `channel-group 1 mode desirable` on Switch A and `channel-group 1 mode on` on Switch B?",
    explanation: "The channel will fail to form. Mode 'desirable' requires negotiation using PAgP packets, whereas mode 'on' disables negotiation. Mismatched negotiation states prevent bundle establishment.",
    domain: "switching",
    subtopic: "EtherChannel",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The EtherChannel bundle establishes successfully using PAgP", is_correct: false },
      { text: "The EtherChannel fails to form because one side expects negotiation and the other does not", is_correct: true },
      { text: "LACP takes over automatically and brings up the port channel", is_correct: false },
      { text: "The interfaces will automatically convert to 10 Gbps full duplex", is_correct: false }
    ]
  },
  {
    stem: "Which command shows the MAC address table entries learned on a Cisco Catalyst switch?",
    explanation: "The command `show mac address-table` (or `show mac-address-table`) displays dynamically learned and statically configured MAC addresses along with their associated VLAN and port.",
    domain: "switching",
    subtopic: "Switch Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "show ip arp", is_correct: false },
      { text: "show mac address-table", is_correct: true },
      { text: "show cam table", is_correct: false },
      { text: "show switchport macs", is_correct: false }
    ]
  },
  {
    stem: "What is the primary role of the System ID Extension in the modern STP Bridge ID format?",
    explanation: "The 12-bit System ID Extension carries the VLAN ID (1–4095). This eliminates the requirement for each switch to have a unique MAC address per VLAN in PVST+ and Rapid PVST+.",
    domain: "switching",
    subtopic: "Spanning Tree Protocol",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It carries the cryptographic signature of the root bridge", is_correct: false },
      { text: "It carries the VLAN ID, allowing a single switch MAC address to support multiple spanning-tree instances", is_correct: true },
      { text: "It records the hop count remaining before a BPDU expires", is_correct: false },
      { text: "It stores the VTP domain revision number", is_correct: false }
    ]
  },
  {
    stem: "What is the effect of the command `spanning-tree vlan 20 priority 4096` on a switch?",
    explanation: "It sets the bridge priority for VLAN 20 to 4096 (plus the system ID extension 20, making the total BID priority 4116), making this switch very likely to be elected the root bridge for VLAN 20.",
    domain: "switching",
    subtopic: "Spanning Tree Protocol",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It sets the port path cost for VLAN 20 to 4096", is_correct: false },
      { text: "It lowers the bridge priority for VLAN 20 to 4096, heavily favoring it in root bridge election", is_correct: true },
      { text: "It limits maximum MAC addresses learned on VLAN 20 to 4096", is_correct: false },
      { text: "It forces all trunk ports in VLAN 20 to use 802.1D legacy mode", is_correct: false }
    ]
  },
  {
    stem: "Which statement is true regarding Spanning Tree Backup port role in RSTP 802.1w?",
    explanation: "A Backup port provides a redundant path to the same shared segment where another port on the same switch is already the Designated port (typically seen on a hub or shared collision domain).",
    domain: "switching",
    subtopic: "Rapid PVST+",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It provides a redundant path to the root bridge when the root port fails", is_correct: false },
      { text: "It acts as a redundant designated port for the same shared collision domain on the same switch", is_correct: true },
      { text: "It replaces the Root Bridge when the primary root switch fails", is_correct: false },
      { text: "It forwards broadcast traffic while blocking unicast frames", is_correct: false }
    ]
  },
  {
    stem: "What command creates an SVI for VLAN 10 and assigns it an IP address on a Cisco multilayer switch?",
    explanation: "The command sequence `interface vlan 10` followed by `ip address <ip> <mask>` and `no shutdown` creates and enables the Switch Virtual Interface for VLAN 10.",
    domain: "switching",
    subtopic: "Layer 3 Switching",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "vlan 10 ip address <ip> <mask>", is_correct: false },
      { text: "interface vlan 10 followed by ip address <ip> <mask>", is_correct: true },
      { text: "switchport vlan 10 ip <ip>", is_correct: false },
      { text: "ip default-gateway vlan 10 <ip>", is_correct: false }
    ]
  },
  {
    stem: "Which command restricts an 802.1Q trunk port to only carry traffic for VLANs 10, 20, and 30?",
    explanation: "The command `switchport trunk allowed vlan 10,20,30` explicitly defines the exact set of VLANs permitted across the trunk. All other VLANs are pruned.",
    domain: "switching",
    subtopic: "VLANs and Trunking",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "switchport trunk vlan permit 10,20,30", is_correct: false },
      { text: "switchport trunk allowed vlan 10,20,30", is_correct: true },
      { text: "switchport allowed vlan add 10 20 30", is_correct: false },
      { text: "vlan trunk filter 10-30", is_correct: false }
    ]
  },
  {
    stem: "What is the default operational mode of a switchport on a Cisco Catalyst 2960/3560 series switch?",
    explanation: "On many traditional Cisco Catalyst switches, the default mode is `dynamic auto` or `dynamic desirable`. Modern Catalyst switches default to static `access` mode for security.",
    domain: "switching",
    subtopic: "DTP Negotiation",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Routed interface (no switchport)", is_correct: false },
      { text: "Dynamic auto", is_correct: true },
      { text: "Permanent trunk with 802.1Q", is_correct: false },
      { text: "Port-channel member mode", is_correct: false }
    ]
  },
  {
    stem: "What does the command `switchport mode trunk` do on a switch interface?",
    explanation: "The command `switchport mode trunk` places the interface into permanent trunking mode and negotiates with the connected device to convert the link to an 802.1Q trunk link.",
    domain: "switching",
    subtopic: "VLANs and Trunking",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "It sets the interface as an untagged access port", is_correct: false },
      { text: "It puts the interface into permanent trunking mode and sends DTP frames to negotiate trunking", is_correct: true },
      { text: "It binds the interface into an LACP EtherChannel bundle", is_correct: false },
      { text: "It assigns the interface to VLAN 1 exclusively", is_correct: false }
    ]
  },
  {
    stem: "When an administrator enters `show spanning-tree summary`, what information is displayed?",
    explanation: "The `show spanning-tree summary` command displays the active STP mode (PVST+, Rapid PVST+, MST), global settings like PortFast default and BPDU Guard default, and a summary table of blocking, listening, learning, and forwarding ports across all VLANs.",
    domain: "switching",
    subtopic: "Spanning Tree Protocol",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A list of IP addresses configured on all SVIs", is_correct: false },
      { text: "The active STP mode, global defaults, and total counts of port states across VLANs", is_correct: true },
      { text: "The CAM table aging timer for each physical port", is_correct: false },
      { text: "The current CDP neighbors on active trunk ports", is_correct: false }
    ]
  },
  {
    stem: "Why would an administrator configure `switchport access vlan 99` on an interface before enabling `switchport mode access`?",
    explanation: "Configuring the access VLAN associates the port with VLAN 99. Setting `switchport mode access` forces the port into static access mode, ensuring it never attempts to negotiate trunking.",
    domain: "switching",
    subtopic: "VLANs and Trunking",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "To encrypt all traffic sent by the attached workstation", is_correct: false },
      { text: "To assign the port to broadcast domain VLAN 99 and disable dynamic trunk negotiation", is_correct: true },
      { text: "To make the port a routed Layer 3 gateway interface", is_correct: false },
      { text: "To enable 802.1Q tag insertion on host packets", is_correct: false }
    ]
  },
  {
    stem: "What is an EtherChannel misconfiguration guard designed to protect against in Cisco switches?",
    explanation: "EtherChannel guard detects when member ports in a bundle are improperly connected to different devices or configured inconsistently, and places the offending ports into err-disabled state to prevent Layer 2 bridging loops.",
    domain: "switching",
    subtopic: "EtherChannel",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It protects against IP address conflicts between SVIs", is_correct: false },
      { text: "It detects inconsistent bundle cabling or parameters and disables the ports to prevent loops", is_correct: true },
      { text: "It limits bandwidth utilization to under 80% on member links", is_correct: false },
      { text: "It blocks untrusted DHCP servers from sending offer packets", is_correct: false }
    ]
  },
  {
    stem: "What command removes all dynamically learned MAC addresses from the CAM table on a Cisco Catalyst switch?",
    explanation: "The privileged EXEC command `clear mac address-table dynamic` flushes all dynamically learned MAC address table entries, forcing the switch to relearn source addresses from incoming frames.",
    domain: "switching",
    subtopic: "Switch Operations",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "clear ip arp", is_correct: false },
      { text: "clear mac address-table dynamic", is_correct: true },
      { text: "reset cam table", is_correct: false },
      { text: "flush mac-table all", is_correct: false }
    ]
  }
];

fs.writeFileSync(
  path.join(__dirname, "../questions-batch-4.json"),
  JSON.stringify(questions, null, 2)
);
console.log(`Generated ${questions.length} questions in questions-batch-4.json`);
