import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Circle, ClipboardList, Github, Plus, RefreshCw, Server, Trash2 } from 'lucide-react';

const API = '/api';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Connecting to API…');
  const [busy, setBusy] = useState(false);

  async function loadTasks() {
    try {
      const response = await fetch(`${API}/tasks`);
      if (!response.ok) throw new Error('API request failed');
      setTasks(await response.json());
      setStatus('Backend connected');
    } catch {
      setStatus('Backend unavailable — check the API container');
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!response.ok) throw new Error('Could not add task');
      setTitle('');
      await loadTasks();
    } catch { setStatus('Could not add task'); }
    finally { setBusy(false); }
  }

  async function toggleTask(id) {
    await fetch(`${API}/tasks/${id}`, { method: 'PATCH' });
    await loadTasks();
  }

  async function deleteTask(id) {
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
    await loadTasks();
  }

  const completed = tasks.filter(task => task.completed).length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const remaining = useMemo(() => tasks.length - completed, [tasks, completed]);

  return (
    <main className="shell">
      <nav className="topbar">
        <a className="brand" href="#"><span className="brand-icon"><ClipboardList size={20}/></span> ShipShape<span className="brand-dot">.</span></a>
        <span className="nav-tag"><span className="live-dot"/> DEVOPS INTERNSHIP PROJECT</span>
        <a className="github-link" href="https://github.com" target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span/> YOUR WORKSPACE</div>
        <h1>Make progress.<br/><span>Ship with confidence.</span></h1>
        <p className="hero-copy">A simple space to track the work that moves your projects forward.</p>
      </section>

      <section className="status-row">
        <div className="connection"><span className={status === 'Backend connected' ? 'live-dot' : 'warn-dot'}/><span>{status}</span></div>
        <button className="refresh" onClick={loadTasks} aria-label="Refresh tasks"><RefreshCw size={15}/> Refresh</button>
      </section>

      <section className="stats">
        <article className="stat-card"><div className="stat-label"><ClipboardList size={16}/> TOTAL TASKS</div><strong>{tasks.length.toString().padStart(2, '0')}</strong><small>In your workspace</small></article>
        <article className="stat-card"><div className="stat-label"><CheckCircle2 size={16}/> COMPLETED</div><strong>{completed.toString().padStart(2, '0')}</strong><small>Good work — keep going</small></article>
        <article className="stat-card"><div className="stat-label"><Activity size={16}/> REMAINING</div><strong>{remaining.toString().padStart(2, '0')}</strong><small>One step at a time</small></article>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><div className="eyebrow">THE PLAN</div><h2>Today's tasks</h2></div><span className="count-pill">{tasks.length} ITEMS</span></div>
        <div className="progress-wrap"><div className="progress-meta"><span>Overall progress</span><b>{progress}%</b></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }}/></div></div>

        <form className="add-form" onSubmit={addTask}>
          <input value={title} onChange={event => setTitle(event.target.value)} placeholder="What needs to get done?" aria-label="New task" maxLength={120}/>
          <button type="submit" disabled={busy || !title.trim()}><Plus size={17}/> Add task</button>
        </form>

        <div className="task-list">
          {tasks.map(task => <div className={`task ${task.completed ? 'is-done' : ''}`} key={task.id}>
            <button className="check-btn" onClick={() => toggleTask(task.id)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>{task.completed ? <CheckCircle2 size={21}/> : <Circle size={21}/>}</button>
            <span className="task-title">{task.title}</span>
            <span className={`task-state ${task.completed ? 'done' : ''}`}>{task.completed ? 'DONE' : 'IN PROGRESS'}</span>
            <button className="delete-btn" onClick={() => deleteTask(task.id)} aria-label="Delete task"><Trash2 size={16}/></button>
          </div>)}
          {tasks.length === 0 && <div className="empty">Nothing here yet. Add your first task above.</div>}
        </div>
      </section>

      <footer><span><Server size={14}/> React frontend · Express API · Docker · GitHub Actions</span><span>Built to ship <span className="brand-dot">♥</span></span></footer>
    </main>
  );
}
