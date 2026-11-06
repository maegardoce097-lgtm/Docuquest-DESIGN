import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Save, UserRound } from 'lucide-react';
import { apiRequest, postJson } from './api.js';
import TechnicalSettingsPage from './TechnicalSettingsPage.jsx';

function AdminAccountsSettings() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadAccounts() {
    const result = await apiRequest('/admin/accounts');
    setAccounts(result.accounts || []);
  }

  useEffect(() => {
    let active = true;
    apiRequest('/admin/accounts').then((result) => {
      if (active) setAccounts(result.accounts || []);
    }).catch((cause) => {
      if (active) setError(cause.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function createAccount(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await postJson('/admin/accounts', form);
      await loadAccounts();
      setForm({ username: '', email: '', password: '', password_confirmation: '' });
      setNotice(result.message || 'Administrator account created.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="settings-form admin-accounts-settings">
    <div className="settings-header">
      <div><p className="eyebrow">ADMINISTRATION / ACCESS</p><h2>Admin accounts</h2><p>Create staff accounts that can sign in at the admin page.</p></div>
      <span className="security-pill">{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</span>
    </div>
    <div className="settings-grid">
      <form className="settings-card" onSubmit={createAccount}>
        <div className="settings-card-header"><UserRound size={18} /><strong>Create admin account</strong></div>
        <label>Full name<input required minLength="2" maxLength="100" autoComplete="name" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
        <label>Email address<input required type="email" maxLength="255" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input required type="password" minLength="10" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <label>Confirm password<input required type="password" minLength="10" autoComplete="new-password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} /></label>
        <button className="primary-button settings-save" disabled={busy} type="submit">{busy ? 'Creating…' : 'Create account'}<ArrowRight size={17} /></button>
      </form>
      <div className="settings-card admin-account-list">
        <div className="settings-card-header"><UserRound size={18} /><strong>Registered admins</strong></div>
        {loading ? <p>Loading admin accounts…</p> : accounts.length ? <ul>
          {accounts.map((account) => <li key={account.id}>
            <span className="avatar">{account.username?.slice(0, 1).toUpperCase()}</span>
            <span><strong>{account.username}</strong><small>{account.email}</small></span>
            <span className={`admin-account-status ${Number(account.is_active) === 1 ? 'active' : ''}`}>{Number(account.is_active) === 1 ? 'Active' : 'Inactive'}</span>
          </li>)}
        </ul> : <p>No administrator accounts found.</p>}
      </div>
    </div>
    {notice && <p className="form-success" role="status">{notice}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}

export default function SettingsPage({ user, onProfileUpdated }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [form, setForm] = useState({
    username: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      username: user.username || '',
      email: user.email || '',
    }));
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        username: form.username,
        email: form.email,
        current_password: form.current_password,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      };

      const result = await postJson('/profile/update', payload);
      setNotice(result.message || 'Account updated successfully.');
      setForm((current) => ({
        ...current,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
      onProfileUpdated?.(result.user);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-page">
      {user?.role === 'admin' && <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button className={activeSection === 'profile' ? 'active' : ''} type="button" role="tab" aria-selected={activeSection === 'profile'} onClick={() => setActiveSection('profile')}>Profile</button>
        <button className={activeSection === 'technical' ? 'active' : ''} type="button" role="tab" aria-selected={activeSection === 'technical'} onClick={() => setActiveSection('technical')}>Technical settings</button>
        <button className={activeSection === 'admins' ? 'active' : ''} type="button" role="tab" aria-selected={activeSection === 'admins'} onClick={() => setActiveSection('admins')}>Admin accounts</button>
      </div>}
      {user?.role === 'admin' && activeSection === 'admins' ? <AdminAccountsSettings /> : user?.role === 'admin' && activeSection === 'technical' ? <TechnicalSettingsPage /> : <>
      <div className="settings-header">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h2>Your profile</h2>
        </div>
        <span className="security-pill"><LockKeyhole size={15} /> Protected</span>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-card-header">
              <UserRound size={18} />
              <strong>Profile details</strong>
            </div>
            <label>
              Full name
              <input required minLength="2" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            </label>
            <label>
              Email address
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <LockKeyhole size={18} />
              <strong>Change password</strong>
            </div>
            <label>
              Current password
              <input type="password" autoComplete="current-password" value={form.current_password} onChange={(event) => setForm({ ...form, current_password: event.target.value })} />
            </label>
            <label>
              New password
              <input type="password" minLength="10" autoComplete="new-password" value={form.new_password} onChange={(event) => setForm({ ...form, new_password: event.target.value })} />
            </label>
            <label>
              Confirm new password
              <input type="password" minLength="10" autoComplete="new-password" value={form.confirm_password} onChange={(event) => setForm({ ...form, confirm_password: event.target.value })} />
            </label>
          </div>
        </div>

        {notice && <p className="form-success">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="settings-actions">
          <button className="primary-button settings-save" disabled={busy} type="submit">
            {busy ? 'Saving…' : 'Save changes'}
            <ArrowRight size={17} />
          </button>
          <span className="settings-hint"><Save size={15} /> Password is optional. Leave blank to keep your current password.</span>
        </div>
      </form>
      </>}
    </section>
  );
}
