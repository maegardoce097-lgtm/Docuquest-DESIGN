import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, BarChart3, Bell, BookOpen, Check, CreditCard, Download, FilePlus2, FileText, FolderOpen, LogOut, Mail, RefreshCw, Search, Send, Settings2, ShieldCheck, Star, Trash2, Upload, X } from 'lucide-react';
import { apiRequest, appUrl, APP_BASE_URL, clearTokens, downloadRequestFile, hasSession, homepageImageUrl, logout, postJson } from './api.js';
import { getRecaptchaToken, initializeRecaptcha } from './recaptcha.js';
import AdminArchive from './AdminArchive.jsx';
import AdminReports from './AdminReports.jsx';
import AdminFeedback from './AdminFeedback.jsx';
import AdminFiles from './AdminFiles.jsx';
import MessagesPage from './MessagesPage.jsx';
import HomePage from './HomePage.jsx';
import HowToUsePage from './HowToUsePage.jsx';
import SettingsPage from './SettingsPage.jsx';
import WorkspaceClockWeather from './WorkspaceClockWeather.jsx';
import './payment.css';

const naujanSeal = '/assets/naujan_seal_3d_bg_web.webp';
const emptyRequest = { full_name: '', phone: '', address: '', sitio: '', document_type: 'Application for Marriage License', purpose: '' };
const feedbackQuestions = [
  { key: 'staff_service_rating', label: 'How easy was it to submit your document request using the DocuQuest system?', tagalog: 'Gaano kadali magsumite ng document request gamit ang DocuQuest system?' },
  { key: 'instructions_clarity_rating', label: 'How clear was the information about requirements and fees for this transaction?', tagalog: 'Gaano kalinaw ang impormasyon tungkol sa requirements at bayarin para sa transaksyong ito?' },
  { key: 'status_updates_rating', label: 'How useful and timely were the system notifications and request status updates?', tagalog: 'Gaano kapaki-pakinabang at kaagap ang mga notification at update sa status ng request?' },
  { key: 'processing_time_rating', label: 'How smooth was the payment process, or fee-waiver handling if no payment was due?', tagalog: 'Gaano kadali ang proseso ng pagbabayad, o pag-asikaso ng libreng request kung walang bayarin?' },
  { key: 'overall_satisfaction_rating', label: 'How satisfied are you with the overall completion of this document transaction through DocuQuest?', tagalog: 'Gaano ka nasiyahan sa kabuuang pagkumpleto ng transaksyon ng dokumentong ito sa DocuQuest?' },
];
const emptyFeedbackRatings = Object.fromEntries(feedbackQuestions.map(({ key }) => [key, 0]));
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

initializeRecaptcha().catch(() => {});
const DOCUMENT_GUIDES = {
  'Application for Marriage License': {
    english: 'Use this service to ask the Municipal Registrar about applying for a marriage license before a wedding. The registrar will review your situation and explain the applicable eligibility, documents, and next steps.',
    tagalog: 'Gamitin ang serbisyong ito upang magtanong sa Municipal Registrar tungkol sa pagkuha ng marriage license bago ikasal. Susuriin ng registrar ang inyong sitwasyon at ipapaliwanag ang naaangkop na kwalipikasyon, mga dokumento, at susunod na hakbang.',
    exampleEnglish: 'A couple planning a civil wedding asks the registrar which documents to prepare and whether they meet the requirements.',
    exampleTagalog: 'Magtatanong ang magkaparehang nagpaplanong magpakasal sa civil wedding kung anong mga dokumento ang ihahanda at kung pasok sila sa mga kinakailangan.',
  },
  'Authentication of Record': {
    english: 'Use this service when an organization asks you to have a civil registry record verified or authenticated by the office that holds or certifies it. Ask the registrar and the receiving organization what type of authentication is accepted; requirements can vary.',
    tagalog: 'Gamitin ito kapag hinihingi ng isang organisasyon na beripikahin o ipa-authenticate sa tanggapang may hawak o nagpapatunay nito ang isang civil registry record. Itanong sa registrar at sa tatanggap na organisasyon kung anong uri ng authentication ang tinatanggap dahil maaaring magkaiba ang mga kinakailangan.',
    exampleEnglish: 'A school asks for an authenticated copy of a local civil registry record, so the applicant checks with the registrar what authentication the school will accept.',
    exampleTagalog: 'Humingi ang paaralan ng authenticated na kopya ng lokal na civil registry record, kaya kinukumpirma muna ng aplikante sa registrar kung anong authentication ang tatanggapin ng paaralan.',
  },
  Endorsement: {
    english: 'Use this service to ask the Municipal Registrar to review whether a record-related request should be referred or forwarded to another office for the next step. The registrar will determine whether an endorsement is appropriate and what information is needed.',
    tagalog: 'Gamitin ito upang ipasuri sa Municipal Registrar kung dapat i-refer o ipasa sa ibang tanggapan ang isang kahilingan tungkol sa rekord. Ang registrar ang magpapasya kung angkop ang endorsement at kung anong impormasyon ang kailangan.',
    exampleEnglish: 'A resident is unsure which registry office should handle a record concern and asks the registrar whether it can be referred to the appropriate office.',
    exampleTagalog: 'Hindi tiyak ang isang residente kung aling registry office ang dapat humawak sa usapin tungkol sa rekord, kaya itinatanong niya sa registrar kung maaari itong i-refer sa tamang tanggapan.',
  },
  'Issuance of Certificate of Birth/Marriage/Death on Municipal Forms (1A, 2B, 3C)': {
    english: 'Use this service to request a birth, marriage, or death certificate on the applicable Municipal Registrar form (1A, 2B, or 3C). The registrar will check which form matches your record and purpose, and confirm whether the record can be issued by the office.',
    tagalog: 'Gamitin ito upang humiling ng birth, marriage, o death certificate gamit ang naaangkop na Municipal Registrar form (1A, 2B, o 3C). Titingnan ng registrar kung aling form ang angkop sa rekord at layunin mo, at kung maaari itong ilabas ng tanggapan.',
    exampleEnglish: 'A resident needs a municipal-form birth certificate for an application and asks the registrar which form to request.',
    exampleTagalog: 'Kailangan ng isang residente ng birth certificate na nasa municipal form para sa isang aplikasyon, kaya itinatanong niya sa registrar kung aling form ang dapat hilingin.',
  },
  'Petition for Correction of Clerical Error (RA 9048/10172) or Change of First Name (RA 9048)': {
    english: 'Use this service to ask whether a civil registry entry may qualify for correction of a clerical or typographical error, a correction covered by RA 9048/10172, or a change of first name under RA 9048. The registrar will assess which legal process applies and what evidence is required. Filing a petition does not guarantee approval.',
    tagalog: 'Gamitin ito upang alamin kung maaaring saklawin ng pagwawasto ng clerical o typographical error, ng RA 9048/10172, o ng pagpapalit ng first name sa ilalim ng RA 9048 ang isang civil registry entry. Susuriin ng registrar kung aling prosesong legal ang naaangkop at anong ebidensya ang kailangan. Hindi garantiya ng pag-apruba ang paghahain ng petisyon.',
    exampleEnglish: 'A person notices a misspelled name on a registry record and asks the registrar whether it may qualify for a petition and what proof to prepare.',
    exampleTagalog: 'May napansing maling baybay ng pangalan ang isang tao sa registry record, kaya itinatanong niya sa registrar kung maaari itong petisyunan at anong patunay ang ihahanda.',
  },
  'Registration of Death': {
    english: 'Use this service to ask how a death is reported and recorded in the civil registry. The registrar will explain who may provide the information and which supporting records are needed for the circumstances, including if the registration is late.',
    tagalog: 'Gamitin ito upang magtanong kung paano iniuulat at itinatala sa civil registry ang pagkamatay. Ipapaliwanag ng registrar kung sino ang maaaring magbigay ng impormasyon at anong mga suportang rekord ang kailangan, kabilang kung late na ang pagpaparehistro.',
    exampleEnglish: 'A family member asks the registrar how to report a relative’s death and what records to bring to begin the process.',
    exampleTagalog: 'Itinatanong ng isang kaanak sa registrar kung paano iuulat ang pagkamatay ng kapamilya at anong mga rekord ang dadalhin upang masimulan ang proseso.',
  },
  'Registration of Live Birth': {
    english: 'Use this service to ask how a child’s birth can be recorded in the civil registry. The registrar will review the details and explain which supporting documents and steps apply to your situation. Ask the office about late registration or other special circumstances.',
    tagalog: 'Gamitin ito upang magtanong kung paano itatala sa civil registry ang kapanganakan ng bata. Susuriin ng registrar ang mga detalye at ipapaliwanag kung anong mga suportang dokumento at hakbang ang naaangkop sa inyong sitwasyon. Magtanong sa tanggapan tungkol sa late registration o iba pang espesyal na kalagayan.',
    exampleEnglish: 'A parent of a newborn asks the registrar how to register the birth and which supporting documents to prepare.',
    exampleTagalog: 'Itinatanong ng magulang ng bagong silang na sanggol sa registrar kung paano ipaparehistro ang kapanganakan at anong mga suportang dokumento ang ihahanda.',
  },
  'Supplemental Report/Annotation (Birth/Marriage/Death)': {
    english: 'Use this service to ask whether omitted information or a later legal event may be added to or noted on an existing birth, marriage, or death record. A supplemental report and an annotation are different processes; the registrar will determine which, if either, applies and what documents are needed.',
    tagalog: 'Gamitin ito upang alamin kung maaaring idagdag o itala sa kasalukuyang birth, marriage, o death record ang impormasyong hindi naisama o ang sumunod na legal na pangyayari. Magkaiba ang supplemental report at annotation; ang registrar ang tutukoy kung alin, kung mayroon man, ang naaangkop at anong mga dokumento ang kailangan.',
    exampleEnglish: 'After receiving a record copy, a resident notices an omitted detail or has a later legal document and asks the registrar whether a supplemental report or annotation is appropriate.',
    exampleTagalog: 'Matapos makatanggap ng kopya ng rekord, may napansing hindi naisamang detalye ang isang residente o may bago siyang legal na dokumento, kaya tinatanong niya sa registrar kung supplemental report o annotation ang angkop.',
  },
};

