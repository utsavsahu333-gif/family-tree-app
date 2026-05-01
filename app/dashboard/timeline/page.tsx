"use client";
import { useEffect, useState } from "react";
import TimelineView from "@/app/components/Timeline";

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then(d => setEvents(d.events || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Family Timeline</h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Track births, marriages, and milestones across generations</p>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
          <div className="animate-float" style={{ fontSize: 40 }}>📅</div>
          <p style={{ marginTop: 16 }}>Loading timeline...</p>
        </div>
      ) : (
        <TimelineView events={events} />
      )}
    </div>
  );
}
