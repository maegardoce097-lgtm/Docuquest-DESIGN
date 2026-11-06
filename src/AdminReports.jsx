import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, Database, Download, Folder, FolderOpen, RefreshCw, Search } from 'lucide-react';
import { apiRequest, postJson } from './api.js';
import './AdminReports.css';

function reportDateLabel(day) {
  if (!day) return 'Unknown date';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(`${day}T12:00:00+08:00`));
}

function paymentStatusLabel(request) {
  if (request.payment_status === 'paid') return 'Paid';
  if (request.payment_status === 'waived') return 'No payment required';
  return request.payment_amount !== null && request.payment_amount !== undefined ? 'Pending' : 'Not set';
}

export default function AdminReports() {
  const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  const monthStart = `${today.slice(0, 7)}-01`;
  const [start, setStart] = useState(monthStart);
  const [end, setEnd] = useState(today);
  const [activeRange, setActiveRange] = useState({ start: monthStart, end: today });
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [activeDay, setActiveDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedReports, setSavedReports] = useState([]);
  const [selectedSaved, setSelectedSaved] = useState('');
  const [notice, setNotice] = useState('');

  async function loadReport(range = activeRange) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ start: range.start, end: range.end });
      const result = await apiRequest(`/admin/reports?${params}`);
      setRequests(result.requests || []);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(activeRange);
    apiRequest('/admin/reports/saved').then((result) => setSavedReports(result.reports || [])).catch(() => {});
  }, []);

  const filtered = requests;
  const groupedRequests = requests.reduce((groups, request) => {
    const day = request.submitted_date || 'unknown';
    if (!groups[day]) groups[day] = [];
    groups[day].push(request);
    return groups;
  }, {});
  const reportFolders = Object.entries(groupedRequests).sort(([left], [right]) => right.localeCompare(left));
  const activeDayRequests = requests.filter((request) => request.submitted_date === activeDay);
  const activeFolderLabel = activeDayRequests[0]?.submitted_day_label || reportDateLabel(activeDay);
  const visibleRequests = useMemo(() => {
    const dayRequests = activeDay ? requests.filter((request) => request.submitted_date === activeDay) : [];
    const term = appliedQuery.trim().toLowerCase();
    return term ? dayRequests.filter((request) => [request.request_number, request.requester_name, request.full_name, request.contact_email, request.document_type, request.purpose, request.status].some((value) => String(value || '').toLowerCase().includes(term))) : dayRequests;
  }, [requests, activeDay, appliedQuery]);

  const statuses = useMemo(() => filtered.reduce((counts, request) => {
    const key = request.status || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}), [filtered]);
  const documents = useMemo(() => filtered.reduce((counts, request) => {
    const key = request.document_type || 'Other';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}), [filtered]);
  const collected = filtered.reduce((total, request) => total + (request.payment_status === 'paid' ? Number(request.payment_amount || 0) : 0), 0);
  const documentRows = Object.entries(documents).sort((left, right) => right[1] - left[1]);
  const statusRows = Object.entries(statuses).sort((left, right) => right[1] - left[1]);
  const maxDocument = Math.max(...documentRows.map(([, count]) => count), 1);
  const maxStatus = Math.max(...statusRows.map(([, count]) => count), 1);

  async function saveToDatabase() {
    setError('');
    setNotice('');
    try {
      const result = await postJson('/admin/reports/save', activeRange);
      setNotice(`${result.report_number} saved to the database.`);
      const saved = await apiRequest('/admin/reports/saved');
      setSavedReports(saved.reports || []);
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function openSavedReport(reportId) {
    setSelectedSaved(reportId);
    if (!reportId) return loadReport(activeRange);
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest(`/admin/reports/saved/show?id=${encodeURIComponent(reportId)}`);
      setRequests(result.report.requests || []);
      setActiveRange({ start: result.report.start_date, end: result.report.end_date });
      setStart(result.report.start_date);
      setEnd(result.report.end_date);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }

  function submitRange(event) {
    event.preventDefault();
    const range = { start, end };
    setActiveRange(range);
    loadReport(range);
  }

  function searchRegister(event) {
    event.preventDefault();
    setAppliedQuery(query.trim());
  }

  function openReportFolder(day) {
    setActiveDay(day);
    setQuery('');
    setAppliedQuery('');
  }

  function closeReportFolder() {
    setActiveDay('');
    setQuery('');
    setAppliedQuery('');
  }

  async function exportExcel() {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DocuQuest - Municipality of Naujan';
    workbook.subject = 'Document Request Registry Consolidated Report';
    workbook.created = new Date();

    const summary = workbook.addWorksheet('Summary');
    summary.columns = [{ width: 34 }, { width: 14 }, { width: 30 }, { width: 14 }];
    summary.views = [{ state: 'normal', zoomScale: 90 }];
    summary.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1, horizontalCentered: true };
    summary.pageMargins = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
    summary.mergeCells('A1:D1');
    summary.getCell('A1').value = 'MUNICIPALITY OF NAUJAN - DOCUQUEST REPORT';
    summary.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    summary.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17382B' } };
    summary.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    summary.getRow(1).height = 34;
    summary.mergeCells('A2:D2');
    summary.getCell('A2').value = `CONSOLIDATED REPORT PERIOD: ${activeRange.start} to ${activeRange.end}`;
    summary.getCell('A2').font = { bold: true, size: 11, color: { argb: 'FF44534A' } };
    summary.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    summary.getRow(2).height = 24;

    const pendingCount = filtered.filter((request) => ['submitted', 'under_review', 'processing'].includes(request.status)).length;
    const summaryCards = [
      { label: 'TOTAL REQUESTS', value: filtered.length },
      { label: 'COMPLETED', value: statuses.completed || 0 },
      { label: 'PENDING PROCESSING', value: pendingCount },
      { label: 'COLLECTED FEES', value: collected, numFmt: 'PHP #,##0.00' },
    ];
    summaryCards.forEach((card, index) => {
      const startColumn = index % 2 === 0 ? 'A' : 'C';
      const endColumn = index % 2 === 0 ? 'B' : 'D';
      const labelRow = index < 2 ? 4 : 7;
      const valueRow = labelRow + 1;
      summary.mergeCells(`${startColumn}${labelRow}:${endColumn}${labelRow}`);
      summary.mergeCells(`${startColumn}${valueRow}:${endColumn}${valueRow}`);
      const labelCell = summary.getCell(`${startColumn}${labelRow}`);
      labelCell.value = card.label;
      labelCell.font = { bold: true, size: 10, color: { argb: 'FF44534A' } };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1EDE2' } };
      labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
      const valueCell = summary.getCell(`${startColumn}${valueRow}`);
      valueCell.value = card.value;
      valueCell.font = { bold: true, size: 15, color: { argb: 'FF17382B' } };
      valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (card.numFmt) valueCell.numFmt = card.numFmt;
      [labelCell, valueCell].forEach((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D2C0' } },
          left: { style: 'thin', color: { argb: 'FFD9D2C0' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D2C0' } },
          right: { style: 'thin', color: { argb: 'FFD9D2C0' } },
        };
      });
      summary.getRow(labelRow).height = 22;
      summary.getRow(valueRow).height = 28;
    });

    summary.addRow([]);
    summary.getRow(10).height = 8;
    summary.getRow(11).values = ['DOCUMENT TYPE', 'REQUESTS', 'STATUS', 'REQUESTS'];
    summary.getRow(11).height = 24;
    [1, 2, 3, 4].forEach((column) => {
      const cell = summary.getRow(11).getCell(column);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17382B' } };
      cell.alignment = { horizontal: column === 2 || column === 4 ? 'center' : 'left', vertical: 'middle' };
    });
    const breakdownRows = Math.max(documentRows.length, statusRows.length);
    for (let index = 0; index < breakdownRows; index += 1) {
      const row = summary.getRow(12 + index);
      const document = documentRows[index];
      const status = statusRows[index];
      row.values = [
        document?.[0] || '',
        document?.[1] ?? '',
        status?.[0].replaceAll('_', ' ') || '',
        status?.[1] ?? '',
      ];
      row.height = 21;
      row.eachCell({ includeEmpty: true }, (cell, column) => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9D2C0' } } };
        cell.alignment = { horizontal: column === 2 || column === 4 ? 'center' : 'left', vertical: 'middle', wrapText: true };
        if (index % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F0' } };
      });
    }
    summary.autoFilter = { from: 'A11', to: `D${11 + breakdownRows}` };
    summary.printArea = `A1:D${Math.max(11 + breakdownRows, 12)}`;

    const register = workbook.addWorksheet('Request Register');
    const header = ['Reference', 'Submitted Date', 'Submitted Time', 'Requester', 'Name on Document', 'Email', 'Phone', 'Address', 'Document', 'Purpose', 'Status', 'Payment Status', 'Fee Amount', 'Paid At'];
    register.addRow(header);
    register.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    register.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17382B' } };
    register.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    register.getRow(1).height = 24;
    filtered.forEach((request) => register.addRow([
      request.request_number,
      request.submitted_date,
      request.submitted_time,
      request.requester_name,
      request.full_name,
      request.requester_email || request.contact_email,
      request.phone,
      request.address,
      request.document_type,
      request.purpose,
      request.status?.replaceAll('_', ' '),
      paymentStatusLabel(request),
      Number(request.payment_amount || 0),
      request.paid_at || '',
    ]));
    register.columns = header.map((name, index) => ({ header: name, key: name, width: [19, 15, 14, 23, 24, 30, 17, 30, 24, 42, 19, 22, 16, 21][index] }));
    register.views = [{ state: 'frozen', xSplit: 3, ySplit: 1, zoomScale: 80 }];
    register.autoFilter = { from: 'A1', to: `N${register.rowCount}` };
    register.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    register.pageMargins = { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
    register.getRow(1).height = 30;
    register.getColumn(13).numFmt = 'PHP #,##0.00';
    register.eachRow((row, rowNumber) => {
      let maxLines = 1;
      if (rowNumber > 1 && rowNumber % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F0' } };
      row.eachCell((cell, columnNumber) => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9D2C0' } } };
        if (rowNumber > 1) {
          const columnWidth = register.getColumn(columnNumber).width || 10;
          maxLines = Math.max(maxLines, Math.ceil(String(cell.value ?? '').length / Math.max(8, columnWidth - 4)));
          cell.alignment = {
            vertical: 'top',
            horizontal: columnNumber === 13 ? 'right' : [1, 2, 3, 11, 12, 14].includes(columnNumber) ? 'center' : 'left',
            wrapText: true,
          };
        }
      });
      if (rowNumber > 1) row.height = Math.max(28, maxLines * 15 + 8);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `DocuQuest-Report-${activeRange.start}-to-${activeRange.end}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="reports-page">
      <header className="reports-header view-heading">
        <div><p className="eyebrow">REGISTRY / CONSOLIDATED REPORTS</p><h2>Document request reports</h2><p>Select dates to consolidate submissions for database saving and Excel export.</p></div>
        <div className="report-actions"><button className="secondary-button" type="button" onClick={() => loadReport(activeRange)} disabled={loading}><RefreshCw size={16} /> Refresh</button><button className="secondary-button" type="button" onClick={saveToDatabase} disabled={loading || !filtered.length}><Database size={16} /> Save to database</button><button className="primary-button" type="button" onClick={exportExcel} disabled={!filtered.length}><Download size={16} /> Export Excel</button></div>
      </header>
      <form className="report-range" onSubmit={submitRange}>
        <label><span>From</span><input type="date" max={today} required value={start} onChange={(event) => setStart(event.target.value)} /></label>
        <label><span>To</span><input type="date" min={start} max={today} required value={end} onChange={(event) => setEnd(event.target.value)} /></label>
        <button className="search-button" disabled={loading}>Consolidate report</button>
      </form>
      <label className="saved-report-picker"><span>Saved database reports</span><select value={selectedSaved} onChange={(event) => openSavedReport(event.target.value)}><option value="">Use live database report</option>{savedReports.map((report) => <option key={report.id} value={report.id}>{report.report_number} · {report.start_date} to {report.end_date} · {report.record_count} records</option>)}</select></label>
      {notice && <p className="form-success" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="report-kpis">
        <article><span>Total requests</span><strong>{filtered.length}</strong><small>{activeRange.start} to {activeRange.end}</small></article>
        <article><span>Completed</span><strong>{statuses.completed || 0}</strong><small>Registry requests</small></article>
        <article><span>Pending processing</span><strong>{filtered.filter((request) => ['submitted', 'under_review', 'processing'].includes(request.status)).length}</strong><small>Active queue</small></article>
        <article><span>Collected fees</span><strong>PHP {collected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong><small>Confirmed payments</small></article>
      </div>
      <div className="report-charts">
        <article className="report-chart"><header><div><BarChart3 size={18} /><strong>Requests by document</strong></div><small>{documentRows.length} types</small></header><div className="report-horizontal-chart" role="list" aria-label="Request totals by document type">{documentRows.map(([name, count]) => <div className="report-horizontal-row" role="listitem" key={name}><span title={name}>{name}</span><div className="report-horizontal-track" aria-hidden="true"><i style={{ width: `${count / maxDocument * 100}%` }} /></div><strong>{count}</strong></div>)}{!documentRows.length && <p className="report-chart-empty">No document requests in this date range.</p>}</div></article>
        <article className="report-chart"><header><div><BarChart3 size={18} /><strong>Status distribution</strong></div><small>{statusRows.length} statuses</small></header><div className="report-horizontal-chart" role="list" aria-label="Request totals by status">{statusRows.map(([name, count]) => <div className="report-horizontal-row" role="listitem" key={name}><span title={name}>{name.replaceAll('_', ' ')}</span><div className="report-horizontal-track" aria-hidden="true"><i style={{ width: `${count / maxStatus * 100}%` }} /></div><strong>{count}</strong></div>)}{!statusRows.length && <p className="report-chart-empty">No request statuses in this date range.</p>}</div></article>
      </div>
      <section className="report-table-section">
        <header><div><p className="eyebrow">CONSOLIDATED RECORDS</p><h3>Request register</h3></div><span className="report-folder-total">{activeDay ? `${activeDayRequests.length} ${activeDayRequests.length === 1 ? 'REQUEST' : 'REQUESTS'}` : `${reportFolders.length} DATE FOLDERS`}</span></header>
        {activeDay ? <>
          <div className="report-open-folder-heading"><button type="button" onClick={closeReportFolder}><ArrowLeft size={15} /> All dates</button><span className="report-open-folder-icon"><FolderOpen size={22} /></span><div><small>REPORT DATE</small><strong>{activeFolderLabel}</strong></div></div>
          <form className="report-folder-search" onSubmit={searchRegister}><label><Search size={16} /><input aria-label="Search requests in this report date" placeholder="Search reference, requester, document, or status" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="search-button" type="submit"><Search size={15} /> Search</button></form>
          <div className="report-table-wrap"><table><thead><tr><th>Reference / Submitted</th><th>Requester</th><th>Document / Purpose</th><th>Status</th><th>Payment</th></tr></thead><tbody>{visibleRequests.map((request) => <tr key={request.id}><td><strong>{request.request_number}</strong><small>{request.submitted_date} · {request.submitted_time}</small></td><td><strong>{request.requester_name || request.full_name}</strong><small>{request.contact_email}</small></td><td><strong>{request.document_type}</strong><small>{request.purpose}</small></td><td><span className={`status status-${request.status}`}>{request.status?.replaceAll('_', ' ')}</span></td><td><strong>{paymentStatusLabel(request)}</strong><small>{request.payment_amount !== null && request.payment_amount !== undefined ? `PHP ${Number(request.payment_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : 'No fee assigned'}</small></td></tr>)}</tbody></table>{!visibleRequests.length && <p className="report-empty">{appliedQuery ? 'No matching requests in this date folder.' : 'No requests found for this date.'}</p>}</div>
        </> : reportFolders.length ? <div className="report-date-folders">{reportFolders.map(([day, dayRequests]) => <button className="report-date-folder" type="button" key={day} onClick={() => openReportFolder(day)}><span className="report-date-folder-icon"><Folder size={26} /></span><span className="report-date-folder-copy"><small>REPORT DATE</small><strong>{dayRequests[0]?.submitted_day_label || reportDateLabel(day)}</strong><span>Open folder to view register</span></span><span className="report-date-folder-count"><strong>{dayRequests.length}</strong><small>RECORDS</small></span><ArrowRight size={16} /></button>)}</div> : <p className="report-empty">No requests found for the selected consolidation range.</p>}
      </section>
      <footer className="report-print-footer">Municipality of Naujan · Registry Consolidated Report · {activeRange.start} to {activeRange.end}</footer>
    </section>
  );
}
