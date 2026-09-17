import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-secondary",
        ghost: "hover:bg-secondary"
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  if (asChild) {
    // Render children directly when asChild is true
    const child = (props as any).children;
    if (child && typeof child === "object" && "type" in child) {
      const { children: childChildren, ...childProps } = child.props;
      const Tag = child.type as any;
      return (
        <Tag
          className={cn(buttonVariants({ variant, size }), className)}
          {...childProps}
        >
          {childChildren}
        </Tag>
      );
    }
  }
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
