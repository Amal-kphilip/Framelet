import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type TypographyVariant =
  | "display"
  | "hero"
  | "h1"
  | "h2"
  | "bodyLg"
  | "body"
  | "bodySm"
  | "label"
  | "footer"
  | "sidenav"
  | "legal";

type TypographyProps = {
  as?: React.ElementType;
  variant?: TypographyVariant;
  className?: string;
  children: React.ReactNode;
  weight?: number;
  muted?: boolean;
  id?: string;
  title?: string;
};

const variantClasses: Record<TypographyVariant, string> = {
  display: "type-fluid type-display",
  hero: "type-fluid type-hero",
  h1: "type-fluid type-h1",
  h2: "type-fluid type-h2",
  bodyLg: "type-fluid type-body-lg",
  body: "type-fluid type-body",
  bodySm: "type-fluid type-body-sm",
  label: "type-fluid type-label",
  footer: "type-fluid type-footer",
  sidenav: "type-fluid type-sidenav",
  legal: "type-fluid type-legal",
};

export const Typography = ({
  as: Comp = "p",
  variant = "body",
  className,
  children,
  weight,
  muted = false,
  id,
  title,
}: TypographyProps) => {
  return (
    <Comp
      id={id}
      title={title}
      className={cn(variantClasses[variant], muted && "text-muted-foreground", className)}
      style={weight ? ({ ["--weight" as string]: weight } as React.CSSProperties) : undefined}
    >
      {children}
    </Comp>
  );
};

export default Typography;
