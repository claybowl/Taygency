export default function LandingPage() {
  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Vibe Planning</h1>
      </header>

      <section style={styles.hero}>
        <h2 style={styles.heroTitle}>Your AI assistant for task management</h2>
        <p style={styles.heroSubtitle}>
          Email your brain dump. Text for quick updates. We organize, you execute.
        </p>

        <div style={styles.cta}>
          <a href="mailto:tasks@vibeplan.com" style={styles.ctaButton}>
            Email tasks@vibeplan.com to get started
          </a>
        </div>
      </section>

      <section style={styles.features}>
        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>Email</h3>
          <p style={styles.featureDesc}>
            Send your messy task list. Get back organized categories, priorities, and a clear plan.
          </p>
        </div>

        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>SMS</h3>
          <p style={styles.featureDesc}>
            Text &quot;what should I do?&quot; and get your top priorities. Quick adds, quick updates.
          </p>
        </div>

        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>Your Data</h3>
          <p style={styles.featureDesc}>
            Everything stored as files you own. Full transparency, full portability.
          </p>
        </div>
      </section>

      <section style={styles.howItWorks}>
        <h2 style={styles.sectionTitle}>How it works</h2>
        <ol style={styles.steps}>
          <li style={styles.step}>
            <strong>1. Brain dump via email</strong>
            <span>Send everything on your mind to tasks@vibeplan.com</span>
          </li>
          <li style={styles.step}>
            <strong>2. AI organizes</strong>
            <span>We categorize, prioritize, and structure your tasks</span>
          </li>
          <li style={styles.step}>
            <strong>3. Text for updates</strong>
            <span>Quick queries, quick adds, mark things done - all via text</span>
          </li>
        </ol>
      </section>

      <footer style={styles.footer}>
        <p>&copy; 2025 Vibe Planning. Built for people who think in lists.</p>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    marginBottom: '60px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '80px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#666',
    marginBottom: '40px',
  },
  cta: {
    marginTop: '30px',
  },
  ctaButton: {
    display: 'inline-block',
    padding: '16px 32px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 500,
    textDecoration: 'none',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '40px',
    marginBottom: '80px',
  },
  feature: {
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '10px',
  },
  featureDesc: {
    color: '#666',
  },
  howItWorks: {
    marginBottom: '80px',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: 600,
    marginBottom: '30px',
    textAlign: 'center',
  },
  steps: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    paddingTop: '40px',
    borderTop: '1px solid #eee',
  },
};
