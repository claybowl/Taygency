"use client";

import { useEffect, useState, useRef, CSSProperties } from "react";
import * as d3 from "d3-force";
import type {
  Task,
  TasksResponse,
  AgentResponse,
  AgentExecutionTrace,
  AgentLogEntry,
  AgentLogEvent,
} from "@vibe-planning/shared";

type PageId =
  | "overview"
  | "tasks"
  | "skills"
  | "files"
  | "logs"
  | "context"
  | "memory"
  | "simulator";

interface MemoryResponse {
  enabled: boolean;
  healthy: boolean;
  stats: {
    totalFacts: number;
    totalEntities: number;
    recentFacts: number;
    patterns: number;
    preferences: number;
  };
  recentFacts: Array<{ fact: string; validAt?: string; score: number }>;
  graph: {
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ id: string; source: string; target: string; fact: string }>;
  };
}
type TaskFilter = "active" | "completed" | "someday";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>("overview");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("active");
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [simulatorResponse, setSimulatorResponse] =
    useState<AgentResponse | null>(null);
  const [simulatorTrace, setSimulatorTrace] =
    useState<AgentExecutionTrace | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>("config.json");
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [memoryData, setMemoryData] = useState<MemoryResponse | null>(null);
  const [memoryLoading, setMemoryLoading] = useState(false);

  const [activityFeed, setActivityFeed] = useState<
    Array<{
      id: string;
      type: "email" | "sms" | "task" | "system" | "skill";
      channel: string;
      preview: string;
      timestamp: string;
    }>
  >([]);
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>("");
  const [greetingLoading, setGreetingLoading] = useState(true);

  // Form state for simulator
  const [simChannel, setSimChannel] = useState<"email" | "sms">("email");
  const [simFrom, setSimFrom] = useState("");
  const [simSubject, setSimSubject] = useState("");
  const [simBody, setSimBody] = useState("");

  // Mock data for when API fails (no GitHub token, etc.)
  const mockTasks: Task[] = [
    {
      id: "task-demo-1",
      title: "Review Q4 Planning Strategy",
      status: "active",
      priority: "high",
      category: "Strategic Planning",
      energy: "high",
      duration: "45 mins",
      due: "Today, 5:00 PM",
      source: "email",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-demo-2",
      title: "Schedule team sync for next week",
      status: "active",
      priority: "medium",
      category: "Work",
      energy: "medium",
      duration: "15 mins",
      source: "sms",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-demo-3",
      title: "Buy birthday gift for mom",
      status: "active",
      priority: "low",
      category: "Personal",
      energy: "low",
      duration: "30 mins",
      due: "Saturday",
      source: "email",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/dashboard/tasks");
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data: TasksResponse = await res.json();
        setTasks(data.tasks);
        setError(null);
      } catch (err) {
        console.warn("[Dashboard] API unavailable, using mock data:", err);
        setTasks(mockTasks);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/dashboard/activity");
        if (res.ok) {
          const data = await res.json();
          setActivityFeed(data.activities || []);
          setLastActivityAt(data.lastActivityAt);
        }
      } catch (err) {
        console.warn("[Dashboard] Activity feed unavailable:", err);
      }
    }
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchGreeting() {
      setGreetingLoading(true);
      try {
        const res = await fetch("/api/dashboard/greeting");
        if (res.ok) {
          const data = await res.json();
          setGreeting(data.message);
        }
      } catch (err) {
        console.warn("[Dashboard] Greeting unavailable:", err);
        setGreeting("Welcome back! Let's make today productive. 🚀");
      } finally {
        setGreetingLoading(false);
      }
    }
    fetchGreeting();
  }, []);

  // Bar chart animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setBarsAnimated(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentPage === "memory" && !memoryData) {
      setMemoryLoading(true);
      fetch("/api/dashboard/memory")
        .then((res) => res.json())
        .then((data: MemoryResponse) => {
          setMemoryData(data);
        })
        .catch(() => {
          setMemoryData({
            enabled: false,
            healthy: false,
            stats: {
              totalFacts: 0,
              totalEntities: 0,
              recentFacts: 0,
              patterns: 0,
              preferences: 0,
            },
            recentFacts: [],
            graph: { nodes: [], edges: [] },
          });
        })
        .finally(() => setMemoryLoading(false));
    }
  }, [currentPage, memoryData]);

  const showPage = (pageId: PageId) => {
    setCurrentPage(pageId);
  };

  const simulateSend = async () => {
    if (!simBody.trim()) {
      setSimulatorError("Please enter a message");
      return;
    }

    setIsSimulating(true);
    setSimulatorResponse(null);
    setSimulatorTrace(null);
    setSimulatorError(null);

    try {
      const response = await fetch("/api/simulator/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: simChannel,
          message: simBody,
          context: {
            from: simChannel === "email" ? simFrom : undefined,
            subject: simChannel === "email" ? simSubject : undefined,
            phoneNumber: simChannel === "sms" ? simFrom : undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process message");
      }

      setSimulatorResponse(data.response);
      if (data.trace) {
        setSimulatorTrace(data.trace);
      }
    } catch (error) {
      setSimulatorError(
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredTasks = tasks.filter((task) => task.status === taskFilter);

  const getPriorityClass = (priority: string): "high" | "medium" | "low" => {
    if (priority === "high") return "high";
    if (priority === "medium") return "medium";
    return "low";
  };

  const formatRelativeTime = (timestamp: string | null): string => {
    if (!timestamp) return "No activity yet";
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDays}d ago`;
  };

  const formatActivityTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case "email":
        return "E";
      case "sms":
        return "S";
      case "task":
        return "T";
      case "skill":
        return "⚡";
      default:
        return "⚙";
    }
  };

  const getActivityIconType = (type: string): "email" | "sms" | "system" => {
    if (type === "email") return "email";
    if (type === "sms") return "sms";
    return "system";
  };

  const taskCategories = tasks.reduce(
    (acc, task) => {
      const cat = task.category || "Other";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const categoryData = Object.entries(taskCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const maxCategoryCount = Math.max(
    ...categoryData.map(([, count]) => count),
    1,
  );

  const priorityCounts = {
    high: tasks.filter((t) => t.priority === "high" && t.status === "active")
      .length,
    medium: tasks.filter(
      (t) => t.priority === "medium" && t.status === "active",
    ).length,
    low: tasks.filter((t) => t.priority === "low" && t.status === "active")
      .length,
  };
  const totalPriority =
    priorityCounts.high + priorityCounts.medium + priorityCounts.low || 1;

  const fileContents: Record<string, string> = {
    "config.json": `{
  "agent_id": "vibe-planning-01",
  "version": "2.4.0-stable",
  "capabilities": [
    "nlp_classification",
    "calendar_orchestration",
    "energy_modeling"
  ],
  "latency_threshold": 250,
  "default_channel": "email"
}`,
    "preferences.md": `# User Preferences

## Schedule
- Morning meetings preferred (9-11 AM)
- Deep work blocks: 2-5 PM
- No meetings on Fridays

## Communication
- Email for async, Slack for urgent
- Daily digest at 8 AM`,
    "patterns.md": `# Detected Patterns

## Meeting Preferences
- 95% confidence: Prefers morning meetings
- 87% confidence: Avoids Monday mornings

## Task Completion
- Average completion time: 2.3 days
- Most productive: Tuesday/Wednesday`,
  };

  // Stats computation
  const activeTasks = tasks.filter((t) => t.status === "active").length;
  const completedToday = tasks.filter((t) => t.status === "completed").length;
  const totalSkills = 24;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.body}>
      {/* Structural Grid Lines */}
      <div style={{ ...styles.gridLine, ...styles.gridV, left: "260px" }} />
      <div style={{ ...styles.gridLine, ...styles.gridV, left: "60%" }} />
      <div style={{ ...styles.gridLine, ...styles.gridH, top: "100px" }} />

      {/* Sidebar Navigation */}
      <aside style={styles.aside}>
        <div style={styles.logo}>
          <div style={styles.logoMark} />
          <span>Agent Organizer</span>
        </div>
        <nav style={styles.nav}>
          <ul style={styles.navList}>
            {(
              [
                "overview",
                "tasks",
                "skills",
                "files",
                "logs",
                "context",
                "memory",
              ] as PageId[]
            ).map((page) => (
              <li key={page} style={styles.navItem}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    showPage(page);
                  }}
                  onMouseEnter={() => setHoveredNavItem(page)}
                  onMouseLeave={() => setHoveredNavItem(null)}
                  style={{
                    ...styles.navLink,
                    ...(currentPage === page ? styles.navLinkActive : {}),
                    ...(hoveredNavItem === page && currentPage !== page
                      ? styles.navLinkHover
                      : {}),
                  }}
                >
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </a>
              </li>
            ))}
            <li style={styles.navDivider} />
            <li style={styles.navItem}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  showPage("simulator");
                }}
                onMouseEnter={() => setHoveredNavItem("simulator")}
                onMouseLeave={() => setHoveredNavItem(null)}
                style={{
                  ...styles.navLink,
                  ...styles.simulatorLink,
                  ...(currentPage === "simulator" ? styles.navLinkActive : {}),
                  ...(hoveredNavItem === "simulator" &&
                  currentPage !== "simulator"
                    ? styles.navLinkHover
                    : {}),
                }}
              >
                Simulator
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={styles.main}>
        {/* Overview Page */}
        {currentPage === "overview" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>System Overview</h1>
              <p style={styles.pageSubtitle}>
                Real-time monitoring and agent health diagnostics.
              </p>
            </div>

            {/* Agent Greeting */}
            <div style={styles.greetingBox}>
              <div style={styles.greetingIcon}>✨</div>
              <div style={styles.greetingContent}>
                {greetingLoading ? (
                  <span style={styles.greetingLoading}>
                    Thinking of something nice to say...
                  </span>
                ) : (
                  <span style={styles.greetingText}>{greeting}</span>
                )}
              </div>
            </div>

            <div style={styles.statsGrid}>
              <StatCard
                label="Active Tasks"
                value={activeTasks.toString()}
                hatch
              />
              <StatCard
                label="Completed Today"
                value={completedToday.toString()}
              />
              <StatCard
                label="Total Skills"
                value={totalSkills.toString()}
                subValue="/ 8 meta"
                hatch
              />
              <StatCard
                label="Last Activity"
                value={formatRelativeTime(lastActivityAt)}
                small
              />
            </div>

            <div style={styles.dashboardContent}>
              {/* Activity Feed */}
              <div style={styles.sectionBox}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionTitle}>Recent Activity Feed</span>
                  <span style={styles.activityTime}>
                    {activityFeed.length > 0
                      ? "Live Sync Active"
                      : "Awaiting Activity"}
                  </span>
                </div>
                <ul style={styles.activityFeedList}>
                  {activityFeed.length > 0 ? (
                    activityFeed
                      .slice(0, 5)
                      .map((activity, index) => (
                        <ActivityItem
                          key={activity.id}
                          icon={getActivityIcon(activity.type)}
                          iconType={getActivityIconType(activity.type)}
                          channel={activity.channel}
                          time={formatActivityTime(activity.timestamp)}
                          preview={activity.preview}
                          isLast={
                            index === Math.min(activityFeed.length, 5) - 1
                          }
                        />
                      ))
                  ) : (
                    <li style={styles.emptyActivity}>
                      <span style={styles.emptyActivityIcon}>📭</span>
                      <span>
                        No recent activity. Send an email or SMS to get started!
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Task Distribution Chart */}
              <div style={{ ...styles.sectionBox, ...styles.hatchBg }}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionTitle}>Task Distribution</span>
                </div>
                <div style={styles.chartPlaceholder}>
                  {categoryData.length > 0 ? (
                    categoryData.map(([category, count]) => (
                      <Bar
                        key={category}
                        height={
                          barsAnimated
                            ? Math.max(20, (count / maxCategoryCount) * 80)
                            : 0
                        }
                        label={category}
                      />
                    ))
                  ) : (
                    <>
                      <Bar height={barsAnimated ? 20 : 0} label="No tasks" />
                    </>
                  )}
                </div>
                <div style={styles.priorityRatioContainer}>
                  <div style={styles.statLabel}>Priority Ratio</div>
                  <div style={styles.priorityBar}>
                    <div
                      style={{
                        ...styles.prioritySegment,
                        width: `${(priorityCounts.high / totalPriority) * 100}%`,
                        background: COLORS.danger,
                      }}
                      title={`High: ${priorityCounts.high}`}
                    />
                    <div
                      style={{
                        ...styles.prioritySegment,
                        width: `${(priorityCounts.medium / totalPriority) * 100}%`,
                        background: COLORS.warning,
                      }}
                      title={`Medium: ${priorityCounts.medium}`}
                    />
                    <div
                      style={{
                        ...styles.prioritySegment,
                        width: `${(priorityCounts.low / totalPriority) * 100}%`,
                        background: COLORS.success,
                      }}
                      title={`Low: ${priorityCounts.low}`}
                    />
                  </div>
                  <div style={styles.priorityLabels}>
                    <span style={{ color: COLORS.danger }}>
                      ● High ({priorityCounts.high})
                    </span>
                    <span style={{ color: COLORS.warning }}>
                      ● Med ({priorityCounts.medium})
                    </span>
                    <span style={{ color: COLORS.success }}>
                      ● Low ({priorityCounts.low})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tasks Page */}
        {currentPage === "tasks" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Task Management</h1>
              <p style={styles.pageSubtitle}>
                Structural overview of all planned agent operations.
              </p>
            </div>

            <div style={styles.filterButtons}>
              {(["active", "completed", "someday"] as TaskFilter[]).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    style={{
                      ...styles.btn,
                      ...(taskFilter === filter
                        ? styles.btnActive
                        : styles.btnOutline),
                    }}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ),
              )}
            </div>

            {filteredTasks.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No {taskFilter} tasks found.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  getPriorityClass={getPriorityClass}
                />
              ))
            )}
          </section>
        )}

        {/* Skills Page */}
        {currentPage === "skills" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Skills Library</h1>
              <p style={styles.pageSubtitle}>
                Available agent capabilities and automation patterns.
              </p>
            </div>
            <div style={styles.placeholderBox}>
              <div style={styles.placeholderIcon}>⚡</div>
              <p style={styles.placeholderText}>
                Skills management interface coming soon.
              </p>
              <p style={styles.placeholderSubtext}>
                24 skills loaded • 8 meta-skills active
              </p>
            </div>
          </section>
        )}

        {/* Files Page */}
        {currentPage === "files" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>File Browser</h1>
              <p style={styles.pageSubtitle}>
                Inspect the underlying data structure of the planning agent.
              </p>
            </div>

            <div style={styles.fileBrowser}>
              <div style={styles.fileTree}>
                <TreeItem icon="📁" label="tasks" indent={0} />
                <TreeItem icon="📁" label="skills" indent={0} />
                <TreeItem icon="📁" label="context" indent={0} />
                <TreeItem
                  icon="📄"
                  label="preferences.md"
                  indent={1}
                  onClick={() => setSelectedFile("preferences.md")}
                  active={selectedFile === "preferences.md"}
                />
                <TreeItem
                  icon="📄"
                  label="patterns.md"
                  indent={1}
                  onClick={() => setSelectedFile("patterns.md")}
                  active={selectedFile === "patterns.md"}
                />
                <TreeItem icon="📁" label="meta" indent={0} />
                <TreeItem
                  icon="📄"
                  label="config.json"
                  indent={1}
                  onClick={() => setSelectedFile("config.json")}
                  active={selectedFile === "config.json"}
                  highlight
                />
                <TreeItem icon="📁" label="inbox" indent={0} />
              </div>
              <div style={styles.fileContent}>
                <pre style={styles.fileContentPre}>
                  {fileContents[selectedFile] || "// Select a file to view"}
                </pre>
              </div>
            </div>
          </section>
        )}

        {/* Logs Page */}
        {currentPage === "logs" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>System Logs</h1>
              <p style={styles.pageSubtitle}>
                Real-time event stream and debugging information.
              </p>
            </div>
            <div style={styles.placeholderBox}>
              <div style={styles.placeholderIcon}>📋</div>
              <p style={styles.placeholderText}>
                Log viewer interface coming soon.
              </p>
              <p style={styles.placeholderSubtext}>
                Streaming logs • Filter by severity • Export
              </p>
            </div>
          </section>
        )}

        {/* Context Page */}
        {currentPage === "context" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Context Memory</h1>
              <p style={styles.pageSubtitle}>
                Learned patterns and user preferences.
              </p>
            </div>
            <div style={styles.placeholderBox}>
              <div style={styles.placeholderIcon}>🧠</div>
              <p style={styles.placeholderText}>
                Context explorer interface coming soon.
              </p>
              <p style={styles.placeholderSubtext}>
                Preferences • Patterns • History
              </p>
            </div>
          </section>
        )}

        {/* Memory Page */}
        {currentPage === "memory" && (
          <MemoryPage memoryLoading={memoryLoading} memoryData={memoryData} />
        )}

        {/* Simulator Page */}
        {currentPage === "simulator" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Agent Simulator</h1>
              <p style={styles.pageSubtitle}>
                Send mock triggers to test system response logic.
              </p>
            </div>

            <div style={styles.simulatorContainer}>
              <div style={styles.simulatorLayout}>
                <div style={styles.composer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Channel</label>
                    <select
                      value={simChannel}
                      onChange={(e) =>
                        setSimChannel(e.target.value as "email" | "sms")
                      }
                      style={styles.select}
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>

                  {simChannel === "email" && (
                    <>
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>From</label>
                        <input
                          type="text"
                          placeholder="sender@domain.com"
                          value={simFrom}
                          onChange={(e) => setSimFrom(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>Subject</label>
                        <input
                          type="text"
                          placeholder="Subject line..."
                          value={simSubject}
                          onChange={(e) => setSimSubject(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                    </>
                  )}

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Message Body</label>
                    <textarea
                      rows={8}
                      placeholder="Type mock message here..."
                      value={simBody}
                      onChange={(e) => setSimBody(e.target.value)}
                      style={styles.textarea}
                    />
                  </div>

                  <button onClick={simulateSend} style={styles.btnPrimary}>
                    Dispatch Trigger
                  </button>

                  <div style={styles.presetsSection}>
                    <label style={styles.statLabel}>Quick Presets</label>
                    <div style={styles.presetsGrid}>
                      <button
                        style={styles.presetBtn}
                        onClick={() => {
                          setSimSubject("Can we reschedule?");
                          setSimBody(
                            "Hey, can we move our 3pm meeting to 4pm? I have a conflict.",
                          );
                        }}
                      >
                        Reschedule Meeting
                      </button>
                      <button
                        style={styles.presetBtn}
                        onClick={() => {
                          setSimSubject("New task");
                          setSimBody(
                            "Please add 'Review Q4 strategy' to my task list with high priority.",
                          );
                        }}
                      >
                        New Task Request
                      </button>
                      <button
                        style={styles.presetBtn}
                        onClick={() => {
                          setSimSubject("Schedule conflict");
                          setSimBody(
                            "I need to attend both the team standup and client call at 10am. Can you help resolve this?",
                          );
                        }}
                      >
                        Complex Conflict
                      </button>
                    </div>
                  </div>
                </div>

                <div style={styles.responsePanel}>
                  <div style={styles.responseView}>
                    {isSimulating ? (
                      <div style={styles.processingText}>[PROCESSING...]</div>
                    ) : simulatorError ? (
                      <div style={styles.errorText}>
                        <span style={{ color: COLORS.danger }}>ERROR:</span>{" "}
                        {simulatorError}
                      </div>
                    ) : simulatorResponse ? (
                      <SimulatorResponseContent response={simulatorResponse} />
                    ) : (
                      <div style={styles.waitingText}>
                        // Waiting for input...
                      </div>
                    )}
                  </div>

                  {simulatorTrace && <AgentLogsViewer trace={simulatorTrace} />}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Color constants
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

// Sub-components
function StatCard({
  label,
  value,
  subValue,
  hatch,
  small,
}: {
  label: string;
  value: string;
  subValue?: string;
  hatch?: boolean;
  small?: boolean;
}) {
  return (
    <div style={{ ...styles.statCard, ...(hatch ? styles.hatchBg : {}) }}>
      <div style={styles.statCardCornerTL} />
      <div style={styles.statCardCornerBR} />
      <span style={styles.statLabel}>{label}</span>
      <div
        style={{ ...styles.statValue, ...(small ? { fontSize: "1rem" } : {}) }}
      >
        {value}
        {subValue && <small style={styles.statSubValue}>{subValue}</small>}
      </div>
    </div>
  );
}

function Bar({ height, label }: { height: number; label: string }) {
  return (
    <div
      style={{
        ...styles.bar,
        height: `${height}%`,
      }}
      data-label={label}
    >
      <span style={styles.barLabel}>{label}</span>
    </div>
  );
}

function ActivityItem({
  icon,
  iconType,
  channel,
  time,
  preview,
  isLast,
}: {
  icon: string;
  iconType: "email" | "sms" | "system";
  channel: string;
  time: string;
  preview: string;
  isLast?: boolean;
}) {
  const iconStyles: Record<string, CSSProperties> = {
    email: { background: "#dbeafe", color: "#3b82f6" },
    sms: { background: "#dcfce7", color: "#22c55e" },
    system: { background: "#e5e7eb", color: "#4b5563" },
  };

  return (
    <li
      style={{
        ...styles.activityItem,
        ...(isLast ? { borderBottom: "none" } : {}),
      }}
    >
      <div style={{ ...styles.channelIcon, ...iconStyles[iconType] }}>
        {icon}
      </div>
      <div style={styles.activityContent}>
        <div style={styles.activityMeta}>
          <span style={styles.activityChannel}>{channel}</span>
          <span style={styles.activityTime}>{time}</span>
        </div>
        <p style={styles.activityPreview}>{preview}</p>
      </div>
    </li>
  );
}

function TaskCard({
  task,
  getPriorityClass,
}: {
  task: Task;
  getPriorityClass: (priority: string) => "high" | "medium" | "low";
}) {
  const priorityColors: Record<string, string> = {
    high: COLORS.danger,
    medium: COLORS.warning,
    low: COLORS.success,
  };

  return (
    <div style={styles.taskCard}>
      <div style={styles.taskCardHeader}>
        <div>
          <span
            style={{
              ...styles.priorityBadge,
              color: priorityColors[getPriorityClass(task.priority)],
              borderColor: priorityColors[getPriorityClass(task.priority)],
            }}
          >
            {task.priority} Priority
          </span>
          <h3 style={styles.taskTitle}>{task.title}</h3>
          <p style={styles.taskMeta}>
            Category: {task.category} {task.due && `• Due: ${task.due}`}
          </p>
        </div>
        <div style={styles.taskStats}>
          {task.energy && <div>⚡ {task.energy} Energy</div>}
          {task.duration && <div>⏱ {task.duration}</div>}
        </div>
      </div>
      <div style={styles.taskTags}>
        {task.source && (
          <span style={styles.taskTag}>Source: {task.source}</span>
        )}
        <span style={styles.taskTag}>ID: {task.id.slice(0, 8)}</span>
      </div>
    </div>
  );
}

function TreeItem({
  icon,
  label,
  indent,
  onClick,
  active,
  highlight,
}: {
  icon: string;
  label: string;
  indent: number;
  onClick?: () => void;
  active?: boolean;
  highlight?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.treeItem,
        paddingLeft: `${indent * 20 + 4}px`,
        ...(active || highlight ? { color: COLORS.accent } : {}),
        ...(hovered && !active ? { color: COLORS.accent } : {}),
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

const NODE_TYPE_COLORS: Record<string, string> = {
  Person: "#3b82f6",
  Task: "#22c55e",
  Project: "#8b5cf6",
  Pattern: "#f59e0b",
  Preference: "#ec4899",
  default: "#6b7280",
};

// Memory Page Component - Immersive Knowledge Graph Experience
function MemoryPage({
  memoryLoading,
  memoryData,
}: {
  memoryLoading: boolean;
  memoryData: MemoryResponse | null;
}) {
  const [factsExpanded, setFactsExpanded] = useState(false);

  if (memoryLoading) {
    return (
      <section style={memoryPageStyles.fullSection}>
        <div style={memoryPageStyles.loadingState}>
          <div style={styles.loadingSpinner} />
          <p style={styles.placeholderText}>Loading memory data...</p>
        </div>
      </section>
    );
  }

  if (!memoryData?.enabled) {
    return (
      <section style={memoryPageStyles.fullSection}>
        <div style={memoryPageStyles.disabledState}>
          <div style={memoryPageStyles.disabledIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#374151"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                d="M24 24L40 40M40 24L24 40"
                stroke="#6b7280"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 style={memoryPageStyles.disabledTitle}>
            Graphiti Not Configured
          </h2>
          <p style={memoryPageStyles.disabledText}>
            Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables
            to enable the knowledge graph.
          </p>
        </div>
      </section>
    );
  }

  if (!memoryData?.healthy) {
    return (
      <section style={memoryPageStyles.fullSection}>
        <div style={memoryPageStyles.disabledState}>
          <div style={memoryPageStyles.disabledIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#dc2626"
                strokeWidth="2"
                opacity="0.5"
              />
              <path
                d="M32 20V36M32 42V44"
                stroke="#dc2626"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 style={memoryPageStyles.disabledTitle}>Connection Failed</h2>
          <p style={memoryPageStyles.disabledText}>
            Check Neo4j database status and credentials.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={memoryPageStyles.fullSection}>
      {/* Ambient Background */}
      <div style={memoryPageStyles.ambientBg} />

      {/* Compact Stats Bar */}
      <div style={memoryPageStyles.compactStatsBar}>
        <div style={memoryPageStyles.titleArea}>
          <h1 style={memoryPageStyles.pageTitle}>Knowledge Graph</h1>
          <span style={memoryPageStyles.statusBadge}>
            <span style={memoryPageStyles.statusDot} />
            Connected
          </span>
        </div>
        <div style={memoryPageStyles.statsRow}>
          <CompactStat
            label="Facts"
            value={memoryData.stats.totalFacts}
            accent
          />
          <CompactStat
            label="Entities"
            value={memoryData.stats.totalEntities}
          />
          <CompactStat
            label="Recent 24h"
            value={memoryData.stats.recentFacts}
          />
          <CompactStat label="Patterns" value={memoryData.stats.patterns} />
          <CompactStat
            label="Preferences"
            value={memoryData.stats.preferences}
          />
        </div>
      </div>

      {/* Hero Graph Container */}
      <div style={memoryPageStyles.heroGraphContainer}>
        {memoryData.graph.nodes.length === 0 ? (
          <div style={memoryPageStyles.emptyGraph}>
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              style={{ opacity: 0.4 }}
            >
              <circle cx="40" cy="40" r="12" stroke="#6366f1" strokeWidth="2" />
              <circle cx="80" cy="35" r="10" stroke="#22c55e" strokeWidth="2" />
              <circle cx="60" cy="80" r="14" stroke="#8b5cf6" strokeWidth="2" />
              <line
                x1="50"
                y1="45"
                x2="72"
                y2="40"
                stroke="#e5e7eb"
                strokeWidth="1.5"
              />
              <line
                x1="45"
                y1="50"
                x2="55"
                y2="70"
                stroke="#e5e7eb"
                strokeWidth="1.5"
              />
              <line
                x1="75"
                y1="45"
                x2="68"
                y2="68"
                stroke="#e5e7eb"
                strokeWidth="1.5"
              />
            </svg>
            <p style={memoryPageStyles.emptyTitle}>
              No entities in the graph yet
            </p>
            <p style={memoryPageStyles.emptySubtitle}>
              Facts will appear here as the agent learns from interactions
            </p>
          </div>
        ) : (
          <KnowledgeGraph
            nodes={memoryData.graph.nodes}
            edges={memoryData.graph.edges}
          />
        )}
      </div>

      {/* Collapsible Facts Panel */}
      <div
        style={{
          ...memoryPageStyles.factsPanel,
          ...(factsExpanded ? memoryPageStyles.factsPanelExpanded : {}),
        }}
      >
        <div
          style={memoryPageStyles.factsPanelHeader}
          onClick={() => setFactsExpanded(!factsExpanded)}
        >
          <div style={memoryPageStyles.factsPanelTitle}>
            <span style={memoryPageStyles.factsPanelIcon}>
              {factsExpanded ? "▼" : "▲"}
            </span>
            Recent Facts
            <span style={memoryPageStyles.factsBadge}>
              {memoryData.recentFacts.length}
            </span>
          </div>
          <span style={memoryPageStyles.factsPanelHint}>
            {factsExpanded ? "Click to collapse" : "Click to expand"}
          </span>
        </div>

        {factsExpanded && (
          <div style={memoryPageStyles.factsContent}>
            {memoryData.recentFacts.length === 0 ? (
              <p style={memoryPageStyles.noFacts}>No facts recorded yet.</p>
            ) : (
              <div style={memoryPageStyles.factsGrid}>
                {memoryData.recentFacts.slice(0, 12).map((fact, index) => (
                  <div key={index} style={memoryPageStyles.factCard}>
                    <div style={memoryPageStyles.factCardHeader}>
                      <span style={memoryPageStyles.factConfidence}>
                        {(fact.score * 100).toFixed(0)}%
                      </span>
                      {fact.validAt && (
                        <span style={memoryPageStyles.factDate}>
                          {new Date(fact.validAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p style={memoryPageStyles.factText}>{fact.fact}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Compact Stat Component for the stats bar
function CompactStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div style={memoryPageStyles.compactStat}>
      <span
        style={{
          ...memoryPageStyles.compactStatValue,
          ...(accent ? { color: COLORS.accent } : {}),
        }}
      >
        {value.toLocaleString()}
      </span>
      <span style={memoryPageStyles.compactStatLabel}>{label}</span>
    </div>
  );
}

// Memory Page Styles
const memoryPageStyles: Record<string, CSSProperties> = {
  fullSection: {
    position: "relative",
    height: "calc(100vh - 4rem)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    margin: "-2rem -3rem",
    padding: "0",
    background: "#000",
  },
  ambientBg: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at center, #050a15 0%, #000 100%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  loadingState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    background: "radial-gradient(circle at center, #050a15 0%, #000 100%)",
  },
  disabledState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "2rem",
    background: "radial-gradient(circle at center, #050a15 0%, #000 100%)",
  },
  disabledIcon: {
    marginBottom: "0.5rem",
  },
  disabledTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Georgia, serif",
  },
  disabledText: {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    maxWidth: "400px",
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
  },
  compactStatsBar: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    background: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(100, 200, 255, 0.15)",
  },
  titleArea: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: 400,
    letterSpacing: "0.05em",
    color: "rgba(255, 255, 255, 0.9)",
    margin: 0,
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#00ffff",
    background: "rgba(0, 255, 255, 0.1)",
    padding: "0.25rem 0.6rem",
    borderRadius: "12px",
    border: "1px solid rgba(0, 255, 255, 0.2)",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#00ffff",
    boxShadow: "0 0 8px #00ffff",
    animation: "pulse 2s ease-in-out infinite",
  },
  statsRow: {
    display: "flex",
    gap: "2rem",
  },
  compactStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  compactStatValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.9)",
  },
  compactStatLabel: {
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "rgba(255, 255, 255, 0.4)",
  },
  heroGraphContainer: {
    position: "relative",
    zIndex: 5,
    flex: 1,
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
  },
  emptyGraph: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "3rem",
  },
  emptyTitle: {
    fontSize: "1.1rem",
    fontWeight: 400,
    color: "rgba(255, 255, 255, 0.6)",
    margin: 0,
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
  },
  emptySubtitle: {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.4)",
    margin: 0,
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
  },
  factsPanel: {
    position: "relative",
    zIndex: 10,
    background: "rgba(0, 0, 0, 0.9)",
    backdropFilter: "blur(12px)",
    borderTop: "1px solid rgba(100, 200, 255, 0.15)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  factsPanelExpanded: {
    maxHeight: "280px",
  },
  factsPanelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 2rem",
    cursor: "pointer",
    userSelect: "none",
    transition: "background 0.2s",
  },
  factsPanelTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
  },
  factsPanelIcon: {
    fontSize: "0.6rem",
    color: "rgba(255, 255, 255, 0.4)",
  },
  factsBadge: {
    fontSize: "0.7rem",
    fontWeight: 600,
    background: "rgba(0, 255, 255, 0.2)",
    color: "#00ffff",
    padding: "0.1rem 0.5rem",
    borderRadius: "10px",
    border: "1px solid rgba(0, 255, 255, 0.3)",
  },
  factsPanelHint: {
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.4)",
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
  },
  factsContent: {
    padding: "0 2rem 1.5rem",
    maxHeight: "200px",
    overflowY: "auto",
  },
  noFacts: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.4)",
    padding: "1rem",
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
  },
  factsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "0.75rem",
  },
  factCard: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(100, 200, 255, 0.1)",
    borderRadius: "6px",
    padding: "0.75rem 1rem",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  factCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.4rem",
  },
  factConfidence: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#00ffff",
  },
  factDate: {
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.4)",
  },
  factText: {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 1.4,
    margin: 0,
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
  },
};

// D3 simulation node type
interface SimNode {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
  id: string;
  fact: string;
}

function KnowledgeGraph({
  nodes,
  edges,
}: {
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ id: string; source: string; target: string; fact: string }>;
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const [positions, setPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const VIEW_WIDTH = 1600;
  const VIEW_HEIGHT = 900;

  // D3 force simulation setup
  useEffect(() => {
    if (nodes.length === 0) {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      return;
    }

    // Create simulation nodes with random initial positions spread across canvas
    const simNodes: SimNode[] = nodes.map((node, i) => {
      // Check if we have an existing position for this node
      const existing = simNodesRef.current.find((n) => n.id === node.id);
      if (existing && existing.x !== undefined && existing.y !== undefined) {
        return { ...node, x: existing.x, y: existing.y };
      }
      // Spread initial positions randomly across the canvas
      return {
        ...node,
        x: Math.random() * (VIEW_WIDTH - 160) + 80,
        y: Math.random() * (VIEW_HEIGHT - 160) + 80,
      };
    });

    simNodesRef.current = simNodes;

    // Create simulation links
    const simLinks: SimLink[] = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      id: edge.id,
      fact: edge.fact,
    }));

    // Stop any existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create new D3 force simulation
    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(150)
          .strength(0.5),
      )
      .force("charge", d3.forceManyBody().strength(-400).distanceMax(500))
      .force("center", d3.forceCenter(VIEW_WIDTH / 2, VIEW_HEIGHT / 2))
      .force("collide", d3.forceCollide<SimNode>().radius(50).strength(0.8))
      .force("x", d3.forceX(VIEW_WIDTH / 2).strength(0.05))
      .force("y", d3.forceY(VIEW_HEIGHT / 2).strength(0.05))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    // Update positions on each tick
    simulation.on("tick", () => {
      const newPositions = new Map<string, { x: number; y: number }>();
      simNodes.forEach((node) => {
        // Clamp positions to bounds
        const x = Math.max(
          80,
          Math.min(VIEW_WIDTH - 80, node.x ?? VIEW_WIDTH / 2),
        );
        const y = Math.max(
          80,
          Math.min(VIEW_HEIGHT - 80, node.y ?? VIEW_HEIGHT / 2),
        );
        node.x = x;
        node.y = y;
        newPositions.set(node.id, { x, y });
      });
      setPositions(newPositions);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes.length, nodes.map((n) => n.id).join(","), edges.length]);

  const getSVGPoint = (
    e: React.MouseEvent<SVGElement> | MouseEvent,
  ): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const scaleX = VIEW_WIDTH / rect.width / zoom;
    const scaleY = VIEW_HEIGHT / rect.height / zoom;

    return {
      x: (e.clientX - rect.left) * scaleX - pan.x / zoom,
      y: (e.clientY - rect.top) * scaleY - pan.y / zoom,
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(2.5, Math.max(0.5, zoom * delta));
    setZoom(newZoom);
  };

  const handlePanStart = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNode) return;
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handlePanMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNodeMouseDown = (
    nodeId: string,
    e: React.MouseEvent<SVGElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const pos = positions.get(nodeId);
    if (!pos) return;

    const svgPoint = getSVGPoint(e);
    dragOffsetRef.current = {
      x: pos.x - svgPoint.x,
      y: pos.y - svgPoint.y,
    };

    setDraggedNode(nodeId);

    const simNode = simNodesRef.current.find((n) => n.id === nodeId);
    if (simNode && simulationRef.current) {
      simNode.fx = pos.x;
      simNode.fy = pos.y;
      simulationRef.current.alphaTarget(0.3).restart();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNode) return;

    const svgPoint = getSVGPoint(e);
    const newX = Math.max(
      80,
      Math.min(VIEW_WIDTH - 80, svgPoint.x + dragOffsetRef.current.x),
    );
    const newY = Math.max(
      80,
      Math.min(VIEW_HEIGHT - 80, svgPoint.y + dragOffsetRef.current.y),
    );

    const simNode = simNodesRef.current.find((n) => n.id === draggedNode);
    if (simNode) {
      simNode.fx = newX;
      simNode.fy = newY;
      simNode.x = newX;
      simNode.y = newY;
    }

    setPositions((prev) => {
      const newPositions = new Map(prev);
      newPositions.set(draggedNode, { x: newX, y: newY });
      return newPositions;
    });
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      const simNode = simNodesRef.current.find((n) => n.id === draggedNode);
      if (simNode && simulationRef.current) {
        simNode.fx = null;
        simNode.fy = null;
        simulationRef.current.alphaTarget(0);
      }
    }
    setDraggedNode(null);
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
  };

  const getNodeColor = (type: string) =>
    NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.default;

  // Determine which nodes should be highlighted (via hover or selection)
  const activeNode = draggedNode || hoveredNode || selectedNode;
  const connectedNodes = activeNode
    ? new Set(
        edges
          .filter((e) => e.source === activeNode || e.target === activeNode)
          .flatMap((e) => [e.source, e.target]),
      )
    : null;

  return (
    <div ref={containerRef} style={memoryStyles.graphContainer}>
      <div style={memoryStyles.graphControls}>
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
          style={memoryStyles.zoomBtn}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))}
          style={memoryStyles.zoomBtn}
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={resetView}
          style={memoryStyles.zoomBtn}
          title="Reset View"
        >
          ⟲
        </button>
        <span style={memoryStyles.zoomLabel}>{Math.round(zoom * 100)}%</span>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: "block",
          cursor: isPanning ? "grabbing" : draggedNode ? "grabbing" : "grab",
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: "center center",
          transition:
            isPanning || draggedNode ? "none" : "transform 0.1s ease-out",
        }}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handlePanMove(e);
        }}
        onMouseUp={() => {
          handleMouseUp();
          handlePanEnd();
        }}
        onMouseLeave={() => {
          handleMouseUp();
          handlePanEnd();
        }}
        onMouseDown={handlePanStart}
        onClick={handleBackgroundClick}
        onWheel={handleWheel}
      >
        <defs>
          <linearGradient id="etherealGrad">
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#ff00ff" />
          </linearGradient>
          <linearGradient id="etherealGradAlt">
            <stop offset="0%" stopColor="#ff00ff" />
            <stop offset="100%" stopColor="#00ffff" />
          </linearGradient>
          <filter id="nodeBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="strongGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="bgGlow1" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <radialGradient id="bgGlow2" cx="70%" cy="70%" r="40%">
            <stop offset="0%" stopColor="rgba(100, 200, 255, 0.03)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="bgGlow3" cx="20%" cy="80%" r="35%">
            <stop offset="0%" stopColor="rgba(255, 100, 255, 0.02)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#bgGlow1)" />
        <rect width="100%" height="100%" fill="url(#bgGlow2)" />
        <rect width="100%" height="100%" fill="url(#bgGlow3)" />

        {edges.map((edge) => {
          const sourcePos = positions.get(edge.source);
          const targetPos = positions.get(edge.target);
          if (!sourcePos || !targetPos) return null;

          const isHighlighted =
            hoveredEdge === edge.id ||
            activeNode === edge.source ||
            activeNode === edge.target;

          const isDraggingConnected =
            draggedNode &&
            (edge.source === draggedNode || edge.target === draggedNode);

          const midX = (sourcePos.x + targetPos.x) / 2;
          const midY = (sourcePos.y + targetPos.y) / 2;
          const curveOffset = 20 + Math.random() * 10;
          const ctrlX = midX + curveOffset;
          const ctrlY = midY - curveOffset;

          return (
            <g key={edge.id}>
              <path
                d={`M ${sourcePos.x} ${sourcePos.y} Q ${ctrlX} ${ctrlY} ${targetPos.x} ${targetPos.y}`}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
              <path
                d={`M ${sourcePos.x} ${sourcePos.y} Q ${ctrlX} ${ctrlY} ${targetPos.x} ${targetPos.y}`}
                fill="none"
                stroke={isHighlighted ? "#fff" : "url(#etherealGrad)"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={isHighlighted ? 0.6 : 0.2}
                strokeLinecap="round"
                filter={isHighlighted ? "url(#nodeGlow)" : undefined}
                style={{
                  transition: "all 0.3s ease",
                  pointerEvents: "none",
                }}
              />
              {isHighlighted && !isDraggingConnected && (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={ctrlX - 120}
                    y={ctrlY - 28}
                    width={240}
                    height={36}
                    rx={4}
                    fill="rgba(0, 0, 0, 0.85)"
                    stroke="rgba(100, 200, 255, 0.3)"
                    strokeWidth={1}
                  />
                  <text
                    x={ctrlX}
                    y={ctrlY - 6}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.8)"
                    fontSize="12"
                    fontFamily="Georgia, serif"
                    fontStyle="italic"
                  >
                    {edge.fact.length > 45
                      ? edge.fact.slice(0, 45) + "..."
                      : edge.fact}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {nodes.map((node, index) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const isHovered = hoveredNode === node.id;
          const isSelected = selectedNode === node.id;
          const isDragging = draggedNode === node.id;
          const isConnected = connectedNodes?.has(node.id);
          const isDimmed =
            activeNode &&
            !isConnected &&
            !isHovered &&
            !isSelected &&
            !isDragging;

          const baseRadius = 8 + (index % 5) * 4;
          const radius =
            isHovered || isSelected || isDragging
              ? baseRadius * 1.3
              : baseRadius;

          return (
            <g
              key={node.id}
              style={{
                cursor: isDragging ? "grabbing" : "grab",
                opacity: isDimmed ? 0.3 : 1,
                transition: isDragging ? "none" : "opacity 0.3s ease",
              }}
              onMouseEnter={() => !draggedNode && setHoveredNode(node.id)}
              onMouseLeave={() => !draggedNode && setHoveredNode(null)}
              onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
              onClick={(e) => handleNodeClick(node.id, e)}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill="rgba(255, 255, 255, 0.05)"
                stroke={
                  isHovered || isSelected ? "#fff" : "rgba(100, 200, 255, 0.4)"
                }
                strokeWidth={isHovered || isSelected ? 2 : 1}
                filter={
                  isHovered || isSelected
                    ? "url(#strongGlow)"
                    : "url(#nodeBlur)"
                }
                style={{
                  transition: isDragging ? "none" : "all 0.2s ease",
                }}
              />
              <text
                x={pos.x}
                y={pos.y + radius + 18}
                textAnchor="middle"
                fill={
                  isHovered || isSelected
                    ? "rgba(255, 255, 255, 0.9)"
                    : "rgba(255, 255, 255, 0.6)"
                }
                fontSize="14"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontStyle="italic"
                style={{
                  transition: "all 0.2s ease",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {node.label.length > 20
                  ? node.label.slice(0, 20) + "..."
                  : node.label}
              </text>
              {(isHovered || isSelected) && (
                <text
                  x={pos.x}
                  y={pos.y + radius + 34}
                  textAnchor="middle"
                  fill="rgba(100, 200, 255, 0.7)"
                  fontSize="11"
                  fontFamily="Georgia, serif"
                  fontStyle="italic"
                  style={{ pointerEvents: "none" }}
                >
                  {node.type}
                </text>
              )}
            </g>
          );
        })}

        {nodes.length === 0 && (
          <text
            x={VIEW_WIDTH / 2}
            y={VIEW_HEIGHT / 2}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.4)"
            fontSize="18"
            fontFamily="Georgia, serif"
            fontStyle="italic"
          >
            awaiting knowledge...
          </text>
        )}
      </svg>

      <div style={memoryStyles.legendContainer}>
        <div style={memoryStyles.legendItem}>
          <div
            style={{
              ...memoryStyles.legendDot,
              background: "linear-gradient(135deg, #00ffff, #ff00ff)",
            }}
          />
          <span>connections</span>
        </div>
        <div style={memoryStyles.legendItem}>
          <span
            style={{ color: "rgba(255, 255, 255, 0.5)", fontStyle: "italic" }}
          >
            drag to explore • scroll to zoom
          </span>
        </div>
      </div>
    </div>
  );
}

const memoryStyles: Record<string, CSSProperties> = {
  graphContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    overflow: "hidden",
    background: "radial-gradient(circle at center, #050a15 0%, #000 100%)",
    boxShadow:
      "0 0 60px rgba(100, 200, 255, 0.1), inset 0 0 120px rgba(0, 0, 0, 0.5)",
  },
  graphControls: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    zIndex: 20,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(12px)",
    padding: "0.4rem",
    borderRadius: "8px",
    border: "1px solid rgba(100, 200, 255, 0.2)",
  },
  zoomBtn: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(100, 200, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.7)",
    transition: "all 0.15s ease",
  },
  zoomLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.5)",
    minWidth: "40px",
    textAlign: "center",
  },
  legendContainer: {
    position: "absolute",
    bottom: "1rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "1.5rem",
    justifyContent: "center",
    alignItems: "center",
    padding: "0.6rem 1.25rem",
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    border: "1px solid rgba(100, 200, 255, 0.15)",
    zIndex: 20,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "Georgia, serif",
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  factIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "linear-gradient(135deg, #ddd6fe 0%, #e9d5ff 100%)",
  },
  factIconInner: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#7c3aed",
  },
  factScore: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    fontSize: "0.8rem",
    color: COLORS.accent,
  },
};

function SimulatorResponseContent({ response }: { response: AgentResponse }) {
  return (
    <>
      <div style={styles.responseSection}>
        <span style={{ color: COLORS.success }}>
          &gt; {response.success ? "RESPONSE RECEIVED" : "RESPONSE FAILED"}
        </span>
        <p style={styles.responseMessage}>"{response.message}"</p>
      </div>

      <div style={styles.metadataSection}>
        <div style={styles.metadataLabel}>METADATA</div>
        <div style={styles.metadataGrid}>
          <div>
            Tokens:{" "}
            <span style={{ color: COLORS.accent }}>
              {response.metadata.tokensUsed}
            </span>
          </div>
          <div>
            Time:{" "}
            <span style={{ color: COLORS.accent }}>
              {response.metadata.processingTimeMs}ms
            </span>
          </div>
          <div>
            Skills:{" "}
            <span style={{ color: COLORS.accent }}>
              {response.metadata.skillsExecuted.length}
            </span>
          </div>
        </div>
      </div>

      {response.metadata.skillsExecuted.length > 0 && (
        <div style={styles.metadataSection}>
          <div style={styles.metadataLabel}>SKILLS EXECUTED</div>
          <ul style={styles.actionsList}>
            {response.metadata.skillsExecuted.map((skill) => (
              <li key={skill}>• {skill}</li>
            ))}
          </ul>
        </div>
      )}

      {response.actions.length > 0 && (
        <div style={styles.actionsSection}>
          <div style={styles.metadataLabel}>ACTIONS TAKEN</div>
          <ul style={styles.actionsList}>
            {response.actions.map((action, index) => (
              <li key={index}>
                • {action.type}:{" "}
                {action.type === "task_created"
                  ? `${action.title}`
                  : action.type === "task_completed"
                    ? `Task ${action.taskId}`
                    : JSON.stringify(action)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

const LOG_LEVEL_COLORS: Record<string, string> = {
  debug: "#6b7280",
  info: "#22d3ee",
  warn: "#fbbf24",
  error: "#f87171",
};

function formatEventType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function getEventDetails(
  event: AgentLogEvent,
): Array<{ key: string; value: string }> {
  const details: Array<{ key: string; value: string }> = [];
  const entries = Object.entries(event);

  for (const [key, value] of entries) {
    if (key === "type") continue;

    let displayValue: string;
    if (typeof value === "object" && value !== null) {
      displayValue = JSON.stringify(value, null, 2);
    } else if (typeof value === "boolean") {
      displayValue = value ? "true" : "false";
    } else {
      displayValue = String(value);
    }

    details.push({ key, value: displayValue });
  }

  return details;
}

function AgentLogsViewer({ trace }: { trace: AgentExecutionTrace }) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleLogExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLogs(new Set(trace.logs.map((log) => log.id)));
  };

  const collapseAll = () => {
    setExpandedLogs(new Set());
  };

  return (
    <div style={logsStyles.container}>
      <div
        style={logsStyles.header}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={logsStyles.headerLeft}>
          <span style={logsStyles.headerChevron}>
            {isCollapsed ? "▶" : "▼"}
          </span>
          <span style={logsStyles.headerTitle}>EXECUTION TRACE</span>
          <span style={logsStyles.traceId}>{trace.traceId}</span>
        </div>
        <div style={logsStyles.headerRight}>{trace.logs.length} events</div>
      </div>

      {!isCollapsed && (
        <>
          {trace.summary && (
            <div style={logsStyles.summary}>
              <div style={logsStyles.summaryItem}>
                <span style={logsStyles.summaryValue}>
                  {trace.summary.totalDurationMs}
                </span>
                <span style={logsStyles.summaryLabel}>ms</span>
              </div>
              <div style={logsStyles.summaryDivider} />
              <div style={logsStyles.summaryItem}>
                <span style={logsStyles.summaryValue}>
                  {trace.summary.llmCalls}
                </span>
                <span style={logsStyles.summaryLabel}>LLM calls</span>
              </div>
              <div style={logsStyles.summaryDivider} />
              <div style={logsStyles.summaryItem}>
                <span style={logsStyles.summaryValue}>
                  {trace.summary.toolCalls}
                </span>
                <span style={logsStyles.summaryLabel}>Tool calls</span>
              </div>
              <div style={logsStyles.summaryDivider} />
              <div style={logsStyles.summaryItem}>
                <span style={logsStyles.summaryValue}>
                  {trace.summary.tokensUsed.toLocaleString()}
                </span>
                <span style={logsStyles.summaryLabel}>tokens</span>
              </div>
              <div style={logsStyles.summaryDivider} />
              <div style={logsStyles.summaryItem}>
                <span
                  style={{
                    ...logsStyles.summaryValue,
                    color: trace.summary.success ? "#22c55e" : "#f87171",
                  }}
                >
                  {trace.summary.success ? "SUCCESS" : "FAILED"}
                </span>
              </div>
            </div>
          )}

          <div style={logsStyles.controls}>
            <button
              style={logsStyles.controlBtn}
              onClick={(e) => {
                e.stopPropagation();
                expandAll();
              }}
            >
              Expand All
            </button>
            <button
              style={logsStyles.controlBtn}
              onClick={(e) => {
                e.stopPropagation();
                collapseAll();
              }}
            >
              Collapse All
            </button>
          </div>

          <div style={logsStyles.logsList}>
            {trace.logs.map((log, index) => (
              <LogEntryItem
                key={log.id}
                log={log}
                index={index}
                isExpanded={expandedLogs.has(log.id)}
                onToggle={() => toggleLogExpanded(log.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LogEntryItem({
  log,
  index,
  isExpanded,
  onToggle,
}: {
  log: AgentLogEntry;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const levelColor = LOG_LEVEL_COLORS[log.level] || LOG_LEVEL_COLORS.info;
  const details = getEventDetails(log.event);
  const hasDetails = details.length > 0;

  return (
    <div
      style={{
        ...logsStyles.logEntry,
        ...(isHovered ? logsStyles.logEntryHover : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={logsStyles.logEntryHeader}
        onClick={hasDetails ? onToggle : undefined}
      >
        <span style={logsStyles.lineNumber}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span style={logsStyles.timestamp}>
          {formatTimestamp(log.timestamp)}
        </span>
        <span
          style={{
            ...logsStyles.levelBadge,
            color: levelColor,
            borderColor: levelColor,
          }}
        >
          {log.level.toUpperCase()}
        </span>
        <span style={logsStyles.eventType}>
          {formatEventType(log.event.type)}
        </span>
        {log.durationMs !== undefined && (
          <span style={logsStyles.duration}>+{log.durationMs}ms</span>
        )}
        {hasDetails && (
          <span style={logsStyles.expandIndicator}>
            {isExpanded ? "▼" : "▶"}
          </span>
        )}
      </div>

      {isExpanded && hasDetails && (
        <div style={logsStyles.logDetails}>
          {details.map(({ key, value }) => (
            <div key={key} style={logsStyles.detailRow}>
              <span style={logsStyles.detailKey}>{key}:</span>
              <span
                style={{
                  ...logsStyles.detailValue,
                  ...(value.includes("\n") ? { whiteSpace: "pre-wrap" } : {}),
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const logsStyles: Record<string, CSSProperties> = {
  container: {
    background: "#0d1117",
    borderTop: "1px solid #30363d",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.8rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.25rem",
    background: "linear-gradient(180deg, #161b22 0%, #0d1117 100%)",
    borderBottom: "1px solid #30363d",
    cursor: "pointer",
    userSelect: "none",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  headerChevron: {
    color: "#8b949e",
    fontSize: "0.65rem",
  },
  headerTitle: {
    color: "#c9d1d9",
    fontWeight: 600,
    letterSpacing: "0.1em",
    fontSize: "0.7rem",
  },
  traceId: {
    color: "#484f58",
    fontSize: "0.7rem",
  },
  headerRight: {
    color: "#8b949e",
    fontSize: "0.75rem",
  },
  summary: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem 1.25rem",
    background: "#161b22",
    borderBottom: "1px solid #21262d",
  },
  summaryItem: {
    display: "flex",
    alignItems: "baseline",
    gap: "0.35rem",
  },
  summaryValue: {
    color: "#58a6ff",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
  summaryLabel: {
    color: "#8b949e",
    fontSize: "0.7rem",
  },
  summaryDivider: {
    width: "1px",
    height: "16px",
    background: "#30363d",
  },
  controls: {
    display: "flex",
    gap: "0.5rem",
    padding: "0.5rem 1.25rem",
    borderBottom: "1px solid #21262d",
  },
  controlBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    color: "#8b949e",
    fontSize: "0.65rem",
    padding: "0.25rem 0.5rem",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    transition: "all 0.15s ease",
  },
  logsList: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  logEntry: {
    borderBottom: "1px solid #21262d",
    transition: "background 0.1s ease",
  },
  logEntryHover: {
    background: "#161b22",
  },
  logEntryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 1.25rem",
    cursor: "pointer",
  },
  lineNumber: {
    color: "#484f58",
    fontSize: "0.7rem",
    minWidth: "20px",
  },
  timestamp: {
    color: "#6e7681",
    fontSize: "0.75rem",
    minWidth: "90px",
  },
  levelBadge: {
    fontSize: "0.6rem",
    fontWeight: 700,
    padding: "0.1rem 0.4rem",
    border: "1px solid",
    minWidth: "45px",
    textAlign: "center",
  },
  eventType: {
    color: "#c9d1d9",
    flex: 1,
  },
  duration: {
    color: "#484f58",
    fontSize: "0.7rem",
  },
  expandIndicator: {
    color: "#484f58",
    fontSize: "0.6rem",
    marginLeft: "auto",
  },
  logDetails: {
    padding: "0.5rem 1.25rem 0.75rem 3.5rem",
    background: "#0d1117",
    borderTop: "1px solid #21262d",
  },
  detailRow: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "0.35rem",
    alignItems: "flex-start",
  },
  detailKey: {
    color: "#7ee787",
    minWidth: "120px",
    flexShrink: 0,
  },
  detailValue: {
    color: "#8b949e",
    wordBreak: "break-word",
  },
};

// Styles
const styles: Record<string, CSSProperties> = {
  // Layout
  body: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    background: COLORS.bg,
    color: COLORS.text,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "16px",
  },
  loadingSpinner: {
    width: "32px",
    height: "32px",
    border: `3px solid ${COLORS.border}`,
    borderTopColor: COLORS.accent,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: "0.9rem",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  errorText: {
    color: "#dc2626",
    fontFamily: "'JetBrains Mono', monospace",
  },

  // Grid lines
  gridLine: {
    position: "fixed" as const,
    background: COLORS.border,
    zIndex: 0,
    pointerEvents: "none" as const,
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

  // Sidebar
  aside: {
    width: "260px",
    height: "100vh",
    background: COLORS.surface,
    borderRight: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column" as const,
    padding: "2rem 0",
    zIndex: 10,
    position: "relative" as const,
  },
  logo: {
    padding: "0 2rem 3rem 2rem",
    fontWeight: 700,
    fontSize: "0.8rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
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
  nav: {
    flexGrow: 1,
  },
  navList: {
    listStyle: "none",
  },
  navItem: {
    position: "relative" as const,
    marginBottom: "4px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem 2rem",
    textDecoration: "none",
    color: COLORS.muted,
    fontSize: "0.9rem",
    fontWeight: 500,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    borderLeft: "3px solid transparent",
    cursor: "pointer",
  },
  navLinkHover: {
    color: COLORS.text,
    background: "rgba(99, 102, 241, 0.05)",
  },
  navLinkActive: {
    color: COLORS.accent,
    background: "rgba(99, 102, 241, 0.08)",
    borderLeft: `3px solid ${COLORS.accent}`,
  },
  navDivider: {
    height: "1px",
    background: COLORS.border,
    margin: "1.5rem 2rem",
    listStyle: "none",
  },
  simulatorLink: {
    color: COLORS.accent,
    fontWeight: 600,
    background:
      "linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)",
  },

  // Main content
  main: {
    flexGrow: 1,
    height: "100vh",
    overflowY: "auto" as const,
    position: "relative" as const,
    zIndex: 5,
    padding: "2rem 3rem",
  },
  pageTransition: {
    animation: "fadeIn 0.4s ease-out",
  },
  pageHeader: {
    marginBottom: "2.5rem",
  },
  pageTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  pageSubtitle: {
    color: COLORS.muted,
    fontSize: "0.95rem",
    marginTop: "0.5rem",
  },

  // Stats Grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1.5rem",
    marginBottom: "2.5rem",
  },
  statCard: {
    background: COLORS.vellumBg,
    backdropFilter: "blur(8px)",
    border: `1px solid ${COLORS.border}`,
    padding: "1.5rem",
    position: "relative" as const,
    transition: "transform 0.2s ease",
  },
  statCardCornerTL: {
    position: "absolute" as const,
    top: "-5px",
    left: "-5px",
    width: "10px",
    height: "10px",
    borderTop: `1px solid ${COLORS.muted}`,
    borderLeft: `1px solid ${COLORS.muted}`,
  },
  statCardCornerBR: {
    position: "absolute" as const,
    bottom: "-5px",
    right: "-5px",
    width: "10px",
    height: "10px",
    borderBottom: `1px solid ${COLORS.muted}`,
    borderRight: `1px solid ${COLORS.muted}`,
  },
  statLabel: {
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: COLORS.muted,
    marginBottom: "1rem",
    display: "block",
  },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "1.75rem",
    fontWeight: 600,
  },
  statSubValue: {
    fontSize: "0.6em",
    color: COLORS.muted,
    marginLeft: "4px",
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

  // Dashboard Content
  dashboardContent: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem",
  },
  sectionBox: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    position: "relative" as const,
  },
  sectionHeader: {
    padding: "1.25rem 1.5rem",
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },

  greetingBox: {
    background: `linear-gradient(135deg, ${COLORS.surface} 0%, rgba(99, 102, 241, 0.1) 100%)`,
    border: `1px solid ${COLORS.accent}`,
    borderRadius: "8px",
    padding: "1.25rem 1.5rem",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  greetingIcon: {
    fontSize: "1.5rem",
    flexShrink: 0,
  },
  greetingContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: "1rem",
    color: COLORS.text,
    lineHeight: 1.5,
  },
  greetingLoading: {
    fontSize: "0.9rem",
    color: COLORS.muted,
    fontStyle: "italic",
  },
  activityFeedList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  emptyActivity: {
    padding: "2rem 1.5rem",
    textAlign: "center" as const,
    color: COLORS.muted,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.5rem",
  },
  emptyActivityIcon: {
    fontSize: "1.5rem",
  },
  priorityLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "0.5rem",
    fontSize: "0.7rem",
    fontFamily: "'JetBrains Mono', monospace",
  },
  activityFeed: {
    listStyle: "none",
  },
  activityItem: {
    padding: "1.25rem 1.5rem",
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    gap: "1rem",
    transition: "background 0.2s",
  },
  channelIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "bold",
    flexShrink: 0,
  },
  activityContent: {
    flexGrow: 1,
  },
  activityMeta: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.25rem",
  },
  activityChannel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    fontSize: "0.8rem",
  },
  activityTime: {
    fontSize: "0.75rem",
    color: COLORS.muted,
    fontFamily: "'JetBrains Mono', monospace",
  },
  activityPreview: {
    fontSize: "0.9rem",
    color: COLORS.text,
    lineHeight: 1.4,
  },

  // Chart
  chartPlaceholder: {
    height: "200px",
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    padding: "1.5rem",
  },
  bar: {
    flexGrow: 1,
    background: COLORS.accent,
    position: "relative" as const,
    transition: "height 1s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  barLabel: {
    position: "absolute" as const,
    bottom: "-20px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "0.6rem",
    color: COLORS.muted,
    whiteSpace: "nowrap" as const,
  },
  priorityRatioContainer: {
    padding: "1.5rem",
    borderTop: `1px solid ${COLORS.border}`,
  },
  priorityBar: {
    height: "8px",
    background: "#eee",
    display: "flex",
  },
  prioritySegment: {
    height: "100%",
  },

  // Tasks View
  filterButtons: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
  },
  btn: {
    padding: "0.75rem 1.5rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    fontSize: "0.875rem",
    fontFamily: "'Inter', sans-serif",
  },
  btnActive: {
    background: COLORS.text,
    color: "white",
    border: `1px solid ${COLORS.text}`,
  },
  btnOutline: {
    background: "transparent",
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
  },
  taskCard: {
    background: "white",
    border: `1px solid ${COLORS.border}`,
    padding: "1.25rem",
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  taskCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  priorityBadge: {
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "2px 8px",
    textTransform: "uppercase" as const,
    border: "1px solid currentColor",
    display: "inline-block",
  },
  taskTitle: {
    marginTop: "0.5rem",
    fontSize: "1rem",
    fontWeight: 600,
  },
  taskMeta: {
    color: COLORS.muted,
    fontSize: "0.85rem",
    marginTop: "0.25rem",
  },
  taskStats: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.8rem",
    textAlign: "right" as const,
    color: COLORS.muted,
  },
  taskTags: {
    display: "flex",
    gap: "10px",
    marginTop: "0.5rem",
  },
  taskTag: {
    background: "#f3f4f6",
    padding: "2px 8px",
    fontSize: "0.75rem",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "4rem 2rem",
    color: COLORS.muted,
  },

  // File Browser
  fileBrowser: {
    display: "flex",
    height: "600px",
    border: `1px solid ${COLORS.border}`,
  },
  fileTree: {
    width: "250px",
    borderRight: `1px solid ${COLORS.border}`,
    padding: "1rem",
    background: COLORS.bg,
  },
  fileContent: {
    flexGrow: 1,
    padding: "2rem",
    background: "white",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.85rem",
    lineHeight: 1.6,
    overflowY: "auto" as const,
  },
  fileContentPre: {
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
  treeItem: {
    padding: "4px 0",
    fontSize: "0.9rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "color 0.15s",
  },

  // Placeholder pages
  placeholderBox: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    padding: "4rem 2rem",
    textAlign: "center" as const,
  },
  placeholderIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  placeholderText: {
    fontSize: "1.1rem",
    fontWeight: 500,
    color: COLORS.text,
  },
  placeholderSubtext: {
    fontSize: "0.9rem",
    color: COLORS.muted,
    marginTop: "0.5rem",
  },

  simulatorContainer: {
    border: `1px solid ${COLORS.border}`,
    height: "calc(100vh - 200px)",
    overflow: "hidden",
  },
  simulatorLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    height: "100%",
  },
  composer: {
    padding: "2.5rem",
    overflowY: "auto" as const,
    borderRight: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
  },
  responsePanel: {
    display: "flex",
    flexDirection: "column" as const,
    background: "#1a1a1a",
    overflowY: "auto" as const,
  },
  responseView: {
    padding: "2.5rem",
    flex: 1,
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  inputLabel: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    marginBottom: "0.5rem",
    color: COLORS.muted,
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    resize: "vertical" as const,
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    background: "white",
  },
  btnPrimary: {
    padding: "0.75rem 1.5rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    background: COLORS.accent,
    color: "white",
    fontSize: "0.875rem",
    fontFamily: "'Inter', sans-serif",
  },
  presetsSection: {
    marginTop: "2rem",
  },
  presetsGrid: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
  },
  presetBtn: {
    fontSize: "0.7rem",
    padding: "0.5rem 0.75rem",
    border: `1px solid ${COLORS.border}`,
    background: "transparent",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.2s",
  },
  processingText: {
    fontFamily: "'JetBrains Mono', monospace",
    color: COLORS.accent,
  },
  waitingText: {
    color: "#666",
  },
  responseSection: {
    marginBottom: "2rem",
  },
  responseMessage: {
    marginTop: "1rem",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.5,
  },
  metadataSection: {
    borderTop: "1px solid #333",
    paddingTop: "1rem",
  },
  metadataLabel: {
    color: "#666",
    fontSize: "0.8rem",
    marginBottom: "1rem",
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    fontSize: "0.8rem",
  },
  actionsSection: {
    marginTop: "2rem",
  },
  actionsList: {
    listStyle: "none",
    fontSize: "0.8rem",
    color: "#aaa",
  },
};
