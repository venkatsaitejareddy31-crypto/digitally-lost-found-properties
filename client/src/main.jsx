import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, MapPin, MessageCircle, Plus, Search, ShieldCheck, Tag } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const emptyForm = {
  title: '',
  type: 'lost',
  category: 'pet',
  description: '',
  imageUrl: '',
  location: '',
  contactHint: ''
};

function App() {
  const [notices, setNotices] = useState([]);
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Loading notices...');

  useEffect(() => {
    loadNotices();
  }, []);

  async function loadNotices() {
    try {
      const response = await fetch(`${API_URL}/notices`);
      const data = await response.json();
      setNotices(data);
      setStatus(data.length ? 'Board is up to date.' : 'No notices yet. Add the first one.');
    } catch {
      setStatus('Could not reach the API. Start the server and MongoDB first.');
    }
  }

  async function createNotice(event) {
    event.preventDefault();
    setStatus('Posting notice...');

    const response = await fetch(`${API_URL}/notices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const error = await response.json();
      setStatus(error.message || 'Could not create notice.');
      return;
    }

    const data = await response.json();
    setNotices((current) => [data.notice, ...current]);
    setMatches(data.matches);
    setForm(emptyForm);
    setStatus(data.matches.length ? 'Posted. Nearby matches found.' : 'Posted. No close matches yet.');
  }

  async function sendMessage(id, body) {
    if (!body.trim()) return;

    const response = await fetch(`${API_URL}/notices/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });

    if (response.ok) {
      const updated = await response.json();
      setNotices((current) => current.map((notice) => (notice._id === updated._id ? updated : notice)));
    }
  }

  const visibleNotices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notices;

    return notices.filter((notice) => {
      return [notice.title, notice.description, notice.location, notice.category, ...(notice.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [notices, query]);

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Community bulletin board</p>
          <h1>Digital Lost and Found</h1>
        </div>
        <div className="trust-chip">
          <ShieldCheck size={18} />
          Anonymous return chat
        </div>
      </section>

      <section className="workspace">
        <form className="notice-form" onSubmit={createNotice}>
          <div className="section-title">
            <Plus size={20} />
            <h2>Report an item</h2>
          </div>

          <label>
            Title
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Brown wallet near library" />
          </label>

          <div className="two-column">
            <label>
              Notice type
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="pet">Pet</option>
                <option value="phone">Phone</option>
                <option value="wallet">Wallet</option>
                <option value="bag">Bag</option>
                <option value="keys">Keys</option>
                <option value="jewelry">Jewelry</option>
                <option value="document">Document</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          <label>
            Description
            <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Color, brand, marks, pet breed, collar, or other identifying details" />
          </label>

          <label>
            Image URL
            <input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
          </label>

          <div className="two-column">
            <label>
              Area
              <input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Main gate, Sector 12" />
            </label>
            <label>
              Contact hint
              <input value={form.contactHint} onChange={(event) => setForm({ ...form, contactHint: event.target.value })} placeholder="Ask for last 4 digits" />
            </label>
          </div>

          <button type="submit">
            <Bell size={18} />
            Post and check matches
          </button>
          <p className="status">{status}</p>
        </form>

        <section className="board">
          <div className="board-header">
            <div className="section-title">
              <Search size={20} />
              <h2>Current notices</h2>
            </div>
            <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search board" />
          </div>

          {matches.length > 0 && (
            <div className="alert-strip">
              <Bell size={18} />
              {matches.length} possible match{matches.length === 1 ? '' : 'es'} found for your latest post.
            </div>
          )}

          <div className="notice-grid">
            {visibleNotices.map((notice) => (
              <NoticeCard key={notice._id} notice={notice} onSendMessage={sendMessage} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function NoticeCard({ notice, onSendMessage }) {
  const [message, setMessage] = useState('');

  return (
    <article className="notice-card">
      {notice.imageUrl ? <img src={notice.imageUrl} alt={notice.title} /> : <div className="image-placeholder">{notice.category}</div>}
      <div className="notice-body">
        <div className="notice-topline">
          <span className={`pill ${notice.type}`}>{notice.type}</span>
          <span className="pill">{notice.category}</span>
        </div>
        <h3>{notice.title}</h3>
        <p>{notice.description}</p>
        <div className="meta-line">
          <MapPin size={16} />
          {notice.location}
        </div>
        {notice.contactHint && <div className="hint">Verification: {notice.contactHint}</div>}
        <div className="tag-list">
          {(notice.tags || []).slice(0, 5).map((tag) => (
            <span key={tag}>
              <Tag size={13} />
              {tag}
            </span>
          ))}
        </div>
        <div className="message-box">
          <div className="meta-line">
            <MessageCircle size={16} />
            {notice.messages?.length || 0} anonymous message{notice.messages?.length === 1 ? '' : 's'}
          </div>
          <div className="message-row">
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Send return details privately" />
            <button
              type="button"
              onClick={() => {
                onSendMessage(notice._id, message);
                setMessage('');
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

createRoot(document.getElementById('root')).render(<App />);
