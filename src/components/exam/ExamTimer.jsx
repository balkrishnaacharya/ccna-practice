import { useEffect, useState } from "react";

export default function ExamTimer({
  timeRemainingSeconds = 0,
  totalSeconds = 7200,
  onTimeExpire,
}) {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    const m = Math.floor(timeRemainingSeconds / 60);
    const s = timeRemainingSeconds % 60;
    setMinutes(m);
    setSeconds(s);
    setIsCritical(m < 10);
  }, [timeRemainingSeconds]);

  useEffect(() => {
    if (timeRemainingSeconds <= 0 && onTimeExpire) {
      onTimeExpire();
    }
  }, [timeRemainingSeconds, onTimeExpire]);

  const format = (n) => n.toString().padStart(2, "0");
  const progress = totalSeconds > 0 ? (timeRemainingSeconds / totalSeconds) * 100 : 100;
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="30"
          cy="30"
          r="24"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="30"
          cy="30"
          r="24"
          stroke={isCritical ? "#ef4444" : "#F6F2E9"}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-sm text-foreground">
          {format(minutes)}:{format(seconds)}
        </span>
      </div>
    </div>
  );
}
