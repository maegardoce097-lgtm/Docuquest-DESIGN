import { Fragment, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Check, ChevronDown, FileCheck2, FilePlus2, FileSearch, Menu, ShieldCheck, X } from 'lucide-react';
import { ADMIN_URL, apiRequest, appUrl, homepageImageUrl } from './api.js';
import { DEFAULT_HOMEPAGE_CONTENT, mergeHomepageContent } from './homepage-content.js';
import './home.css';
import './home-motion.css';
import './video-inspired.css';
import './black-gold.css';
import './home-premium.css';

const stepIcons = [FilePlus2, FileSearch, FileCheck2];
const naujanSeal = '/assets/naujan_seal_3d_bg_web.webp';

function scrollToSection(event, sectionId) {
  event.preventDefault();
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function WaveText({ text }) {
  let waveIndex = 0;
  return <span className="wave-text" aria-hidden="true">{text.split(' ').map((word, wordIndex) => <Fragment key={wordIndex}><span className="wave-word">{Array.from(word).map((character) => { const index = waveIndex++; return <span className="wave-letter" style={{ '--wave-index': index }} key={index}>{character}</span>; })}</span>{wordIndex < text.split(' ').length - 1 ? ' ' : null}</Fragment>)}</span>;
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [homepage, setHomepage] = useState(DEFAULT_HOMEPAGE_CONTENT);
  const [heroImages, setHeroImages] = useState({ background: '', seal: '' });

  useEffect(() => {
    let active = true;
    apiRequest('/homepage').then((result) => {
      if (!active) return;
      setHomepage(mergeHomepageContent(result.content || {}));
      const version = result.updated_at || '';
      setHeroImages({
        background: result.images?.hero_background ? homepageImageUrl('hero_background', version) : '',
        seal: result.images?.hero_seal ? homepageImageUrl('hero_seal', version) : '',
      });
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const root = document.querySelector('.marketing-home');
    const targets = [...document.querySelectorAll('.marketing-home [data-reveal]')];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return undefined;
    }

    root?.classList.add('motion-ready');
    let observer;
    const revealTarget = (target) => {
      target.classList.add('is-visible');
      observer?.unobserve(target);
    };
    const revealInView = () => {
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) revealTarget(target);
      });
    };
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) revealTarget(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

    targets.forEach((target) => observer.observe(target));
    revealInView();
    const frame = window.requestAnimationFrame(revealInView);
    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('resize', revealInView);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', revealInView);
      window.removeEventListener('resize', revealInView);
      observer.disconnect();
    };
  }, []);

  return (
    <main className="marketing-home">
      <div className="home-shell">
      <header className="marketing-header">
        <a className="marketing-brand" href={appUrl()} aria-label="DocuQuest home"><span className="brand-mark">DQ</span><span>DocuQuest</span></a>
        <button className="mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <nav className={`marketing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href={appUrl('how-to-use')}>How to use</a>
          <a href="#how-it-works" onClick={(event) => { setMenuOpen(false); scrollToSection(event, 'how-it-works'); }}>How it works</a>
          <a href="#documents" onClick={(event) => { setMenuOpen(false); scrollToSection(event, 'documents'); }}>Documents</a>
          <a href="#questions" onClick={(event) => { setMenuOpen(false); scrollToSection(event, 'questions'); }}>Questions</a>
          <a className="nav-sign-in" href={appUrl('login')}>Sign in</a>
          <a className="nav-create" href={appUrl('register')}>Create account <ArrowUpRight size={15} /></a>
        </nav>
      </header>

      <section className="marketing-hero" style={heroImages.background ? { backgroundImage: `linear-gradient(105deg,#06271fe8 0%,#082b20c9 48%,#08291f91 100%),url("${heroImages.background}")` } : undefined}>
        <div className="hero-copy" data-reveal>
          <p className="eyebrow"><span className="eyebrow-line" /> {homepage.heroEyebrow}</p>
          <h1 aria-label={`${homepage.heroHeadline} ${homepage.heroEmphasis}`}><WaveText text={homepage.heroHeadline} /><br /><em><WaveText text={homepage.heroEmphasis} /></em></h1>
          <p className="hero-lede">{homepage.heroDescription}</p>
          <div className="hero-actions"><a className="hero-primary" href={appUrl('register')}>Start your request <ArrowRight size={17} /></a><a className="hero-secondary" href="#documents" onClick={(event) => scrollToSection(event, 'documents')}>Check documents <ArrowDown size={16} /></a></div>
          <div className="hero-assurance"><ShieldCheck size={17} /><span>{homepage.heroAssurance}</span></div>
        </div>
        <div className="hero-visual" data-reveal>
          <img src={heroImages.seal || naujanSeal} alt="Municipality of Naujan seal" />
        </div>
      </section>

      <section className="daily-limit-banner" aria-label="Daily request limit">
        <div className="daily-limit-icon"><ShieldCheck size={20} /></div>
        <div className="daily-limit-copy"><strong>Paalala sa daily limit</strong><span>Hanggang 5 document requests lamang bawat account kada araw. Ihanda ang tamang detalye bago magsumite.</span></div>
        <span className="daily-limit-count">5 requests <i>/</i> araw</span>
      </section>

      <section className="trust-strip" aria-label="Portal features" data-reveal>{homepage.trustItems.map((item, index) => { const Icon = [BadgeCheck, FileSearch, ShieldCheck][index] || BadgeCheck; return <Fragment key={`${item}-${index}`}>{index > 0 && <i />}<span><Icon size={17} /> {item}</span></Fragment>; })}</section>

      <section className="process-section" id="how-it-works">
        <div className="section-intro" data-reveal><p className="eyebrow">HOW IT WORKS</p><h2 aria-label={`${homepage.processHeading[0]} ${homepage.processHeading[1]}`}><WaveText text={homepage.processHeading[0]} /><br /><WaveText text={homepage.processHeading[1]} /></h2><p>{homepage.processDescription}</p></div>
        <div className="steps-list">{homepage.steps.map(({ title, text }, index) => { const Icon = stepIcons[index] || FileCheck2; const number = String(index + 1).padStart(2, '0'); return <article className="process-step" data-reveal style={{ '--reveal-delay': `${index * 90}ms` }} key={number}><span className="step-number">{number}</span><span className="step-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{text}</p></div></article>; })}</div>
      </section>

      <section className="documents-section" id="documents">
        <div className="documents-heading" data-reveal><div><p className="eyebrow">DOCUMENT SERVICES</p><h2 aria-label={homepage.documentsHeading}><WaveText text={homepage.documentsHeading} /></h2><p className="documents-lede">{homepage.documentsDescription}</p></div><a href={appUrl('register')}>Browse request form <ArrowUpRight size={16} /></a></div>
        <div className="document-list" data-reveal>{homepage.documents.map((type, index) => <div className="document-item" style={{ '--reveal-delay': `${index * 45}ms` }} key={`${type}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{type}</strong><ArrowRight size={16} /></div>)}</div>
      </section>

      <section className="tracking-section">
        <div className="tracking-copy" data-reveal><p className="eyebrow">ALWAYS KNOW WHAT'S NEXT</p><h2 aria-label={`${homepage.trackingHeading[0]} ${homepage.trackingHeading[1]}`}><WaveText text={homepage.trackingHeading[0]} /><br /><WaveText text={homepage.trackingHeading[1]} /></h2><p>{homepage.trackingDescription}</p><a href={appUrl('login')}>View your requests <ArrowRight size={16} /></a></div>
        <div className="tracking-visual" data-reveal aria-label="Example request progress">
          <div className="tracking-topline"><span>REQUEST TIMELINE</span><span className="tracking-live"><i /> LIVE UPDATES</span></div>
          <div className="tracking-reference"><span>DOCUMENT REQUEST</span><strong>DQ-2408-0182</strong><span className="status status-processing">Processing</span></div>
          <div className="tracking-steps"><div className="tracking-step complete"><i><Check size={12} /></i><span><strong>Submitted</strong><small>Request received</small></span></div><div className="tracking-step complete"><i><Check size={12} /></i><span><strong>Under review</strong><small>Details checked</small></span></div><div className="tracking-step current"><i /><span><strong>Processing</strong><small>Being prepared</small></span></div><div className="tracking-step"><i /><span><strong>Ready for release</strong><small>Next update</small></span></div></div>
        </div>
      </section>

      <section className="questions-section" id="questions">
        <div className="questions-heading" data-reveal><p className="eyebrow">GOOD TO KNOW</p><h2 aria-label={homepage.faqsHeading}><WaveText text={homepage.faqsHeading} /></h2><p>{homepage.faqsDescription}</p></div>
        <div className="questions-list" data-reveal>
          {homepage.faqs.map((item, index) => <details key={`${item.question}-${index}`}><summary>{item.question}<ChevronDown size={17} /></summary><p>{item.answer}</p></details>)}
        </div>
      </section>

      <section className="closing-cta" data-reveal><div><p className="eyebrow">NAUJAN DOCUMENT PORTAL</p><h2 aria-label={homepage.closingHeading}><WaveText text={homepage.closingHeading} /></h2><p>{homepage.closingDescription}</p></div><a href={appUrl('register')}>Create your account <ArrowRight size={17} /></a></section>

      <footer className="marketing-footer">
        <div className="footer-main"><div className="footer-brand-block"><a className="marketing-brand" href={appUrl()}><span className="brand-mark">DQ</span><span>DocuQuest</span></a><p>{homepage.footerDescription}</p></div><div className="footer-links"><div><strong>Explore</strong><a href={appUrl('how-to-use')}>How to use DocuQuest</a><a href="#how-it-works" onClick={(event) => scrollToSection(event, 'how-it-works')}>How it works</a><a href="#documents" onClick={(event) => scrollToSection(event, 'documents')}>Document services</a><a href="#questions" onClick={(event) => scrollToSection(event, 'questions')}>Questions</a></div><div><strong>Your account</strong><a href={appUrl('login')}>Sign in</a><a href={appUrl('register')}>Create account</a><a href={ADMIN_URL}>Staff portal</a></div></div></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} DOCUQUEST</span><span>LAVALUST · SECURE REQUEST PORTAL</span></div>
      </footer>
      </div>
    </main>
  );
}