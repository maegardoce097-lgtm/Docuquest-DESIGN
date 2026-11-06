import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Eye, FileText, FolderOpen, Image, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { apiRequest, fetchProtectedFile } from './api.js';
import './admin-files.css';

function fileEndpoint(file) {
  const route = file.file_source === 'message' ? '/requests/message-file' : '/requests/file';
  return `${route}?id=${encodeURIComponent(file.id)}`;
}

function formatSize(bytes) {
  const size = Number(bytes) || 0;
  return size < 1024 * 1024 ? `${Math.max(1, Math.ceil(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value) {
  if (!value) return 'Date unavailable';
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(date);
}

export default function AdminFiles() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [activeRequesterKey, setActiveRequesterKey] = useState('');
  const [folderQuery, setFolderQuery] = useState('');
  const [activeFolderQuery, setActiveFolderQuery] = useState('');
  const [activeView, setActiveView] = useState('submitted');
  const [storageQuery, setStorageQuery] = useState('');
  const [activeStorageQuery, setActiveStorageQuery] = useState('');
  const [storageDate, setStorageDate] = useState('');
  const [activeStorageDate, setActiveStorageDate] = useState('');
  const [activeStorageSenderKey, setActiveStorageSenderKey] = useState('');
  const [files, setFiles] = useState([]);
  const [storagePhotos, setStoragePhotos] = useState([]);
  const [storagePhotoToken, setStoragePhotoToken] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [storagePhotoLoading, setStoragePhotoLoading] = useState(false);
  const [busyFile, setBusyFile] = useState(null);
  const [error, setError] = useState('');
  const [storagePhotoError, setStoragePhotoError] = useState('');

  useEffect(() => {
    let current = true;
    const params = new URLSearchParams();
    if (activeQuery) params.set('q', activeQuery);

    async function loadFiles() {
      setLoading(true);
      setError('');
      try {
        const result = await apiRequest(`/admin/files?${params.toString()}`);
        if (current) setFiles(result.files || []);
      } catch (cause) {
        if (current) setError(cause.message);
      } finally {
        if (current) setLoading(false);
      }
    }

    loadFiles();
    return () => { current = false; };
  }, [activeQuery]);

  useEffect(() => {
    if (activeView !== 'storage') return undefined;
    let current = true;

    async function loadStoragePhotos() {
      setStoragePhotoLoading(true);
      setStoragePhotoError('');
      setStoragePhotos([]);
      setStoragePhotoToken('');
      try {
        const params = new URLSearchParams();
        if (activeStorageQuery) params.set('q', activeStorageQuery);
        if (activeStorageDate) params.set('date', activeStorageDate);
        const result = await apiRequest(`/admin/storage-photos?${params.toString()}`);
        if (current) {
          setStoragePhotos(result.photos || []);
          setStoragePhotoToken(result.next_token || '');
        }
      } catch (cause) {
        if (current) setStoragePhotoError(cause.message);
      } finally {
        if (current) setStoragePhotoLoading(false);
      }
    }

    loadStoragePhotos();
    return () => { current = false; };
  }, [activeView, activeStorageQuery, activeStorageDate]);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  async function openPreview(file) {
    setBusyFile(file.id);
    setError('');
    try {
      const blob = await fetchProtectedFile(fileEndpoint(file));
      setPreviewZoom(1);
      setPreview({ file, url: URL.createObjectURL(blob) });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusyFile(null);
    }
  }

  async function downloadFile(file) {
    setBusyFile(file.id);
    setError('');
    try {
      const blob = await fetchProtectedFile(fileEndpoint(file));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name || 'submitted-file';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusyFile(null);
    }
  }

  async function loadMoreStoragePhotos() {
    if (!storagePhotoToken || storagePhotoLoading) return;
    setStoragePhotoLoading(true);
    setStoragePhotoError('');
    try {
      const params = new URLSearchParams({ token: storagePhotoToken });
      const result = await apiRequest(`/admin/storage-photos?${params.toString()}`);
      setStoragePhotos((current) => [...current, ...(result.photos || [])]);
      setStoragePhotoToken(result.next_token || '');
    } catch (cause) {
      setStoragePhotoError(cause.message);
    } finally {
      setStoragePhotoLoading(false);
    }
  }

  async function openStoragePhoto(photo) {
    setBusyFile(photo.key);
    setStoragePhotoError('');
    try {
      const path = `/admin/storage-photo?key=${encodeURIComponent(photo.key)}`;
      const url = URL.createObjectURL(await fetchProtectedFile(path));
      setPreviewZoom(1);
      setPreview({ file: { original_name: photo.key, requester_name: 'Storage bucket', request_number: 'Stored image', mime_type: photo.mime_type }, url });
      const params = new URLSearchParams({ token: storagePhotoToken });
      if (activeStorageQuery) params.set('q', activeStorageQuery);
      if (activeStorageDate) params.set('date', activeStorageDate);
    } catch (cause) {
      setStoragePhotoError(cause.message);
    } finally {
      setBusyFile(null);
    }
  }

  async function downloadStoragePhoto(photo) {
    setBusyFile(photo.key);
    setStoragePhotoError('');
    try {
      const path = `/admin/storage-photo?key=${encodeURIComponent(photo.key)}`;
      const url = URL.createObjectURL(await fetchProtectedFile(path));
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.key;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setStoragePhotoError(cause.message);
    } finally {
      setBusyFile(null);
    }
  }

  const groupedFiles = files.reduce((groups, file) => {
    const key = file.requester_email || file.requester_name || 'Unknown requester';
    if (!groups[key]) groups[key] = { name: file.requester_name || file.requester_username || 'Unknown requester', email: file.requester_email || '', files: [] };
    groups[key].files.push(file);
    return groups;
  }, {});
  const sortedFileGroups = Object.entries(groupedFiles).sort(([, left], [, right]) => left.name.localeCompare(right.name));
  const activeFileGroup = groupedFiles[activeRequesterKey];
  const activeFolderFiles = activeFileGroup?.files.filter((file) => {
    const term = activeFolderQuery.trim().toLowerCase();
    return !term || [file.original_name, file.request_number, file.document_type, file.mime_type, file.file_source]
      .some((value) => String(value || '').toLowerCase().includes(term));
  }) || [];
  const groupedStoragePhotos = storagePhotos.reduce((groups, photo) => {
    const name = photo.sender_name || 'Uploader unavailable';
    const role = photo.sender_role || '';
    const key = `${role}:${name}`;
    if (!groups[key]) groups[key] = { name, role, photos: [] };
    groups[key].photos.push(photo);
    return groups;
  }, {});
  const sortedStorageGroups = Object.entries(groupedStoragePhotos).sort(([, left], [, right]) => left.name.localeCompare(right.name));
  const activeStorageGroup = groupedStoragePhotos[activeStorageSenderKey];

  return (
    <section className="admin-files-page">
      <header className="view-heading">
        <div><p className="eyebrow">ADMINISTRATION / PRIVATE STORAGE</p><h2>Submitted files</h2><p>Request documents and message images, grouped by requester.</p></div>
        <span className="archive-total">{activeView === 'storage' ? `${storagePhotos.length} PHOTOS` : `${files.length} FILES`}</span>
      </header>
      <div className="admin-files-tabs" aria-label="File views">
        <button type="button" className={activeView === 'submitted' ? 'active' : ''} aria-pressed={activeView === 'submitted'} onClick={() => setActiveView('submitted')}><FileText size={15} />Submitted files</button>
        <button type="button" className={activeView === 'storage' ? 'active' : ''} aria-pressed={activeView === 'storage'} onClick={() => setActiveView('storage')}><Image size={15} />Storage photos</button>
      </div>
      {activeView === 'submitted' ? <>
      {!activeRequesterKey ? <form className="admin-files-search" onSubmit={(event) => { event.preventDefault(); setActiveQuery(query.trim()); }}>
        <label className="archive-search"><Search size={17} /><input aria-label="Search submitted files" placeholder="Search sender, email, filename, or reference" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button className="search-button" disabled={loading}>Search<Search size={16} /></button>
      </form> : <form className="admin-files-search admin-file-folder-search" onSubmit={(event) => { event.preventDefault(); setActiveFolderQuery(folderQuery.trim()); }}>
        <label className="archive-search"><Search size={17} /><input aria-label={`Search files from ${activeFileGroup?.name || 'sender'}`} placeholder="Search filename, reference, or file type" value={folderQuery} onChange={(event) => setFolderQuery(event.target.value)} /></label>
        <button className="search-button" type="submit">Search<Search size={16} /></button>
      </form>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <div className="archive-empty"><strong>Loading submitted files…</strong></div> : !activeRequesterKey ? files.length ? <section className="admin-file-folder-browser">
        <header><div><p className="eyebrow">SENDER INDEX</p><h3>Browse by sender</h3></div><span>{sortedFileGroups.length} FOLDERS</span></header>
        <div className="admin-file-folder-grid">{sortedFileGroups.map(([key, group]) => <button className="admin-file-folder-card" type="button" key={key} onClick={() => { setActiveRequesterKey(key); setFolderQuery(''); setActiveFolderQuery(''); }}>
          <span className="admin-file-folder-icon"><FolderOpen size={27} strokeWidth={1.7} /></span>
          <span className="admin-file-folder-copy"><small>SENDER</small><strong>{group.name}</strong><span>{group.email || 'Email unavailable'}</span></span>
          <span className="admin-file-folder-count"><strong>{group.files.length}</strong><small>FILES</small></span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>)}</div>
      </section> : <div className="archive-empty"><strong>{activeQuery ? 'No matching files' : 'No submitted files yet'}</strong><span>Files uploaded with requests and messages will appear here.</span></div> : activeFileGroup ? <>
        <div className="admin-file-folder-heading"><button type="button" onClick={() => { setActiveRequesterKey(''); setFolderQuery(''); setActiveFolderQuery(''); }}><ArrowLeft size={15} /> All senders</button><span className="admin-file-folder-icon"><FolderOpen size={22} /></span><div><small>SENDER FOLDER</small><strong>{activeFileGroup.name}</strong><span>{activeFileGroup.email || 'Email unavailable'}</span></div><b>{activeFileGroup.files.length} {activeFileGroup.files.length === 1 ? 'FILE' : 'FILES'}</b></div>
        {activeFolderFiles.length ? <section className="admin-files-group admin-files-open-folder">
          <div className="archive-table-wrap"><table className="archive-table"><thead><tr><th>FILE</th><th>REQUEST</th><th>TYPE</th><th>UPLOADED</th><th>ACTIONS</th></tr></thead><tbody>
            {activeFolderFiles.map((file) => <tr key={`${file.file_source}-${file.id}`}>
              <td><strong className="admin-file-name">{file.file_source === 'message' ? <Image size={15} /> : <FileText size={15} />}{file.original_name}</strong><small>{formatSize(file.size_bytes)} · {file.mime_type}</small></td>
              <td><strong>{file.request_number}</strong><small>{file.document_type}</small></td>
              <td>{file.file_source === 'message' ? 'Message image' : 'Request document'}</td>
              <td>{file.created_at}</td>
              <td><div className="admin-file-actions"><button type="button" className="admin-file-action" disabled={busyFile === file.id} onClick={() => openPreview(file)}><Eye size={15} />View</button><button type="button" className="admin-file-action" disabled={busyFile === file.id} onClick={() => downloadFile(file)}><Download size={15} />Download</button></div></td>
            </tr>)}
          </tbody></table></div>
        </section> : <div className="archive-empty"><strong>{activeFolderQuery ? 'No matching files in this folder' : 'No files found'}</strong><span>Try another filename, reference, or file type.</span></div>}
      </> : <div className="archive-empty"><strong>No files for this sender</strong><button type="button" onClick={() => setActiveRequesterKey('')}>Back to senders</button></div>}
      </> : <section className="admin-storage-photos">
        <header><div><h3>Storage photos</h3><p>Images currently stored in the configured private bucket.</p></div><span className="archive-total">{storagePhotos.length} LOADED</span></header>
        <form className="storage-photo-search" onSubmit={(event) => { event.preventDefault(); setActiveStorageQuery(storageQuery.trim()); setActiveStorageDate(storageDate); }}>
          <label className="archive-search"><Search size={16} /><input aria-label="Search photo sender or filename" placeholder="Search sender or filename" value={storageQuery} onChange={(event) => setStorageQuery(event.target.value)} /></label>
          <label className="storage-photo-date"><span>Sent date</span><input aria-label="Filter photos by sent date" type="date" value={storageDate} onChange={(event) => setStorageDate(event.target.value)} /></label>
          <button type="submit" className="search-button" disabled={storagePhotoLoading}><Search size={15} />Search</button>
        </form>
        {storagePhotoError && <p className="form-error" role="alert">{storagePhotoError}</p>}
        {storagePhotoLoading && storagePhotos.length === 0 ? <div className="archive-empty"><strong>Loading storage photos…</strong></div> : storagePhotos.length && !activeStorageSenderKey ? <section className="storage-photo-folder-browser">
          <header><div><p className="eyebrow">PHOTO SENDERS</p><h3>Browse by sender</h3></div><span>{sortedStorageGroups.length} FOLDERS</span></header>
          <div className="storage-photo-folder-grid">{sortedStorageGroups.map(([key, group]) => <button className="storage-photo-folder-card" type="button" key={key} onClick={() => setActiveStorageSenderKey(key)}>
            <span className="storage-photo-folder-icon"><FolderOpen size={27} strokeWidth={1.7} /></span>
            <span className="storage-photo-folder-copy"><small>SENDER</small><strong>{group.name}</strong><span>{group.role ? `${group.role === 'admin' ? 'Admin' : 'Requester'} uploads` : 'Sender unavailable'}</span></span>
            <span className="storage-photo-folder-count"><strong>{group.photos.length}</strong><small>PHOTOS</small></span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>)}</div>
        </section> : activeStorageSenderKey && activeStorageGroup ? <>
          <div className="storage-photo-folder-heading"><button type="button" onClick={() => setActiveStorageSenderKey('')}><ArrowLeft size={15} /> All senders</button><span className="storage-photo-folder-icon"><FolderOpen size={22} /></span><div><small>SENDER FOLDER</small><strong>{activeStorageGroup.name}</strong><span>{activeStorageGroup.role ? `${activeStorageGroup.role === 'admin' ? 'Admin' : 'Requester'} uploads` : 'Sender unavailable'}</span></div><b>{activeStorageGroup.photos.length} PHOTOS</b></div>
          <div className="storage-photo-grid">
          {activeStorageGroup.photos.map((photo) => <article className="storage-photo-item" key={photo.key}>
            <div className="storage-photo-icon"><Image size={24} /></div>
            <div className="storage-photo-details">
              <strong title={photo.original_name || photo.key}>{photo.original_name || photo.key}</strong>
              <small>{photo.sender_name ? `Uploaded by ${photo.sender_name}${photo.sender_role ? ` · ${photo.sender_role === 'admin' ? 'Admin' : 'Requester'}` : ''}` : 'Uploader unavailable · no matching upload record'}</small>
              <small>{photo.source_type || 'Storage object'} · {formatSize(photo.size_bytes)} · {formatDateTime(photo.created_at || photo.last_modified)}</small>
            </div>
            <div className="admin-file-actions"><button type="button" className="admin-file-action" disabled={busyFile === photo.key} onClick={() => openStoragePhoto(photo)}><Eye size={15} />View</button><button type="button" className="admin-file-action" disabled={busyFile === photo.key} onClick={() => downloadStoragePhoto(photo)}><Download size={15} />Download</button></div>
          </article>)}
          </div>
        </> : !storagePhotoLoading && <div className="archive-empty"><strong>{activeStorageSenderKey ? 'No photos for this sender' : 'No stored photos found'}</strong><span>Only JPG and PNG images are shown here.</span></div>}
        {storagePhotoToken && <button type="button" className="storage-photo-more" disabled={storagePhotoLoading} onClick={loadMoreStoragePhotos}>{storagePhotoLoading ? 'Loading…' : 'Load more photos'}</button>}
      </section>}

      {preview && <div className="admin-file-preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
        <section className="admin-file-preview" role="dialog" aria-modal="true" aria-label={`Preview ${preview.file.original_name}`}>
          <header><div><strong>{preview.file.original_name}</strong><small>{preview.file.requester_name} · {preview.file.request_number}</small></div><div className="admin-file-preview-tools">{preview.file.mime_type !== 'application/pdf' && <><button type="button" className="icon-button" title="Zoom out" aria-label="Zoom out" disabled={previewZoom <= 1} onClick={() => setPreviewZoom((zoom) => Math.max(1, +(zoom - 0.25).toFixed(2)))}><ZoomOut size={17} /></button><span aria-live="polite">{Math.round(previewZoom * 100)}%</span><button type="button" className="icon-button" title="Zoom in" aria-label="Zoom in" disabled={previewZoom >= 3} onClick={() => setPreviewZoom((zoom) => Math.min(3, +(zoom + 0.25).toFixed(2)))}><ZoomIn size={17} /></button></>}<button type="button" className="icon-button" aria-label="Close preview" onClick={() => setPreview(null)}><X size={18} /></button></div></header>
          <div className={`admin-file-preview-content${previewZoom > 1 ? ' is-zoomed' : ''}`}>{preview.file.mime_type === 'application/pdf'
            ? <iframe title={`Preview ${preview.file.original_name}`} src={preview.url} />
            : <img src={preview.url} alt={preview.file.original_name} style={{ width: `${previewZoom * 100}%`, height: `${previewZoom * 100}%` }} />}</div>
        </section>
      </div>}
    </section>
  );
}