"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
}

export default function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      setIsNative(true);
    }
  }, []);

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPulling = useRef(false);

  const THRESHOLD = 70;

  // Jika di native Android / iOS, serahkan sepenuhnya ke SwipeRefreshLayout bawaan Android
  if (isNative) {
    return <div className="w-full h-full flex flex-col min-h-0 flex-1">{children}</div>;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = containerRef.current ? containerRef.current.scrollTop : 0;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    } else {
      isPulling.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    const scrollTop = containerRef.current ? containerRef.current.scrollTop : 0;
    if (scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    if (diff > 0) {
      // Elastic resistance formula
      const resistance = 0.45;
      const distance = Math.min(diff * resistance, 110);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || isRefreshing) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(40);
        }
      } catch {}

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Standard full reload like mobile app pull-to-refresh
          window.location.reload();
        }
      } catch (e) {
        console.error("Refresh error:", e);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 800);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full overflow-y-auto overscroll-y-contain flex-1 flex flex-col"
    >
      {/* Pull to refresh visual indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none transition-transform duration-150 z-40"
        style={{
          transform: `translateY(${pullDistance - 45}px)`,
          opacity: pullDistance > 10 ? Math.min(pullDistance / THRESHOLD, 1) : 0,
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white text-emerald-700 shadow-xl border border-slate-200 flex items-center justify-center">
          <RefreshCw
            className={`w-5 h-5 transition-transform ${
              isRefreshing ? "animate-spin text-emerald-600" : ""
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content wrapper with smooth spring bounce */}
      <div
        className="flex-1 flex flex-col transition-transform duration-100"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

