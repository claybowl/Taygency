'use client';

import { useEffect, useState } from 'react';
import type { Task, TasksResponse } from '@vibe-planning/shared';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/dashboard/tasks', {
          headers: { 'x-user-id': 'demo-user' },
        });

        if (!res.ok) throw new Error('Failed to fetch tasks');

        const data: TasksResponse = await res.json();
        setTasks(data.tasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <main style={styles.container}>
        <p>Loading tasks...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.container}>
        <p style={styles.error}>Error: {error}</p>
      </main>
    );
  }

  const groupedTasks = groupByCategory(tasks);

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Your Tasks</h1>
        <p style={styles.subtitle}>{tasks.length} active tasks</p>
      </header>

      {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
        <section key={category} style={styles.category}>
          <h2 style={styles.categoryTitle}>{category}</h2>
          <ul style={styles.taskList}>
            {categoryTasks.map((task) => (
              <li key={task.id} style={styles.taskItem}>
                <span style={styles.taskTitle}>{task.title}</span>
                <span style={{ ...styles.priority, ...getPriorityStyle(task.priority) }}>
                  {task.priority}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {tasks.length === 0 && (
        <p style={styles.empty}>
          No tasks yet. Email tasks@vibeplan.com to get started!
        </p>
      )}
    </main>
  );
}

function groupByCategory(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce(
    (acc, task) => {
      const category = task.category || 'inbox';
      if (!acc[category]) acc[category] = [];
      acc[category].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );
}

function getPriorityStyle(priority: string): React.CSSProperties {
  const colors: Record<string, string> = {
    high: '#dc2626',
    medium: '#f59e0b',
    low: '#22c55e',
  };
  return { backgroundColor: colors[priority] || '#6b7280' };
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
  },
  subtitle: {
    color: '#666',
    marginTop: '8px',
  },
  category: {
    marginBottom: '32px',
  },
  categoryTitle: {
    fontSize: '18px',
    fontWeight: 600,
    textTransform: 'capitalize',
    marginBottom: '16px',
    color: '#374151',
  },
  taskList: {
    listStyle: 'none',
  },
  taskItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    marginBottom: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  taskTitle: {
    fontSize: '16px',
  },
  priority: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  error: {
    color: '#dc2626',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: '40px',
  },
};
