import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function LogoIcon({
  size = 22,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

export function OverviewIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function ScenarioBuilderIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

export function SimulationLabIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <path d="M10 2v7.31L4.1 19.34A1 1 0 0 0 5 21h14a1 1 0 0 0 .9-1.66L14 9.31V2" />
      <line x1="8.5" y1="2" x2="15.5" y2="2" />
      <path d="M14 9.3a6.5 6.5 0 0 0-4 0" />
      <circle cx="10" cy="15" r="1" />
      <circle cx="13" cy="17" r="1" />
    </svg>
  );
}

export function DeadlockAnalyzerIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function ThreadMonitorIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function ReportsIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function SettingsIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function SearchIcon({
  size = 16,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function BellIcon({
  size = 18,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function ArrowRightIcon({
  size = 16,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function ChevronRightIcon({
  size = 14,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function MenuIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function CloseIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function LayersIcon({
  size = 26,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function ClockIcon({
  size = 26,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function TerminalIcon({
  size = 22,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function ShieldAlertIcon({
  size = 26,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function LockIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function SyncIcon({
  size = 20,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function PlayCircleIcon({
  size = 18,
  width,
  height,
  className = "",
  style,
  ...props
}: IconProps) {
  const finalW = width ?? size;
  const finalH = height ?? size;
  return (
    <svg
      width={finalW}
      height={finalH}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={{ width: finalW, height: finalH, ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}
