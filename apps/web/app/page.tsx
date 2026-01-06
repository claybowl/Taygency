"use client";

import { useEffect, useState, CSSProperties } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={styles.container}>
      {/* Structural Grid Lines */}
      <div style={{ ...styles.gridLine, ...styles.gridV, left: "80px" }} />
      <div style={{ ...styles.gridLine, ...styles.gridV, left: "50%" }} />
      <div style={{ ...styles.gridLine, ...styles.gridH, top: "120px" }} />

      {/* Header with Dashboard Link */}
      <header style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark} />
          <span style={styles.logoText}>Vibe Planning</span>
        </div>
        <a href="/dashboard" style={styles.dashboardLink}>
          <span style={styles.dashboardLinkIcon}>▣</span>
          Dashboard
        </a>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>AI-Powered Task Management</div>
        <h1 style={styles.heroTitle}>Your AI assistant for task management</h1>
        <p style={styles.heroSubtitle}>
          Email your brain dump. Text for quick updates. We organize, you
          execute.
        </p>

        <div style={styles.heroCta}>
          <a href="mailto:tasks@vibeplan.com" style={styles.ctaButton}>
            <span style={styles.ctaIcon}>✉</span>
            Email tasks@vibeplan.com
          </a>
          <span style={styles.ctaDivider}>or</span>
          <div style={styles.smsCTA}>
            <span style={styles.smsIcon}>💬</span>
            <span>Text &quot;what should I do?&quot; to get priorities</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresGrid}>
          <div style={{ ...styles.featureCard, ...styles.hatchBg }}>
            <div style={styles.featureIcon}>E</div>
            <h3 style={styles.featureTitle}>Email</h3>
            <p style={styles.featureDesc}>
              Send your messy task list. Get back organized categories,
              priorities, and a clear plan.
            </p>
            <div style={styles.featureDetail}>
              <span style={styles.featureDetailLabel}>Use:</span>
              <code style={styles.featureDetailCode}>tasks@vibeplan.com</code>
            </div>
          </div>

          <div style={styles.featureCard}>
            <div style={{ ...styles.featureIcon, ...styles.smsIconBg }}>S</div>
            <h3 style={styles.featureTitle}>SMS</h3>
            <p style={styles.featureDesc}>
              Text &quot;what should I do?&quot; and get your top priorities.
              Quick adds, quick updates.
            </p>
            <div style={styles.featureDetail}>
              <span style={styles.featureDetailLabel}>Use:</span>
              <code style={styles.featureDetailCode}>+1 (555) 000-0000</code>
            </div>
          </div>

          <div style={{ ...styles.featureCard, ...styles.hatchBg }}>
            <div style={{ ...styles.featureIcon, ...styles.dataIconBg }}>D</div>
            <h3 style={styles.featureTitle}>Your Data</h3>
            <p style={styles.featureDesc}>
              Everything stored as files you own. Full transparency, full
              portability.
            </p>
            <div style={styles.featureDetail}>
              <span style={styles.featureDetailLabel}>Format:</span>
              <span style={styles.featureDetailText}>Markdown / JSON</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.howItWorks}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionNumber}>01</span>
          <h2 style={styles.sectionTitle}>How it works</h2>
        </div>

        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Brain dump via email</h3>
            <p style={styles.stepDesc}>
              Send everything on your mind to tasks@vibeplan.com
            </p>
            <div style={styles.stepMeta}>
              <span style={styles.stepMetaItem}>Input: Unstructured text</span>
            </div>
          </div>

          <div style={styles.stepArrow}>→</div>

          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>AI organizes</h3>
            <p style={styles.stepDesc}>
              We categorize, prioritize, and structure your tasks
            </p>
            <div style={styles.stepMeta}>
              <span style={styles.stepMetaItem}>Processing: Claude Agent</span>
            </div>
          </div>

          <div style={styles.stepArrow}>→</div>

          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Text for updates</h3>
            <p style={styles.stepDesc}>
              Quick queries, quick adds, mark things done - all via text
            </p>
            <div style={styles.stepMeta}>
              <span style={styles.stepMetaItem}>Output: Structured tasks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section style={styles.dashboardPreview}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionNumber}>02</span>
          <h2 style={styles.sectionTitle}>Full Visibility</h2>
        </div>

        <div style={styles.previewContainer}>
          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <span style={styles.previewTitle}>Dashboard Features</span>
            </div>
            <div style={styles.previewContent}>
              <div style={styles.previewStat}>
                <span style={styles.previewStatLabel}>
                  Real-time monitoring
                </span>
                <div style={styles.previewStatBar} />
              </div>
              <div style={styles.previewStat}>
                <span style={styles.previewStatLabel}>Task management</span>
                <div style={{ ...styles.previewStatBar, width: "75%" }} />
              </div>
              <div style={styles.previewStat}>
                <span style={styles.previewStatLabel}>Agent simulator</span>
                <div style={{ ...styles.previewStatBar, width: "60%" }} />
              </div>
              <div style={styles.previewStat}>
                <span style={styles.previewStatLabel}>File browser</span>
                <div style={{ ...styles.previewStatBar, width: "45%" }} />
              </div>
            </div>
          </div>

          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <span style={styles.previewTitle}>Quick Actions</span>
            </div>
            <div style={styles.quickActions}>
              <a href="/dashboard" style={styles.quickActionBtn}>
                <span>→</span> View Dashboard
              </a>
              <a href="mailto:tasks@vibeplan.com" style={styles.quickActionBtn}>
                <span>✉</span> Send Email
              </a>
              <div style={styles.quickActionBtn}>
                <span>💬</span> Text Update
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLogo}>
            <div style={styles.logoMarkSmall} />
            <span>Vibe Planning</span>
          </div>
          <p style={styles.footerText}>
            © 2025 Vibe Planning. Built for people who think in lists.
          </p>
          <div style={styles.footerLinks}>
            <a href="/dashboard" style={styles.footerLink}>
              Dashboard
            </a>
            <a href="mailto:tasks@vibeplan.com" style={styles.footerLink}>
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* Entry Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        ${
          mounted
            ? `
          .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
          .animate-slide { animation: slideIn 0.4s ease-out forwards; }
        `
            : ""
        }
      `}</style>
    </div>
  );
}

// Color Palette
const COLORS = {
  primary: "#1a1a1a",
  accent: "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#dc2626",
  bg: "#f9fafb",
  surface: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  hatchColor: "rgba(0, 0, 0, 0.03)",
  vellumBg: "rgba(255, 255, 255, 0.85)",
};

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    overflowX: "hidden",
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
    padding: "2rem 3rem",
    position: "relative",
    zIndex: 10,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoMark: {
    width: "12px",
    height: "12px",
    background: COLORS.accent,
    transform: "rotate(45deg)",
  },
  logoText: {
    fontWeight: 700,
    fontSize: "0.8rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  },
  dashboardLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0.75rem 1.5rem",
    background: COLORS.accent,
    color: "white",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.9rem",
    borderRadius: "4px",
    transition: "all 0.2s",
  },
  dashboardLinkIcon: {
    fontSize: "1rem",
  },

  // Hero
  hero: {
    padding: "6rem 3rem 4rem",
    textAlign: "center",
    position: "relative",
    zIndex: 5,
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 16px",
    background: "rgba(99, 102, 241, 0.1)",
    color: COLORS.accent,
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    borderRadius: "100px",
    marginBottom: "1.5rem",
  },
  heroTitle: {
    fontSize: "3rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    marginBottom: "1rem",
    maxWidth: "700px",
    margin: "0 auto 1rem",
  },
  heroSubtitle: {
    fontSize: "1.25rem",
    color: COLORS.muted,
    maxWidth: "500px",
    margin: "0 auto 3rem",
    lineHeight: 1.5,
  },
  heroCta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  ctaButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "1rem 2rem",
    background: COLORS.primary,
    color: "white",
    borderRadius: "4px",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s",
  },
  ctaIcon: {
    fontSize: "1.2rem",
  },
  ctaDivider: {
    color: COLORS.muted,
    fontWeight: 500,
  },
  smsCTA: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: COLORS.muted,
    fontSize: "0.9rem",
  },
  smsIcon: {
    fontSize: "1.2rem",
  },

  // Features
  featuresSection: {
    padding: "4rem 3rem",
    position: "relative",
    zIndex: 5,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  featureCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    padding: "2rem",
    position: "relative",
    transition: "transform 0.2s ease",
  },
  hatchBg: {
    backgroundImage: `repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 8px,
      ${COLORS.hatchColor} 8px,
      ${COLORS.hatchColor} 9px
    )`,
  },
  featureIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    background: "#dbeafe",
    color: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "1.5rem",
  },
  smsIconBg: {
    background: "#dcfce7",
    color: "#22c55e",
  },
  dataIconBg: {
    background: "#fef3c7",
    color: "#f59e0b",
  },
  featureTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "0.75rem",
  },
  featureDesc: {
    color: COLORS.muted,
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  featureDetail: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "1rem",
    borderTop: `1px solid ${COLORS.border}`,
  },
  featureDetailLabel: {
    fontSize: "0.75rem",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  featureDetailCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.8rem",
    background: COLORS.bg,
    padding: "4px 8px",
    borderRadius: "4px",
  },
  featureDetailText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.8rem",
    color: COLORS.accent,
  },

  // How It Works
  howItWorks: {
    padding: "4rem 3rem",
    maxWidth: "1000px",
    margin: "0 auto",
    position: "relative",
    zIndex: 5,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "3rem",
  },
  sectionNumber: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.75rem",
    color: COLORS.accent,
    background: "rgba(99, 102, 241, 0.1)",
    padding: "4px 12px",
    borderRadius: "100px",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  stepsGrid: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  stepCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    padding: "2rem",
    flex: 1,
    maxWidth: "280px",
    position: "relative",
  },
  stepNumber: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  stepTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  stepDesc: {
    color: COLORS.muted,
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  stepMeta: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: `1px solid ${COLORS.border}`,
  },
  stepMetaItem: {
    fontSize: "0.75rem",
    fontFamily: "'JetBrains Mono', monospace",
    color: COLORS.accent,
  },
  stepArrow: {
    fontSize: "1.5rem",
    color: COLORS.muted,
  },

  // Dashboard Preview
  dashboardPreview: {
    padding: "4rem 3rem",
    maxWidth: "1000px",
    margin: "0 auto",
    position: "relative",
    zIndex: 5,
  },
  previewContainer: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem",
  },
  previewCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
  },
  previewHeader: {
    padding: "1rem 1.5rem",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  previewTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  previewContent: {
    padding: "1.5rem",
  },
  previewStat: {
    marginBottom: "1rem",
  },
  previewStatLabel: {
    display: "block",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
  },
  previewStatBar: {
    height: "8px",
    background: COLORS.accent,
    borderRadius: "4px",
    width: "50%",
    transition: "width 1s ease",
  },
  quickActions: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  quickActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "1rem",
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "4px",
    textDecoration: "none",
    color: COLORS.text,
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },

  // Footer
  footer: {
    padding: "4rem 3rem 2rem",
    borderTop: `1px solid ${COLORS.border}`,
    marginTop: "2rem",
  },
  footerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    textAlign: "center",
  },
  footerLogo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    fontSize: "0.8rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  logoMarkSmall: {
    width: "8px",
    height: "8px",
    background: COLORS.accent,
    transform: "rotate(45deg)",
  },
  footerText: {
    color: COLORS.muted,
    fontSize: "0.85rem",
  },
  footerLinks: {
    display: "flex",
    gap: "2rem",
    marginTop: "0.5rem",
  },
  footerLink: {
    color: COLORS.muted,
    textDecoration: "none",
    fontSize: "0.85rem",
  },
};
