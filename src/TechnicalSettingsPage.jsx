import { useEffect, useState } from 'react';
import { ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { apiRequest, homepageImageUrl } from './api.js';
import { DEFAULT_HOMEPAGE_CONTENT, mergeHomepageContent } from './homepage-content.js';

function ImagePreview({ file, source, alt }) {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const imageSource = preview || source;
  return imageSource
    ? <img className="technical-image-preview" src={imageSource} alt={alt} />
    : <div className="technical-image-empty"><ImagePlus size={20} /><span>No custom image. The built-in image is active.</span></div>;
}

function TextField({ label, value, onChange, rows = 0, maxLength = 500 }) {
  return <label>{label}{rows
    ? <textarea rows={rows} maxLength={maxLength} value={value || ''} onChange={(event) => onChange(event.target.value)} />
    : <input maxLength={maxLength} value={value || ''} onChange={(event) => onChange(event.target.value)} />}</label>;
}

export default function TechnicalSettingsPage() {
  const [content, setContent] = useState(DEFAULT_HOMEPAGE_CONTENT);
  const [images, setImages] = useState({ hero_background: false, hero_seal: false });
  const [updatedAt, setUpdatedAt] = useState('');
  const [imageFiles, setImageFiles] = useState({});
  const [clearImages, setClearImages] = useState({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadSettings() {
    const result = await apiRequest('/admin/homepage');
    setContent(mergeHomepageContent(result.content || {}));
    setImages(result.images || { hero_background: false, hero_seal: false });
    setUpdatedAt(result.updated_at || '');
  }

  useEffect(() => {
    let active = true;
    apiRequest('/admin/homepage').then((result) => {
      if (!active) return;
      setContent(mergeHomepageContent(result.content || {}));
      setImages(result.images || { hero_background: false, hero_seal: false });
      setUpdatedAt(result.updated_at || '');
    }).catch((cause) => {
      if (active) setError(cause.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const setField = (key, value) => setContent((current) => ({ ...current, [key]: value }));
  const setArrayValue = (key, index, value) => setContent((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) => itemIndex === index ? value : item),
  }));
  const setObjectValue = (key, index, field, value) => setContent((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
  }));

  function chooseImage(slot, event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Choose a JPG or PNG image smaller than 2 MB.');
      return;
    }
    setError('');
    setImageFiles((current) => ({ ...current, [slot]: file }));
    setClearImages((current) => ({ ...current, [slot]: false }));
  }

  async function saveSettings(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = new FormData();
      payload.append('content', JSON.stringify(content));
      payload.append('clear_images', JSON.stringify(clearImages));
      Object.entries(imageFiles).forEach(([slot, file]) => payload.append(slot, file));
      const result = await apiRequest('/admin/homepage', { method: 'POST', body: payload });
      await loadSettings();
      setImageFiles({});
      setClearImages({});
      setNotice(result.message || 'Homepage settings saved.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  const imageVersion = updatedAt || '';

  return (
    <section className="technical-settings">
      <div className="settings-header">
        <div><p className="eyebrow">ADMINISTRATION / HOMEPAGE</p><h2>Technical settings</h2><p>Update the public homepage copy and featured images.</p></div>
        {updatedAt && <span className="security-pill">Last saved {updatedAt}</span>}
      </div>
      {loading && <p className="technical-loading">Loading homepage settings…</p>}
      <form className="settings-form technical-settings-form" onSubmit={saveSettings}>
        <div className="settings-card technical-settings-card">
          <div className="settings-card-header"><ImagePlus size={18} /><strong>Homepage images</strong></div>
          <div className="technical-image-grid">
            {[{ slot: 'hero_background', label: 'Hero background' }, { slot: 'hero_seal', label: 'Hero featured image' }].map(({ slot, label }) => {
              const currentUrl = images[slot] ? homepageImageUrl(slot, imageVersion) : '';
              return <div className="technical-image-field" key={slot}>
                <strong>{label}</strong>
                <ImagePreview file={imageFiles[slot]} source={clearImages[slot] ? '' : currentUrl} alt={label} />
                <div className="technical-image-actions">
                  <label className="technical-upload"><ImagePlus size={15} /> Choose JPG/PNG<input type="file" accept="image/jpeg,image/png" onChange={(event) => chooseImage(slot, event)} /></label>
                  {images[slot] && <button type="button" className="technical-clear-image" onClick={() => { setClearImages((current) => ({ ...current, [slot]: !current[slot] })); setImageFiles((current) => ({ ...current, [slot]: null })); }}><Trash2 size={14} /> {clearImages[slot] ? 'Keep current image' : 'Use built-in image'}</button>}
                </div>
                {imageFiles[slot] && <small>{imageFiles[slot].name}</small>}
              </div>;
            })}
          </div>
          <p className="technical-hint">JPG or PNG, up to 2 MB per image. Uploaded images are stored outside the public folder.</p>
        </div>

        <div className="settings-card technical-settings-card">
          <div className="settings-card-header"><strong>Hero and quick facts</strong></div>
          <div className="technical-fields-grid">
            <TextField label="Eyebrow" value={content.heroEyebrow} onChange={(value) => setField('heroEyebrow', value)} />
            <TextField label="Main headline" value={content.heroHeadline} onChange={(value) => setField('heroHeadline', value)} />
            <TextField label="Highlighted headline" value={content.heroEmphasis} onChange={(value) => setField('heroEmphasis', value)} />
            <TextField label="Hero description" rows={3} value={content.heroDescription} onChange={(value) => setField('heroDescription', value)} />
            <TextField label="Visit assurance" rows={2} value={content.heroAssurance} onChange={(value) => setField('heroAssurance', value)} />
          </div>
          <div className="technical-fields-grid technical-three-columns">{content.trustItems.map((value, index) => <TextField key={index} label={`Quick fact ${index + 1}`} value={value} onChange={(next) => setArrayValue('trustItems', index, next)} />)}</div>
        </div>

        <div className="settings-card technical-settings-card">
          <div className="settings-card-header"><strong>How it works</strong></div>
          <div className="technical-fields-grid">
            <TextField label="Heading line 1" value={content.processHeading[0]} onChange={(value) => setArrayValue('processHeading', 0, value)} />
            <TextField label="Heading line 2" value={content.processHeading[1]} onChange={(value) => setArrayValue('processHeading', 1, value)} />
            <TextField label="Section description" value={content.processDescription} onChange={(value) => setField('processDescription', value)} />
          </div>
          <div className="technical-repeater">{content.steps.map((step, index) => <div className="technical-repeater-item" key={index}><strong>Step {String(index + 1).padStart(2, '0')}</strong><TextField label="Title" value={step.title} onChange={(value) => setObjectValue('steps', index, 'title', value)} /><TextField label="Description" value={step.text} onChange={(value) => setObjectValue('steps', index, 'text', value)} /></div>)}</div>
        </div>

        <div className="settings-card technical-settings-card">
          <div className="settings-card-header"><strong>Document services and tracking</strong></div>
          <div className="technical-fields-grid">
            <TextField label="Documents heading" value={content.documentsHeading} onChange={(value) => setField('documentsHeading', value)} />
            <TextField label="Documents introduction" rows={3} value={content.documentsDescription} onChange={(value) => setField('documentsDescription', value)} />
            <label>Document list<textarea rows={6} value={content.documents.join('\n')} onChange={(event) => setField('documents', event.target.value.split(/\r?\n/).slice(0, 10))} /><small>One document per line, up to 10 items.</small></label>
            <TextField label="Tracking heading line 1" value={content.trackingHeading[0]} onChange={(value) => setArrayValue('trackingHeading', 0, value)} />
            <TextField label="Tracking heading line 2" value={content.trackingHeading[1]} onChange={(value) => setArrayValue('trackingHeading', 1, value)} />
            <TextField label="Tracking description" rows={3} value={content.trackingDescription} onChange={(value) => setField('trackingDescription', value)} />
          </div>
        </div>

        <div className="settings-card technical-settings-card">
          <div className="settings-card-header"><strong>Frequently asked questions</strong></div>
          <div className="technical-fields-grid">
            <TextField label="FAQ heading" value={content.faqsHeading} onChange={(value) => setField('faqsHeading', value)} />
            <TextField label="FAQ introduction" value={content.faqsDescription} onChange={(value) => setField('faqsDescription', value)} />
          </div>
          <div className="technical-repeater">{content.faqs.map((faq, index) => <div className="technical-repeater-item" key={index}><strong>Question {index + 1}</strong><TextField label="Question" value={faq.question} onChange={(value) => setObjectValue('faqs', index, 'question', value)} /><TextField label="Answer" rows={2} value={faq.answer} onChange={(value) => setObjectValue('faqs', index, 'answer', value)} /></div>)}</div>
        </div>

        <div className="settings-card technical-settings-card">
          <div className="settings-card-header"><strong>Closing section and footer</strong></div>
          <div className="technical-fields-grid">
            <TextField label="Closing headline" value={content.closingHeading} onChange={(value) => setField('closingHeading', value)} />
            <TextField label="Closing description" rows={2} value={content.closingDescription} onChange={(value) => setField('closingDescription', value)} />
            <TextField label="Footer description" value={content.footerDescription} onChange={(value) => setField('footerDescription', value)} />
          </div>
        </div>

        {notice && <p className="form-success" role="status">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="settings-actions"><button className="primary-button settings-save" type="submit" disabled={busy || loading}><Save size={16} />{busy ? 'Saving…' : 'Save homepage settings'}</button><span className="settings-hint"><Plus size={15} /> Public homepage updates after saving.</span></div>
      </form>
    </section>
  );
}
