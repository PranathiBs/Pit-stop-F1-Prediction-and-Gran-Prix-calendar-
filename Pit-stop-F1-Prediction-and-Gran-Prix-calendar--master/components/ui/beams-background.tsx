"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BeamsBackground({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const beamsRef = useRef<any[]>([]);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            beamsRef.current = Array.from({ length: 30 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                width: 30 + Math.random() * 60,
                length: canvas.height * 2.5,
                angle: -35 + Math.random() * 10,
                speed: 0.6 + Math.random() * 1.2,
                opacity: 0.12 + Math.random() * 0.16,
                hue: 210 + Math.random() * 30,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03,
            }));
        };

        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);

        function animate() {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = "blur(35px)";
            beamsRef.current.forEach((beam) => {
                beam.y -= beam.speed;
                beam.pulse += beam.pulseSpeed;
                if (beam.y + beam.length < -100) beam.y = canvas.height + 100;
                ctx.save();
                ctx.translate(beam.x, beam.y);
                ctx.rotate((beam.angle * Math.PI) / 180);
                const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
                gradient.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, 0)`);
                gradient.addColorStop(0.4, `hsla(${beam.hue}, 85%, 65%, ${beam.opacity})`);
                gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
                ctx.restore();
            });
            animationFrameRef.current = requestAnimationFrame(animate);
        }
        animate();
        return () => {
            window.removeEventListener("resize", updateCanvasSize);
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    return (
        <div className={cn("fixed inset-0 z-[-1] bg-neutral-950", className)}>
            <canvas ref={canvasRef} className="absolute inset-0" style={{ filter: "blur(15px)" }} />
        </div>
    );
}
