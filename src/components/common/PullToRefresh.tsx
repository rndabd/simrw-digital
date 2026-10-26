"use client";

import React, { ReactNode } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
}

/**
 * PullToRefresh Wrapper
 * - Pada Android APK: SwipeRefreshLayout native dari MainActivity.java menangani pull-to-refresh sistem.
 * - Pada Web: Meniadakan nested scroll-trap (overflow-y-auto ganda) dan touch-event interception
 *   sehingga gesture scrolling di browser (mobile maupun desktop) berjalan lancar 100% tanpa hambatan.
 */
export default function PullToRefresh({ children }: PullToRefreshProps) {
  return (
    <div className="w-full h-full flex flex-col min-h-0 flex-1">
      {children}
    </div>
  );
}
