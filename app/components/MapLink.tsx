"use client";

import Link, { type LinkProps } from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useMapLoading } from "./MapLoadingProvider";

type MapLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export default function MapLink({ onClick, ...props }: MapLinkProps) {
  const { startMapLoading } = useMapLoading();

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          startMapLoading();
        }
      }}
    />
  );
}
