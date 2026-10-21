"use client";

import React, { useState, useEffect } from "react";
import { Pin, Calendar, Tag, BellRing, Sparkles, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  scope: string;
  is_pinned: boolean;
  authorName?: string;
  created_at: string;
}

interface AnnouncementFeedProps {
  onSelectAnnouncement?: (announcement: AnnouncementItem) => void;
}

export default function AnnouncementFeed({ onSelectAnnouncement }: AnnouncementFeedProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "RW" | "RT">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch("/api/v1/announcements");
        const json = await res.json();
        if (json.success && json.data) {
          setAnnouncements(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  const filtered = announcements.filter((a) => {
    if (filter === "RW") return a.scope === "RW_BROADCAST";
    if (filter === "RT") return a.scope === "RT_BROADCAST";
    return true;
  });

  const getScopeBadge = (scope: string) => {
    if (scope === "RW_BROADCAST") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Warga RW 05
        </span>
      );
    }
    if (scope === "RT_BROADCAST") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          Lingkup RT 02
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
        Khusus Pengurus
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <BellRing className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Kabar & Pengumuman Warga
          </h3>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2 py-0.5 rounded-md transition-all ${
              filter === "ALL" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter("RW")}
            className={`px-2 py-0.5 rounded-md transition-all ${
              filter === "RW" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            RW
          </button>
          <button
            onClick={() => setFilter("RT")}
            className={`px-2 py-0.5 rounded-md transition-all ${
              filter === "RT" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            RT
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-600">Belum ada pengumuman baru</div>
          <div className="text-[11px] text-slate-400">Pengumuman dari pengurus RT/RW akan tampil di sini.</div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectAnnouncement?.(item)}
              className={`p-4 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-md cursor-pointer relative ${
                item.is_pinned
                  ? "border-emerald-300 ring-1 ring-emerald-400/30 bg-emerald-50/20"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              {item.is_pinned && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mb-2">
                  <Pin className="w-3 h-3 text-amber-700 rotate-45" />
                  Sematkan Wajib Baca
                </div>
              )}

              <div className="flex items-center justify-between mb-1.5">
                {getScopeBadge(item.scope)}
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 leading-snug">
                {item.title}
              </h4>

              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {item.content}
              </p>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Oleh: {item.authorName || "Pengurus RW"}</span>
                <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold hover:underline">
                  Baca Detail <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

