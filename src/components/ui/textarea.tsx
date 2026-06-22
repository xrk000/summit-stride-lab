import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

function resizeToFit(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, onInput, value, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    resizeToFit(innerRef.current);
  }, [value]);

  return (
    <textarea
      ref={(el) => {
        innerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      }}
      className={cn(
        "flex min-h-[80px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onInput={(e) => {
        resizeToFit(e.currentTarget);
        onInput?.(e);
      }}
      value={value}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
