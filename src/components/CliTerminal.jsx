import { useEffect, useRef, useState } from "react";
import { executeCommand, getPrompt } from "../utils/iosEngine";

const quickCommands = ["show ip interface brief", "show ip route", "show running-config"];

export default function CliTerminal({ devices, onDevicesChange }) {
  const deviceNames = Object.keys(devices || {});
  const [activeDevice, setActiveDevice] = useState(deviceNames[0] || "");
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!deviceNames.includes(activeDevice) && deviceNames.length) setActiveDevice(deviceNames[0]);
  }, [deviceNames.join("|"), activeDevice]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [entries, activeDevice]);

  const device = devices?.[activeDevice];
  const prompt = device ? getPrompt(device) : "Router>";

  function run(line) {
    const value = line.trim();
    if (!value) return;
    if (value.toLowerCase() === "clear") {
      setEntries([]);
      setInput("");
      return;
    }
    if (value === "\u0003") {
      setEntries((old) => [...old, { prompt, command: "^C", output: "" }]);
      setInput("");
      return;
    }
    const result = executeCommand(devices, activeDevice, value);
    onDevicesChange?.(devices);
    setEntries((old) => [...old, { prompt, command: value, output: result.output }]);
    setHistory((old) => [...old, value]);
    setHistoryIndex(-1);
    setInput("");
  }

  function insertCommand(value) {
    setInput(value);
    inputRef.current?.focus();
  }

  function tabComplete() {
    const choices = device?.mode === "user"
      ? ["enable"]
      : device?.mode === "privileged"
        ? ["configure terminal", ...quickCommands, "show ip ospf neighbor", "show vlan brief", "show interfaces trunk"]
        : device?.mode === "config"
          ? ["interface ", "router ospf ", "ipv6 router ospf ", "vlan ", "ip dhcp pool ", "access-list ", "ip access-list standard ", "ip access-list extended ", "ip route ", "ipv6 route ", "aaa new-model", "username ", "tacacs server ", "radius server ", "line vty 0 4", "lldp run", "ip nat inside source "]
          : device?.mode === "interface"
            ? ["ip address ", "ipv6 address ", "no shutdown", "shutdown", "switchport mode access", "switchport mode trunk", "switchport access vlan ", "switchport trunk native vlan ", "switchport trunk allowed vlan add ", "ip helper-address ", "ip ospf ", "channel-group ", "ip access-group ", "ip nat inside", "ip nat outside", "switchport port-security maximum "]
            : device?.mode === "dhcp"
              ? ["network ", "default-router ", "dns-server "]
              : device?.mode === "vlan"
                ? ["name "]
                : device?.mode === "server-tacacs" || device?.mode === "server-radius"
                  ? ["address ipv4 ", "key "]
                  : device?.mode === "line"
                    ? ["transport input ssh", "login local", "access-class "]
                    : device?.mode === "acl-standard" || device?.mode === "acl-extended"
                      ? ["permit ", "deny "]
                      : ["network ", "area "];
    const matches = choices.filter((item) => item.toLowerCase().startsWith(input.toLowerCase()));
    if (matches.length === 1) setInput(matches[0]);
    else if (matches.length > 1) setEntries((old) => [...old, { prompt, command: input, output: matches.join("   ") }]);
    inputRef.current?.focus();
  }

  function keyDown(event) {
    if (event.key === "Enter") { event.preventDefault(); run(input); }
    if (event.key === "Tab") { event.preventDefault(); tabComplete(); }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!history.length) return;
      const next = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next); setInput(history[next] || "");
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(history.length, historyIndex + 1);
      setHistoryIndex(next); setInput(history[next] || "");
    }
    if (event.key === "c" && event.ctrlKey) { event.preventDefault(); run("\u0003"); }
  }

  const controls = [
    ["Tab", tabComplete],
    ["↑", () => { if (history.length) { const next = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1); setHistoryIndex(next); setInput(history[next] || ""); inputRef.current?.focus(); } }],
    ["↓", () => { const next = Math.min(history.length, historyIndex + 1); setHistoryIndex(next); setInput(history[next] || ""); inputRef.current?.focus(); }],
    ["?", () => run("?")],
    ["Ctrl+C", () => run("\u0003")],
    ["show", () => insertCommand("show ")],
    ["exit", () => run("exit")],
  ];

  return (
    <section className="flex h-[50vh] min-h-[320px] max-h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-2xl border border-[#252a32] bg-[#101318] shadow-lg sm:h-[56vh] sm:max-h-none">
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-[#2b3038] bg-[#191d24] p-2.5">
        {deviceNames.map((name) => (
          <button key={name} onClick={() => { setActiveDevice(name); inputRef.current?.focus(); }} className={`min-w-14 rounded-lg px-4 py-2 font-mono text-sm font-semibold ${activeDevice === name ? "bg-[#4d6bfe] text-white" : "bg-[#282e37] text-[#c4cad4] hover:bg-[#353c48]"}`}>{name}</button>
        ))}
        <span className="ml-auto hidden pr-2 font-mono text-xs text-[#858d99] sm:inline">IOS command line</span>
      </div>

      <div ref={outputRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 font-mono text-[12px] leading-5 text-[#d6deeb] sm:p-4 sm:text-sm">
        <div className="mb-3 text-[#8f9baa]">Local IOS simulation • Type <span className="text-[#9db1ff]">?</span> for help</div>
        {entries.map((entry, index) => (
          <div key={`${index}-${entry.command}`} className="whitespace-pre-wrap break-words">
            <div><span className="text-[#8fbf9f]">{entry.prompt}</span> <span className="text-white">{entry.command}</span></div>
            {entry.output && <div className="mb-1 text-[#c3cbd7]">{entry.output}</div>}
          </div>
        ))}
        <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
          <span className="shrink-0 text-[#8fbf9f]">{prompt}</span>
          <input ref={inputRef} aria-label="IOS command" autoComplete="off" autoCapitalize="off" spellCheck="false" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={keyDown} className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[12px] text-white outline-none ring-0 focus:ring-0 sm:text-sm" />
          <span className="animate-pulse text-[#8fbf9f]">▋</span>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-[#2b3038] bg-[#191d24] px-2 py-2 pb-[calc(0.5rem+var(--safe-bottom,0px))]">
        <div className="flex touch-pan-x gap-1.5 overflow-x-auto">
          {controls.map(([label, action]) => <button key={label} onClick={action} className="min-h-10 shrink-0 rounded-lg border border-[#343b46] bg-[#242a33] px-3 font-mono text-xs text-[#edf0f5] active:bg-[#4d6bfe]">{label}</button>)}
        </div>
      </div>
    </section>
  );
}
