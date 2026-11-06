import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Folder, FolderOpen, Search, Trash2 } from 'lucide-react';
import { apiRequest, postJson } from './api.js';

function archiveDateLabel(day) {
  if (!day) return 'Unknown date';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(`${day}T12:00:00+08:00`));
}

export default function AdminArchive({ onOpenRequest }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [date, setDate] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [activeDay, setActiveDay] = useState('');
  const [activeFilters, setActiveFilters] = useState({ query: '', status: '', documentType: '', date: '' });
  const [requests, setRequests] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function searchArchive(event) {
    event.preventDefault();
    setActiveFilters({ query: query.trim(), status, documentType, date: activeDay });
  }

  function searchDate(event) {
    event.preventDefault();
    if (date) openDateFolder(date);
  }

  function openDateFolder(day) {
    setActiveDay(day);
    setDate(day);
    setQuery('');
    setStatus('');
    setDocumentType('');
    setRequests([]);
    setBusy(true);
    setActiveFilters({ query: '', status: '', documentType: '', date: day });
  }

  function closeDateFolder() {
    setActiveDay('');
    setDate('');
    setQuery('');
    setStatus('');
    setDocumentType('');
    setRequests([]);
    setBusy(true);
    setActiveFilters({ query: '', status: '', documentType: '', date: '' });
  }

  async function deleteRequest(request) {
    const confirmed = window.confirm(`Permanently delete ${request.request_number}? Its messages, activity history, notifications, and file records will also be deleted.`);
    if (!confirmed) return;

    setDeletingId(request.id);
    setError('');
    setNotice('');
    try {
      const result = await postJson('/requests/delete', { request_id: Number(request.id) });
      setRequests((current) => current.filter((item) => Number(item.id) !== Number(request.id)));
      setNotice(result.message || 'Previous request deleted.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let current = true;
    let loading = false;
    async function refreshArchive(isInitial = false) {
      if (loading || (!isInitial && document.hidden)) return;
      loading = true;
      setBusy(true);
      setError('');
      const params = new URLSearchParams();
      if (activeFilters.query) params.set('q', activeFilters.query);
      if (activeFilters.status) params.set('status', activeFilters.status);
      if (activeFilters.documentType) params.set('document_type', activeFilters.documentType);
      if (activeFilters.date) params.set('date', activeFilters.date);
      try {
        const result = await apiRequest(`/admin/archive?${params.toString()}`);
        if (current) {
          setRequests(result.requests || []);
          setDocumentTypes(result.document_types || []);
          setCurrentDate(result.current_date || '');
        }
      } catch (cause) {
        if (current) setError(cause.message);
      } finally {
        loading = false;
        if (current) setBusy(false);
      }
    }

    refreshArchive(true);
    const interval = window.setInterval(() => refreshArchive(), 30000);
    return () => {
      current = false;
      window.clearInterval(interval);
    };
  }, [activeFilters]);

  const groupedRequests = requests.reduce((groups, request) => {
    const day = request.submitted_date || 'unknown';
    if (!groups[day]) groups[day] = [];
    groups[day].push(request);
    return groups;
  }, {});
  const dateFolders = Object.entries(groupedRequests).sort(([left], [right]) => right.localeCompare(left));
  const activeDayRequests = requests.filter((request) => request.submitted_date === activeDay);
  const activeFolderLabel = activeDayRequests[0]?.submitted_day_label || archiveDateLabel(activeDay);
  const latestArchiveDate = currentDate ? new Date(`${currentDate}T00:00:00Z`) : null;
  if (latestArchiveDate) latestArchiveDate.setUTCDate(latestArchiveDate.getUTCDate() - 1);
  const dateLimit = latestArchiveDate?.toISOString().slice(0, 10) || undefined;

  return (
    <section className="archive-page">
      <header className="view-heading">
        <div><p className="eyebrow">ADMINISTRATION / RECORDS</p><h2>Previous requests</h2><p>{activeDay ? 'Review and follow up on requests submitted on this date.' : 'Open a date folder to review its requests and follow up.'}</p></div>
        <span className="archive-total">{activeDay ? activeDayRequests.length : requests.length} RECORDS</span>
      </header>
      {notice && <p className="form-success" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!activeDay ? <>
        <form className="archive-date-search" onSubmit={searchDate}>
          <label><span>Find requests by date</span><input aria-label="Search previous requests by date" type="date" max={dateLimit} required value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <button className="search-button" type="submit" disabled={busy || !date}>Search date<Search size={16} /></button>
        </form>
        <section className="archive-folder-browser">
        <header className="archive-folder-browser-heading"><div><p className="eyebrow">ARCHIVE INDEX</p><h3>Browse by date</h3></div><span>{dateFolders.length} DATE FOLDERS</span></header>
        {dateFolders.length ? <div className="archive-date-folders">{dateFolders.map(([day, dayRequests]) => <button className="archive-date-folder" type="button" key={day} onClick={() => openDateFolder(day)}>
          <span className="archive-date-folder-icon"><Folder size={28} strokeWidth={1.7} /></span>
          <span className="archive-date-folder-copy"><small>SUBMISSION DATE</small><strong>{dayRequests[0]?.submitted_day_label || archiveDateLabel(day)}</strong><span>Open folder to review requests</span></span>
          <span className="archive-date-folder-count"><strong>{dayRequests.length}</strong><small>REQUESTS</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </button>)}</div> : <div className="archive-empty"><strong>{busy ? 'Loading date folders…' : 'No previous requests yet'}</strong><span>Requests remain here after their Manila submission day ends.</span></div>}
        </section>
      </> : <>
        <div className="archive-open-folder-heading">
          <button type="button" onClick={closeDateFolder}><ArrowLeft size={16} /> All dates</button>
          <span className="archive-open-folder-icon"><FolderOpen size={24} /></span>
          <div><small>DATE FOLDER</small><h3>{activeFolderLabel}</h3></div>
          <span className="archive-open-folder-count">{activeDayRequests.length} {activeDayRequests.length === 1 ? 'request' : 'requests'}</span>
        </div>
        <form className="archive-filters archive-folder-filters" onSubmit={searchArchive}>
          <label className="archive-search"><Search size={17} /><input aria-label="Search requests in this date folder" placeholder="Search reference, name, email, phone…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label className="filter-select"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="processing">Processing</option><option value="ready_for_pickup">Ready for release</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></label>
          <label className="filter-select"><span>Document</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="">All document types</option>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <button className="search-button" disabled={busy}>{busy ? 'Searching…' : 'Search'}<Search size={16} /></button>
        </form>
        {activeDayRequests.length ? <section className="archive-day-group archive-open-day-group">
          <header className="archive-day-heading"><h3>{activeFolderLabel}</h3><span>{activeDayRequests.length} REQUESTS</span></header>
          <div className="archive-table-wrap"><table className="archive-table"><thead><tr><th>REFERENCE / TIME</th><th>REQUESTER</th><th>DOCUMENT</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{activeDayRequests.map((request) => <tr key={request.id}><td><button className="request-open" onClick={() => onOpenRequest(request)}>{request.request_number}</button><small>{request.submitted_time || 'Time unavailable'}</small></td><td><strong>{request.requester_name}</strong><small>{request.requester_email}</small></td><td><strong>{request.document_type}</strong><small>{request.full_name}</small></td><td><span className={`status status-${request.status}`}>{request.status?.replaceAll('_', ' ')}</span><div className="status-track"><span style={{ width: `${request.progress || 0}%` }} /></div></td><td><div className="archive-actions"><button className="text-action" type="button" onClick={() => onOpenRequest(request)}>Open</button><button className="icon-button archive-delete" type="button" aria-label={`Delete ${request.request_number}`} title="Delete previous request" disabled={deletingId === request.id} onClick={() => deleteRequest(request)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
        </section> : <div className="archive-empty"><strong>{busy ? 'Loading requests…' : activeFilters.query || activeFilters.status || activeFilters.documentType ? 'No matching requests in this folder' : 'No requests in this folder'}</strong><span>Use the search and filters above to find a request for follow-up.</span></div>}
      </>}
    </section>
  );
}