function notificationDateInfo(createdAt) {
  const normalized = String(createdAt || '').trim().replace(' ', 'T');
  const date = new Date(normalized.endsWith('Z') ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) return { key: 'Earlier', label: 'Earlier' };

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const nowParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  const todayKey = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
  const yesterday = new Date(`${todayKey}T12:00:00+08:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (dateKey === todayKey) return { key: dateKey, label: 'Today' };
  if (dateKey === yesterdayKey) return { key: dateKey, label: 'Yesterday' };
  return {
    key: dateKey,
    label: new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' }).format(date),
  };
}

function notificationBodyItems(body) {
  return String(body || '').split(/\r?\n/).flatMap((paragraph) => {
    const items = [];
    let start = 0;
    for (let index = 0; index < paragraph.length; index += 1) {
      if ('.!?'.includes(paragraph[index]) && /\s/.test(paragraph[index + 1] || '')
        && /[A-ZÀ-Þ]/.test(paragraph[index + 2] || '')) {
        items.push(paragraph.slice(start, index + 1));
        start = index + 2;
        while (/\s/.test(paragraph[start] || '')) start += 1;
        index = start - 1;
      }
    }
    items.push(paragraph.slice(start));
    return items.map((item) => item.replace(/^\s*(?:[•*-]\s*|\d+[.)]\s*)/, '').trim()).filter(Boolean);
  });
}

export default function App() {
  const initialPath = window.location.pathname;
  const normalizedPath = initialPath.replace(/\/+$/, '') || '/';
  const normalizedBase = APP_BASE_URL.replace(/\/+$/, '') || '/';
  const loginPath = normalizedPath === appUrl('login').replace(/\/+$/, '');
  const registerPath = normalizedPath === appUrl('register').replace(/\/+$/, '');
  const howToUsePath = normalizedPath === appUrl('how-to-use').replace(/\/+$/, '');
  const isHomePath = normalizedPath === normalizedBase;
  const [user, setUser] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(hasSession());
  const initialHash = window.location.hash.replace(/^#/, '');
  const [page, setPage] = useState(howToUsePath ? 'guide' : initialHash || (initialPath.includes('/archive') ? 'archive' : initialPath.includes('/reports') ? 'reports' : initialPath.includes('/feedback') ? 'feedback' : initialPath.includes('/files') || initialPath.includes('/storage') ? 'files' : initialPath.includes('/messages') ? 'messages' : 'requests'));
  const [requests, setRequests] = useState([]);
  const [dailyRequestCount, setDailyRequestCount] = useState(0);
  const [dailyRequestLimit, setDailyRequestLimit] = useState(5);
  const [barangays, setBarangays] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [mode, setMode] = useState(registerPath ? 'register' : 'login');
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirmation: '' });
  const [requestForm, setRequestForm] = useState(emptyRequest);
  const [customDocumentType, setCustomDocumentType] = useState('');
  const [requestFiles, setRequestFiles] = useState([]);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [requestAcknowledged, setRequestAcknowledged] = useState(false);
  const [pendingRequirementFiles, setPendingRequirementFiles] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingPaymentRequests, setPendingPaymentRequests] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [search, setSearch] = useState('');
  const [requestFolderOpen, setRequestFolderOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [todayFolderOpen, setTodayFolderOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [messageBody, setMessageBody] = useState('');
  const [statusForm, setStatusForm] = useState({ status: '', note: '', requirements: '', release_at: '' });
  const [feeAmount, setFeeAmount] = useState('');
  const [paymentOption, setPaymentOption] = useState('amount');
  const [feedbackRatings, setFeedbackRatings] = useState(emptyFeedbackRatings);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [messageTarget, setMessageTarget] = useState({ id: '', revision: 0 });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [notificationError, setNotificationError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const googleButtonRef = useRef(null);
  const paymentReturnHandled = useRef(false);
  const adminPath = normalizedPath === appUrl('admin').replace(/\/+$/, '') || normalizedPath.startsWith(`${appUrl('admin').replace(/\/+$/, '')}/`);

  function showConfirmation(message, type = 'success') {
    setConfirmation({ message, type, createdAt: Date.now() });
  }

  useEffect(() => {
    if (!confirmation) return undefined;
    const timeout = window.setTimeout(() => setConfirmation(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [confirmation]);

  async function loadWorkspace() {
    const dashboard = await apiRequest('/dashboard');
    if (!hasSession()) return;
    setUser(dashboard.user);
    setRequests(dashboard.requests || []);
    setDailyRequestCount(Number(dashboard.daily_request_count || 0));
    setDailyRequestLimit(Number(dashboard.daily_request_limit || 5));
    setBarangays(dashboard.barangays || []);
    setDocumentTypes(dashboard.document_types || []);
    setStats(dashboard.stats || { total: 0, active: 0, completed: 0 });
    setUnreadCount(Number(dashboard.unread_count || 0));
  }

  function finishAuthentication(authenticatedUser) {
    setWorkspaceLoading(true);
    setUser(authenticatedUser);
    setPage('requests');
    const destination = authenticatedUser.role === 'admin' ? 'admin' : 'dashboard';
    window.history.replaceState(null, '', `${appUrl(destination)}#requests`);
    loadWorkspace()
      .catch((cause) => setError(cause.message))
      .finally(() => setWorkspaceLoading(false));
  }

  useEffect(() => {
    if (!hasSession()) {
      setWorkspaceLoading(false);
      return;
    }
    setWorkspaceLoading(true);
    loadWorkspace().catch(() => setUser(null)).finally(() => setWorkspaceLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.role === 'admin' || paymentReturnHandled.current) return;
    const currentUrl = new URL(window.location.href);
    const paymentResult = currentUrl.searchParams.get('payment');
    const requestId = Number(currentUrl.searchParams.get('request_id'));
    if (!paymentResult) return;

    paymentReturnHandled.current = true;
    window.history.replaceState(null, '', `${currentUrl.pathname}#requests`);
    if (!Number.isInteger(requestId) || requestId < 1) return;
    setPage('requests');
    if (paymentResult === 'cancelled') {
      showConfirmation('Payment was not completed. You can try again from this request.', 'warning');
      return;
    }
    if (paymentResult !== 'success') return;

    apiRequest(`/requests/payment/confirm?request_id=${encodeURIComponent(requestId)}`)
      .then(async (result) => {
        showConfirmation(result.payment?.status === 'paid'
          ? 'Payment confirmed by PayMongo.'
          : 'Payment is still being confirmed. Refresh this request shortly.', result.payment?.status === 'paid' ? 'success' : 'warning');
        await loadWorkspace();
        await openRequest({ id: requestId });
      })
      .catch((cause) => showConfirmation(cause.message, 'error'));
  }, [user?.id]);

  useEffect(() => {
    if (mode !== 'login' || user || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return undefined;

    let active = true;
    const renderButton = () => {
      if (!active || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        callback: async ({ credential }) => {
          setBusy(true);
          setError('');
          try {
            const recaptchaToken = await getRecaptchaToken('google_login');
            const result = await postJson('/google-login', { credential, recaptcha_token: recaptchaToken });
            finishAuthentication(result.user);
          } catch (cause) {
            setError(cause.message);
          } finally {
            setBusy(false);
          }
        },
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: 320,
      });
    };

    let script = document.getElementById('google-identity-services');
    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.id = 'google-identity-services';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.append(script);
      }
      script.addEventListener('load', renderButton);
    }

    return () => {
      active = false;
      script?.removeEventListener('load', renderButton);
    };
  }, [mode, user]);

  useEffect(() => {
    if (!user || !['requests', 'new-request'].includes(page)) return undefined;
    let polling = false;
    let active = true;
    async function refreshWorkspace() {
      if (polling || document.hidden) return;
      polling = true;
      try {
        const [dashboard, notificationResult] = await Promise.all([
          apiRequest('/dashboard'),
          notificationsOpen ? apiRequest('/notifications') : Promise.resolve(null),
        ]);
        if (!active) return;
        setRequests(dashboard.requests || []);
        setDailyRequestCount(Number(dashboard.daily_request_count || 0));
        setDailyRequestLimit(Number(dashboard.daily_request_limit || 5));
        setBarangays(dashboard.barangays || []);
        setDocumentTypes(dashboard.document_types || []);
        setStats(dashboard.stats || { total: 0, active: 0, completed: 0 });
        setUnreadCount(Number((notificationResult?.unread_count ?? dashboard.unread_count) || 0));
        if (notificationResult) setNotifications(notificationResult.notifications || []);
        if (activeRequest?.request?.id) {
          const detail = await apiRequest(`/requests/show?id=${encodeURIComponent(activeRequest.request.id)}`);
          if (active) setActiveRequest(detail);
        }
      } catch {
        if (active && !hasSession()) setUser(null);
      } finally {
        polling = false;
      }
    }
    const interval = window.setInterval(refreshWorkspace, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user?.id, page, notificationsOpen, activeRequest?.request?.id]);

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const endpoint = mode === 'register' ? '/create' : '/login';
      const payload = mode === 'login'
        ? { ...form, recaptcha_token: await getRecaptchaToken('login') }
        : form;
      const result = await postJson(endpoint, payload);
      finishAuthentication(result.user);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitRequest(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setPendingPaymentRequests([]);
    try {
      const payload = new FormData();
      Object.entries(requestForm).forEach(([key, value]) => payload.append(key, key === 'document_type' && value === 'Other' ? customDocumentType.trim() : value));
      if (privacyConsent) payload.append('privacy_consent', '1');
      requestFiles.forEach((file) => payload.append('files[]', file));
      await apiRequest('/requests', { method: 'POST', body: payload });
      setRequestForm(emptyRequest);
      setCustomDocumentType('');
      setRequestFiles([]);
      setPrivacyConsent(false);
      setRequestAcknowledged(false);
      showConfirmation('Request sent successfully.');
      setPage('requests');
      window.history.replaceState(null, '', '#requests');
      loadWorkspace().catch(() => {
        setError('Request submitted, but the workspace could not refresh. Reload to see it.');
      });
    } catch (cause) {
      setError(cause.message);
      setPendingPaymentRequests(cause.pendingPayments || []);
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    logout();
    setUser(null);
    setWorkspaceLoading(false);
    setRequests([]);
    setNotifications([]);
    setActiveRequest(null);
    setUnreadCount(0);
    setPage('requests');
    window.history.replaceState(null, '', user?.role === 'admin' ? appUrl('admin') : appUrl());
  }

  async function openRequest(request) {
    setError('');
    setPendingPaymentRequests([]);
    try {
      const detail = await apiRequest(`/requests/show?id=${encodeURIComponent(request.id)}`);
      setActiveRequest(detail);
      setFeedbackRatings(Object.fromEntries(feedbackQuestions.map(({ key }) => [key, Number(detail.feedback?.[key] || 0)])));
      setFeedbackComment(detail.feedback?.comment || '');
      setFeedbackError('');
      setStatusForm({
        status: detail.request.status,
        note: '',
        requirements: detail.request.requirements || '',
        release_at: detail.request.release_at_local || '',
      });
      setMessageBody('');
      setFeeAmount(detail.payment?.amount ?? '');
      setPaymentOption(detail.payment && (detail.payment.status === 'waived' || Number(detail.payment.amount) === 0) ? 'free' : 'amount');
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function submitMessage(event) {
    event.preventDefault();
    if (!activeRequest) return;
    setBusy(true);
    try {
      await postJson('/requests/message', { request_id: activeRequest.request.id, body: messageBody });
      setMessageBody('');
      await openRequest(activeRequest.request);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitFeedback(event) {
    event.preventDefault();
    if (!activeRequest || feedbackQuestions.some(({ key }) => feedbackRatings[key] < 1 || feedbackRatings[key] > 5)) {
      setFeedbackError('Sagutan ang lahat ng limang tanong gamit ang rating na 1 hanggang 5.');
      return;
    }
    setBusy(true);
    setFeedbackError('');
    try {
      const result = await postJson('/requests/feedback', {
        request_id: activeRequest.request.id,
        ratings: feedbackRatings,
        comment: feedbackComment,
      });
      setActiveRequest((current) => current ? { ...current, feedback: result.feedback } : current);
      showConfirmation('Salamat sa pagbibigay ng feedback sa DocuQuest.');
    } catch (cause) {
      setFeedbackError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  function setReleaseTime(hour, minute = 0) {
    const current = statusForm.release_at || '';
    const currentDate = current.slice(0, 10) || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    setStatusForm({ ...statusForm, release_at: `${currentDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` });
  }

  async function submitStatus(event) {
    event.preventDefault();
    if (!activeRequest) return;
    setBusy(true);
    setError('');
    try {
      const result = await postJson('/requests/status', {
        request_id: activeRequest.request.id,
        status: statusForm.status,
        note: statusForm.note,
        requirements: statusForm.requirements,
        release_at: statusForm.release_at,
      });
      await Promise.all([loadWorkspace(), openRequest(activeRequest.request)]);
      showConfirmation(
        result.email_sent ? 'Request update emailed to the requester.' : 'Progress saved, but the email could not be sent.',
        result.email_sent ? 'success' : 'warning',
      );
    } catch (cause) {
      setError(cause.message);
      showConfirmation(cause.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function requirementItems(value) {
    return String(value || '').split(/\r\n|\r|\n/).map((item) => item.trim().replace(/^(?:[-*•]|\d+[.)])\s*/u, '')).filter(Boolean);
  }

  function stageRequirementFile(index, file) {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Pumili ng PDF, JPG, o PNG na hindi lalampas sa 2 MB.');
      return;
    }
    setError('');
    setPendingRequirementFiles((current) => ({ ...current, [index]: file }));
  }

  async function confirmRequirementUpload(index) {
    const file = pendingRequirementFiles[index];
    if (!file) return;
    if (await uploadRequirement(index, file)) {
      setPendingRequirementFiles((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
    }
  }

  async function reviewRequirementUpload(index, file, reviewStatus) {
    try {
      setBusy(true);
      setError('');
      const result = await postJson('/requests/requirements/review', {
        request_id: activeRequest.request.id,
        index,
        file_id: Number(file.id),
        review_status: reviewStatus,
      });
      const refreshedRequest = await apiRequest(`/requests/show?id=${encodeURIComponent(activeRequest.request.id)}`);
      setActiveRequest(refreshedRequest);
      showConfirmation(result.message || (reviewStatus === 'validated' ? 'Requirement validated.' : 'Requirement rejected; requester notified.'));
    } catch (cause) {
      setError(cause.message);
      showConfirmation(cause.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function uploadRequirement(index, file) {
    if (!activeRequest || !file) return false;
    setBusy(true);
    setError('');
    const formData = new FormData();
    formData.append('request_id', String(activeRequest.request.id));
    formData.append('index', String(index));
    formData.append('file', file);
    try {
      await apiRequest('/requests/requirements/upload', { method: 'POST', body: formData });
      await openRequest(activeRequest.request);
      showConfirmation('Na-upload ang file para sa requirement. Susuriin ito ng munisipyo bago ma-verify.');
      return true;
    } catch (cause) {
      setError(cause.message);
      showConfirmation(cause.message, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function savePaymentAmount(event) {
    event.preventDefault();
    if (!activeRequest) return;
    setBusy(true);
    try {
      const result = await postJson('/admin/requests/payment', {
        request_id: Number(activeRequest.request.id),
        amount: paymentOption === 'free' ? '0.00' : feeAmount,
      });
      await openRequest(activeRequest.request);
      showConfirmation(
        result.email_sent === null ? 'Payment amount is unchanged; no additional email was sent.' : result.email_sent === false ? 'Payment saved, but the requester email could not be sent.' : result.payment?.status === 'waived' ? 'No payment is required. The requester was notified.' : 'Payment details saved and the requester was notified.',
        result.email_sent === false ? 'warning' : 'success',
      );
    } catch (cause) {
      showConfirmation(cause.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function startPayment() {
    if (!activeRequest) return;
    setBusy(true);
    try {
      const result = await postJson('/requests/payment/checkout', {
        request_id: Number(activeRequest.request.id),
      });
      if (result.checkout_url) {
        window.location.assign(result.checkout_url);
        return;
      }
      if (result.payment?.status === 'paid') {
        await openRequest(activeRequest.request);
        showConfirmation('Payment confirmed by PayMongo.');
      }
    } catch (cause) {
      showConfirmation(cause.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function toggleNotifications() {
    if (notificationsOpen) {
      setNotificationsOpen(false);
      return;
    }
    setNotificationsOpen(true);
    setNotificationsLoading(true);
    setNotificationError('');
    try {
      const result = await apiRequest('/notifications');
      setNotifications(result.notifications || []);
      setUnreadCount(Number(result.unread_count || 0));
    } catch (cause) {
      setNotificationError(cause.message);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function updateNotificationReadState(notification, isRead) {
    setNotificationError('');
    const wasRead = Number(notification.is_read) === 1;
    if (wasRead === isRead) return true;
    setNotifications((current) => current.map((item) => Number(item.id) === Number(notification.id)
      ? { ...item, is_read: isRead ? 1 : 0 }
      : item));
    setUnreadCount((current) => Math.max(0, current + (isRead ? -1 : 1)));
    try {
      const result = await postJson('/notifications/read', {
        notification_id: Number(notification.id),
        is_read: isRead,
      });
      setUnreadCount(Number(result.unread_count || 0));
      return true;
    } catch (cause) {
      setNotifications((current) => current.map((item) => Number(item.id) === Number(notification.id)
        ? { ...item, is_read: wasRead ? 1 : 0 }
        : item));
      setUnreadCount((current) => Math.max(0, current + (isRead ? 1 : -1)));
      setNotificationError(cause.message);
      return false;
    }
  }

  async function deleteNotification(notification) {
    if (!window.confirm(`Delete notification "${notification.title}"?`)) return;
    setNotificationError('');
    const wasUnread = Number(notification.is_read) !== 1;
    setNotifications((current) => current.filter((item) => Number(item.id) !== Number(notification.id)));
    if (wasUnread) setUnreadCount((current) => Math.max(0, current - 1));
    try {
      const result = await postJson('/notifications/delete', { notification_id: Number(notification.id) });
      setUnreadCount(Number(result.unread_count || 0));
    } catch (cause) {
      setNotifications((current) => [notification, ...current]);
      if (wasUnread) setUnreadCount((current) => current + 1);
      setNotificationError(cause.message);
    }
  }

  async function openNotification(notification) {
    const requestId = Number(notification.request_id);
    if (!Number.isInteger(requestId) || requestId < 1) return;

    if (Number(notification.is_read) !== 1) {
      updateNotificationReadState(notification, true);
    }
    setNotificationsOpen(false);
    setActiveRequest(null);
    if (notification.title?.toLowerCase().startsWith('new message')) {
      setMessageTarget((current) => ({ id: String(requestId), revision: current.revision + 1 }));
      setPage('messages');
      window.history.replaceState(null, '', '#messages');
      return;
    }

    setPage('requests');
    window.history.replaceState(null, '', '#requests');
    openRequest({ id: requestId });
  }

  function navigate(event, nextPage) {
    event.preventDefault();
    setPage(nextPage);
    setActiveRequest(null);
    const nextUrl = howToUsePath
      ? `${appUrl('dashboard')}#${nextPage}`
      : `#${nextPage}`;
    window.history.replaceState(null, '', nextUrl);
  }

  function startDocumentRequest(documentType) {
    setRequestForm((current) => ({ ...current, document_type: documentType }));
    setCustomDocumentType('');
    setSelectedDocumentType('');
    setPage('new-request');
    setActiveRequest(null);
    window.history.replaceState(null, '', '#new-request');
  }

  function showDocumentGuide(documentType) {
    setSelectedDocumentType(documentType);
  }

  const filteredRequests = requests.filter((request) =>
    `${request.request_number} ${request.document_type} ${request.status}`.toLowerCase().includes(search.toLowerCase()),
  );
  const activeDuplicateRequest = requests.find((request) =>
    request.document_type === requestForm.document_type && !['completed', 'rejected'].includes(request.status),
  );
  const selectedDocumentGuide = DOCUMENT_GUIDES[selectedDocumentType] || {
    english: 'This is a document service handled by the Municipal Registrar. The office will review your request and confirm the applicable process and supporting documents. Contact the registrar if you are unsure whether this service matches your needs.',
    tagalog: 'Serbisyo ito para sa dokumentong pinoproseso ng Municipal Registrar. Susuriin ng tanggapan ang iyong request at kukumpirmahin ang naaangkop na proseso at mga suportang dokumento. Makipag-ugnayan sa registrar kung hindi ka sigurado kung ito ang tamang serbisyo.',
    exampleEnglish: 'Describe the record you need and ask the registrar to confirm which service applies.',
    exampleTagalog: 'Ilarawan ang rekord na kailangan mo at itanong sa registrar kung aling serbisyo ang naaangkop.',
  };
  const todayFolderLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date());

  const currentAdminPath = window.location.pathname === appUrl('admin').replace(/\/+$/, '')
    || window.location.pathname.startsWith(`${appUrl('admin').replace(/\/+$/, '')}/`);
  if (user && currentAdminPath && user.role !== 'admin') {
    return <main className="access-denied"><ShieldCheck size={26} /><p className="eyebrow">STAFF AREA</p><h1>Admin access only</h1><p>This account does not have administrator access.</p><button className="primary-button" onClick={signOut}>Sign out and return<ArrowRight size={17} /></button></main>;
  }

  if (!user && isHomePath && !adminPath) {
    return <HomePage />;
  }

  if (!user) {
    return (
      <main className="auth-layout">
        <section className="auth-copy">
            <a className="brand" href="#/"><span className="brand-mark">DQ</span><span>DocuQuest</span></a>
          <div className="auth-message">
            <p className="eyebrow">DOCUMENT SERVICES, MADE CLEAR</p>
            <h1>Your documents.<br /><em>Within reach.</em></h1>
            <p>Request official records and follow every step from submission to release.</p>
            <div className="trust-note"><ShieldCheck size={18} /> Secure access through LavaLust API</div>
          </div>
          <span className="auth-index">01 / REQUEST PORTAL</span>
        </section>
        <section className="auth-panel">
          <div className="auth-form-wrap">
            <div className="auth-seal"><img src={`${APP_BASE_URL}assets/naujan_seal_3d_bg_web.webp`} alt="Municipality of Naujan seal" /></div>
            <div className="panel-heading">
              <p className="eyebrow">WELCOME TO DOCUQUEST</p>
              <h2>{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>
              <p>{mode === 'login' ? 'Access your requests and updates.' : 'Start tracking your document requests.'}</p>
            </div>
            <form className="form-stack" onSubmit={submitAuth}>
              {mode === 'register' && <label>Your name<input required minLength="2" autoComplete="name" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>}
              <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Password<input required type="password" minLength={mode === 'register' ? 10 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
              {mode === 'register' && <label>Confirm password<input required type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} /></label>}
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={17} /></button>
            </form>
            {mode === 'login' && GOOGLE_CLIENT_ID && <div className="google-auth"><span>OR</span><div ref={googleButtonRef} /></div>}
            <p className="switch-auth">{mode === 'login' ? 'New to DocuQuest?' : 'Already registered?'} <a href={appUrl(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</a></p>
          </div>
          <footer className="auth-footer">DOCUQUEST · LAVALUST API</footer>
        </section>
      </main>
    );
  }

  return (
    <main className={`workspace workspace-black${user.role === 'admin' ? ' admin-workspace' : ' requester-workspace'}`}>
      <aside className="sidebar">
        <a className="brand" href="#/"><span className="brand-mark">DQ</span><span>DocuQuest</span></a>
        <div className="side-label">WORKSPACE</div>
        <a className={`side-link ${page === 'requests' ? 'active' : ''}`} href="#requests" onClick={(event) => navigate(event, 'requests')}><FileText size={18} /> {user.role === 'admin' ? "Today's requests" : 'My requests'} <span>{requests.length}</span></a>
        {user.role === 'admin' && <a className={`side-link ${page === 'archive' ? 'active' : ''}`} href="#archive" onClick={(event) => navigate(event, 'archive')}><Search size={18} /> Previous requests</a>}
        {user.role === 'admin' && <a className={`side-link ${page === 'reports' ? 'active' : ''}`} href="#reports" onClick={(event) => navigate(event, 'reports')}><BarChart3 size={18} /> Registry reports</a>}
        {user.role === 'admin' && <a className={`side-link ${page === 'feedback' ? 'active' : ''}`} href="#feedback" onClick={(event) => navigate(event, 'feedback')}><Star size={18} /> Feedback</a>}
        {user.role === 'admin' && <a className={`side-link ${page === 'files' ? 'active' : ''}`} href="#files" onClick={(event) => navigate(event, 'files')}><FolderOpen size={18} /> Submitted files</a>}
        {user.role !== 'admin' && <a className={`side-link ${page === 'new-request' ? 'active' : ''}`} href="#new-request" onClick={(event) => navigate(event, 'new-request')}><FilePlus2 size={18} /> New request</a>}
        <a className={`side-link ${page === 'messages' ? 'active' : ''}`} href="#messages" onClick={(event) => navigate(event, 'messages')}><Send size={18} /> Messages</a>
        <a className={`side-link ${page === 'settings' ? 'active' : ''}`} href="#settings" onClick={(event) => navigate(event, 'settings')}><Settings2 size={18} /> Settings</a>
        {user.role !== 'admin' && <a className={`side-link ${page === 'guide' ? 'active' : ''}`} href="#guide" onClick={(event) => navigate(event, 'guide')}><BookOpen size={18} /> User guide</a>}
        <div className="side-bottom">
          <div className="secure-status"><BadgeCheck size={17} /><span><strong>Account protected</strong><small>API session active</small></span></div>
          <div className="user-row"><span className="avatar">{user.username?.slice(0, 1).toUpperCase()}</span><span className="user-meta"><strong>{user.username}</strong><small>{user.role}</small></span><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={signOut}><LogOut size={17} /></button></div>
        </div>
      </aside>
      <section className="main-panel">
        <header className="topbar">
          <div><p className="eyebrow">{page === 'archive' ? 'ADMINISTRATION / RECORDS' : page === 'files' ? 'ADMINISTRATION / PRIVATE STORAGE' : page === 'feedback' ? 'ADMINISTRATION / REQUESTER EXPERIENCE' : page === 'messages' ? 'SECURE COMMUNICATION' : page === 'settings' ? 'ACCOUNT MANAGEMENT' : page === 'new-request' ? 'REQUEST PORTAL / NEW REQUEST' : page === 'guide' ? 'DOCUQUEST / USER GUIDE' : user.role === 'admin' ? 'ADMINISTRATION' : 'REQUEST PORTAL'}</p><h1 key={page}>{page === 'archive' ? 'Previous requests' : page === 'files' ? 'Submitted files' : page === 'feedback' ? 'DocuQuest feedback' : page === 'messages' ? 'Messages' : page === 'settings' ? 'Account settings' : page === 'new-request' ? 'Request a document' : page === 'guide' ? 'How to use DocuQuest' : `Good day, ${user.username?.split(' ')[0]}`}</h1></div>
          <div className="top-actions">
            <WorkspaceClockWeather />
            <button className="icon-button" title="Refresh requests" aria-label="Refresh requests" onClick={() => loadWorkspace().catch((cause) => setError(cause.message))}><RefreshCw size={17} /></button>
            <button className="icon-button notification-button" title="Notifications" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={toggleNotifications}><Bell size={18} />{unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>
            {notificationsOpen && <div className="notification-popover">
              <div className="popover-heading"><strong>Notifications</strong><button className="icon-button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={15} /></button></div>
              {notificationError && <p className="form-error notification-error" role="alert">{notificationError}</p>}
              <div className="notification-toolbar" role="tablist" aria-label="Notification filter">
                <button type="button" className={notificationFilter === 'all' ? 'notification-filter active' : 'notification-filter'} aria-pressed={notificationFilter === 'all'} onClick={() => setNotificationFilter('all')}>All <span>{notifications.length}</span></button>
                <button type="button" className={notificationFilter === 'unread' ? 'notification-filter active' : 'notification-filter'} aria-pressed={notificationFilter === 'unread'} onClick={() => setNotificationFilter('unread')}>Unread <span>{unreadCount}</span></button>
              </div>
              {notificationsLoading && !notifications.length ? <p className="notification-empty" role="status">Loading notifications…</p> : notifications.length ? (() => {
                const sorted = [...notifications].sort((left, right) => {
                  const difference = new Date(String(right.created_at).replace(' ', 'T')).getTime() - new Date(String(left.created_at).replace(' ', 'T')).getTime();
                  return Number.isNaN(difference) ? Number(right.id) - Number(left.id) : difference || Number(right.id) - Number(left.id);
                });
                const visibleNotifications = sorted.filter((item) => notificationFilter === 'all' || Number(item.is_read) !== 1);
                const groupMap = new Map();
                visibleNotifications.forEach((item) => {
                  const key = item.request_id ? `request-${item.request_id}` : 'general';
                  let group = groupMap.get(key);
                  if (!group) {
                    group = {
                      key,
                      requestNumber: item.request_number || (item.request_id ? `Request #${item.request_id}` : 'Account updates'),
                      items: [],
                      unreadCount: 0,
                      latestAt: item.created_at,
                    };
                    groupMap.set(key, group);
                  }
                  group.items.push(item);
                  if (Number(item.is_read) !== 1) group.unreadCount += 1;
                });
                const groups = [...groupMap.values()].sort((left, right) => {
                  const unreadDifference = Number(right.unreadCount > 0) - Number(left.unreadCount > 0);
                  if (unreadDifference) return unreadDifference;
                  return new Date(String(right.latestAt).replace(' ', 'T')).getTime() - new Date(String(left.latestAt).replace(' ', 'T')).getTime();
                });
                return groups.length ? groups.map((group) => <section className="notification-group notification-request-group" key={group.key}>
                  <h3><span>{group.requestNumber}</span><small>{group.unreadCount ? `${group.unreadCount} unread` : `${group.items.length} updates`}</small></h3>
                  {group.items.map((item) => {
                    const bodyItems = notificationBodyItems(item.body);
                    const date = notificationDateInfo(item.created_at);
                    const isRead = Number(item.is_read) === 1;
                    return <div className={`notification-item ${isRead ? 'read' : 'unread'}`} key={item.id}>
                      <button className="notification-open" type="button" onClick={() => openNotification(item)}>
                        <span className="notification-copy"><strong>{item.title}</strong>{bodyItems.length > 1
                          ? <span className="notification-body notification-body-list">{bodyItems.map((line, index) => <span className="notification-body-line" key={`${item.id}-${index}`}>{line}</span>)}</span>
                          : <span className="notification-body">{item.body}</span>}<small>{date.label} · {new Date(`${String(item.created_at).replace(' ', 'T')}Z`).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' })}</small></span><ArrowRight size={15} aria-hidden="true" />
                      </button>
                      <div className="notification-actions">
                        <button className="icon-button notification-state-toggle" type="button" title={isRead ? 'Mark as unread' : 'Mark as read'} aria-label={`${isRead ? 'Mark as unread' : 'Mark as read'}: ${item.title}`} onClick={() => updateNotificationReadState(item, !isRead)}>{isRead ? <Mail size={15} /> : <Check size={15} />}</button>
                        <button className="icon-button notification-delete" type="button" title="Delete notification" aria-label={`Delete notification: ${item.title}`} onClick={() => deleteNotification(item)}><Trash2 size={15} /></button>
                      </div>
                    </div>;
                  })}
                </section>) : <p className="notification-empty">No unread notifications.</p>;
              })() : <p className="notification-empty">You’re all caught up.</p>}
            </div>}
          </div>
        </header>
        <div className={`content-grid ${user.role === 'admin' && page === 'requests' ? 'admin-dashboard-panel' : user.role !== 'admin' && page === 'requests' ? 'requester-overview-grid' : user.role !== 'admin' && page === 'new-request' ? 'requester-new-request-grid' : ''}`}>
          {page === 'guide' ? <div className="full-view"><HowToUsePage onContinue={(event) => navigate(event, 'new-request')} canContinue={user.role !== 'admin'} /></div> : page === 'files' && user.role === 'admin' ? <div className="full-view"><AdminFiles /></div> : page === 'archive' && user.role === 'admin' ? <div className="full-view"><AdminArchive onOpenRequest={openRequest} /></div> : page === 'reports' && user.role === 'admin' ? <div className="full-view"><AdminReports /></div> : page === 'feedback' && user.role === 'admin' ? <div className="full-view"><AdminFeedback /></div> : page === 'messages' ? <div className="full-view"><MessagesPage requests={requests} user={user} focusRequest={messageTarget} /></div> : page === 'settings' ? <div className="full-view"><SettingsPage user={user} onProfileUpdated={(updatedUser) => setUser((current) => ({ ...current, ...updatedUser }))} /></div> : <>
            {(page !== 'new-request' || user.role === 'admin') && (user.role !== 'admin' && !requestFolderOpen ? <section className="requester-folder-home">
              <header className="requester-folder-heading">
                <div><p className="eyebrow">PERSONAL RECORDS / DOCUQUEST</p><h2>Your document files</h2><p>Keep track of submissions, processing updates, and completed records in one place.</p></div>
                <span className="requester-office-status"><ShieldCheck size={16} /> Secure records</span>
              </header>
              {selectedDocumentType ? <div className="requester-document-guide-layout">
                <section className="requester-document-guide" aria-labelledby="requester-document-guide-title">
                <button className="requester-document-guide-back" type="button" onClick={() => setSelectedDocumentType('')}>
                  <ArrowLeft size={16} /> Back to document folders
                </button>
                <div className="requester-document-guide-heading">
                  <span className="requester-document-folder-art"><FolderOpen size={25} strokeWidth={1.7} /></span>
                  <div><p className="eyebrow">DOCUMENT SERVICE GUIDE</p><h3 id="requester-document-guide-title">{selectedDocumentType}</h3></div>
                </div>
                <div className="requester-document-guide-grid">
                  <section>
                    <h4>What is this document for?</h4>
                    <p>{selectedDocumentGuide.english}</p>
                  </section>
                  <section>
                    <h4>Ano ang gamit ng dokumentong ito?</h4>
                    <p>{selectedDocumentGuide.tagalog}</p>
                  </section>
                </div>
                <section className="requester-document-guide-example">
                  <h4>Example / Halimbawa</h4>
                  <div className="requester-document-guide-example-copy">
                    <p>{selectedDocumentGuide.exampleEnglish}</p>
                    <p lang="tl">{selectedDocumentGuide.exampleTagalog}</p>
                  </div>
                </section>
                <p className="requester-document-guide-note">The Municipal Registrar will confirm eligibility, requirements, fees, and processing steps for your specific case. / Kukumpirmahin ng Municipal Registrar ang eligibility, requirements, bayarin, at proseso para sa iyong partikular na sitwasyon.</p>
                <button className="requester-document-guide-continue" type="button" onClick={() => startDocumentRequest(selectedDocumentType)}>
                  Continue requesting this document <ArrowRight size={18} />
                </button>
                </section>
                <div className="requester-document-guide-seal"><img src={naujanSeal} alt="Municipality of Naujan seal" /></div>
              </div> : <>
                <button className="requester-folder-card" type="button" onClick={() => setRequestFolderOpen(true)}>
                  <span className="requester-folder-art"><FolderOpen size={58} strokeWidth={1.5} /><small>DOCUQUEST</small></span>
                  <span className="requester-folder-copy"><small>PERSONAL FILE</small><strong>My requests</strong><span>Open your recent submissions and status updates.</span></span>
                  <span className="requester-folder-total"><strong>{String(requests.length).padStart(2, '0')}</strong><small>RECORDS</small></span>
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
                {documentTypes.length > 0 && <section className="requester-document-library" aria-labelledby="requester-document-library-title">
                  <header>
                    <div><p className="eyebrow">NAUJAN MUNICIPAL DOCUMENT SERVICES</p><h3 id="requester-document-library-title">Mga dokumentong puwedeng i-request</h3><p>Pumili ng folder para makita ang detalye bago mag-request.</p></div>
                    <span>{documentTypes.length} available</span>
                  </header>
                  <div className="requester-document-grid">
                    {documentTypes.map((type) => <button className="requester-document-folder" type="button" key={type} onClick={() => showDocumentGuide(type)}>
                      <span className="requester-document-folder-art"><FolderOpen size={25} strokeWidth={1.7} /></span>
                      <span className="requester-document-folder-copy"><small>DOCUMENT FILE</small><strong>{type}</strong></span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>)}
                  </div>
                </section>}
                <div className="requester-folder-summary">
                  <span className="requester-folder-summary-title">Records at a glance</span>
                  <div><span>Total requests<strong>{stats.total}</strong></span><span>In progress<strong>{stats.active}</strong></span><span>Completed<strong>{stats.completed}</strong></span></div>
                </div>
              </>}
            </section> : <section className={`overview${user.role !== 'admin' ? ' requester-folder-open' : ''}`}>
              {user.role === 'admin' ? <>
                <div className="section-title"><div><p className="eyebrow">OVERVIEW</p><h2>Request processing</h2></div><span className="live-tag"><span /> LIVE · 15 SEC</span></div>
                <div className="stat-row"><div className="stat"><span>Total requests</span><strong>{stats.total}</strong><small>All time</small></div><div className="stat"><span>In progress</span><strong>{stats.active}</strong><small>Being processed</small></div><div className="stat"><span>Completed</span><strong>{stats.completed}</strong><small>Ready or released</small></div></div>
              </> : <div className="requester-folder-toolbar">
                <button type="button" onClick={() => { setRequestFolderOpen(false); setSearch(''); }}><ArrowRight size={15} /> My folders</button>
                <span><small>PERSONAL RECORDS</small><strong>My requests</strong></span>
                <span className="requester-folder-toolbar-count">{requests.length} {requests.length === 1 ? 'record' : 'records'}</span>
              </div>}
              {user.role === 'admin' && !todayFolderOpen ? <section className="admin-today-folder-panel">
                <header><div><p className="eyebrow">TODAY'S QUEUE</p><h3>Browse today's records</h3></div><span>1 DATE FOLDER</span></header>
                <button className="admin-today-folder" type="button" onClick={() => { setTodayFolderOpen(true); setSearch(''); }}>
                <span className="admin-today-folder-icon"><FolderOpen size={35} strokeWidth={1.6} /></span>
                <span className="admin-today-folder-copy"><small>TODAY'S RECORDS</small><strong>{todayFolderLabel}</strong><span>Open folder to review today's submissions and follow up.</span></span>
                <span className="admin-today-folder-count"><strong>{requests.length}</strong><small>REQUESTS</small></span>
                <ArrowRight size={19} aria-hidden="true" />
                </button>
              </section> : user.role === 'admin' ? <div className="admin-today-folder-toolbar">
                <button type="button" onClick={() => { setTodayFolderOpen(false); setSearch(''); }}><ArrowRight size={15} /> Dashboard</button>
                <span className="admin-today-folder-toolbar-icon"><FolderOpen size={18} /></span>
                <span><small>TODAY'S REQUESTS</small><strong>{todayFolderLabel}</strong></span>
                <span className="admin-today-folder-toolbar-count">{requests.length} {requests.length === 1 ? 'request' : 'requests'}</span>
              </div> : null}
              {(user.role !== 'admin' || todayFolderOpen) && <div className="request-list" id="requests">
                <div className="list-heading"><div><p className="eyebrow">{user.role === 'admin' ? "TODAY'S QUEUE" : 'MY REQUESTS'}</p><h2>{user.role === 'admin' ? "Today's requests" : 'Recent requests'}</h2></div><label className="search-box"><Search size={16} /><input aria-label="Search requests" placeholder="Search requests" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
                {error && <p className="form-error" role="alert">{error}</p>}
                {workspaceLoading ? <div className="empty-state"><RefreshCw size={20} /><strong>Loading your workspace…</strong></div> : filteredRequests.length ? <div className="table-wrap"><table><thead><tr><th>REFERENCE</th><th>DOCUMENT</th><th>{user.role === 'admin' ? 'REQUESTER / SUBMITTED' : 'SUBMITTED'}</th><th>STATUS / PROGRESS</th></tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.id}><td className="request-number"><button className="request-open" onClick={() => openRequest(request)}>{request.request_number}</button></td><td>{request.document_type}</td><td>{user.role === 'admin' ? <><span>{request.requester_name}</span><small className="request-submitted-time">{request.submitted_at || 'Time unavailable'}</small></> : request.created_at?.slice(0, 10) || '—'}</td><td><span className={`status status-${request.status}`}>{request.status?.replaceAll('_', ' ')}</span><div className="status-track"><span style={{ width: `${request.progress || 0}%` }} /></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><FileText size={22} /></div><strong>{user.role === 'admin' ? "No requests for today" : 'No requests found'}</strong><span>{user.role === 'admin' ? 'New requests submitted today will appear here. Earlier requests are in Previous requests.' : 'Submit a document request to start tracking it here.'}</span></div>}
              </div>}
            </section>)}
            {user.role === 'admin' ? <aside className="request-aside admin-summary"><div className="aside-heading"><span className="aside-icon"><BadgeCheck size={19} /></span><div><p className="eyebrow">STAFF WORKSPACE</p><h2>Request review</h2></div></div><p className="aside-intro">Open a request to review its details, update its status, or message the requester.</p><div className="admin-count"><span>Awaiting review</span><strong>{requests.filter((request) => request.status === 'submitted').length}</strong></div><div className="admin-count"><span>Currently processing</span><strong>{requests.filter((request) => ['under_review', 'processing', 'ready_for_pickup'].includes(request.status)).length}</strong></div></aside> : page === 'new-request' ? <aside className="request-aside" id="new-request">
              <div className="aside-heading"><span className="aside-icon"><FilePlus2 size={19} /></span><div><p className="eyebrow">GET STARTED</p><h2>Request a document</h2></div></div>
              <p className="aside-intro">Share the details below. You can follow the request from your workspace.</p>
              {workspaceLoading ? <div className="daily-request-limit-notice" role="status"><strong>Loading your workspace…</strong><span>Kinukuha ang iyong request quota.</span></div> : dailyRequestCount >= dailyRequestLimit ? <div className="daily-request-limit-notice" role="status"><strong>Ubos na ang requests mo para ngayong araw.</strong><span>Nagamit mo na ang {dailyRequestCount} sa {dailyRequestLimit} requests. Maaari kang mag-request ulit bukas.</span></div> : <form className="form-stack compact request-form-enhanced" onSubmit={submitRequest}>
                <fieldset className="request-form-section"><legend>Requester information</legend>
                <label>Full name on document<input required minLength="2" value={requestForm.full_name} onChange={(event) => setRequestForm({ ...requestForm, full_name: event.target.value })} /></label>
                <label>Mobile number<div className="phone-input"><span aria-hidden="true">+63</span><input required type="tel" inputMode="numeric" autoComplete="tel-national" pattern="9[0-9]{9}" minLength={10} maxLength={10} placeholder="9XXXXXXXXX" aria-label="Mobile number after +63" value={requestForm.phone.replace(/^\+63/, '')} onChange={(event) => { const digits = event.target.value.replace(/\D/g, ''); const nationalNumber = (digits.startsWith('63') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits).slice(0, 10); setRequestForm({ ...requestForm, phone: `+63${nationalNumber}` }); }} /></div><small>Enter 10 digits after +63.</small></label>
                <label>Current Naujan barangay<select required value={requestForm.address} onChange={(event) => setRequestForm({ ...requestForm, address: event.target.value })}><option value="">Select a Naujan barangay</option>{barangays.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select></label>
                <label>Sitio / Purok (optional)<input maxLength={100} placeholder="Enter your sitio or purok" value={requestForm.sitio} onChange={(event) => setRequestForm({ ...requestForm, sitio: event.target.value })} /></label>
                </fieldset>
                <fieldset className="request-form-section"><legend>Document details</legend>
                <label>Document type<select required value={requestForm.document_type} onChange={(event) => setRequestForm({ ...requestForm, document_type: event.target.value })}>{documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                {activeDuplicateRequest && <p className="form-error request-duplicate-notice" role="alert">This document has already been requested and cannot be processed again while the existing request is active.</p>}
                {requestForm.document_type === 'Other' && <label>Specify document type<input required maxLength={100} placeholder="Enter the document you need" value={customDocumentType} onChange={(event) => setCustomDocumentType(event.target.value)} /></label>}
                <label>Purpose<textarea required minLength="10" rows="3" placeholder="State why you need this document" value={requestForm.purpose} onChange={(event) => setRequestForm({ ...requestForm, purpose: event.target.value })} /></label>
                </fieldset>
                <fieldset className="request-form-section"><legend>Mga dokumentong kalakip</legend>
                <label>Maglakip ng mga dokumento<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple onChange={(event) => { const selected = Array.from(event.target.files || []); setRequestFiles(selected.slice(0, 3)); setError(selected.length > 3 ? 'Hanggang 3 file lamang ang maaaring ilakip.' : ''); }} /><small>PDF, JPG o PNG · hanggang 3 file, 2 MB bawat isa</small><small className="attachment-note"><span>Attachments are optional unless required for the selected service. Upload only clear, relevant documents.</span><span className="tagalog-translation">Opsyonal ang paglakip ng mga dokumento, maliban kung hinihingi para sa napiling serbisyo. Maglakip lamang ng malinaw at may kaugnayang dokumento.</span></small></label>
                {requestFiles.length > 0 && <div className="selected-files">{requestFiles.map((file) => <span key={`${file.name}-${file.size}`}>{file.name}</span>)}</div>}
                <div className="fee-variation-note"><strong>Document Fee Notice / Paalala tungkol sa bayarin</strong><p>Fees may vary depending on the document type, required processing, and office expenses. Some services may be free, where applicable.</p><p className="tagalog-translation">Maaaring mag-iba ang bayarin batay sa uri ng dokumento, kinakailangang proseso, at mga gastusin ng tanggapan. May mga serbisyong walang bayad, kung naaangkop.</p></div>
                </fieldset>
                <div className="request-email-notice" role="note"><Mail size={17} /><span><strong>Receipt and Certified Copy / Resibo at sertipikadong kopya</strong><small>Please ensure that the email address registered to your DocuQuest account is accurate and active. The receipt will be sent once payment is confirmed, and the certified copy will be sent once your request is approved.</small><small className="tagalog-translation">Tiyaking tama at aktibo ang email address na nakarehistro sa iyong DocuQuest account. Ipapadala roon ang resibo kapag kumpirmado na ang bayad, at ang sertipikadong kopya kapag naaprubahan na ang iyong kahilingan.</small></span></div>
                <label className="request-acknowledgment"><input type="checkbox" required checked={requestAcknowledged} onChange={(event) => setRequestAcknowledged(event.target.checked)} /><span><strong>Read and understood / Nabasa at naunawaan ko</strong><small>I have read and understood all information, requirements, and notices in this form.</small><small className="tagalog-translation">Nabasa at naunawaan ko ang lahat ng impormasyon, kinakailangan, at paalala sa form na ito.</small></span></label>
                <label className="privacy-consent"><input type="checkbox" required checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} /><span><strong>Data Privacy Act of 2012 (RA 10173)</strong><small>I consent to authorized DocuQuest administrators accessing and reviewing the information I provide and the documents I attach, solely to process this request.</small><small className="tagalog-translation">Pumapayag akong ma-access at masuri ng mga awtorisadong administrador ng DocuQuest ang impormasyong ibibigay ko at mga dokumentong ilalakip ko, para lamang maproseso ang kahilingang ito.</small></span></label>
                {error && <div className="form-error" role="alert"><span>{error}</span>{pendingPaymentRequests.length > 0 && <ul className="pending-payment-list">{pendingPaymentRequests.map((request) => <li key={request.id}><button className="pending-payment-link" type="button" onClick={() => openRequest(request)}>{request.request_number}</button><span className="pending-payment-date">Requested {request.submitted_day_label || request.submitted_date || 'date unavailable'}</span></li>)}</ul>}</div>}
                <button className="primary-button" disabled={busy || Boolean(activeDuplicateRequest)}>{busy ? 'Isinusumite ang kahilingan…' : 'Isumite ang kahilingan'}<ArrowRight size={17} /></button>
              </form>}
              <div className="privacy-note"><ShieldCheck size={16} /><span>Ligtas na iniimbak ang iyong impormasyon at mga kalakip na file.</span></div>
            </aside> : null}
          </>}
        </div>
        <footer className="page-footer"><span>DOCUQUEST · DOCUMENT REQUEST PORTAL</span><span><Bell size={14} /> Updates appear in your request activity</span></footer>
      </section>
      {activeRequest && <div className="drawer-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveRequest(null); }}><section className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title"><header className="drawer-header"><div><p className="eyebrow">{activeRequest.request.request_number}</p><h2 id="detail-title">{activeRequest.request.document_type}</h2></div><button className="icon-button" aria-label="Close request details" onClick={() => setActiveRequest(null)}><X size={18} /></button></header><div className="drawer-scroll"><span className={`status status-${activeRequest.request.status}`}>{activeRequest.request.status?.replaceAll('_', ' ')}</span><div className="progress-block"><div><span>Request progress</span><strong>{activeRequest.request.progress}%</strong></div><div className="progress-track"><span style={{ width: `${activeRequest.request.progress}%` }} /></div></div>
        {user.role === 'admin' && <form className="status-editor" onSubmit={submitStatus}>
          <div className="status-editor-heading"><p className="eyebrow">ADMIN ACTIONS / EMAIL UPDATE</p><h3>Update request</h3><p>Choose the next status and provide clear instructions for the requester.</p></div>
          <div className="status-editor-fields">
            <label>Status<select value={statusForm.status} onChange={(event) => setStatusForm({ ...statusForm, status: event.target.value })} disabled={['completed', 'rejected'].includes(activeRequest.request.status)}>{Object.entries(activeRequest.statuses || {}).map(([key, value]) => {
              const progressStatuses = Object.keys(activeRequest.statuses || {}).filter((status) => status !== 'rejected');
              const currentStatusIndex = progressStatuses.indexOf(activeRequest.request.status);
              const nextProgressStatus = progressStatuses[currentStatusIndex + 1];
              const disabledForProgress = key !== 'rejected' && key !== nextProgressStatus;
              const requirementCount = requirementItems(activeRequest.request.requirements).length;
              const requirementsVerified = requirementCount === (activeRequest.requirement_verifications || []).length;
              const disabledForRequirements = ['ready_for_pickup', 'completed'].includes(key) && requirementCount > 0 && !requirementsVerified;
              const paymentSatisfied = activeRequest.payment?.status === 'paid'
                || (activeRequest.payment?.status === 'waived' && Number(activeRequest.payment.amount) === 0);
              const disabledForPayment = ['approved', 'ready_for_pickup', 'completed'].includes(key) && !paymentSatisfied;
              return <option key={key} value={key} disabled={disabledForProgress || disabledForPayment || disabledForRequirements}>{value.label}{disabledForProgress ? key === activeRequest.request.status ? ' · current progress' : key !== 'rejected' ? ' · next step only' : '' : disabledForRequirements ? ' · requirements upload/verification needed' : disabledForPayment ? ' · payment required' : ''}</option>;
            })}</select></label>
            <label className="progress-note-field">Progress note<textarea rows="3" value={statusForm.note} maxLength="1000" onChange={(event) => setStatusForm({ ...statusForm, note: event.target.value })} placeholder="Explain what changed in this update." disabled={['completed', 'rejected'].includes(activeRequest.request.status)} /></label>
          </div>
          <label className="status-editor-requirements">Requirements before release<textarea rows="3" value={statusForm.requirements} maxLength="5000" onChange={(event) => setStatusForm({ ...statusForm, requirements: event.target.value })} placeholder="List documents, fees, or steps the requester must complete." disabled={['completed', 'rejected'].includes(activeRequest.request.status)} /></label>
          {statusForm.requirements.trim() && <div className="requirements-checklist">{requirementItems(statusForm.requirements).map((item, index) => {
            const files = (activeRequest.requirement_uploads?.[index] || []).filter((file) => file.requirement_text === item);
            const sameRequirements = statusForm.requirements.trim() === String(activeRequest.request.requirements || '').trim();
            const checked = sameRequirements && (activeRequest.requirement_verifications || []).includes(index);
            const latestFile = files[files.length - 1];
            return <div className={`requirement-check ${checked ? 'checked' : ''}`} key={`${index}-${item}`}>
              <div className="requirement-review-heading"><strong>{item}</strong><span className={checked ? 'validated' : ''}>{checked ? 'Validated' : 'Needs review'}</span></div>
              {files.length ? <div className="requirement-review-files">{files.map((file, fileIndex) => {
                const reviewStatus = file.review_status || 'pending';
                const reviewLabel = reviewStatus === 'validated' ? 'Validated' : reviewStatus === 'rejected' ? 'Rejected' : 'Pending review';
                const isLatestPending = file.id === latestFile?.id && reviewStatus === 'pending' && sameRequirements;
                return <div className="requirement-review-upload" key={file.id}>
                  <button type="button" className="requirement-review-file-link" onClick={() => downloadRequestFile(file).catch((cause) => setError(cause.message))}><FileText size={14} /><span>{file.original_name}<small>{reviewLabel}</small></span><Download size={14} /></button>
                  {isLatestPending && <div className="requirement-review-actions"><button type="button" className="requirement-review-validate" disabled={busy} onClick={() => reviewRequirementUpload(index, file, 'validated')}>Validated</button><button type="button" className="requirement-review-reject" disabled={busy} onClick={() => reviewRequirementUpload(index, file, 'rejected')}>Rejected</button></div>}
                </div>;
              })}</div> : <span className="requirement-upload-pending">Wala pang naiu-upload na file.</span>}
            </div>;
          })}</div>}
          {statusForm.status !== 'completed' && <div className="release-scheduler"><div className="release-scheduler-heading"><strong>Release date and time</strong><small>Philippine Standard Time</small></div><label>Date<input type="date" value={statusForm.release_at.slice(0, 10)} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)} onChange={(event) => { const time = statusForm.release_at.slice(11, 16) || '09:00'; setStatusForm({ ...statusForm, release_at: `${event.target.value}T${time}` }); }} required={statusForm.status === 'ready_for_pickup'} disabled={['completed', 'rejected'].includes(activeRequest.request.status)} /></label><label>Time<input type="time" step="900" value={statusForm.release_at.slice(11, 16)} onChange={(event) => { const date = statusForm.release_at.slice(0, 10) || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); setStatusForm({ ...statusForm, release_at: `${date}T${event.target.value}` }); }} required={statusForm.status === 'ready_for_pickup'} disabled={['completed', 'rejected'].includes(activeRequest.request.status)} /></label><div className="release-presets" aria-label="Quick release times"><span>Quick set</span><button type="button" onClick={() => setReleaseTime(9)}>9:00 AM</button><button type="button" onClick={() => setReleaseTime(13)}>1:00 PM</button><button type="button" onClick={() => setReleaseTime(15)}>3:00 PM</button></div></div>}
          {statusForm.status === 'ready_for_pickup' && <small className="release-hint">A future release appointment is required for this status.</small>}
          <button className="primary-button" disabled={busy || ['completed', 'rejected'].includes(activeRequest.request.status) || statusForm.status === activeRequest.request.status}>{busy ? 'Saving…' : 'Save progress and email requester'}<Mail size={16} /></button>
        </form>}
        {user.role !== 'admin' && <section className="request-journey" aria-label="Request progress stages">
          {['submitted', 'under_review', 'processing', 'approved', 'ready_for_pickup', 'completed'].map((stage, index) => {
            const stages = ['submitted', 'under_review', 'processing', 'approved', 'ready_for_pickup', 'completed'];
            const currentIndex = stages.indexOf(activeRequest.request.status === 'rejected' ? 'submitted' : activeRequest.request.status);
            const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
            const labels = { submitted: 'Submitted', under_review: 'Review', processing: 'Processing', approved: 'Approved', ready_for_pickup: 'For release', completed: 'Ready to claim' };
            return <div className={`journey-step journey-${state}`} key={stage}><span>{state === 'complete' ? <Check size={13} /> : index + 1}</span><small>{labels[stage]}</small></div>;
          })}
        </section>}
        {user.role === 'admin' && <p className="request-facts-eyebrow">REQUEST DETAILS / IMPORMASYON NG REQUEST</p>}
        <dl className={`request-facts${user.role === 'admin' ? ' request-facts-highlight' : ''}`}><div><dt>Name on document</dt><dd>{activeRequest.request.full_name}</dd></div><div><dt>Requester</dt><dd>{activeRequest.request.requester_name} · {activeRequest.request.contact_email}</dd></div><div><dt>Mobile</dt><dd>{activeRequest.request.phone}</dd></div><div><dt>Address</dt><dd>{activeRequest.request.address}</dd></div><div><dt>Purpose</dt><dd>{activeRequest.request.purpose}</dd></div></dl>
        {user.role !== 'admin' && activeRequest.request.status === 'completed' && <div className="release-detail"><strong>Request completed</strong><p>Salamat sa pagtitiwala sa DocuQuest.</p></div>}
        {user.role === 'admin' && activeRequest.request.requirements && <div className="release-detail"><strong>Requirements before release</strong><p>{activeRequest.request.requirements}</p></div>}
        {activeRequest.request.status === 'ready_for_pickup' && activeRequest.request.release_at_label && <div className="release-detail"><strong>Ready for release · Philippine time</strong><p>Nakatakda ang pagkuha sa {activeRequest.request.release_at_label}. Dalhin ang iyong valid ID.</p></div>}
        {user.role === 'user' && requirementItems(activeRequest.request.requirements).length > 0 && <section className="request-requirement-uploads">
          <header><div><p className="eyebrow">REQUEST PROGRESS / REQUIREMENTS</p><h3>Mga kailangang dokumento</h3></div><small>PDF, JPG, o PNG · hanggang 2 MB bawat file</small></header>
          {!['completed', 'rejected'].includes(activeRequest.request.status) && <div className="request-requirement-alert" role="note"><strong>Mahalagang paalala</strong><span>Mag-upload ng tig-isang file para sa bawat requirement. Kailangang masuri at ma-verify ng admin ang mga ito bago maipagpatuloy ang request para sa release.</span></div>}
          <div className="request-requirement-list">{requirementItems(activeRequest.request.requirements).map((item, index) => {
            const files = activeRequest.requirement_uploads?.[index] || [];
            const latestFile = files[files.length - 1];
            const latestReviewStatus = latestFile?.review_status || 'pending';
            const canUpload = !latestFile || latestReviewStatus === 'rejected';
            return <article className="request-requirement-item" key={`${index}-${item}`}>
              <div className="request-requirement-title"><span>{index + 1}</span><strong>{item}</strong></div>
              <div className="request-requirement-files">{files.length ? files.map((file) => {
                const reviewStatus = file.review_status || 'pending';
                const reviewLabel = reviewStatus === 'validated' ? 'Validated' : reviewStatus === 'rejected' ? 'Rejected · Kailangan ng bagong file' : 'Pending admin review';
                return <button type="button" className={`requirement-file-link requirement-file-${reviewStatus}`} key={file.id} onClick={() => downloadRequestFile(file).catch((cause) => setError(cause.message))}><FileText size={15} /><span>{file.original_name}<small>{Math.ceil(Number(file.size_bytes) / 1024)} KB · {reviewLabel}</small></span><Download size={15} /></button>;
              }) : <span className="requirement-upload-pending">Wala pang naiu-upload na file para sa requirement na ito.</span>}</div>
              {!['completed', 'rejected'].includes(activeRequest.request.status) && <>
                {canUpload ? <label className="requirement-upload-button"><Upload size={15} /><span>{latestReviewStatus === 'rejected' ? 'Mag-upload ng kapalit na file' : 'Pumili ng requirement file'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) stageRequirementFile(index, file); event.target.value = ''; }} /></label> : <span className={`requirement-review-notice requirement-review-notice-${latestReviewStatus}`}>{latestReviewStatus === 'validated' ? 'Validated na ang requirement na ito.' : 'Naghihintay ng review ng admin. Mag-upload muli kung rejected.'}</span>}
                {pendingRequirementFiles[index] && <div className="requirement-upload-confirmation">
                  <span><FileText size={15} /><strong title={pendingRequirementFiles[index].name}>{pendingRequirementFiles[index].name}</strong><small>{Math.max(1, Math.ceil(pendingRequirementFiles[index].size / 1024))} KB · Hindi pa naiu-upload</small></span>
                  <button type="button" className="requirement-upload-cancel" aria-label="Kanselahin ang napiling file" title="Cancel" disabled={busy} onClick={() => setPendingRequirementFiles((current) => { const next = { ...current }; delete next[index]; return next; })}><X size={15} /></button>
                  <button type="button" className="requirement-upload-confirm-button" disabled={busy} onClick={() => confirmRequirementUpload(index)}><Check size={14} /> Submit</button>
                </div>}
              </>}
            </article>;
          })}</div>
        </section>}
        {user.role === 'user' && activeRequest.request.status === 'completed' && <section className="request-feedback-panel">
          <div><p className="eyebrow">YOUR DOCUQUEST EXPERIENCE</p><h3>Kamusta ang proseso ng request mo?</h3><p>Sagutin ang limang tanong. Ang 1 ang pinakamababa at 5 ang pinakamataas na rating.</p></div>
          {activeRequest.feedback ? <div className="feedback-thanks" role="status">
            <div className="feedback-answer-list">{feedbackQuestions.map(({ key, label }) => <div key={key}><span>{label}</span><strong>{activeRequest.feedback[key] ? `${activeRequest.feedback[key]} / 5` : 'Detailed rating unavailable'}</strong></div>)}</div>
            <strong>Salamat sa iyong feedback!</strong>
            {activeRequest.feedback.comment && <p>{activeRequest.feedback.comment}</p>}
          </div> : <form onSubmit={submitFeedback}>
            {feedbackQuestions.map(({ key, label, tagalog }) => <fieldset className="feedback-question" key={key}><legend>{label}<small>{tagalog}</small></legend><div className="request-feedback-stars" role="group" aria-label={`${label} Rating`}>
              {[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" aria-label={`${rating} out of 5`} aria-pressed={feedbackRatings[key] === rating} onClick={() => setFeedbackRatings((current) => ({ ...current, [key]: rating }))}>
                <Star size={23} fill={rating <= feedbackRatings[key] ? 'currentColor' : 'none'} />
              </button>)}
              <span>{feedbackRatings[key] ? `${feedbackRatings[key]} / 5` : 'Required'}</span>
            </div></fieldset>)}
            <label>Komento (opsyonal)<textarea rows="3" maxLength={1000} value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="Ibahagi ang naging karanasan mo sa proseso ng DocuQuest." /></label>
            {feedbackError && <p className="form-error" role="alert">{feedbackError}</p>}
            <button className="primary-button" disabled={busy || feedbackQuestions.some(({ key }) => feedbackRatings[key] === 0)}>{busy ? 'Isinusumite…' : 'Ipadala ang feedback'}<ArrowRight size={16} /></button>
          </form>}
        </section>}
        <section className="payment-panel">
          <header className="payment-panel-header"><CreditCard size={18} /><h3>Request payment</h3></header>
          {activeRequest.payment ? <div className="payment-panel-meta"><span>{activeRequest.payment.status === 'waived' ? 'Fee assigned' : 'Amount due'}</span><strong>PHP {Number(activeRequest.payment.amount).toFixed(2)}</strong><span>Status</span><span className={`${activeRequest.payment.status === 'paid' || activeRequest.payment.status === 'waived' ? 'payment-status' : 'status'} payment-status-${activeRequest.payment.status}`}>{activeRequest.payment.status === 'paid' ? 'Paid' : activeRequest.payment.status === 'waived' ? 'No payment required' : 'Pending'}</span></div> : <p className="payment-notice">The office has not set a payment amount yet.</p>}
          {activeRequest.payment?.status === 'paid' ? <p className="payment-status"><BadgeCheck size={15} /> PayMongo payment confirmed</p> : user.role === 'admin' && activeRequest.request.status === 'processing' ? <form className="payment-admin-form" onSubmit={savePaymentAmount}>
            <label>Payment option<select value={paymentOption} onChange={(event) => setPaymentOption(event.target.value)} disabled={activeRequest.payment?.status === 'paid'}><option value="amount">Set amount</option><option value="free">FREE</option></select></label>
            {paymentOption === 'amount' ? <label>Fee amount · PHP<input type="number" min="0.01" max="99999999.99" step="0.01" required value={feeAmount} onChange={(event) => setFeeAmount(event.target.value)} disabled={activeRequest.payment?.status === 'paid'} /></label> : <p className="payment-free-note">No payment is required. This will be saved as PHP 0.00.</p>}
            <button className="primary-button" disabled={busy || activeRequest.payment?.status === 'paid'}>{busy ? 'Saving…' : paymentOption === 'free' ? activeRequest.payment ? 'Update to FREE' : 'Set as FREE' : activeRequest.payment ? 'Update payment amount' : 'Set payment amount'}<Mail size={16} /></button>
          </form> : activeRequest.payment?.status === 'waived' ? <p className="payment-notice"><BadgeCheck size={15} /> Walang kailangang bayaran para sa request na ito.</p> : user.role === 'admin' ? <p className="payment-notice">Magtakda ng payment kapag nasa Processing na ang request.</p> : activeRequest.payment && <button className="primary-button" type="button" onClick={startPayment} disabled={busy}>{busy ? 'Connecting to PayMongo…' : 'Pay with PayMongo'}<CreditCard size={16} /></button>}
        </section>
        {(activeRequest.files || []).length > 0 && <section className="request-attachments"><p className="eyebrow">{activeRequest.files.some((file) => file.original_name.includes('copy-certified')) ? 'OFFICIAL DOCUMENTS' : 'ATTACHED FILES'}</p>{activeRequest.files.map((file) => { const certified = file.original_name.includes('copy-certified'); return <button className={certified ? 'attachment-download certified-copy-download' : 'attachment-download'} key={file.id} onClick={() => downloadRequestFile(file).catch((cause) => setError(cause.message))}><span>{certified ? <BadgeCheck size={18} /> : <FileText size={16} />}<span><strong>{certified ? 'Approved Copy - Certified PDF' : file.original_name}</strong><small>{certified ? 'Ready to download · ' : ''}{Math.ceil(Number(file.size_bytes) / 1024)} KB · {file.mime_type}</small></span></span><Download size={17} /></button>; })}</section>}
        <div className="timeline"><p className="eyebrow">ACTIVITY</p>{(activeRequest.updates || []).map((update) => <div className="timeline-item" key={update.id}><span className="timeline-dot" /><div><strong>{update.status?.replaceAll('_', ' ')}</strong><p>{update.note}</p>{update.requirements && <p><strong>Requirements:</strong> {update.requirements}</p>}{update.release_at_label && <small>Release: {update.release_at_label} · Philippine time</small>}<small>{update.actor_name} · {update.created_at}</small></div></div>)}</div>
        <div className="message-section"><p className="eyebrow">CONVERSATION</p><div className="message-list">{(activeRequest.messages || []).map((message) => <div className={`message-bubble ${Number(message.sender_id) === Number(user.id) ? 'mine' : ''}`} key={message.id}><strong>{message.sender_name}</strong><p>{message.body}</p><small>{message.created_at}</small></div>)}</div><form className="message-form" onSubmit={submitMessage}><input aria-label="Write a message" placeholder="Write a message…" value={messageBody} maxLength="2000" onChange={(event) => setMessageBody(event.target.value)} required /><button className="icon-button" title="Send message" aria-label="Send message" disabled={busy}><Send size={17} /></button></form></div>
      </div></section></div>}
      {confirmation && <section
        className={`transaction-toast transaction-toast-${confirmation.type}`}
        role={confirmation.type === 'error' ? 'alert' : 'status'}
        aria-live={confirmation.type === 'error' ? 'assertive' : 'polite'}
        style={{ '--confirmation-image': `url("${homepageImageUrl('hero_background', confirmation.createdAt)}")` }}
      >
        <span className="transaction-toast-mark"><BadgeCheck size={19} /></span>
        <span className="transaction-toast-copy"><strong>{confirmation.type === 'success' ? 'Transaction sent' : confirmation.type === 'warning' ? 'Action needed' : 'Transaction not completed'}</strong><span>{confirmation.message}</span></span>
        <button type="button" className="transaction-toast-close" aria-label="Dismiss notification" onClick={() => setConfirmation(null)}><X size={17} /></button>
      </section>}
    </main>
  );
}