export default function CameraGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="24" y="16" width="16" height="7" rx="2" fill="currentColor" />
      <rect x="10" y="21" width="44" height="30" rx="6" fill="currentColor" />
      <circle cx="32" cy="37" r="11" fill="#FF4620" />
      <circle cx="32" cy="37" r="11" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="37" r="3.5" fill="currentColor" />
      <rect x="42" y="26" width="6" height="2.4" rx="1.2" fill="#FF4620" />
    </svg>
  );
}
