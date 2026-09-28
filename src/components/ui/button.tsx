import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        brand: "!h-auto !bg-transparent !shadow-none !rounded-none",
        nav: "!h-auto !p-0 !bg-transparent !shadow-none text-[10px] uppercase tracking-[.12em] text-[var(--hero-ink)] hover:text-[var(--gold)]",
        headerBook: "!h-11 !rounded-none border border-[var(--cream-stroke)] !bg-[var(--background)] !text-foreground !shadow-none px-5 text-[10px] uppercase tracking-[.13em] hover:!bg-secondary",
        mobileMenu: "!bg-transparent !text-[var(--hero-ink)] !shadow-none !rounded-none",
        mobileNav: "!h-14 !rounded-none !bg-transparent !shadow-none !text-foreground !justify-start border-b border-border !px-0 font-display !text-3xl hover:!text-primary [&_span]:font-body [&_span]:text-[10px] [&_span]:mr-4 [&_svg]:ml-auto",
        hero: "!h-12 !rounded-none !bg-background !text-foreground !shadow-none px-6 uppercase tracking-[.12em] text-[10px] font-bold hover:!bg-secondary",
        heroOutline: "!h-12 !rounded-none !bg-transparent !text-[var(--hero-ink)] !shadow-none border border-[var(--cream-stroke)] px-6 uppercase tracking-[.12em] text-[10px] font-bold hover:!bg-[var(--scene-shade)]",
        scrollHint: "!h-auto !p-0 !bg-transparent !text-[var(--hero-ink)] !shadow-none text-[10px] tracking-[.2em] hover:!text-[var(--gold)]",
        panelIcon: "!h-9 !w-9 !rounded-none !bg-transparent !text-foreground !shadow-none border border-border hover:!bg-secondary",
        luxury: "!h-12 !rounded-none !bg-primary !text-primary-foreground !shadow-none px-6 uppercase tracking-[.12em] text-[10px] font-bold hover:!bg-foreground",
        imageThumb: "!h-15 !w-20 !min-w-20 !p-0 !rounded-none !bg-transparent !shadow-none !opacity-60 border-2 border-transparent hover:!opacity-100",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
