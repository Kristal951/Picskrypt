"use client";

import React from "react";

interface SpinnerProps {
  size?: number;
  stroke?: number;
  background?: string;
  foreground?: string;
  className?: string;
}

export default function Spinner({
  size = 40,
  stroke = 3,
  background = "rgba(var(--foreground) / 0.1)",
  foreground = "rgb(var(--primary))",
  className = "",
}: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        style={{
          width: size,
          height: size,
          borderWidth: stroke,
          borderStyle: "solid",
          borderColor: background,
          borderTopColor: foreground,
        }}
        className="animate-spin rounded-full will-change-transform"
      />
    </div>
  );
}