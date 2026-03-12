"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const HoverButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const [circles, setCircles] = React.useState<any[]>([])
    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCircles(prev => [...prev, { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    }
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (circles.length > 0) {
              setCircles(prev => prev.slice(1));
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [circles]);

    return (
      <button
        ref={ref}
        className={cn("relative isolate px-8 py-3 rounded-full border border-white/10 text-white backdrop-blur-lg bg-white/5 overflow-hidden transition-all active:scale-95 group", className)}
        onPointerMove={handlePointerMove}
        style={{ "--circle-start": "#a0d9f8", "--circle-end": "#3a5bbf" } as any}
        {...props}
      >
        {circles.map(c => (
          <div key={c.id} className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md bg-[#a0d9f8] pointer-events-none" style={{ left: c.x, top: c.y }} />
        ))}
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      </button>
    )
  }
)
export { HoverButton }
