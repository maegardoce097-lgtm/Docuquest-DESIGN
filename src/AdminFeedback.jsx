import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronDown, FileText, MessageSquareText, RefreshCw, Search, Star } from 'lucide-react';
import { apiRequest } from './api.js';
import './AdminFeedback.css';

const feedbackQuestions = [
  { key: 'sqd0', label: 'Overall satisfaction', tagalog: 'Kasiyahan sa serbisyo' },
  { key: 'sqd1', label: 'Reasonable processing time', tagalog: 'Makatwirang oras ng pagproseso' },
  { key: 'sqd2', label: 'Requirements and steps were followed', tagalog: 'Sinunod ang mga kinakailangan' },
  { key: 'sqd3', label: 'Steps were easy and simple', tagalog: 'Madali at simple ang mga hakbang' },
  { key: 'sqd4', label: 'Information was easy to find', tagalog: 'Madaling hanapin ang impormasyon' },
  { key: 'sqd5', label: 'Fees were reasonable', tagalog: 'Makatwiran ang mga bayarin' },
  { key: 'sqd6', label: 'Service was fair to everyone', tagalog: 'Patas ang serbisyo sa lahat' },
  { key: 'sqd7', label: 'Staff were courteous and helpful', tagalog: 'Magalang at matulungin ang kawani' },
  { key: 'sqd8', label: 'Received the service needed', tagalog: 'Nakuha ang serbisyong kailangan' },
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
const legacyRatingMap = {
  staff_service_rating: 'sqd7',
  instructions_clarity_rating: 'sqd4',
  status_updates_rating: 'sqd2',
  processing_time_rating: 'sqd1',
  overall_satisfaction_rating: 'sqd0',
};

function surveyFor(entry) {
  return entry.survey && typeof entry.survey === 'object' ? entry.survey : null;
}

function scoreFor(entry, key) {
  const survey = surveyFor(entry);
  const legacyKey = Object.keys(legacyRatingMap).find((candidate) => legacyRatingMap[candidate] === key);
  const value = survey ? survey[key] : legacyKey ? entry[legacyKey] : null;
  const score = Number(value);
  return Number.isInteger(score) && score >= 1 && score <= 5 ? score : null;
}

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
  const [selectedDocumentType, setSelectedDocumentType] = useState('all');
  const [query, setQuery] = useState('');
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadFeedback() {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/admin/feedback');
      setFeedback(result.feedback || []);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  const documentTypes = useMemo(() => [...new Set(feedback.map((entry) => entry.document_type).filter(Boolean))].sort((left, right) => left.localeCompare(right)), [feedback]);

  const scopedFeedback = useMemo(() => selectedDocumentType === 'all'
    ? feedback
    : feedback.filter((entry) => entry.document_type === selectedDocumentType), [feedback, selectedDocumentType]);

  const stats = useMemo(() => {
    const questionStats = feedbackQuestions.map((question) => {
      const ratings = scopedFeedback.map((entry) => scoreFor(entry, question.key)).filter((score) => score !== null);
      const distribution = [1, 2, 3, 4, 5].map((rating) => ratings.filter((score) => score === rating).length);
      const favorable = ratings.filter((rating) => rating >= 4).length;
      return {
        ...question,
        count: ratings.length,
        average: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
        favorable,
        favorablePercent: ratings.length ? Math.round((favorable / ratings.length) * 100) : null,
        distribution,
      };
    });
    const overall = questionStats[0];
    const serviceRatings = questionStats.slice(1).flatMap((question) => scopedFeedback
      .map((entry) => scoreFor(entry, question.key))
      .filter((score) => score !== null));
    const aware = scopedFeedback.filter((entry) => {
      const value = Number(surveyFor(entry)?.cc1);
      return value >= 1 && value <= 3;
    }).length;
    const cc1Count = scopedFeedback.filter((entry) => Number(surveyFor(entry)?.cc1) >= 1 && Number(surveyFor(entry)?.cc1) <= 4).length;
    const cc2Answers = scopedFeedback.map((entry) => Number(surveyFor(entry)?.cc2)).filter((value) => value >= 1 && value <= 4);
    const cc3Answers = scopedFeedback.map((entry) => Number(surveyFor(entry)?.cc3)).filter((value) => value >= 1 && value <= 3);
    return {
      questionStats,
      overallPercent: overall.favorablePercent,
      satisfied: overall.favorable,
      overallCount: overall.count,
      serviceAverage: serviceRatings.length ? serviceRatings.reduce((sum, score) => sum + score, 0) / serviceRatings.length : null,
      awarePercent: cc1Count ? Math.round((aware / cc1Count) * 100) : null,
      easyToSeePercent: cc2Answers.length ? Math.round((cc2Answers.filter((value) => value <= 2).length / cc2Answers.length) * 100) : null,
      helpedPercent: cc3Answers.length ? Math.round((cc3Answers.filter((value) => value <= 2).length / cc3Answers.length) * 100) : null,
    };
  }, [scopedFeedback]);

  const monthlyTrend = useMemo(() => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit' })
      .formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    const currentMonth = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, 1));
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 5 + index, 1));
      return {
        key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
        label: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date),
        satisfied: 0,
        count: 0,
      };
    });
    const monthIndex = new Map(months.map((month, index) => [month.key, index]));
    scopedFeedback.forEach((entry) => {
      const rating = scoreFor(entry, 'sqd0');
      const date = new Date(`${String(entry.created_at || '').replace(' ', 'T')}Z`);
      if (rating === null || Number.isNaN(date.getTime())) return;
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit' }).format(date);
      const index = monthIndex.get(key);
      if (index === undefined) return;
      months[index].count++;
      if (rating >= 4) months[index].satisfied++;
    });
    return months.map((month) => ({
      ...month,
      percent: month.count ? Math.round((month.satisfied / month.count) * 100) : null,
    }));
  }, [scopedFeedback]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? scopedFeedback.filter((entry) => [
        entry.request_number,
        entry.document_type,
        entry.full_name,
        entry.username,
        entry.comment,
        JSON.stringify(entry.survey || {}),
      ].some((value) => String(value || '').toLowerCase().includes(term)))
      : scopedFeedback;
  }, [scopedFeedback, query]);

  const lowAreas = stats.questionStats.filter((question) => question.count > 0)
    .sort((left, right) => left.favorablePercent - right.favorablePercent);
  const comments = scopedFeedback
    .filter((entry) => String(surveyFor(entry)?.suggestions || entry.comment || '').trim())
    .sort((left, right) => (Number(left.rating) - Number(right.rating))
      || new Date(String(right.created_at).replace(' ', 'T')) - new Date(String(left.created_at).replace(' ', 'T')))
    .slice(0, 8);
  const chartPoints = monthlyTrend.map((month, index) => (month.percent === null ? null : {
    ...month,
    x: 64 + (index * 136),
    y: 174 - (month.percent * 1.28),
  })).filter(Boolean);
  const chartLine = chartPoints.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const chartArea = chartPoints.length > 1
    ? `${chartLine} L ${chartPoints[chartPoints.length - 1].x} 174 L ${chartPoints[0].x} 174 Z`
    : '';

  return (
    <section className="admin-feedback-page">
      <header className="csm-header">
        <div><p className="csm-eyebrow">ADMINISTRATION / CLIENT EXPERIENCE</p><h2>Client satisfaction</h2><p>How residents rated their completed requests at the Naujan Municipal Registry Office.</p></div>
        <div className="csm-controls">
          <label>Document type<select value={selectedDocumentType} onChange={(event) => setSelectedDocumentType(event.target.value)}><option value="all">All documents</option>{documentTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label>
          <button type="button" className="csm-refresh" onClick={loadFeedback} disabled={loading} aria-label="Refresh feedback"><RefreshCw size={16} className={loading ? 'is-spinning' : ''} /></button>
        </div>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}
      <section className="csm-hero" aria-live="polite">
        <strong className="csm-hero-score">{stats.overallPercent === null ? '—' : <>{stats.overallPercent}<small>%</small></>}</strong>
        <div><p>{stats.overallCount ? `${stats.satisfied} of ${stats.overallCount} respondents said they were satisfied with the service.` : 'Wala pang SQD0 rating para sa piniling document type.'}</p>
          <small>{lowAreas.length ? `Lowest area: ${lowAreas[0].label.toLowerCase()} at ${lowAreas[0].favorablePercent}%.` : 'Naghihintay ng mga survey response.'}</small></div>
      </section>
      <section className="csm-kpis" aria-label="Feedback summary">
        <article><strong>{stats.serviceAverage === null ? '—' : `${stats.serviceAverage.toFixed(1)}/5`}</strong><span>Average of SQD1 to SQD8</span></article>
        <article><strong>{scopedFeedback.length}</strong><span>Responses collected</span></article>
        <article><strong>{documentTypes.length ? new Set(scopedFeedback.map((entry) => entry.document_type).filter(Boolean)).size : 0}</strong><span>Document types represented</span></article>
      </section>
      <section className="csm-analysis-grid">
        <article className="csm-panel csm-low-areas">
          <header><div><h3>Where residents are less satisfied</h3><p>Lowest first. Favorable responses are Agree or Strongly Agree.</p></div><BarChart3 size={19} aria-hidden="true" /></header>
          {lowAreas.length ? <div className="csm-area-list">{lowAreas.map((question) => {
            const level = question.favorablePercent >= 85 ? 'positive' : question.favorablePercent >= 70 ? 'fair' : 'needs-work';
            return <div className="csm-area" key={question.key}>
              <div className="csm-area-title"><span>{question.label}</span><strong>{question.favorablePercent}%</strong></div>
              <div className="csm-progress"><span className={`csm-progress-fill ${level}`} style={{ width: `${question.favorablePercent}%` }} /></div>
              <small>{question.key.toUpperCase()} · {question.favorable} of {question.count} agree · average {question.average.toFixed(1)}/5</small>
            </div>;
          })}</div> : <p className="csm-empty">Wala pang SQD responses para sa filter na ito.</p>}
        </article>
        <article className="csm-panel csm-charter">
          <header><div><h3>Citizen’s Charter</h3><p>Awareness, visibility, and help with the transaction.</p></div><FileText size={19} aria-hidden="true" /></header>
          {[
            ['Know what a Citizen’s Charter is', stats.awarePercent],
            ['Found it easy to see', stats.easyToSeePercent],
            ['Said it helped', stats.helpedPercent],
          ].map(([label, percent]) => <div className="csm-charter-stat" key={label}>
            <div><span>{label}</span><strong>{percent === null ? '—' : `${percent}%`}</strong></div>
            <div className="csm-progress"><span className="csm-progress-fill gold" style={{ width: `${percent || 0}%` }} /></div>
          </div>)}
          {!scopedFeedback.some((entry) => surveyFor(entry)?.cc1) && <p className="csm-empty">Wala pang Citizen’s Charter responses para sa filter na ito.</p>}
        </article>
      </section>
      <section className="csm-panel csm-trend">
        <header><div><h3>Overall satisfaction by month</h3><p>Share of respondents who agreed with SQD0.</p></div><span className="csm-trend-range">LAST 6 MONTHS</span></header>
        {chartPoints.length ? <div className="csm-chart-wrap"><svg className="csm-chart" viewBox="0 0 760 220" role="img" aria-label="Monthly share of respondents satisfied with the service">
          {[0, 25, 50, 75, 100].map((value) => {
            const y = 174 - (value * 1.28);
            return <g key={value}><line x1="64" x2="744" y1={y} y2={y} /><text x="52" y={y + 4} textAnchor="end">{value}%</text></g>;
          })}
          {chartArea && <path className="csm-chart-area" d={chartArea} />}
          {chartPoints.length > 1 && <path className="csm-chart-line" d={chartLine} />}
          {chartPoints.map((point) => <g key={point.key}><circle cx={point.x} cy={point.y} r="5" /><text className="csm-chart-value" x={point.x} y={point.y - 13} textAnchor="middle">{point.percent}%</text></g>)}
          {monthlyTrend.map((month, index) => <text className="csm-chart-month" key={month.key} x={64 + (index * 136)} y="205" textAnchor="middle">{month.label}</text>)}
        </svg></div> : <p className="csm-empty">Wala pang SQD0 ratings sa nakalipas na anim na buwan.</p>}
      </section>
      <section className="csm-panel csm-comments">
        <header><div><h3>Comments</h3><p>Lowest-rated responses first.</p></div><MessageSquareText size={19} aria-hidden="true" /></header>
        {comments.length ? <div className="csm-comment-list">{comments.map((entry) => <article key={entry.id}>
          <time>{formatDate(entry.created_at)}</time>
          <span>{entry.document_type || 'Document request'}</span>
          <strong className="csm-comment-rating"><Star size={14} fill="currentColor" /> {entry.rating || '—'} / 5</strong>
          <p>{surveyFor(entry)?.suggestions || entry.comment}</p>
        </article>)}</div> : <p className="csm-empty">Wala pang ibinahaging mungkahi o komento.</p>}
      </section>
      <details className="csm-all-responses" open={responsesOpen} onToggle={(event) => setResponsesOpen(event.currentTarget.open)}>
        <summary><span><strong>All responses</strong><small>{filtered.length} records · search request, requester, or comment</small></span><label className="csm-search" onClick={(event) => event.preventDefault()}><Search size={15} /><input aria-label="Search feedback records" placeholder="Search responses" value={query} onChange={(event) => setQuery(event.target.value)} /></label></summary>
        {filtered.length ? <div className="csm-table-wrap"><table><thead><tr><th>DATE</th><th>REQUEST</th><th>REQUESTER</th><th>CC</th><th>SQD RATINGS</th><th>COMMENT</th></tr></thead><tbody>{filtered.map((entry) => {
          const survey = surveyFor(entry);
          return <tr key={entry.id}>
            <td>{formatDate(entry.created_at)}</td>
            <td><strong>{entry.request_number}</strong><small>{entry.document_type}</small></td>
            <td>{entry.full_name}<small>Account: {entry.username}</small>{survey?.client_type && <small>{clientTypeLabels[survey.client_type] || survey.client_type}</small>}</td>
            <td>{survey ? <><strong>{cc1Labels[survey.cc1] || 'Hindi nakatala'}</strong><small>CC2: {survey.cc1 === 4 ? 'Hindi naaangkop' : cc2Labels[survey.cc2] || 'Hindi nakatala'}</small><small>CC3: {survey.cc1 === 4 ? 'Hindi naaangkop' : cc3Labels[survey.cc3] || 'Hindi nakatala'}</small></> : <small>Legacy record</small>}</td>
            <td className="csm-table-scores">{survey ? feedbackQuestions.map(({ key }) => <span key={key}>{key.toUpperCase()} <strong>{ratingLabels[Number(survey[key])] || 'Hindi nakatala'}</strong></span>) : legacyQuestions.map(({ key, label }) => <span key={key}><small>{label}</small><strong>{entry[key] ? `${entry[key]} / 5` : 'Hindi nakatala'}</strong></span>)}</td>
            <td>{survey?.suggestions || entry.comment || '—'}</td>
          </tr>;
        })}</tbody></table></div> : <p className="csm-empty">{loading ? 'Loading feedback…' : query ? 'No matching responses.' : 'Wala pang feedback.'}</p>}
      </details>
    </section>
  );
}
