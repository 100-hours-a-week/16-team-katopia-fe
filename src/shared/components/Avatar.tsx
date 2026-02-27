"use client";

import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import type { CSSProperties } from "react";

type AvatarProps = {
  src?: string | null;
  alt: string;
  size?: number;
  fallbackSrc?: string;
  fallbackSize?: number;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  style?: CSSProperties;
  priority?: boolean;
};

export default function Avatar({
  src,
  alt,
  size = 40,
  fallbackSrc = "/icons/user.svg",
  fallbackSize,
  className = "",
  imageClassName = "",
  fallbackClassName = "",
  style,
  priority = false,
}: AvatarProps) {
  void priority;
  const resolvedSrc = resolveMediaUrl(src);
  const resolvedFallbackSize =
    fallbackSize ?? Math.max(16, Math.round(size * 0.5));

  return (
    <span
      className={`relative overflow-hidden rounded-full bg-muted flex items-center justify-center ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {resolvedSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
          src={resolvedSrc}
          alt={alt}
            className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
            loading="lazy"
          />
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
          src={fallbackSrc}
          alt={alt}
          width={resolvedFallbackSize}
          height={resolvedFallbackSize}
          className={`${fallbackClassName} ${imageClassName}`}
            loading="lazy"
          />
        </>
      )}
    </span>
  );
}
