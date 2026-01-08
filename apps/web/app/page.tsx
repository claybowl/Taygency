"use client";

import { useEffect, useState, CSSProperties } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* Grid Lines */}
      <div style={{ ...styles.gridLine, ...styles.gridV, left: "60px" }} />
      <div style={{ ...styles.gridLine, ...styles.gridV, right: "60px" }} />
      <div style={{ ...styles.gridLine, ...styles.gridH, top: "100px" }} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark} />
          <span style={styles.logoText}>Vibe Planning</span>
          <span style={styles.timeBadge}>{currentTime}</span>
        </div>
        <a href="/dashboard" style={styles.dashboardButton}>
          <span style={styles.dashboardIcon}>▣</span>
          Dashboard
        </a>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Quick Start */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Start</h2>
          <div style={styles.quickStartGrid}>
            <a href="mailto:tasks@vibeplan.com" style={styles.methodCard}>
              <div style={styles.methodIcon}>✉</div>
              <div style={styles.methodContent}>
                <h3 style={styles.methodTitle}>Email</h3>
                <p style={styles.methodDesc}>
                  Brain dump everything - the agent organizes it
                </p>
                <code style={styles.methodCode}>tasks@vibeplan.com</code>
              </div>
              <span style={styles.methodArrow}>→</span>
            </a>

            <div
              style={styles.methodCard}
              onClick={() => alert("SMS: +1 (555) 000-0000")}
            >
              <div style={styles.methodIcon}>💬</div>
              <div style={styles.methodContent}>
                <h3 style={styles.methodTitle}>Text</h3>
                <p style={styles.methodDesc}>
                  Quick updates and priority checks
                </p>
                <code style={styles.methodCode}>+1 (555) 000-0000</code>
              </div>
              <span style={styles.methodArrow}>→</span>
            </div>

            <a href="/dashboard" style={styles.methodCard}>
              <div style={styles.methodIcon}>📞</div>
              <div style={styles.methodContent}>
                <h3 style={styles.methodTitle}>Voice</h3>
                <p style={styles.methodDesc}>
                  Call for briefings and task management
                </p>
                <code style={styles.methodCode}>Your Vapi Number</code>
              </div>
              <span style={styles.methodArrow}>→</span>
            </a>
          </div>
        </section>

        {/* How to Use */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.howItWorksGrid}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h4 style={styles.stepTitle}>Capture tasks</h4>
                <p style={styles.stepDesc}>
                  Email, text, or call to add tasks. No structure needed - just
                  dump your thoughts.
                </p>
                <div style={styles.exampleBox}>
                  <span style={styles.exampleLabel}>Try:</span>
                  <code>
                    &ldquo;Need to finish report, call Jim, buy groceries,
                    schedule dentist appointment by Friday&ldquo;
                  </code>
                </div>
              </div>
            </div>

            <div style={styles.stepArrow}>→</div>

            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h4 style={styles.stepTitle}>Agent organizes</h4>
                <p style={styles.stepDesc}>
                  The AI categorizes, prioritizes, and structures your tasks
                  automatically.
                </p>
                <div style={styles.exampleBox}>
                  <span style={styles.exampleLabel}>Result:</span>
                  <code>
                    Tasks sorted by priority, category, and energy level
                  </code>
                </div>
              </div>
            </div>

            <div style={styles.stepArrow}>→</div>

            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h4 style={styles.stepTitle}>Stay on track</h4>
                <p style={styles.stepDesc}>
                  Text &ldquo;what should I do?&rdquo; for instant
                  prioritization. Call for briefings.
                </p>
                <div style={styles.exampleBox}>
                  <span style={styles.exampleLabel}>Ask:</span>
                  <code>&ldquo;What&apos;s my top priority today?&rdquo;</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Things You Can Do */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Things You Can Do</h2>
          <div style={styles.actionsGrid}>
            <div style={styles.actionCard}>
              <span style={styles.actionIcon}>📋</span>
              <div style={styles.actionContent}>
                <h4 style={styles.actionTitle}>List tasks</h4>
                <p style={styles.actionDesc}>
                  &ldquo;What do I have today?&rdquo;
                </p>
              </div>
            </div>

            <div style={styles.actionCard}>
              <span style={styles.actionIcon}>➕</span>
              <div style={styles.actionContent}>
                <h4 style={styles.actionTitle}>Add tasks</h4>
                <p style={styles.actionDesc}>
                  &ldquo;Add task to email Sarah about budget&ldquo;
                </p>
              </div>
            </div>

            <div style={styles.actionCard}>
              <span style={styles.actionIcon}>✅</span>
              <div style={styles.actionContent}>
                <h4 style={styles.actionTitle}>Complete tasks</h4>
                <p style={styles.actionDesc}>
                  &ldquo;I finished the quarterly report&ldquo;
                </p>
              </div>
            </div>

            <div style={styles.actionCard}>
              <span style={styles.actionIcon}>🎯</span>
              <div style={styles.actionContent}>
                <h4 style={styles.actionTitle}>Get recommendations</h4>
                <p style={styles.actionDesc}>
                  &ldquo;What should I work on next?&ldquo;
                </p>
              </div>
            </div>

            <div style={styles.actionCard}>
              <span style={styles.actionIcon}>📅</span>
              <div style={styles.actionContent}>
                <h4 style={styles.actionTitle}>Schedule tasks</h4>
                <p style={styles.actionDesc}>
                  &ldquo;Move budget task to tomorrow&ldquo;
                </p>
              </div>
            </div>

            <div style={styles.actionCard}>
              <span style={styles.actionIcon}>📊</span>
              <div style={styles.actionContent}>
                <h4 style={styles.actionTitle}>Get a briefing</h4>
                <p style={styles.actionDesc}>
                  &ldquo;Give me my daily briefing&ldquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Links</h2>
          <div style={styles.linksGrid}>
            <a href="/dashboard" style={styles.linkCard}>
              <span style={styles.linkIcon}>▣</span>
              <span>Dashboard</span>
              <span style={styles.linkArrow}>→</span>
            </a>
            <a href="/dashboard/memory" style={styles.linkCard}>
              <span style={styles.linkIcon}>🧠</span>
              <span>Memory Graph</span>
              <span style={styles.linkArrow}>→</span>
            </a>
            <a href="/dashboard/skills" style={styles.linkCard}>
              <span style={styles.linkIcon}>⚡</span>
              <span>Skills</span>
              <span style={styles.linkArrow}>→</span>
            </a>
            <a href="/dashboard/simulator" style={styles.linkCard}>
              <span style={styles.linkIcon}>🧪</span>
              <span>Simulator</span>
              <span style={styles.linkArrow}>→</span>
            </a>
          </div>
        </section>

        {/* Status Card */}
        <section style={styles.section}>
          <div style={styles.statusCard}>
            <div style={styles.statusHeader}>
              <span style={styles.statusDot} />
              <span style={styles.statusLabel}>System Status</span>
            </div>
            <div style={styles.statusGrid}>
              <div style={styles.statusItem}>
                <span style={styles.statusItemLabel}>Agent</span>
                <span style={styles.statusItemValue}>Ready</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusItemLabel}>Storage</span>
                <span style={styles.statusItemValue}>Connected</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusItemLabel}>LLM</span>
                <span style={styles.statusItemValue}>Active</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusItemLabel}>Vapi</span>
                <span style={styles.statusItemValue}>Online</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <a href="/dashboard" style={styles.footerLink}>
            <span style={styles.footerIcon}>▣</span>
            Go to Dashboard
          </a>
          <span style={styles.footerDivider}>|</span>
          <a href="mailto:tasks@vibeplan.com" style={styles.footerLink}>
            Contact Agent
          </a>
          <span style={styles.footerDivider}>|</span>
          <a href="USER-GUIDE.md" style={styles.footerLink}>
            User Guide
          </a>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        ${
          mounted
            ? `
          .animate-in { animation: fadeIn 0.5s ease-out forwards; }
          .pulse { animation: pulse 2s ease-in-out infinite; }
        `
            : ""
        }
      `}</style>
    </div>
  );
}

const COLORS = {
  bg: "#fafafa",
  surface: "#ffffff",
  border: "#e5e5e5",
  text: "#171717",
  muted: "#737373",
  accent: "#2563eb",
  accentLight: "#dbeafe",
  success: "#16a34a",
  successLight: "#dcfce7",
};

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
  },

  // Grid Lines
  gridLine: {
    position: "fixed",
    background: COLORS.border,
    zIndex: 0,
    pointerEvents: "none",
  },
  gridV: {
    width: "1px",
    height: "100vh",
    top: 0,
  },
  gridH: {
    height: "1px",
    width: "100vw",
    left: 0,
  },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem 3rem",
    background: COLORS.surface,
    borderBottom: `1px solid ${COLORS.border}`,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoMark: {
    width: "10px",
    height: "10px",
    background: COLORS.accent,
    transform: "rotate(45deg)",
  },
  logoText: {
    fontWeight: 600,
    fontSize: "0.9rem",
    letterSpacing: "0.05em",
  },
  timeBadge: {
    padding: "4px 10px",
    background: COLORS.accentLight,
    color: COLORS.accent,
    fontSize: "0.75rem",
    fontWeight: 500,
    borderRadius: "100px",
    marginLeft: "12px",
  },
  dashboardButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0.6rem 1.2rem",
    background: COLORS.accent,
    color: "white",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "0.85rem",
    borderRadius: "6px",
    transition: "all 0.2s",
  },
  dashboardIcon: {
    fontSize: "1rem",
  },

  // Main
  main: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "2rem 3rem 4rem",
    position: "relative",
    zIndex: 1,
  },

  // Sections
  section: {
    marginBottom: "3rem",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: "1.25rem",
    paddingBottom: "0.75rem",
    borderBottom: `1px solid ${COLORS.border}`,
  },

  // Quick Start
  quickStartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
  },
  methodCard: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.25rem",
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    textDecoration: "none",
    color: COLORS.text,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  methodIcon: {
    fontSize: "1.5rem",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: "2px",
  },
  methodDesc: {
    fontSize: "0.75rem",
    color: COLORS.muted,
    marginBottom: "4px",
  },
  methodCode: {
    fontSize: "0.7rem",
    fontFamily: "'JetBrains Mono', monospace",
    background: COLORS.accentLight,
    color: COLORS.accent,
    padding: "2px 6px",
    borderRadius: "4px",
  },
  methodArrow: {
    color: COLORS.muted,
    fontSize: "1rem",
  },

  // How It Works
  howItWorksGrid: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
  },
  step: {
    flex: 1,
    display: "flex",
    gap: "1rem",
    padding: "1.25rem",
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: COLORS.accent,
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "0.8rem",
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "4px",
  },
  stepDesc: {
    fontSize: "0.75rem",
    color: COLORS.muted,
    marginBottom: "8px",
  },
  exampleBox: {
    background: COLORS.bg,
    padding: "8px 10px",
    borderRadius: "4px",
    fontSize: "0.7rem",
  },
  exampleLabel: {
    color: COLORS.accent,
    fontWeight: 500,
    marginRight: "6px",
  },
  stepArrow: {
    color: COLORS.muted,
    fontSize: "1.25rem",
    marginTop: "0.5rem",
  },

  // Actions Grid
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
  },
  actionCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1rem",
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
  },
  actionIcon: {
    fontSize: "1.25rem",
  },
  actionContent: {},
  actionTitle: {
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "2px",
  },
  actionDesc: {
    fontSize: "0.7rem",
    color: COLORS.muted,
    fontFamily: "'JetBrains Mono', monospace",
  },

  // Links Grid
  linksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "0.75rem",
  },
  linkCard: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "1rem",
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    textDecoration: "none",
    color: COLORS.text,
    fontSize: "0.85rem",
    fontWeight: 500,
    transition: "all 0.2s",
  },
  linkIcon: {
    fontSize: "1rem",
    color: COLORS.accent,
  },
  linkArrow: {
    marginLeft: "auto",
    color: COLORS.muted,
    fontSize: "0.9rem",
  },

  // Status Card
  statusCard: {
    background: COLORS.successLight,
    border: `1px solid #bbf7d0`,
    borderRadius: "8px",
    padding: "1.25rem",
  },
  statusHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "1rem",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: COLORS.success,
  },
  statusLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: COLORS.success,
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
  },
  statusItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statusItemLabel: {
    fontSize: "0.7rem",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statusItemValue: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: COLORS.text,
  },

  // Footer
  footer: {
    padding: "1.5rem 3rem",
    background: COLORS.surface,
    borderTop: `1px solid ${COLORS.border}`,
  },
  footerContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  footerLink: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: COLORS.muted,
    textDecoration: "none",
    fontSize: "0.8rem",
    transition: "color 0.2s",
  },
  footerIcon: {
    fontSize: "0.9rem",
  },
  footerDivider: {
    color: COLORS.border,
  },
};
