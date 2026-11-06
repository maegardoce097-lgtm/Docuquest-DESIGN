import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FolderOpen, RefreshCw, Search, Star } from 'lucide-react';
import { apiRequest } from './api.js';
import './AdminFeedback.css';

const feedbackQuestions = [
  { key: 'staff_service_rating', label: 'Ease of submitting a document request', tagalog: 'Kadalian ng pagsumite ng document request' },
  { key: 'instructions_clarity_rating', label: 'Clarity of transaction requirements and fees', tagalog: 'Linaw ng requirements at bayarin' },
  { key: 'status_updates_rating', label: 'Timeliness and usefulness of system updates', tagalog: 'Kaagapan at silbi ng system updates' },
  { key: 'processing_time_rating', label: 'Payment or fee-waiver process', tagalog: 'Proseso ng bayad o libreng request' },
  { key: 'overall_satisfaction_rating', label: 'Completion of the document transaction', tagalog: 'Pagkumpleto ng transaksyon ng dokumento' },
];

function formatDate(value) {
  const date = new Date(`${String(value || '').replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [questionSummary, setQuestionSummary] = useState({});
  const [query, setQuery] = useState('');
  const [folderOpen, setFolderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadFeedback() {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/admin/feedback');
      setFeedback(result.feedback || []);
      setQuestionSummary(result.question_summary || {});
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? feedback.filter((entry) => [
        entry.request_number,
        entry.document_type,
        entry.full_name,
        entry.username,
        entry.comment,
      ].some((value) => String(value || '').toLowerCase().includes(term)))
      : feedback;
  }, [feedback, query]);

  return (
    <section className="admin-feedback-page">
      <header className="admin-feedback-header">
        <div>
          <p className="eyebrow">ADMINISTRATION / REQUESTER EXPERIENCE</p>
          <h2>DocuQuest feedback</h2>
          <p>Five ratings and optional comments for completed requests.</p>
        </div>
        <button className="secondary-button" type="button" onClick={loadFeedback} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}
      <section className="feedback-question-tallies" aria-label="Question rating tallies">
        {feedbackQuestions.map(({ key, label, tagalog }) => {
          const tally = questionSummary[key] || { count: 0, average: 0, distribution: {} };
          return <article className="feedback-question-tally" key={key}>
            <header><h3>{label}<small>{tagalog}</small></h3><span>{Number(tally.average || 0).toFixed(2)} / 5 average · {tally.count || 0} responses</span></header>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = Number(tally.distribution?.[rating] || 0);
              const percentage = tally.count ? (count / tally.count) * 100 : 0;
              return <div className="feedback-distribution-row" key={rating}>
                <span>{rating} <Star size={14} fill="currentColor" /></span>
                <div><i style={{ width: `${percentage}%` }} /></div>
                <strong>{count}</strong>
              </div>;
            })}
          </article>;
        })}
      </section>
      {!folderOpen ? <section className="feedback-folder-panel">
        <header><div><p className="eyebrow">COMPILED RESPONSES</p><h3>Browse feedback</h3></div><span>{feedback.length} RESPONSES</span></header>
        <button className="feedback-folder-card" type="button" onClick={() => setFolderOpen(true)}>
          <span className="feedback-folder-icon"><FolderOpen size={31} strokeWidth={1.7} /></span>
          <span className="feedback-folder-copy"><small>REQUESTER EXPERIENCE</small><strong>All feedback</strong><span>Open folder to review ratings and comments.</span></span>
          <span className="feedback-folder-count"><strong>{feedback.length}</strong><small>RESPONSES</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section> : <section className="feedback-list">
        <header>
          <button className="feedback-back-button" type="button" onClick={() => { setFolderOpen(false); setQuery(''); }}><ArrowLeft size={15} /> All folders</button>
          <div><p className="eyebrow">REQUESTER EXPERIENCE</p><h3>All feedback</h3></div>
          <label className="search-box"><Search size={16} /><input aria-label="Search feedback" placeholder="Search feedback" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </header>
        {filtered.length ? (
          <div className="feedback-table-wrap">
            <table>
              <thead><tr><th>OVERALL</th><th>REQUEST</th><th>REQUESTER</th><th>QUESTION RATINGS</th><th>COMMENTS</th><th>SUBMITTED</th></tr></thead>
              <tbody>{filtered.map((entry) => (
                <tr key={entry.id}>
                  <td><span className="feedback-rating"><Star size={15} fill="currentColor" /> {entry.rating} / 5</span></td>
                  <td><strong>{entry.request_number}</strong><small>{entry.document_type}</small></td>
                  <td>{entry.full_name}<small>Account: {entry.username}</small></td>
                  <td className="feedback-question-scores">{feedbackQuestions.map(({ key, label }) => <span key={key}><small>{label}</small><strong>{entry[key] ? `${entry[key]} / 5` : 'Not collected'}</strong></span>)}</td>
                  <td className="feedback-comment">{entry.comment || 'No written comment provided.'}</td>
                  <td>{formatDate(entry.created_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="feedback-empty">{loading ? 'Loading feedback…' : query ? 'No matching feedback found.' : 'No requester feedback has been submitted yet.'}</p>}
      </section>}
    </section>
  );
}
