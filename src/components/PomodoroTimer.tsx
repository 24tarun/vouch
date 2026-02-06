"use client";

import { useEffect, useState } from "react";
import { Pause, Play, Square, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PomoSession } from "@/lib/types";

export interface PomodoroTimerProps {
    session: PomoSession;
    taskTitle: string;
    minimized: boolean;
    onMinimize: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
}

export function PomodoroTimer({ session, taskTitle, minimized, onMinimize, onPause, onResume, onStop }: PomodoroTimerProps) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // VFD Color Style
    const vfdColor = "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]";

    useEffect(() => {
        const calculateTime = () => {
            if (!session) return;

            const durationSec = session.duration_minutes * 60;
            let currentElapsed = session.elapsed_seconds;

            if (session.status === "ACTIVE") {
                const start = new Date(session.started_at).getTime();
                const now = new Date().getTime();
                currentElapsed += Math.floor((now - start) / 1000);
            }

            const remaining = Math.max(0, durationSec - currentElapsed);
            setTimeLeft(remaining);
            setProgress(Math.min(100, (currentElapsed / durationSec) * 100));
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval);
    }, [session]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", onFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
    }, []);

    // Format HH:MM or MM:SS
    const formatTime = (seconds: number) => {
        if (seconds >= 6000) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        }

        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch {
            // Ignore API failures. The overlay still covers the viewport.
        }
    };

    if (minimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div
                    onClick={onMinimize}
                    className="group bg-black border border-slate-800 rounded-full h-20 pl-3 pr-6 flex items-center gap-4 shadow-2xl cursor-pointer hover:border-cyan-500/40 transition-all overflow-hidden min-w-[230px]"
                >
                    {/* Tiny Circular Progress */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-slate-800"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="text-cyan-500 transition-all duration-500 ease-linear"
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                        </svg>
                        <div className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold font-mono", vfdColor)}>
                            {Math.ceil(timeLeft / 60)}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200 truncate max-w-[150px]">{taskTitle}</span>
                        <span className={cn("text-xs font-mono tracking-wider", session.status === "PAUSED" ? "text-amber-400" : "text-slate-400")}>
                            {session.status === "PAUSED" ? "PAUSED" : "ACTIVE"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black text-slate-200 animate-in fade-in duration-200">
            <div className="absolute top-6 left-6">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-600 font-semibold">Current Task</p>
                <h3 className="text-xl font-semibold text-white mt-1 max-w-[70vw] truncate">{taskTitle}</h3>
            </div>

            <div className="absolute top-6 right-6 flex items-center gap-1">
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2 text-slate-500 hover:text-cyan-300 transition-colors"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={onMinimize}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                    title="Minimize timer"
                >
                    <Minimize2 className="w-5 h-5" />
                </button>
            </div>

            <div className="h-full w-full flex flex-col items-center justify-center gap-10 px-4">
                {/* Main Clock */}
                <div className="relative w-[310px] h-[310px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
                    {/* SVG Ring */}
                    <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Track */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="3"
                        />
                        {/* Progress */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="text-cyan-500 transition-all duration-1000 ease-linear"
                            strokeDasharray={`${progress * 2.83}, 283`}
                        />
                    </svg>

                    {/* VFD Display (minimal: no rectangular box) */}
                    <div className={cn("text-7xl sm:text-8xl font-mono font-bold tracking-tight z-10", vfdColor)}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-10 w-full justify-center">
                    {session.status === "ACTIVE" ? (
                        <button
                            onClick={onPause}
                            className="text-slate-200 hover:text-cyan-300 transition-colors hover:scale-105 active:scale-95 p-2"
                            title="Pause"
                        >
                            <Pause className="w-10 h-10 fill-current" />
                        </button>
                    ) : (
                        <button
                            onClick={onResume}
                            className="text-slate-200 hover:text-cyan-300 transition-colors hover:scale-105 active:scale-95 p-2"
                            title="Resume"
                        >
                            <Play className="w-10 h-10 fill-current" />
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (confirm("Are you sure you want to stop this session?")) {
                                onStop();
                            }
                        }}
                        className="text-red-500 hover:text-red-400 transition-colors hover:scale-105 active:scale-95 p-2"
                        title="Stop"
                    >
                        <Square className="w-9 h-9 fill-current" />
                    </button>
                </div>
            </div>
        </div>
    );
}
