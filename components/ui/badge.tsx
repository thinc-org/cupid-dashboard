import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        soft: "border-pink-200 bg-pink-50 text-[#db2777] font-semibold",
        emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold",
        outline: "border-slate-200 bg-slate-100 text-slate-700 font-semibold",
        muted: "border-transparent bg-slate-100 text-slate-500",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
