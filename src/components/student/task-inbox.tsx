import { LuClipboardList, LuCircleCheck, LuClock, LuArrowRight } from "react-icons/lu";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/services/database";

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed";
  link: string;
}

export function TaskInbox() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        // Using Tanmay Sen's ID for demo
        const data = await db.getTasks("5b07cc4f-361e-4493-a412-78b6aecd0110");
        const formatted = (data || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: t.due_date ? db.formatRelativeTime(t.due_date) : 'No Date',
          priority: t.priority,
          status: t.status,
          link: t.link || '#'
        }));
        setTasks(formatted);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const handleToggle = async (taskId: string, currentStatus: string) => {
    try {
      const updatedTask = await db.toggleTaskStatus(taskId, currentStatus);
      setTasks(tasks.map(t => t.id === taskId ? { 
        ...t, 
        status: updatedTask.status 
      } : t));
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  if (loading) return (
    <div className="app-card p-12 text-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold text-muted mt-4 uppercase tracking-widest">Loading Missions...</p>
    </div>
  );

  return (
    <div className="app-card overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-background/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <LuClipboardList size={22} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">Mission Control</h3>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Pending Actions</p>
          </div>
        </div>
        <div className="h-8 px-3 rounded-full bg-secondary/20 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-secondary-dark animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-tight text-foreground">{tasks.filter(t => t.status === 'pending').length} Active</span>
        </div>
      </div>

      <div className="divide-y border-border-subtle">
        {tasks.map((task) => (
          <div key={task.id} className="p-6 hover:bg-background/50 transition-all group flex items-start gap-6">
            <button 
              onClick={() => handleToggle(task.id, task.status)}
              className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.status === "completed" 
                  ? "bg-primary border-primary text-white" 
                  : "border-border-subtle group-hover:border-primary"
              }`}
            >
              {task.status === "completed" && <LuCircleCheck size={14} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-display text-lg font-bold tracking-tight group-hover:text-primary transition-colors truncate">
                  {task.title}
                </h4>
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                  task.dueDate.includes('now') || task.dueDate.includes('hours') ? "text-primary" : "text-muted"
                }`}>
                  <LuClock size={12} />
                  {task.dueDate}
                </div>
              </div>
              <p className="text-sm font-medium text-muted mt-1 leading-relaxed line-clamp-1">
                {task.description}
              </p>
              
              <div className="mt-4 flex items-center gap-4">
                <Link href={task.link} className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 hover:gap-3 transition-all">
                  Execute Task <LuArrowRight size={14} />
                </Link>
                {task.priority === "high" && (
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                    Critical
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="p-12 text-center text-muted italic text-sm">All clear! No pending missions.</div>
        )}
      </div>
      
      <div className="p-4 bg-background/50 border-t border-border-subtle text-center">
        <button className="text-[10px] font-bold text-muted hover:text-primary uppercase tracking-[0.2em] transition-colors">
          View Archived Missions
        </button>
      </div>
    </div>
  );
}

