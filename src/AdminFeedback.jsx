import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FolderOpen, RefreshCw, Search, Star } from 'lucide-react';
import { apiRequest } from './api.js';
import './AdminFeedback.css';

const feedbackQuestions = [
  { key: 'sqd0', label: 'Nasiyahan sa serbisyong natanggap' },
  { key: 'sqd1', label: 'Makatwiran ang tagal ng pagproseso' },
  { key: 'sqd2', label: 'Sinunod ang mga kinakailangan at hakbang' },
  { key: 'sqd3', label: 'Madali at simple ang mga hakbang at pagbabayad' },
  { key: 'sqd4', label: 'Madaling nahanap ang impormasyon' },
  { key: 'sqd5', label: 'Makatwiran ang mga bayarin' },
  { key: 'sqd6', label: 'Patas ang pagtrato sa lahat' },
  { key: 'sqd7', label: 'Magalang at matulungin ang mga kawani' },
  { key: 'sqd8', label: 'Nakuha ang kailangan o naipaliwanag ang pagtanggi' },
];
const legacyQuestions = [
  { key: 'staff_service_rating', label: 'Dating rating: kawani' },
  { key: 'instructions_clarity_rating', label: 'Dating rating: impormasyon' },
  { key: 'status_updates_rating', label: 'Dating rating: update' },
  { key: 'processing_time_rating', label: 'Dating rating: oras' },
  { key: 'overall_satisfaction_rating', label: 'Dating rating: kasiyahan' },
];
const clientTypeLabels = { citizen: 'Mamamayan', business: 'Negosyo', government: 'Pamahalaan' };
const sexLabels = { male: 'Lalaki', female: 'Babae' };
const cc1Labels = {
  1: 'Alam at nakita ang Citizen’s Charter',
  2: 'Alam ngunit hindi nakita ang Citizen’s Charter',
  3: 'Nalaman lamang nang makita ang Citizen’s Charter',
  4: 'Hindi alam at walang nakitang Citizen’s Charter',
};
const cc2Labels = { 1: 'Madaling makita', 2: 'Medyo madaling makita', 3: 'Mahirap makita', 4: 'Hindi talaga makita', 5: 'Hindi naaangkop' };
const cc3Labels = { 1: 'Malaki ang naitulong', 2: 'May naitulong', 3: 'Hindi nakatulong', 4: 'Hindi naaangkop' };
const ratingLabels = ['Hindi naaangkop', 'Lubos na hindi sumasang-ayon', 'Hindi sumasang-ayon', 'Hindi sumasang-ayon o sumasang-ayon', 'Sumasang-ayon', 'Lubos na sumasang-ayon'];

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
        JSON.stringify(entry.survey || {}),
      ].some((value) => String(value || '').toLowerCase().includes(term)))
      : feedback;
  }, [feedback, query]);

  return (
    <section className="admin-feedback-page">
      <header className="admin-feedback-header">
        <div>
          <p className="eyebrow">ADMINISTRATION / CLIENT EXPERIENCE</p>
          <h2>Client Satisfaction Measurement</h2>
          <p>Mga tugon sa Citizen’s Charter at kalidad ng serbisyo para sa mga natapos na kahilingan.</p>
        </div>
        <button className="secondary-button" type="button" onClick={loadFeedback} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}
      <section className="feedback-question-tallies" aria-label="SQD rating tallies">
        {feedbackQuestions.map(({ key, label }) => {
          const tally = questionSummary[key] || { count: 0, average: 0, distribution: {} };
          return <article className="feedback-question-tally" key={key}>
            <header><h3>{key.toUpperCase()}. {label}</h3><span>{Number(tally.average || 0).toFixed(2)} / 5 average · {tally.count || 0} responses</span></header>
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
              <thead><tr><th>OVERALL</th><th>REQUEST</th><th>REQUESTER</th><th>CITIZEN’S CHARTER</th><th>SERVICE QUALITY</th><th>SUGGESTIONS</th><th>SUBMITTED</th></tr></thead>
              <tbody>{filtered.map((entry) => (
                <tr key={entry.id}>
                  <td><span className="feedback-rating"><Star size={15} fill="currentColor" /> {entry.rating} / 5</span></td>
                  <td><strong>{entry.request_number}</strong><small>{entry.document_type}</small></td>
                  <td>{entry.full_name}<small>Account: {entry.username}</small>{entry.survey?.client_type && <small>{clientTypeLabels[entry.survey.client_type] || entry.survey.client_type}{entry.survey.age ? ` · ${entry.survey.age} taong gulang` : ''}</small>}{entry.survey?.email && <small>{entry.survey.email}</small>}</td>
                  <td className="feedback-cc-details">{entry.survey ? <>
                    <strong>CC1</strong><small>{cc1Labels[entry.survey.cc1] || 'Hindi nakatala'}</small>
                    <strong>CC2</strong><small>{entry.survey.cc1 === 4 ? 'Hindi naaangkop' : cc2Labels[entry.survey.cc2] || 'Hindi nakatala'}</small>
                    <strong>CC3</strong><small>{entry.survey.cc1 === 4 ? 'Hindi naaangkop' : cc3Labels[entry.survey.cc3] || 'Hindi nakatala'}</small>
                    {entry.survey.sex && <small>Kasarian: {sexLabels[entry.survey.sex] || entry.survey.sex}</small>}
                    {entry.survey.region && <small>Rehiyon: {entry.survey.region}</small>}
                  </> : <small>Legacy feedback record; walang Citizen’s Charter responses.</small>}</td>
                  <td className="feedback-question-scores">{entry.survey ? feedbackQuestions.map(({ key, label }) => <span key={key}><small>{key.toUpperCase()}. {label}</small><strong>{ratingLabels[Number(entry.survey[key])] || 'Hindi nakatala'}</strong></span>) : legacyQuestions.map(({ key, label }) => <span key={key}><small>{label}</small><strong>{entry[key] ? `${entry[key]} / 5` : 'Hindi nakatala'}</strong></span>)}</td>
                  <td className="feedback-comment">{entry.survey?.suggestions || entry.comment || 'Walang ibinigay na mungkahi.'}</td>
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
