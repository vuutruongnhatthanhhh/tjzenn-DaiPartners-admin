import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Session } from "next-auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
