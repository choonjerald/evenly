"use client";
import { cn } from "@/lib/utils"; // or replace with your own classNames util
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name?: string, email?: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return (a + b || a).toUpperCase();
  }
  if (email) return email[0]?.toUpperCase() ?? "U";
  return "U";
}


type Size = "xs" | "sm" | "md" | "lg";
const sizeClass: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function UserAvatar({
  user,
  size = "sm",
  className,
}: {
  user?: { name?: string; avatarUrl?: string };
  size?: Size;
  className?: string;
}) {
  const name = user?.name ?? "User";
  return (
    <Avatar className={cn(sizeClass[size], className)}>
      <AvatarImage src={user?.avatarUrl} alt={name} />
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
