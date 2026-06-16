import { cn } from "./ui";

// Real profile photo for Amara (AI-generated face, no real subject).
export function AmaraAvatar({ size = 44, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/amara.jpg"
      alt="Amara Okafor"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("rounded-full object-cover", className)}
    />
  );
}
