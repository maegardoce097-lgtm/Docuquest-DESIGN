import { useEffect, useRef, useState } from 'react';
import { ImagePlus, MessageSquareText, Send, X } from 'lucide-react';
import { apiRequest, fetchMessageImage } from './api.js';

function MessageImage({ fileId, fileName }) {
  const [imageUrl, setImageUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    fetchMessageImage(fileId).then((url) => {
      objectUrl = url;
      if (active) setImageUrl(url);
      else URL.revokeObjectURL(url);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  if (failed) return <p className="message-image-unavailable">Image unavailable.</p>;
  if (!imageUrl) return <p className="message-image-loading">Loading image…</p>;
  return <a className="conversation-message-image" href={imageUrl} target="_blank" rel="noreferrer"><img src={imageUrl} alt={fileName || 'Image attachment'} /></a>;
}

export default function MessagesPage({ requests, user, focusRequest }) {
  const [requestId, setRequestId] = useState('');
  const [thread, setThread] = useState(null);
  const [body, setBody] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (focusRequest?.id) setRequestId(String(focusRequest.id));
  }, [focusRequest?.id, focusRequest?.revision]);

  useEffect(() => {
    if (!requestId && !focusRequest?.id && requests.length) setRequestId(String(requests[0].id));
  }, [requestId, requests, focusRequest?.id]);

  useEffect(() => {
    if (!requestId) {
      setThread(null);
      setLoading(false);
      return undefined;
    }

    let current = true;
    let polling = false;
    setThread(null);
    setLoading(true);
    setError('');
    const loadThread = async (includeDetails = false) => {
      if (polling || (!includeDetails && document.hidden)) return;
      polling = true;
      try {
        const result = includeDetails
          ? await apiRequest(`/requests/show?id=${encodeURIComponent(requestId)}`)
          : await apiRequest(`/requests/messages?id=${encodeURIComponent(requestId)}`);
        if (current) {
          if (includeDetails) setThread(result);
          else setThread((activeThread) => activeThread ? { ...activeThread, messages: result.messages || [] } : activeThread);
          setError('');
        }
      } catch (cause) {
        if (current) setError(cause.message);
      } finally {
        polling = false;
        if (current && includeDetails) setLoading(false);
      }
    };

    loadThread(true);
    const interval = window.setInterval(() => loadThread(), 15000);
    return () => {
      current = false;
      window.clearInterval(interval);
    };
  }, [requestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread?.request?.id, thread?.messages?.length]);

  function selectRequest(id) {
    setThread(null);
    setLoading(true);
    setError('');
    setRequestId(String(id));
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!requestId || (!body.trim() && !selectedImage)) return;
    setSending(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('request_id', requestId);
      payload.append('body', body.trim());
      if (selectedImage) payload.append('image', selectedImage);
      await apiRequest('/requests/message', { method: 'POST', body: payload });
      setBody('');
      setSelectedImage(null);
      const result = await apiRequest(`/requests/show?id=${encodeURIComponent(requestId)}`);
      setThread(result);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="messages-page">
      <header className="view-heading"><div><p className="eyebrow">SECURE COMMUNICATION</p><h2>Messages</h2><p>Talk with the {user.role === 'admin' ? 'requester' : 'records team'} about a document request.</p></div></header>
      <div className="messages-layout">
        <aside className="conversation-list"><div className="conversation-list-heading"><span>INBOX</span><strong>{requests.length}</strong></div>{requests.map((request) => <button type="button" key={request.id} aria-pressed={String(request.id) === requestId} className={`conversation-choice ${String(request.id) === requestId ? 'selected' : ''}`} onClick={() => selectRequest(request.id)}><span className="conversation-avatar">{request.document_type?.slice(0, 1)}</span><span className="conversation-meta"><strong>{user.role === 'admin' ? request.requester_name : request.document_type}</strong><small>{request.request_number}</small></span><span className={`status-dot status-dot-${request.status}`} /></button>)}{!requests.length && <p className="conversation-empty">No requests yet.</p>}</aside>
        <section className="conversation-panel">
          {loading && !thread ? <div className="conversation-loading" role="status" aria-live="polite"><span className="conversation-loading-mark"><MessageSquareText size={20} /></span><strong>Opening conversation</strong><small>Loading messages for this request…</small></div> : thread ? <>
            <header className="conversation-header"><div><p className="eyebrow">{thread.request.request_number}</p><h3>{user.role === 'admin' ? thread.request.requester_name : thread.request.document_type}</h3><span>{thread.request.document_type}</span></div><span className={`status status-${thread.request.status}`}>{thread.request.status?.replaceAll('_', ' ')}</span></header>
            <div className="progress-block"><div><span>Request progress</span><strong>{thread.request.progress}%</strong></div><div className="progress-track"><span style={{ width: `${thread.request.progress}%` }} /></div></div>
            <div className="conversation-messages">{(thread.messages || []).map((message) => <article className={`message-bubble ${Number(message.sender_id) === Number(user.id) ? 'mine' : ''}`} key={message.id}><strong>{message.sender_name}</strong>{message.body && <p>{message.body}</p>}{message.attachment_id && <MessageImage fileId={message.attachment_id} fileName={message.attachment_original_name} />}<small>{message.created_at}</small></article>)}{!thread.messages?.length && <div className="conversation-no-messages"><span><MessageSquareText size={21} /></span><strong>No messages yet</strong><small>Send a message to start the conversation about this request.</small></div>}<div ref={messagesEndRef} /></div>
            <form className="conversation-compose" onSubmit={sendMessage}>
              <div className="conversation-compose-heading"><strong>NEW MESSAGE</strong><span>Reply about this request</span></div>
              {selectedImage && <div className="message-image-pending"><ImagePlus size={15} /><span>{selectedImage.name}</span><button type="button" aria-label="Remove attached image" onClick={() => setSelectedImage(null)}><X size={15} /></button></div>}
              <label className="message-image-picker" title="Attach a JPG or PNG image"><input type="file" accept="image/jpeg,image/png" aria-label="Attach a JPG or PNG image" onChange={(event) => { const image = event.target.files?.[0] || null; event.target.value = ''; if (!image) return; if (!['image/jpeg', 'image/png'].includes(image.type) || image.size > 2 * 1024 * 1024) { setError('Choose a JPG or PNG image smaller than 2 MB.'); return; } setError(''); setSelectedImage(image); }} /><ImagePlus size={18} /></label>
              <textarea aria-label="Write a message" placeholder="Write a message…" rows="2" maxLength="2000" value={body} onChange={(event) => setBody(event.target.value)} />
              <button className="primary-button" disabled={sending || (!body.trim() && !selectedImage)}>{sending ? 'Sending…' : 'Send'}<Send size={16} /></button>
            </form>
          </> : <div className="conversation-empty-state"><strong>{requests.length ? 'Choose a request' : 'No requests to discuss'}</strong><span>Select a request to view its conversation.</span></div>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </section>
      </div>
    </section>
  );
}