const fs = require("fs");
const path = require("path");

const questions = [
  {
    stem: "In network operations utilizing Generative AI and LLMs, what is the role of 'few-shot prompting'?",
    explanation: "Few-shot prompting provides the Large Language Model with a few input-output examples before the actual question. This guides the model to produce consistent formatting and syntax (e.g. generating Cisco IOS configuration snippets).",
    domain: "ai_ops",
    subtopic: "Generative AI",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Fine-tuning the neural network model weights using labeled datasets", is_correct: false },
      { text: "Providing explicit demonstration examples in the prompt to guide output format and behavior", is_correct: true },
      { text: "Limiting the AI model to only accept single-word user queries", is_correct: false },
      { text: "Retrying an API call multiple times after receiving HTTP 500 errors", is_correct: false }
    ]
  },
  {
    stem: "What is a primary operational risk when using Generative AI Large Language Models (LLMs) to generate network device configurations?",
    explanation: "LLM hallucination can produce syntactically plausible but technically invalid or nonexistent CLI commands, wrong IP addresses, or dangerous security gaps. Automated testing and engineer review are essential before deployment.",
    domain: "ai_ops",
    subtopic: "Generative AI",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "The AI model automatically disables switchport security on all interfaces", is_correct: false },
      { text: "The model may hallucinate nonexistent commands, incorrect syntax, or invalid subnets", is_correct: true },
      { text: "LLMs require physical console cable connections to run", is_correct: false },
      { text: "LLM prompts can cause physical optical fiber degradation", is_correct: false }
    ]
  },
  {
    stem: "What is the primary function of AIOps (Artificial Intelligence for IT Operations) in an enterprise network?",
    explanation: "AIOps ingests and analyzes vast streams of network telemetry using machine learning to detect anomalies, correlate related events, reduce alert fatigue, and isolate root causes faster than manual analysis.",
    domain: "ai_ops",
    subtopic: "AIOps Fundamentals",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Replacing physical network switches with virtual software bots", is_correct: false },
      { text: "Applying machine learning to telemetry data for automated anomaly detection and root cause analysis", is_correct: true },
      { text: "Encrypting all wireless client frames using quantum key algorithms", is_correct: false },
      { text: "Eliminating the need for IP address subnetting across enterprise LANs", is_correct: false }
    ]
  },
  {
    stem: "How does streaming telemetry differ from traditional SNMP polling in network monitoring?",
    explanation: "Streaming telemetry uses a push model where the device continuously streams structured data (e.g. via gRPC or NETCONF) as state changes occur, whereas SNMP uses a pull model where the management station polls devices periodically, introducing delays and CPU spikes.",
    domain: "ai_ops",
    subtopic: "Telemetry and Monitoring",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "SNMP pushes data continuously while streaming telemetry relies on periodic polling", is_correct: false },
      { text: "Streaming telemetry pushes real-time data continuously, providing higher granularity than periodic SNMP polling", is_correct: true },
      { text: "Streaming telemetry is unencrypted while SNMPv1 is always encrypted", is_correct: false },
      { text: "Streaming telemetry can only monitor physical interface link state up/down", is_correct: false }
    ]
  },
  {
    stem: "Which HTTP request method is used in a REST API to update an existing resource by replacing only the specified fields?",
    explanation: "The PATCH method applies partial modifications to a resource, updating only the fields provided. The PUT method replaces the entire resource with the payload.",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "GET", is_correct: false },
      { text: "POST", is_correct: false },
      { text: "PATCH", is_correct: true },
      { text: "DELETE", is_correct: false }
    ]
  },
  {
    stem: "Which HTTP status code indicates that a REST API request was successful and a new resource was created on the server?",
    explanation: "HTTP 201 Created indicates that the request succeeded and a new resource was successfully created as a result (commonly returned following a POST request).",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "200 OK", is_correct: false },
      { text: "201 Created", is_correct: true },
      { text: "204 No Content", is_correct: false },
      { text: "301 Moved Permanently", is_correct: false }
    ]
  },
  {
    stem: "What does HTTP status code 401 Unauthorized indicate when interacting with a network controller REST API?",
    explanation: "HTTP 401 indicates that the request lacks valid authentication credentials (such as an expired or missing API token, invalid API key, or incorrect username/password).",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The requested URI resource was not found on the server", is_correct: false },
      { text: "The client request lacks valid authentication credentials", is_correct: true },
      { text: "The server encountered an unrecoverable internal database error", is_correct: false },
      { text: "The client sent invalid JSON syntax in the payload body", is_correct: false }
    ]
  },
  {
    stem: "What does HTTP status code 404 Not Found indicate?",
    explanation: "HTTP 404 indicates that the server could not find the requested URI endpoint or specific resource ID specified in the URL.",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The user credentials failed authentication", is_correct: false },
      { text: "The requested resource or endpoint URI does not exist on the server", is_correct: true },
      { text: "The payload exceeded the maximum allowable JSON size", is_correct: false },
      { text: "The server is temporarily overloaded with API requests", is_correct: false }
    ]
  },
  {
    stem: "In JSON data encoding format, how are arrays and objects represented syntactically?",
    explanation: "In JSON, arrays (ordered lists of values) are enclosed in square brackets `[ ]`, and objects (unordered collections of key-value pairs) are enclosed in curly braces `{ }`.",
    domain: "ai_ops",
    subtopic: "Data Encoding Formats",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Arrays use angle brackets `< >`, objects use parenthesis `( )`", is_correct: false },
      { text: "Arrays use square brackets `[ ]`, objects use curly braces `{ }`", is_correct: true },
      { text: "Arrays use quotation marks `\" \"`, objects use colons `: :`", is_correct: false },
      { text: "Arrays use indentation, objects use semicolons `;`", is_correct: false }
    ]
  },
  {
    stem: "What is a distinguishing syntax requirement of the YAML data serialization language?",
    explanation: "YAML relies strictly on consistent whitespace indentation (spaces, not tabs) to denote data hierarchy and structure. It is designed to be easily human-readable.",
    domain: "ai_ops",
    subtopic: "Data Encoding Formats",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "All values must be enclosed in double quotation marks", is_correct: false },
      { text: "Hierarchy and data nesting are defined strictly using whitespace indentation", is_correct: true },
      { text: "Every line must terminate with a closing semicolon", is_correct: false },
      { text: "Closing tags must mirror opening XML brackets", is_correct: false }
    ]
  },
  {
    stem: "What is YANG in the context of network automation and model-driven programmability?",
    explanation: "YANG (Yet Another Next Generation, RFC 6020) is a standard data modeling language used to define the configuration and state data of network devices, utilized by protocols like NETCONF and RESTCONF.",
    domain: "ai_ops",
    subtopic: "Model-Driven Programmability",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "A Python web application framework for hosting REST APIs", is_correct: false },
      { text: "A standard data modeling language defining network configuration and operational state", is_correct: true },
      { text: "A proprietary Cisco routing protocol replacing OSPF in SD-WAN", is_correct: false },
      { text: "A terminal emulation protocol replacing SSH on modern switches", is_correct: false }
    ]
  },
  {
    stem: "Which transport protocol, port, and data encoding format does NETCONF use according to RFC 6241?",
    explanation: "NETCONF operates over SSH on TCP port 830 using XML data encoding for all RPC requests and responses.",
    domain: "ai_ops",
    subtopic: "Model-Driven Programmability",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "HTTPS on port 443 with JSON encoding", is_correct: false },
      { text: "SSH on port 830 with XML encoding", is_correct: true },
      { text: "UDP on port 161 with ASN.1 MIB encoding", is_correct: false },
      { text: "Telnet on port 23 with plaintext YAML", is_correct: false }
    ]
  },
  {
    stem: "Which transport protocol, port, and encoding formats does RESTCONF use according to RFC 8040?",
    explanation: "RESTCONF operates over HTTPS (TCP port 443) using standard RESTful principles, supporting both JSON and XML encoding formats mapped from underlying YANG models.",
    domain: "ai_ops",
    subtopic: "Model-Driven Programmability",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "SSH port 830 with XML encoding", is_correct: false },
      { text: "HTTPS port 443 with JSON or XML encoding", is_correct: true },
      { text: "gRPC port 50051 with binary protobuf encoding", is_correct: false },
      { text: "SNMP port 162 with UDP datagrams", is_correct: false }
    ]
  },
  {
    stem: "How does Ansible differ from Puppet and Chef regarding its device management architecture?",
    explanation: "Ansible is agentless and manages target network devices over standard SSH (or APIs) using YAML playbooks, requiring no software agent installed on the managed network switches. Puppet and Chef traditionally rely on installed client agents.",
    domain: "ai_ops",
    subtopic: "Configuration Management",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Ansible requires a dedicated client agent installed on each managed switch", is_correct: false },
      { text: "Ansible is agentless and connects to network devices using SSH or APIs", is_correct: true },
      { text: "Ansible only works with Linux servers and cannot automate Cisco switches", is_correct: false },
      { text: "Ansible uses Ruby scripts rather than declarative YAML files", is_correct: false }
    ]
  },
  {
    stem: "What file format is used to write Ansible playbooks for network automation tasks?",
    explanation: "Ansible playbooks are written in YAML (Yet Another Markup Language), which provides a clear, human-readable structure for defining automation tasks and plays.",
    domain: "ai_ops",
    subtopic: "Configuration Management",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "JSON", is_correct: false },
      { text: "YAML", is_correct: true },
      { text: "XML", is_correct: false },
      { text: "Python bytecode", is_correct: false }
    ]
  },
  {
    stem: "In modern network architecture, what is the core purpose of a centralized controller like Cisco Catalyst Center (formerly DNA Center)?",
    explanation: "Cisco Catalyst Center provides a centralized intent-based networking platform that manages the network fabric, translates business intent into configurations, provides end-to-end telemetry and assurance, and exposes REST APIs for external automation.",
    domain: "ai_ops",
    subtopic: "Network Automation Architecture",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "It replaces all physical fiber cables with virtual software routers", is_correct: false },
      { text: "It provides centralized intent-based policy management, telemetry assurance, and REST API access", is_correct: true },
      { text: "It acts as a public authoritative DNS root server", is_correct: false },
      { text: "It assigns public IP addresses to home broadband subscribers", is_correct: false }
    ]
  },
  {
    stem: "What is the difference between a declarative and an imperative network automation model?",
    explanation: "A declarative model defines the desired end state (e.g. 'VLAN 10 should exist with IP 10.1.1.1'), letting the tool determine how to achieve it. An imperative model provides explicit step-by-step instructions (e.g. 'enter config t, enter vlan 10, enter name Data').",
    domain: "ai_ops",
    subtopic: "Configuration Management",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Declarative specifies step-by-step CLI commands; imperative specifies desired end state", is_correct: false },
      { text: "Declarative defines the desired end state; imperative specifies the exact step-by-step actions", is_correct: true },
      { text: "Declarative runs only on routers; imperative runs only on firewalls", is_correct: false },
      { text: "Declarative requires manual password entry on every execution", is_correct: false }
    ]
  },
  {
    stem: "In a software-defined networking (SDN) controller architecture, which plane of operation is centralized on the controller?",
    explanation: "In SDN architectures, the Control Plane (which builds routing and switching topology tables) is centralized on the controller, while the Data Plane (forwarding packets) remains distributed on hardware switches and routers.",
    domain: "ai_ops",
    subtopic: "Network Automation Architecture",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "Data Plane", is_correct: false },
      { text: "Control Plane", is_correct: true },
      { text: "Physical Plane", is_correct: false },
      { text: "Power Management Plane", is_correct: false }
    ]
  },
  {
    stem: "What are Northbound and Southbound APIs in an SDN controller architecture?",
    explanation: "Northbound APIs allow external applications, orchestration systems, and scripts to communicate with the controller (e.g. RESTful APIs). Southbound APIs allow the controller to communicate down to physical network devices (e.g. NETCONF, OpenFlow, SNMP, CLI).",
    domain: "ai_ops",
    subtopic: "Network Automation Architecture",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Northbound connects devices to switches; Southbound connects to Internet routers", is_correct: false },
      { text: "Northbound connects applications to the controller; Southbound connects the controller to network devices", is_correct: true },
      { text: "Northbound manages power distribution; Southbound manages optical wavelengths", is_correct: false },
      { text: "Northbound handles IPv4; Southbound handles IPv6", is_correct: false }
    ]
  },
  {
    stem: "What is an advantage of Model-Driven Telemetry (MDT) using gRPC transport?",
    explanation: "gRPC uses HTTP/2 transport and Google Protocol Buffers (Protobuf) for binary payload serialization. This enables high-speed, compact, multiplexed, and encrypted streaming telemetry with minimal network overhead.",
    domain: "ai_ops",
    subtopic: "Telemetry and Monitoring",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It uses unencrypted UDP broadcast datagrams for legacy compatibility", is_correct: false },
      { text: "It uses HTTP/2 and compact binary Protocol Buffers for efficient, high-throughput streaming", is_correct: true },
      { text: "It eliminates the need for IP addressing across monitoring nodes", is_correct: false },
      { text: "It can only transmit text-based syslog strings", is_correct: false }
    ]
  },
  {
    stem: "When prompt engineering an AI assistant to diagnose network outages, why is it beneficial to specify an explicit output schema (such as JSON)?",
    explanation: "Requiring the AI model to respond with a defined JSON schema ensures structured, machine-parsable output that can be integrated directly into automated troubleshooting workflows or ticketing APIs without manual text parsing.",
    domain: "ai_ops",
    subtopic: "Generative AI",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It bypasses all network security firewalls automatically", is_correct: false },
      { text: "It produces structured, predictable output that can be directly parsed by downstream automation scripts", is_correct: true },
      { text: "It speeds up physical link transmission rates across copper cables", is_correct: false },
      { text: "It prevents the AI model from consuming CPU cycles", is_correct: false }
    ]
  },
  {
    stem: "Which YANG data modeling node type represents a single data variable with a specific value and no children (e.g. an interface name or IP address)?",
    explanation: "In YANG, a `leaf` node holds a single scalar value (such as a string or integer) and contains no child nodes. In contrast, `container` groups related nodes, and `list` contains multiple entries.",
    domain: "ai_ops",
    subtopic: "Model-Driven Programmability",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "container", is_correct: false },
      { text: "leaf", is_correct: true },
      { text: "leaf-list", is_correct: false },
      { text: "module", is_correct: false }
    ]
  },
  {
    stem: "In an AIOps platform, what is the role of baseline analysis in identifying network anomalies?",
    explanation: "Baseline analysis learns normal historical operational patterns (e.g. typical bandwidth utilization, latency, CPU load at 2 PM on a Tuesday) so that deviations from the norm trigger intelligent alerts rather than rigid static thresholds.",
    domain: "ai_ops",
    subtopic: "AIOps Fundamentals",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Resetting all switch interfaces to factory default configurations every night", is_correct: false },
      { text: "Learning normal historical operational patterns to accurately detect anomalous behavioral deviations", is_correct: true },
      { text: "Calculating spanning tree path costs based on cable length", is_correct: false },
      { text: "Converting IPv4 addresses to equivalent EUI-64 format", is_correct: false }
    ]
  },
  {
    stem: "What is an example of an idempotent operation in configuration management tools like Ansible and Terraform?",
    explanation: "An operation is idempotent if applying it multiple times produces the exact same result as applying it once, without making redundant changes or corrupting system state if the desired state already exists.",
    domain: "ai_ops",
    subtopic: "Configuration Management",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "A script that appends duplicate ACL entries to a router config on every execution", is_correct: false },
      { text: "An operation that checks current state and only executes changes if the target state is not already met", is_correct: true },
      { text: "A task that reboots the router regardless of whether changes were applied", is_correct: false },
      { text: "A tool that runs only over unencrypted Telnet connections", is_correct: false }
    ]
  },
  {
    stem: "Which HTTP header is typically included in a REST API request to specify that the client expects the response formatted as JSON?",
    explanation: "The `Accept: application/json` header informs the API server that the client wants the response payload formatted as JSON. The `Content-Type: application/json` header specifies the format of the payload being sent in the request.",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "Content-Length: 0", is_correct: false },
      { text: "Accept: application/json", is_correct: true },
      { text: "Authorization: Bearer none", is_correct: false },
      { text: "Host: localhost", is_correct: false }
    ]
  },
  {
    stem: "What is the primary role of Git in modern Network as Code (NetDevOps) workflows?",
    explanation: "Git provides version control for network configuration files, infrastructure-as-code templates, and automation scripts. It tracks historical revisions, enables peer code reviews via pull requests, and supports automated CI/CD validation pipelines.",
    domain: "ai_ops",
    subtopic: "Configuration Management",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "It compiles Python scripts into router firmware binaries", is_correct: false },
      { text: "It provides version control, revision history, and collaboration for network configuration code", is_correct: true },
      { text: "It manages physical cabling connections in data center patch panels", is_correct: false },
      { text: "It acts as a dynamic routing protocol replacing eBGP", is_correct: false }
    ]
  },
  {
    stem: "What does the HTTP status code 403 Forbidden indicate in a network automation REST API interaction?",
    explanation: "HTTP 403 Forbidden indicates that the client is authenticated, but their account or role lacks the necessary permissions to access or modify the requested resource.",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "easy",
    source: "ai-generated",
    choices: [
      { text: "The client did not provide any username or password", is_correct: false },
      { text: "The client is authenticated but lacks authorization permissions to access the resource", is_correct: true },
      { text: "The requested network switch has experienced a hardware crash", is_correct: false },
      { text: "The REST API server is unreachable due to routing failure", is_correct: false }
    ]
  },
  {
    stem: "In AI-assisted troubleshooting, what does 'Retrieval-Augmented Generation' (RAG) provide to an LLM?",
    explanation: "RAG retrieves relevant private enterprise context (e.g. current network topology, running configs, device logs, and internal documentation) from a database and provides it to the LLM alongside the user prompt, ensuring accurate and grounded answers without retraining the model.",
    domain: "ai_ops",
    subtopic: "Generative AI",
    difficulty: "hard",
    source: "ai-generated",
    choices: [
      { text: "It generates random synthetic MAC addresses for penetration testing", is_correct: false },
      { text: "It injects relevant live enterprise network documentation and configs into the prompt context for grounded answers", is_correct: true },
      { text: "It compresses optical laser pulses to increase fiber bandwidth", is_correct: false },
      { text: "It replaces the router's internal TCAM memory with flash storage", is_correct: false }
    ]
  },
  {
    stem: "What is an event correlation engine in an enterprise AIOps platform designed to accomplish?",
    explanation: "Event correlation analyzes thousands of simultaneous raw alerts generated during a major outage (e.g. multiple downstream devices reporting unreachable when an upstream core switch fails) and groups them into a single actionable incident ticket identifying the root failure.",
    domain: "ai_ops",
    subtopic: "AIOps Fundamentals",
    difficulty: "medium",
    source: "ai-generated",
    choices: [
      { text: "It broadcasts redundant ARP requests across all campus VLANs", is_correct: false },
      { text: "It aggregates and correlates related alerts into a single root cause incident, drastically reducing alert fatigue", is_correct: true },
      { text: "It reconfigures OSPF cost metrics every 5 seconds dynamically", is_correct: false },
      { text: "It decrypts all internal SSH sessions for inspection", is_correct: false }
    ]
  }
];

fs.writeFileSync(
  path.join(__dirname, "../questions-batch-7.json"),
  JSON.stringify(questions, null, 2)
);
console.log(`Generated ${questions.length} questions in questions-batch-7.json`);
