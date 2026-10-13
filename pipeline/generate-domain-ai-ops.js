const fs = require('fs');
const path = require('path');

const questions = [
  {
    stem: "What is the primary role of Machine Learning (ML) algorithms in modern Cisco AIOps platforms?",
    explanation: "Machine Learning models establish dynamic operational baselines by continuously analyzing telemetry across the network. They detect statistical anomalies and predict potential network outages before users report degradation. This transforms network operations from reactive ticket handling to proactive remediation.",
    domain: "ai_ops",
    subtopic: "AIOps Fundamentals",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Establish dynamic baselines and detect anomalies to predict network degradations", is_correct: true },
      { text: "Replace physical router microcode with neural network firmware", is_correct: false },
      { text: "Eliminate the need for Layer 3 IP routing protocols", is_correct: false },
      { text: "Encrypt wireless radio frequencies using quantum keys", is_correct: false }
    ]
  },
  {
    stem: "In prompt engineering for network automation with Generative AI, what is the importance of providing explicit constraints and output format?",
    explanation: "Explicit constraints and format specifications (e.g. requesting strict JSON or IOS-XE CLI syntax) eliminate hallucinated explanations and ensure syntactic precision. This enables automated pipelines to parse and validate AI-generated configurations without human pre-processing. Without strict format constraints, LLM outputs may introduce invalid commands into production workflows.",
    domain: "ai_ops",
    subtopic: "Generative AI",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Guarantees deterministic, syntactically valid outputs that automation scripts can parse directly", is_correct: true },
      { text: "Reduces the computational memory requirements of the network switch CPU", is_correct: false },
      { text: "Bypasses authentication mechanisms on TACACS+ servers", is_correct: false },
      { text: "Allows LLMs to directly execute unauthenticated BGP updates", is_correct: false }
    ]
  },
  {
    stem: "Which HTTP status code signifies that a REST API request was successful and resulted in the creation of a new network resource?",
    explanation: "The HTTP status code 201 Created indicates that the request succeeded and a new resource was successfully created on the server. Code 200 OK indicates general success without creating a resource, while 204 No Content indicates success with no response body. Codes in the 400 range indicate client-side errors.",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "201 Created", is_correct: true },
      { text: "200 OK", is_correct: false },
      { text: "204 No Content", is_correct: false },
      { text: "202 Accepted", is_correct: false }
    ]
  },
  {
    stem: "Which HTTP verb in a RESTful API is typically used to partially update an existing resource without replacing the entire entity?",
    explanation: "The PATCH method applies partial modifications to an existing resource. In contrast, the PUT method replaces the entire resource representation with the payload provided. POST is generally used to create a new resource, and GET retrieves information.",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "PATCH", is_correct: true },
      { text: "PUT", is_correct: false },
      { text: "POST", is_correct: false },
      { text: "UPDATE", is_correct: false }
    ]
  },
  {
    stem: "What HTTP status code is returned when a client's API request fails because it lacks valid authentication credentials?",
    explanation: "HTTP 401 Unauthorized indicates that the request requires user authentication credentials (such as an API token or bearer token) that are missing or invalid. HTTP 403 Forbidden indicates that credentials are valid but the client lacks permission to access the resource. HTTP 404 indicates the requested endpoint was not found.",
    domain: "ai_ops",
    subtopic: "REST APIs",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "401 Unauthorized", is_correct: true },
      { text: "403 Forbidden", is_correct: false },
      { text: "400 Bad Request", is_correct: false },
      { text: "404 Not Found", is_correct: false }
    ]
  },
  {
    stem: "Which data serialization format relies on strict whitespace indentation to represent hierarchical data structures without using curly braces?",
    explanation: "YAML (YAML Ain't Markup Language) uses whitespace indentation rather than braces or tags to represent hierarchies, key-value pairs, and lists. It is widely favored in automation tools like Ansible because of its clean human readability. JSON relies on curly braces and brackets, while XML uses opening and closing tags.",
    domain: "ai_ops",
    subtopic: "Data Encoding Formats",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "YAML", is_correct: true },
      { text: "JSON", is_correct: false },
      { text: "XML", is_correct: false },
      { text: "HTML", is_correct: false }
    ]
  },
  {
    stem: "Which character is used to denote an array or ordered list of items in JSON format?",
    explanation: "In JSON (JavaScript Object Notation), square brackets `[` and `]` encapsulate ordered lists or arrays of values. Curly braces `{` and `}` enclose unordered key-value objects. Colons separate keys from values, and commas separate individual items.",
    domain: "ai_ops",
    subtopic: "Data Encoding Formats",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Square brackets [ ]", is_correct: true },
      { text: "Curly braces { }", is_correct: false },
      { text: "Parentheses ( )", is_correct: false },
      { text: "Angle brackets < >", is_correct: false }
    ]
  },
  {
    stem: "What data modeling language is standardized by the IETF (RFC 6020/7950) to define network device configurations and state data for NETCONF and RESTCONF?",
    explanation: "YANG (Yet Another Next Generation) is the standard data modeling language used to define the schema for network configuration and operational state. NETCONF and RESTCONF use YANG models to structure RPC operations and payloads. YANG itself is not a transport protocol; it models the data that protocols transport.",
    domain: "ai_ops",
    subtopic: "Model-Driven Programmability",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "YANG", is_correct: true },
      { text: "YAML", is_correct: false },
      { text: "JSON-Schema", is_correct: false },
      { text: "OpenConfig-DSL", is_correct: false }
    ]
  },
  {
    stem: "Which transport protocol and default TCP port are utilized by NETCONF to manage network devices securely?",
    explanation: "NETCONF (RFC 6241) uses SSH over TCP port 830 as its mandatory secure transport protocol. Within the SSH session, NETCONF exchanges XML-encoded Remote Procedure Call (RPC) messages like `<get-config>` and `<edit-config>`. This provides encryption, authentication, and guaranteed delivery.",
    domain: "ai_ops",
    subtopic: "Model-Driven Programmability",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "SSH over TCP port 830", is_correct: true },
      { text: "HTTPS over TCP port 443", is_correct: false },
      { text: "TLS over TCP port 6513", is_correct: false },
      { text: "SNMP over UDP port 161", is_correct: false }
    ]
  },
  {
    stem: "What is the primary difference between NETCONF and RESTCONF protocols?",
    explanation: "NETCONF uses SSH (port 830) with XML-formatted RPCs to interact with YANG data models. RESTCONF (RFC 8040) uses HTTPS (port 443) with standard REST verbs (GET, POST, PUT, DELETE) and supports both JSON and XML encoding. RESTCONF provides a lightweight, web-friendly alternative to NETCONF.",
    domain: "ai_ops",
    subtopic: "Model-Driven Programmability",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "NETCONF uses SSH with XML RPCs, while RESTCONF uses HTTPS with REST methods supporting JSON and XML", is_correct: true },
      { text: "NETCONF is stateless and unauthenticated, while RESTCONF requires TLS mutual certificates", is_correct: false },
      { text: "NETCONF operates over UDP, while RESTCONF requires SCTP transport", is_correct: false },
      { text: "NETCONF only reads device status, while RESTCONF can only push configuration changes", is_correct: false }
    ]
  },
  {
    stem: "Which configuration management tool is agentless, uses SSH for communication, and executes tasks defined in YAML playbooks?",
    explanation: "Ansible is an agentless configuration management engine that communicates with managed network devices using standard SSH or REST APIs. It does not require any software agent to be installed on target switches or routers. Automation workflows are organized in declarative YAML files called playbooks.",
    domain: "ai_ops",
    subtopic: "Configuration Management",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "Ansible", is_correct: true },
      { text: "Puppet", is_correct: false },
      { text: "Chef", is_correct: false },
      { text: "SaltStack", is_correct: false }
    ]
  },
  {
    stem: "Which configuration management tool uses an agent-based architecture with Ruby-like declarative 'manifests' compiled by a Master server?",
    explanation: "Puppet operates primarily with an agent-based architecture where nodes run a Puppet agent that regularly polls a Puppet Master. Manifests are written in Puppet's declarative language and compiled into catalogs before execution on managed devices. Chef also uses an agent, but terms its configuration units 'recipes' and 'cookbooks'.",
    domain: "ai_ops",
    subtopic: "Configuration Management",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Puppet", is_correct: true },
      { text: "Ansible", is_correct: false },
      { text: "Terraform", is_correct: false },
      { text: "Vagrant", is_correct: false }
    ]
  },
  {
    stem: "What is the primary advantage of Model-Driven Streaming Telemetry over traditional SNMP polling?",
    explanation: "Streaming telemetry operates on a push model, where devices continuously stream real-time data to collectors as changes occur or at sub-second intervals. In contrast, SNMP relies on periodic, high-overhead pull queries that consume CPU and introduce monitoring latency. Streaming telemetry provides high granularity and immediate visibility into network conditions.",
    domain: "ai_ops",
    subtopic: "Telemetry and Monitoring",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Uses a push model to stream high-frequency real-time data with lower CPU overhead than SNMP polling", is_correct: true },
      { text: "Encrypts transit data using proprietary Cisco symmetric keys exclusively", is_correct: false },
      { text: "Requires no IP connectivity between the device and the management station", is_correct: false },
      { text: "Replaces hardware forwarding ASICs with software telemetry pipelines", is_correct: false }
    ]
  },
  {
    stem: "In streaming telemetry, what is the difference between a 'dial-in' and a 'dial-out' subscription mode?",
    explanation: "In dial-in telemetry, the management station (collector) initiates the connection to the network device and requests data over gRPC. In dial-out telemetry, the network device actively initiates the outbound connection to the collector and begins pushing data. Dial-out mode is beneficial in environments where inbound connections through firewalls are restricted.",
    domain: "ai_ops",
    subtopic: "Telemetry and Monitoring",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "In dial-in, the collector connects to the device; in dial-out, the device connects outbound to the collector", is_correct: true },
      { text: "In dial-in, telemetry is sent over analog modems; in dial-out, it is sent over Ethernet", is_correct: false },
      { text: "Dial-in uses UDP packets, while dial-out requires unencrypted TCP", is_correct: false },
      { text: "Dial-in only streams interface statistics, while dial-out only streams Syslog entries", is_correct: false }
    ]
  },
  {
    stem: "In Cisco Catalyst Center (DNA Center), what feature utilizes artificial intelligence to correlate client connectivity events and identify root causes?",
    explanation: "AI Network Analytics in Cisco Catalyst Center applies machine learning and cloud-scale analytics to telemetry collected across wireless and wired networks. It analyzes client onboarding stages (association, authentication, DHCP, DNS) and automatically surfaces root causes for failures. This minimizes manual troubleshooting time for network operations teams.",
    domain: "ai_ops",
    subtopic: "AIOps Fundamentals",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "AI Network Analytics / DNA Assurance", is_correct: true },
      { text: "Catalyst Center CLI Wizard", is_correct: false },
      { text: "Adaptive Security Device Manager", is_correct: false },
      { text: "Simple Network Management Console", is_correct: false }
    ]
  },
  {
    stem: "What capability does an AI-powered Network Digital Twin provide to enterprise operations teams?",
    explanation: "A Network Digital Twin creates a high-fidelity software model of the physical network topology, state, and policies. It enables teams to simulate configuration changes, validate routing updates, and predict disruptions in a safe virtual environment before pushing changes to production. This significantly reduces outages caused by human configuration errors.",
    domain: "ai_ops",
    subtopic: "AIOps Fundamentals",
    difficulty: "hard",
    source: "blueprint-bank",
    choices: [
      { text: "Simulates and validates configuration changes in software before deploying to production", is_correct: true },
      { text: "Clones physical switch ASICs to double hardware switching capacity", is_correct: false },
      { text: "Provides automated wireless power amplification during peak hours", is_correct: false },
      { text: "Generates synthetic MAC addresses to bypass switch CAM table limitations", is_correct: false }
    ]
  },
  {
    stem: "Which component of an AI prompt establishes the domain context, perspective, and behavioral tone expected from the LLM?",
    explanation: "The Persona or Role definition instructs the model on who it is acting as (for example, 'You are a senior Cisco CCIE network engineer'). Setting an explicit persona focuses the model's vocabulary and analytical reasoning toward network engineering best practices. Context and task instructions further narrow the response to specific operational requirements.",
    domain: "ai_ops",
    subtopic: "Generative AI",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "The Persona (Role)", is_correct: true },
      { text: "The Delimiter token", is_correct: false },
      { text: "The Temperature parameter", is_correct: false },
      { text: "The Top-P probability threshold", is_correct: false }
    ]
  },
  {
    stem: "What is an inherent risk of applying AI-generated router configurations directly to production network infrastructure without automated validation?",
    explanation: "Generative AI models can produce hallucinations—plausible-sounding CLI commands that are syntactically incorrect, obsolete, or incompatible with the target platform. Deploying unvalidated outputs can cause syntax parsing errors, unintended routing loops, or catastrophic network downtime. Automated CI/CD linting and sandbox testing are essential safeguards in NetDevOps pipelines.",
    domain: "ai_ops",
    subtopic: "Generative AI",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "AI hallucinations can introduce invalid syntax or conflicting routes that disrupt network operations", is_correct: true },
      { text: "The router CPU will automatically downgrade from 64-bit to 32-bit execution mode", is_correct: false },
      { text: "All interface IP addresses are converted into IPv6 link-local addresses irreversibly", is_correct: false },
      { text: "The switch bootloader is overwritten with an unauthenticated microcode image", is_correct: false }
    ]
  },
  {
    stem: "What open-source format uses key-value pairs formatted as `\"key\": \"value\"` and is universally supported across modern network REST APIs?",
    explanation: "JSON (JavaScript Object Notation) is a lightweight, language-independent data-interchange format. It is universally supported by network controllers like Cisco Catalyst Center, Meraki, and modern IOS-XE RESTCONF APIs. Because of its compact syntax and easy programmatic parsing, it has largely replaced XML in web-based automation.",
    domain: "ai_ops",
    subtopic: "Data Encoding Formats",
    difficulty: "easy",
    source: "blueprint-bank",
    choices: [
      { text: "JSON", is_correct: true },
      { text: "CSV", is_correct: false },
      { text: "YANG", is_correct: false },
      { text: "BSON", is_correct: false }
    ]
  },
  {
    stem: "In NetDevOps, what is the role of Continuous Integration / Continuous Deployment (CI/CD) pipelines?",
    explanation: "CI/CD pipelines automate the testing, validation, and deployment of network configuration changes stored in version control systems like Git. When changes are proposed, automated runners validate syntax against lab virtual environments (such as Cisco CML) before deploying to production. This process minimizes human errors and accelerates reliable change delivery.",
    domain: "ai_ops",
    subtopic: "Network Automation Architecture",
    difficulty: "medium",
    source: "blueprint-bank",
    choices: [
      { text: "Automates testing, validation, and deployment of network configurations from version control", is_correct: true },
      { text: "Replaces traditional Ethernet switching with software-defined radio frequencies", is_correct: false },
      { text: "Maintains an active-passive hardware failover link between distant data centers", is_correct: false },
      { text: "Automatically buys cloud transit bandwidth during bandwidth spikes", is_correct: false }
    ]
  }
];

fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'data/ai_ops.json'), JSON.stringify(questions, null, 2));
console.log(`Generated ${questions.length} ai_ops questions.`);
