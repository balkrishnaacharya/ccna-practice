const fs = require('fs');
const path = require('path');

const questions = [
  {
    stem: "What is the primary difference between Standard Access Control Lists (ACLs) and Extended ACLs in Cisco IOS?",
    explanation: "Standard ACLs evaluate only the source IPv4 address of a packet. Extended ACLs evaluate source and destination IPv4 addresses, Layer 4 protocols (such as TCP and UDP), and port numbers. Because of this precision, extended ACLs should be placed as close as possible to the source of the traffic.",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Standard ACLs filter only by source IP, while Extended ACLs filter by source, destination, protocol, and port", is_correct: true },
      { text: "Standard ACLs can filter TCP ports, while Extended ACLs only inspect ICMP packets", is_correct: false },
      { text: "Standard ACLs are placed closest to the source, while Extended ACLs are placed closest to the destination", is_correct: false },
      { text: "Standard ACLs support stateful tracking, while Extended ACLs are purely stateless", is_correct: false }
    ]
  },
  {
    stem: "What is the standard ACL number range in Cisco IOS software?",
    explanation: "Standard IPv4 ACLs use the number ranges 1–99 and expanded ranges 1300–1999. Extended ACLs use ranges 100–199 and expanded ranges 2000–2699. Named ACLs can also be used to provide descriptive names instead of numbers.",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "1–99 and 1300–1999", is_correct: true },
      { text: "100–199 and 2000–2699", is_correct: false },
      { text: "200–299 and 1000–1199", is_correct: false },
      { text: "1–50 and 500–599", is_correct: false }
    ]
  },
  {
    stem: "What statement is implicitly present at the end of every Cisco IOS Access Control List?",
    explanation: "Every Cisco ACL concludes with an invisible implicit deny statement (e.g., `deny ip any any` or `deny any`). Any packet that does not match an explicit permit statement in the ACL is silently dropped. Administrators often append an explicit deny statement with the `log` option to monitor dropped packets.",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "An implicit deny statement that drops all unmatched traffic", is_correct: true },
      { text: "An implicit permit statement that allows all unmatched traffic", is_correct: false },
      { text: "An automatic redirect to the default management interface", is_correct: false },
      { text: "A rate-limiting policy that caps unmatched traffic at 10 Mbps", is_correct: false }
    ]
  },
  {
    stem: "Which wildcard mask matches all hosts within the IPv4 subnet 192.168.16.0/20 in an ACL statement?",
    explanation: "A /20 subnet mask is 255.255.240.0. Subtracting this mask from 255.255.255.255 yields the wildcard mask 0.0.15.255. An ACL statement using this wildcard mask evaluates the first 20 bits and ignores the remaining 12 bits.",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "0.0.15.255", is_correct: true },
      { text: "0.0.31.255", is_correct: false },
      { text: "0.0.240.255", is_correct: false },
      { text: "0.0.7.255", is_correct: false }
    ]
  },
  {
    stem: "Which NAT type maps multiple private IP addresses to a single public IP address using unique Layer 4 source port numbers?",
    explanation: "Port Address Translation (PAT), also known as NAT Overload, maps multiple private IP addresses to a single public registered address. It achieves this by tracking individual sessions with unique TCP/UDP source port numbers. This is the primary method used in home and enterprise routers to conserve IPv4 public address space.",
    domain: "services_security",
    subtopic: "Network Address Translation",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Port Address Translation (PAT) / NAT Overload", is_correct: true },
      { text: "Static one-to-one NAT", is_correct: false },
      { text: "Dynamic pooled NAT without overload", is_correct: false },
      { text: "Dual-stack NAT64 translation", is_correct: false }
    ]
  },
  {
    stem: "What command enables Port Address Translation (PAT) using the public IP address configured on interface GigabitEthernet0/0/0?",
    explanation: "The command `ip nat inside source list 1 interface GigabitEthernet0/0/0 overload` links an ACL (list 1) identifying private addresses to the specified outside interface. The `overload` keyword activates PAT port multiplexing. Traffic leaving the interface has its source IP replaced with that interface's IP.",
    domain: "services_security",
    subtopic: "Network Address Translation",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "ip nat inside source list 1 interface GigabitEthernet0/0/0 overload", is_correct: true },
      { text: "ip nat pool OVERLOAD interface GigabitEthernet0/0/0", is_correct: false },
      { text: "ip pat enable interface GigabitEthernet0/0/0", is_correct: false },
      { text: "ip nat translation port-map GigabitEthernet0/0/0 inside", is_correct: false }
    ]
  },
  {
    stem: "In Cisco NAT terminology, what does the term 'Inside Global' address represent?",
    explanation: "An Inside Global address is the globally unique, routable public IP address that represents an internal private host to the outside world. The Inside Local address is the private IP configured on the host inside the network. When an inside host sends a packet to the internet, NAT translates its Inside Local address to an Inside Global address.",
    domain: "services_security",
    subtopic: "Network Address Translation",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "The public IP address that represents an inside host to the outside world", is_correct: true },
      { text: "The private IP address assigned to a host on the local inside network", is_correct: false },
      { text: "The IP address of an outside destination host as viewed from the inside network", is_correct: false },
      { text: "The default gateway IP assigned to the ISP perimeter edge router", is_correct: false }
    ]
  },
  {
    stem: "Which command clears all dynamic active NAT translations from the router translation table?",
    explanation: "The privileged EXEC command `clear ip nat translation *` immediately flushes all dynamic translations from the NAT table. It is frequently used after modifying NAT configuration or ACLs to force immediate re-evaluation. Static NAT translations are unaffected by this command.",
    domain: "services_security",
    subtopic: "Network Address Translation",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "clear ip nat translation *", is_correct: true },
      { text: "reset ip nat dynamic-table", is_correct: false },
      { text: "flush nat entries all", is_correct: false },
      { text: "no ip nat translations", is_correct: false }
    ]
  },
  {
    stem: "What is the purpose of configuring `ip helper-address 10.1.50.10` on an access router interface?",
    explanation: "The `ip helper-address` command enables the router to act as a DHCP relay agent. It intercepts local broadcast DHCP messages (UDP ports 67/68) and forwards them as unicast packets to the specified remote DHCP server at 10.1.50.10. It also relays other specified UDP broadcast protocols, such as TFTP and DNS, by default.",
    domain: "services_security",
    subtopic: "DHCP and Helper Address",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Relays client broadcast DHCP requests as unicast to a centralized DHCP server", is_correct: true },
      { text: "Acts as a primary DNS name server forwarding queries to root servers", is_correct: false },
      { text: "Establishes a redundant default gateway tracking protocol", is_correct: false },
      { text: "Enables dynamic ARP inspection to validate client MAC addresses", is_correct: false }
    ]
  },
  {
    stem: "Which command reserves IP addresses 192.168.1.1 through 192.168.1.10 so they are not dynamically assigned by a Cisco IOS DHCP pool?",
    explanation: "The global configuration command `ip dhcp excluded-address 192.168.1.1 192.168.1.10` prevents the local DHCP server from leasing out those addresses. This reserves them for statically assigned equipment such as default gateways, switches, and servers. This command is executed in global configuration mode outside the pool definition.",
    domain: "services_security",
    subtopic: "DHCP Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "ip dhcp excluded-address 192.168.1.1 192.168.1.10", is_correct: true },
      { text: "ip dhcp pool exclude 192.168.1.1 to 192.168.1.10", is_correct: false },
      { text: "reserve ip address 192.168.1.1 192.168.1.10", is_correct: false },
      { text: "deny dhcp lease 192.168.1.1 192.168.1.10", is_correct: false }
    ]
  },
  {
    stem: "In the Network Time Protocol (NTP) hierarchy, what stratum level is assigned to a device directly synchronized with a Stratum 1 atomic clock time server?",
    explanation: "NTP measures hierarchical distance using stratum levels. Stratum 0 represents authoritative reference clocks like atomic clocks or GPS satellites. Devices directly synchronized to Stratum 1 servers become Stratum 2 servers. The stratum number increments by 1 at each hop away from the reference clock.",
    domain: "services_security",
    subtopic: "NTP Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Stratum 2", is_correct: true },
      { text: "Stratum 1", is_correct: false },
      { text: "Stratum 0", is_correct: false },
      { text: "Stratum 16", is_correct: false }
    ]
  },
  {
    stem: "What does an NTP stratum level of 16 indicate on a Cisco router?",
    explanation: "In NTP, Stratum 16 signifies that the device is unsynchronized and unreachable. NTP only supports stratum levels from 1 to 15 for valid time tracking. A device at Stratum 16 cannot be used by other devices as a valid time source.",
    domain: "services_security",
    subtopic: "NTP Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "The device is unsynchronized and its clock cannot be trusted", is_correct: true },
      { text: "The device is an authoritative Stratum 0 GPS master clock", is_correct: false },
      { text: "The device is operating in peer-to-peer authenticated broadcast mode", is_correct: false },
      { text: "The device has exceeded the maximum round-trip latency threshold", is_correct: false }
    ]
  },
  {
    stem: "Which command configures a Cisco router to synchronize its system clock with an external NTP server at IP 203.0.113.50?",
    explanation: "The global configuration command `ntp server 203.0.113.50` instructs the router to poll the remote NTP server at that IP address for time synchronization. The router periodically exchanges NTP packets over UDP port 123. The command `show ntp associations` verifies synchronization status.",
    domain: "services_security",
    subtopic: "NTP Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "ntp server 203.0.113.50", is_correct: true },
      { text: "clock sync 203.0.113.50", is_correct: false },
      { text: "time-server 203.0.113.50 enable", is_correct: false },
      { text: "service ntp client 203.0.113.50", is_correct: false }
    ]
  },
  {
    stem: "What is the numeric Syslog severity level for 'Warning' messages?",
    explanation: "Syslog severity levels range from 0 to 7: 0=Emergency, 1=Alert, 2=Critical, 3=Error, 4=Warning, 5=Notice, 6=Informational, and 7=Debugging. Therefore, Warning corresponds to severity level 4. A mnemonic commonly used is 'Every Awesome Cisco Engineer Will Need Ice Cream Daily'.",
    domain: "services_security",
    subtopic: "Syslog Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Level 4", is_correct: true },
      { text: "Level 3", is_correct: false },
      { text: "Level 5", is_correct: false },
      { text: "Level 2", is_correct: false }
    ]
  },
  {
    stem: "Which Syslog severity level represents granular, real-time diagnostic output generated by commands such as `debug ip packet`?",
    explanation: "Syslog severity level 7 represents Debugging output. It produces highly detailed real-time information about protocol exchanges and system events. Because level 7 output can cause high CPU utilization, it should be used cautiously on production equipment.",
    domain: "services_security",
    subtopic: "Syslog Operations",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Level 7 (Debugging)", is_correct: true },
      { text: "Level 6 (Informational)", is_correct: false },
      { text: "Level 0 (Emergency)", is_correct: false },
      { text: "Level 5 (Notice)", is_correct: false }
    ]
  },
  {
    stem: "Which command sends syslog messages of severity level Informational (level 6) and higher to a remote syslog server at 192.168.1.25?",
    explanation: "The commands `logging host 192.168.1.25` and `logging trap informational` (or level 6) direct syslog output to a remote server. The trap level specifies the maximum severity level transmitted, meaning levels 0 through 6 are forwarded to the syslog daemon. Remote syslog uses UDP port 514 by default.",
    domain: "services_security",
    subtopic: "Syslog Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "logging host 192.168.1.25 and logging trap informational", is_correct: true },
      { text: "syslog server 192.168.1.25 level 6", is_correct: false },
      { text: "service syslog remote 192.168.1.25 trap 6", is_correct: false },
      { text: "log-forward 192.168.1.25 trap info", is_correct: false }
    ]
  },
  {
    stem: "What security features does SNMPv3 provide that are absent in SNMPv1 and SNMPv2c?",
    explanation: "SNMPv3 introduces cryptographic message integrity, user authentication, and payload encryption (privacy). Earlier versions sent community strings across the network in cleartext, making them vulnerable to packet sniffing. SNMPv3 defines three security models: noAuthNoPriv, authNoPriv, and authPriv.",
    domain: "services_security",
    subtopic: "SNMP Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Message integrity, user authentication, and data encryption (authPriv)", is_correct: true },
      { text: "Support for community string hashing using MD5 exclusively", is_correct: false },
      { text: "Unicast transport over TLS without requiring user credentials", is_correct: false },
      { text: "Mandatory bidirectional public-key certificate verification", is_correct: false }
    ]
  },
  {
    stem: "What is the primary difference between an SNMP Trap and an SNMP Inform message?",
    explanation: "An SNMP Trap is an unacknowledged message sent by an agent to an NMS over UDP port 162. An SNMP Inform is an acknowledged notification where the NMS must respond with an Inform-Response packet. If no acknowledgment is received, the agent retransmits the Inform, guaranteeing notification delivery.",
    domain: "services_security",
    subtopic: "SNMP Operations",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Informs require an acknowledgment from the NMS, while Traps are unacknowledged", is_correct: true },
      { text: "Traps use TCP port 161, while Informs use UDP port 162", is_correct: false },
      { text: "Informs are sent only when a hardware temperature threshold is breached", is_correct: false },
      { text: "Traps carry encrypted payloads, while Informs are always cleartext", is_correct: false }
    ]
  },
  {
    stem: "Which two commands are prerequisites before an RSA key pair can be generated for SSH access on a Cisco router?",
    explanation: "A hostname (configured with `hostname [name]`) and an IP domain name (configured with `ip domain-name [domain]`) must be established before running `crypto key generate rsa`. Cisco IOS uses these two values together to form the Fully Qualified Domain Name (FQDN) that names the RSA key pair.",
    domain: "services_security",
    subtopic: "SSH Configuration",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "hostname and ip domain-name", is_correct: true },
      { text: "enable secret and username secret", is_correct: false },
      { text: "ip routing and line vty 0 4", is_correct: false },
      { text: "crypto isakmp enable and service password-encryption", is_correct: false }
    ]
  },
  {
    stem: "Which command configures VTY lines to accept only SSH connections while rejecting cleartext Telnet sessions?",
    explanation: "The line configuration command `transport input ssh` restricts remote terminal access to encrypted SSH on port 22. Any incoming connection using Telnet (port 23) or other protocols is immediately rejected. This prevents eavesdropping of administrative credentials in transit.",
    domain: "services_security",
    subtopic: "SSH Configuration",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "transport input ssh", is_correct: true },
      { text: "transport secure-only", is_correct: false },
      { text: "login transport ssh-only", is_correct: false },
      { text: "line vty protocol ssh", is_correct: false }
    ]
  },
  {
    stem: "Which protocol in an AAA architecture separates Authentication, Authorization, and Accounting functions and encrypts the entire packet payload?",
    explanation: "TACACS+ is a Cisco-developed protocol that operates over TCP port 49 and encrypts the entire packet payload. It cleanly separates Authentication, Authorization, and Accounting into distinct modular processes. In contrast, RADIUS combines authentication and authorization and only encrypts the password field over UDP.",
    domain: "services_security",
    subtopic: "AAA Security",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "TACACS+", is_correct: true },
      { text: "RADIUS", is_correct: false },
      { text: "Diameter", is_correct: false },
      { text: "Kerberos", is_correct: false }
    ]
  },
  {
    stem: "What transport protocol and port numbers are standard for RADIUS authentication and accounting according to RFC 2865 and RFC 2866?",
    explanation: "Modern RADIUS uses UDP port 1812 for authentication/authorization and UDP port 1813 for accounting. Earlier legacy implementations used UDP ports 1645 and 1646. RADIUS only encrypts the password attribute, leaving the rest of the packet header in cleartext.",
    domain: "services_security",
    subtopic: "AAA Security",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "UDP ports 1812 (Authentication) and 1813 (Accounting)", is_correct: true },
      { text: "TCP port 49 for all functions", is_correct: false },
      { text: "TCP ports 88 and 464", is_correct: false },
      { text: "UDP ports 500 and 4500", is_correct: false }
    ]
  },
  {
    stem: "Which command configures an interface on a switch as a trusted port for DHCP Snooping?",
    explanation: "The command `ip dhcp snooping trust` designates the port as trusted, allowing it to receive DHCP server messages (such as DHCPOFFER and DHCPACK). All edge access ports facing end users default to untrusted state to block rogue DHCP servers. Trusted ports are typically uplinks connecting to network cores or legitimate DHCP servers.",
    domain: "services_security",
    subtopic: "DHCP Snooping",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "ip dhcp snooping trust", is_correct: true },
      { text: "switchport dhcp allow-server", is_correct: false },
      { text: "ip dhcp-server trusted-port", is_correct: false },
      { text: "service dhcp trust enable", is_correct: false }
    ]
  },
  {
    stem: "What database does Dynamic ARP Inspection (DAI) utilize to validate Address Resolution Protocol packets on untrusted ports?",
    explanation: "Dynamic ARP Inspection inspects ARP requests and replies on untrusted ports against the DHCP Snooping binding database. It verifies that the IP-to-MAC mapping matches a valid dynamic lease or static ARP ACL entry. Invalid ARP packets that attempt ARP poisoning or man-in-the-middle attacks are discarded.",
    domain: "services_security",
    subtopic: "Dynamic ARP Inspection",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "DHCP Snooping binding database", is_correct: true },
      { text: "Switch CAM MAC address table", is_correct: false },
      { text: "OSPF Link-State Database", is_correct: false },
      { text: "Local DNS resolver cache", is_correct: false }
    ]
  },
  {
    stem: "Which command enables Dynamic ARP Inspection on VLANs 10 and 20?",
    explanation: "The global configuration command `ip arp inspection vlan 10,20` activates DAI on those specific VLANs. Untrusted ports on those VLANs will intercept all ARP frames and validate their IP and MAC addresses against the binding table. Uplinks connected to other switches must be configured as trusted using `ip arp inspection trust`.",
    domain: "services_security",
    subtopic: "Dynamic ARP Inspection",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "ip arp inspection vlan 10,20", is_correct: true },
      { text: "arp validate vlan 10 20", is_correct: false },
      { text: "service dai enable vlan 10,20", is_correct: false },
      { text: "ip dynamic-arp vlan 10,20 enable", is_correct: false }
    ]
  },
  {
    stem: "What security feature dynamically filters IP traffic on untrusted Layer 2 ports based on the DHCP Snooping database to prevent IP address spoofing?",
    explanation: "IP Source Guard (IPSG) inspects traffic entering an untrusted port and drops packets whose source IP address does not match an entry in the DHCP snooping binding table. When configured with MAC verification, it also checks the source MAC address against the port's CAM table. This prevents malicious hosts from impersonating other valid endpoints.",
    domain: "services_security",
    subtopic: "Layer 2 Security",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "IP Source Guard (IPSG)", is_correct: true },
      { text: "Port Security", is_correct: false },
      { text: "BPDU Guard", is_correct: false },
      { text: "Storm Control", is_correct: false }
    ]
  },
  {
    stem: "Which key exchange mechanism is introduced in WPA3 Personal to prevent offline dictionary attacks against Wi-Fi pre-shared keys?",
    explanation: "WPA3 Personal replaces the vulnerable WPA2 4-way PSK handshake with Simultaneous Authentication of Equals (SAE), based on the Dragonfly handshake. SAE ensures forward secrecy and prevents attackers from capturing a handshake and executing offline dictionary brute-force attacks. It also allows authentication without sharing the raw pre-shared key over the air.",
    domain: "services_security",
    subtopic: "Wireless Security",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Simultaneous Authentication of Equals (SAE)", is_correct: true },
      { text: "Temporal Key Integrity Protocol (TKIP)", is_correct: false },
      { text: "Wired Equivalent Privacy (WEP) RC4 engine", is_correct: false },
      { text: "Pre-Shared Key with Diffie-Hellman Group 1", is_correct: false }
    ]
  },
  {
    stem: "Which wireless security framework requires an external RADIUS authentication server and 802.1X for enterprise user credentials?",
    explanation: "WPA2/WPA3 Enterprise uses the IEEE 802.1X standard and Extensible Authentication Protocol (EAP) to authenticate individual users against a central AAA/RADIUS server (such as Cisco ISE). Each user signs in with unique corporate credentials or digital certificates rather than a shared static pre-shared key. Dynamic encryption keys are then generated per session.",
    domain: "services_security",
    subtopic: "Wireless Security",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "WPA2/WPA3 Enterprise (802.1X)", is_correct: true },
      { text: "WPA2 Personal (PSK)", is_correct: false },
      { text: "Open System with MAC Filtering", is_correct: false },
      { text: "Wi-Fi Protected Setup (WPS)", is_correct: false }
    ]
  },
  {
    stem: "Which command activates the local AAA subsystem on a Cisco device to enable RADIUS or local authentication policies?",
    explanation: "The global command `aaa new-model` initializes the AAA subsystem in Cisco IOS. Until `aaa new-model` is entered, advanced AAA authentication, authorization, and accounting commands cannot be configured. It is the essential foundation for enterprise identity access control.",
    domain: "services_security",
    subtopic: "AAA Security",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "aaa new-model", is_correct: true },
      { text: "enable aaa services", is_correct: false },
      { text: "aaa authentication default enable", is_correct: false },
      { text: "service aaa-system start", is_correct: false }
    ]
  },
  {
    stem: "What is the function of the Cisco IOS `service password-encryption` command?",
    explanation: "The command `service password-encryption` reversibly obfuscates all plaintext passwords in the running configuration using Cisco Type 7 encryption. While Type 7 is weak and can be easily decrypted with public algorithms, it protects passwords from casual shoulder surfing. Sensitive passwords should always be secured using modern salted hashes like Type 8 or Type 9 (`secret`).",
    domain: "services_security",
    subtopic: "Device Hardening",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Obfuscates cleartext passwords in configuration files using Type 7 encryption", is_correct: true },
      { text: "Upgrades all passwords to SHA-256 salted Type 8 hashes", is_correct: false },
      { text: "Enforces a mandatory 16-character minimum password complexity rule", is_correct: false },
      { text: "Disables password recovery upon reboot", is_correct: false }
    ]
  },
  {
    stem: "Which command configures an enable password using a secure PBKDF2 with SHA-256 hash (Type 8) on Cisco IOS-XE?",
    explanation: "The command `enable algorithm-type sha256 secret [password]` uses PBKDF2 with SHA-256 (Type 8) to store the enable secret. Older Cisco IOS versions used MD5 (Type 5), which is susceptible to rainbow table collision attacks. Type 8 and scrypt (Type 9) offer superior resistance against modern password-cracking hardware.",
    domain: "services_security",
    subtopic: "Device Hardening",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "enable algorithm-type sha256 secret [password]", is_correct: true },
      { text: "enable secret type-7 [password]", is_correct: false },
      { text: "service password sha256 enable", is_correct: false },
      { text: "security password-hash sha256 [password]", is_correct: false }
    ]
  },
  {
    stem: "What feature limits incoming broadcast, multicast, or unknown unicast traffic on a switch port to prevent denial of service and link saturation?",
    explanation: "Storm Control monitors incoming broadcast, multicast, and unknown unicast levels on a physical switch port over 1-second intervals. If traffic exceeds a configured threshold (expressed as bandwidth percentage or packets per second), the switch blocks further excess packets or shuts down the interface. This prevents broadcast storms from crippling the LAN.",
    domain: "services_security",
    subtopic: "Layer 2 Security",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Storm Control", is_correct: true },
      { text: "Quality of Service (QoS)", is_correct: false },
      { text: "Port Security", is_correct: false },
      { text: "Dynamic ARP Inspection", is_correct: false }
    ]
  },
  {
    stem: "What type of attack involves an adversary inserting a rogue switch into an access port to capture traffic from all VLANs?",
    explanation: "A VLAN hopping attack (specifically switch spoofing) occurs when an attacker's device negotiates a dynamic 802.1Q trunk link with an access switch using DTP. Once the trunk forms, the attacker can transmit and receive traffic across all active VLANs. Disabling DTP negotiation and setting unused ports to static access mode mitigates this attack.",
    domain: "services_security",
    subtopic: "Layer 2 Security",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "VLAN Hopping via Switch Spoofing", is_correct: true },
      { text: "CAM Table Overflow", is_correct: false },
      { text: "DHCP Starvation", is_correct: false },
      { text: "ARP Cache Poisoning", is_correct: false }
    ]
  },
  {
    stem: "How can network administrators protect against Double-Tagging VLAN hopping attacks?",
    explanation: "In a double-tagging attack, an attacker prepends two 802.1Q tags to a frame, matching the native VLAN in the outer tag. To neutralize this vulnerability, administrators change the native VLAN to an unused ID and enable native VLAN tagging using `vlan dot1q tag native`. Furthermore, access ports should never belong to the native VLAN.",
    domain: "services_security",
    subtopic: "Layer 2 Security",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "Set the native VLAN to an unused dummy VLAN and enable vlan dot1q tag native", is_correct: true },
      { text: "Configure BPDU Filter on all trunk uplinks", is_correct: false },
      { text: "Enable DHCP Snooping on the native VLAN exclusively", is_correct: false },
      { text: "Set the switch port security maximum MAC addresses to 1", is_correct: false }
    ]
  },
  {
    stem: "What is the purpose of Control Plane Policing (CoPP) on a core router or Layer 3 switch?",
    explanation: "Control Plane Policing (CoPP) protects the router's Route Processor (CPU) from being overwhelmed by high-rate or malicious management and control traffic (such as routing updates, SSH, ICMP, and ARP). By classifying and rate-limiting traffic destined for the control plane, CoPP ensures continuous routing stability and prevents denial of service.",
    domain: "services_security",
    subtopic: "Device Hardening",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "Protects the router's CPU by rate-limiting traffic destined for the control plane", is_correct: true },
      { text: "Encrypts transit user payload frames traversing the data plane", is_correct: false },
      { text: "Filters customer internet traffic based on geographic IP blocks", is_correct: false },
      { text: "Restricts physical console access using biometric authentication", is_correct: false }
    ]
  },
  {
    stem: "Which command applies extended ACL 105 to filter inbound traffic entering interface GigabitEthernet0/0?",
    explanation: "The interface configuration command `ip access-group 105 in` binds access list 105 to incoming packets on GigabitEthernet0/0. Packets are evaluated against the ACL before routing table lookups occur. Traffic matching a permit statement is forwarded, while unmatched packets are dropped by the implicit deny.",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "ip access-group 105 in", is_correct: true },
      { text: "access-class 105 in", is_correct: false },
      { text: "ip access-list 105 apply inbound", is_correct: false },
      { text: "filter ip 105 interface GigabitEthernet0/0", is_correct: false }
    ]
  },
  {
    stem: "Which command applies standard ACL 10 to restrict incoming management sessions on virtual terminal (VTY) lines?",
    explanation: "The line configuration command `access-class 10 in` binds an ACL to incoming VTY line connections. Unlike physical interfaces that use `ip access-group`, terminal lines utilize `access-class`. This ensures that only authorized administrator source IP addresses can establish SSH or Telnet sessions.",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "access-class 10 in", is_correct: true },
      { text: "ip access-group 10 in", is_correct: false },
      { text: "transport access-list 10", is_correct: false },
      { text: "vty filter 10 inbound", is_correct: false }
    ]
  },
  {
    stem: "What parameter does the `established` keyword evaluate in an extended IPv4 ACL TCP statement?",
    explanation: "The `established` keyword permits incoming TCP packets only if the ACK or RST control flag is set in the TCP header. This signifies that the packet belongs to an established return session initiated from the inside network. Packets with only the SYN flag set (initial connection requests from the outside) are blocked.",
    domain: "services_security",
    subtopic: "Access Control Lists",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Permits TCP packets that have the ACK or RST flags set", is_correct: true },
      { text: "Verifies the packet checksum against an active state table", is_correct: false },
      { text: "Matches packets whose sequence numbers fall within the negotiated MSS", is_correct: false },
      { text: "Restricts traffic to established UDP streaming sessions", is_correct: false }
    ]
  },
  {
    stem: "Which port number is utilized by Domain Name System (DNS) queries and responses?",
    explanation: "DNS primarily uses UDP port 53 for standard name resolution queries and responses between clients and DNS resolvers. It can also use TCP port 53 for zone transfers between servers or when responses exceed 512 bytes.",
    domain: "services_security",
    subtopic: "Network Services",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Port 53", is_correct: true },
      { text: "Port 69", is_correct: false },
      { text: "Port 123", is_correct: false },
      { text: "Port 88", is_correct: false }
    ]
  },
  {
    stem: "Which protocol is utilized for unencrypted, trivial file transfers over UDP port 69 without authentication?",
    explanation: "Trivial File Transfer Protocol (TFTP) uses UDP port 69 to transfer configuration files and software images between network devices and servers. It does not provide directory browsing, user authentication, or data encryption. For secure file operations, SCP or SFTP should be used.",
    domain: "services_security",
    subtopic: "Network Services",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "TFTP", is_correct: true },
      { text: "FTP", is_correct: false },
      { text: "SFTP", is_correct: false },
      { text: "SNMP", is_correct: false }
    ]
  }
];

fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'data/services_security.json'), JSON.stringify(questions, null, 2));
console.log(`Generated ${questions.length} services_security questions.`);
