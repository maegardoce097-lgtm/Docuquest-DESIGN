import { ArrowRight, BadgeCheck, Bell, CheckCircle2, CreditCard, FileCheck2, FilePlus2, FileSearch, FolderOpen, LockKeyhole, MessageSquareText, ShieldAlert, ShieldCheck } from 'lucide-react';
import './how-to-use.css';

const guideLinks = [
  ['purpose', 'Para saan ang DocuQuest?'],
  ['before-you-start', 'Bago magsimula'],
  ['request-process', 'Paano mag-request'],
  ['requirements', 'Requirements at uploads'],
  ['payments', 'Bayad at resibo'],
  ['certified-copies', 'Certified copy at release'],
  ['warnings', 'Mahahalagang paalala'],
  ['document-services', 'Mga serbisyong available'],
];

const requestSteps = [
  {
    icon: FilePlus2,
    title: 'Gumawa ng account at mag-sign in',
    text: 'Gamitin ang iyong account para magsumite ng request, makatanggap ng update, magbayad kung may fee, at ma-download ang mga file para sa sarili mong request.',
  },
  {
    icon: FileSearch,
    title: 'Piliin ang tamang serbisyo',
    text: 'Piliin ang document service na tumutugma sa kailangan mo. Kung hindi ka sigurado, magtanong sa staff sa Messages bago magsumite ng panibagong request.',
  },
  {
    icon: FileCheck2,
    title: 'Punan at isumite ang request form',
    text: 'Ilagay ang buong pangalan, contact number, barangay, optional na sitio, uri ng dokumento, at malinaw na layunin. Basahin at tanggapin ang Data Privacy consent bago isumite.',
  },
  {
    icon: Bell,
    title: 'Subaybayan ang review at mga instruction',
    text: 'Buksan ang My requests at piliin ang request para makita ang status at activity. Tingnan ang requirements, notifications, at Messages para sa follow-up mula sa staff.',
  },
];

const services = [
  { title: 'Application for Marriage License', description: 'Magtanong tungkol sa pagkuha ng marriage license bago ikasal. Ipapaliwanag ng registrar ang naaangkop na kwalipikasyon, dokumento, at susunod na hakbang.' },
  { title: 'Authentication of Record', description: 'Para sa record na hinihinging beripikahin o ipa-authenticate. Kumpirmahin sa registrar at sa tatanggap na organisasyon kung anong uri ng authentication ang kailangan.' },
  { title: 'Endorsement', description: 'Ipasuri kung ang usapin tungkol sa rekord ay dapat i-refer o ipasa sa ibang tanggapan. Registrar ang magpapasya kung angkop ito at kung anong impormasyon ang kailangan.' },
  { title: 'Issuance of Certificate of Birth/Marriage/Death on Municipal Forms (1A, 2B, 3C)', description: 'Humiling ng birth, marriage, o death certificate sa naaangkop na municipal form. Titingnan ng registrar kung aling form ang akma sa rekord at layunin.' },
  { title: 'Petition for Correction of Clerical Error (RA 9048/10172) or Change of First Name (RA 9048)', description: 'Magtanong kung maaaring saklawin ng batas ang pagwawasto ng clerical/typographical error o pagpapalit ng first name, at kung anong ebidensya ang kailangan. Hindi garantiya ng pag-apruba ang paghahain ng petisyon.' },
  { title: 'Registration of Death', description: 'Magtanong kung paano iniuulat at itinatala ang pagkamatay, sino ang maaaring magbigay ng impormasyon, at anong suportang rekord ang kailangan, kabilang sa late registration.' },
  { title: 'Registration of Live Birth', description: 'Magtanong tungkol sa pagtatala ng kapanganakan at mga suportang dokumento. Ipaalam sa registrar kung late registration o may espesyal na kalagayan.' },
  { title: 'Supplemental Report/Annotation (Birth/Marriage/Death)', description: 'Magtanong kung maaaring idagdag sa birth, marriage, o death record ang impormasyong hindi naisama o sumunod na legal na pangyayari. Registrar ang tutukoy kung supplemental report o annotation ang naaangkop.' },
];

export default function HowToUsePage({ onContinue, canContinue = true }) {
  return (
    <div className="guide-workspace-content">
      <section className="guide-intro">
        <p className="eyebrow">GABAY SA PAGGAMIT</p>
        <h2>Alamin ang bawat hakbang bago mag-request.</h2>
        <p>Gabay ito sa paggawa at pagsubaybay ng document requests sa DocuQuest ng Municipality of Naujan—mula account at requirements hanggang bayad, certified copy, at release.</p>
      </section>

      <section className="guide-daily-limit" role="note">
          <span className="guide-limit-icon"><ShieldAlert size={20} /></span>
          <div><strong>Limitasyon sa pagsusumite</strong><p>Hanggang <b>5 requests bawat account kada araw</b> lamang. Bago magsumite, tiyaking tama ang serbisyo at kumpleto ang iyong impormasyon.</p></div>
          <span className="guide-limit-badge">5 / araw</span>
        </section>

      <div className="guide-layout">
          <nav className="guide-toc" aria-label="Mga paksa sa gabay">
            <p className="eyebrow">MGA PAKSA</p>
            {guideLinks.map(([id, label], index) => <a href={`#${id}`} key={id}><span>{String(index + 1).padStart(2, '0')}</span>{label}</a>)}
          </nav>

          <div className="guide-content">
            <section id="purpose" className="guide-section guide-purpose">
              <p className="eyebrow">01 / LAYUNIN</p>
              <h2>Isang online portal para sa document requests ng Naujan.</h2>
              <p>Ginagamit ang DocuQuest para isumite at subaybayan ang mga request sa mga nakalistang municipal document services. Nasa iisang account ang request status, updates, requirements, secure na pag-uusap sa staff, payment status, at mga file na inilabas para sa request.</p>
              <div className="guide-note"><ShieldCheck size={19} /><p><strong>Mahalagang malaman:</strong> Ang online request ay hindi awtomatikong pag-apruba o agarang pag-isyu ng dokumento. Susuriin ng awtorisadong staff ang rekord, eligibility, requirements, bayarin, at susunod na hakbang para sa iyong partikular na kaso.</p></div>
            </section>

            <section id="before-you-start" className="guide-section">
              <p className="eyebrow">02 / PAGHAHANDA</p>
              <h2>Bago gumawa ng request</h2>
              <div className="guide-card-grid">
                <article className="guide-info-card"><span><LockKeyhole size={18} /></span><h3>Gamitin ang sarili mong account</h3><p>Tiyaking maa-access mo ang email na naka-link sa account. Doon ipinapadala ang mga payment receipt at certified copy kapag available na.</p></article>
                <article className="guide-info-card"><span><FileCheck2 size={18} /></span><h3>Ihanda ang tamang detalye</h3><p>Alamin kung anong record at document service ang kailangan mo. Ilagay ang tamang pangalan, contact number, barangay, at malinaw na layunin ng request.</p></article>
                <article className="guide-info-card"><span><FolderOpen size={18} /></span><h3>Ihanda ang supporting files</h3><p>Kung kailangan, ihanda ang malinaw at nababasang PDF, JPG, o PNG. Huwag mag-upload ng dokumentong walang kaugnayan sa request.</p></article>
              </div>
            </section>

            <section id="request-process" className="guide-section">
              <p className="eyebrow">03 / HAKBANG-HAKBANG</p>
              <h2>Paano gumawa at sumubaybay ng request</h2>
              <div className="guide-step-list">
                {requestSteps.map(({ icon: Icon, title, text }, index) => <article className="guide-step" key={title}>
                  <span className="guide-step-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="guide-step-icon"><Icon size={20} /></span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </article>)}
              </div>
              <div className="guide-form-reminder">
                <h3>Tamang impormasyon sa form</h3>
                <p>Kinakailangan ang buong pangalan (2–150 character), wastong Philippine mobile number, barangay mula sa listahan, uri ng dokumento, layunin na may 10–2,000 character, at pagsang-ayon sa data privacy consent. Opsyonal ang sitio (hanggang 100 character). Hindi matatanggap ang form kung kulang o hindi valid ang mga detalye.</p>
              </div>
              <div className="guide-statuses">
                <h3>Ano ang ibig sabihin ng status?</h3>
                <p><b>Submitted</b> — natanggap na ang form. <b>Under review</b> — sinusuri ng staff ang detalye. <b>Processing</b> — isinasagawa ang pagproseso at maaaring magtakda ang opisina ng fee o karagdagang requirements. <b>Approved</b> — naaprubahan ang request/copy. <b>Ready for pickup</b> — may release schedule o instructions na dapat sundin. <b>Completed</b> — minarkahan nang tapos ng staff. Maaari ring maging <b>Rejected</b> kung hindi maaprubahan; basahin ang paliwanag at gamitin ang Messages para magtanong.</p>
              </div>
            </section>

            <section id="requirements" className="guide-section">
              <p className="eyebrow">04 / REQUIREMENTS AT FILES</p>
              <h2>Basahin ang hinihingi at isumite ang tamang file</h2>
              <ul className="guide-check-list">
                <li><CheckCircle2 size={17} /><span>Sa unang request, puwedeng mag-attach ng hanggang <b>3 files</b>; PDF, JPG, o PNG lamang at hanggang <b>2 MB bawat file</b>.</span></li>
                <li><CheckCircle2 size={17} /><span>Maaaring magdagdag ang staff ng partikular na requirements habang pinoproseso ang request. Makikita ang mga ito sa request detail; mag-upload ng tig-isang file para sa bawat nakalistang item.</span></li>
                <li><CheckCircle2 size={17} /><span>Ang bawat requirement upload ay PDF, JPG, o PNG at hanggang <b>2 MB</b>. Tiyaking malinaw, kumpleto, at tumutugma sa hinihingi ang file.</span></li>
                <li><CheckCircle2 size={17} /><span>Hintayin ang review/verification ng staff. Hindi sapat ang pag-upload lamang para makumpleto ang requirements o ma-release ang dokumento.</span></li>
              </ul>
              <div className="guide-warning"><ShieldAlert size={19} /><p><strong>Kung may kailangang itama:</strong> Tingnan ang status at Messages para sa feedback ng staff, pagkatapos ay isumite muli ang tamang file sa kaukulang requirement.</p></div>
            </section>

            <section id="payments" className="guide-section">
              <p className="eyebrow">05 / BAYAD AT RESIBO</p>
              <h2>Bayad lamang kapag may itinakdang fee</h2>
              <div className="guide-payment-flow">
                <article><span>01</span><CreditCard size={19} /><h3>Hintayin ang fee notice</h3><p>Kapag umabot na sa Processing ang request, staff ang magtatakda ng halaga o magmamarkang walang bayad. Makikita ang payment details sa request.</p></article>
                <article><span>02</span><CreditCard size={19} /><h3>Magbayad sa PayMongo</h3><p>Kung may halagang dapat bayaran, piliin ang Pay with PayMongo at kumpletuhin ang checkout. Huwag magbayad gamit ang ibang link o account na hindi ibinigay ng system.</p></article>
                <article><span>03</span><BadgeCheck size={19} /><h3>Kumpirmahin ang status</h3><p>Bumalik sa DocuQuest at tiyaking nakasaad na Paid. Hintayin ang system confirmation; ang balik sa site lamang ay hindi palaging nangangahulugang kumpirmado na ang bayad.</p></article>
              </div>
              <div className="guide-note"><MessageSquareText size={19} /><p><strong>Walang bayad?</strong> Kung minarkahan ng staff na waived/no payment required, hindi kailangang mag-checkout. Ipinapadala sa email ang receipt kapag kumpirmado ang bayad. Ang pending na hindi pa bayad na fee ay maaaring pumigil sa pagsumite ng panibagong request hanggang mabayaran ito.</p></div>
            </section>

            <section id="certified-copies" className="guide-section">
              <p className="eyebrow">06 / CERTIFIED COPY AT RELEASE</p>
              <h2>Paano matatanggap ang certified copy</h2>
              <ol className="guide-number-list">
                <li>Kompletuhin ang mga requirement na inilista ng staff at hintayin ang verification.</li>
                <li>Kung may fee, bayaran ito sa PayMongo at tiyaking Paid ang status; kung waived, sundin ang no-payment status.</li>
                <li>Hintayin ang pag-apruba at update mula sa opisina. Hindi agad nalilikha o nailalabas ang certified copy pagkasumite ng form.</li>
                <li>Kapag naaprubahan at available na, buksan ang request at hanapin ang <b>Approved Copy - Certified PDF</b> sa Attached Files/Official Documents para i-download. Ipapadala rin ito sa email na naka-link sa account.</li>
                <li>Kung may pickup o release schedule, sundin ang petsa/oras at instructions na nakasaad sa request timeline. Kumpirmahin sa staff kung kailangan mong dalhin ang original documents.</li>
              </ol>
              <p className="guide-subtle-note">Ang certified copy at kung saan ito tatanggapin ay nakadepende sa pag-apruba ng opisina at layunin ng dokumento. Kung may tatanggap na ahensya, kumpirmahin muna sa kanila kung anong uri ng kopya ang kailangan.</p>
            </section>

            <section id="warnings" className="guide-section">
              <p className="eyebrow">07 / MGA PAALALA</p>
              <h2>Iwasan ang pagkaantala at hindi kumpletong request</h2>
              <div className="guide-warning-list">
                <article><strong>5 requests kada araw</strong><span>May limitasyong limang request bawat account kada araw. Piliin nang tama ang uri ng serbisyo bago isumite.</span></article>
                <article><strong>Isang aktibong request kada dokumento</strong><span>Hindi maaaring ulitin ang parehong uri ng dokumento habang aktibo pa ang naunang request. Buksan ito at kausapin ang staff sa halip na gumawa ng duplicate.</span></article>
                <article><strong>May hindi pa bayad na fee?</strong><span>Kailangan munang asikasuhin ang pending payment bago magsumite ng bagong request.</span></article>
                <article><strong>Walang garantisadong same-day release</strong><span>Nakasalalay ang pagproseso at release sa availability ng rekord, requirements, bayad kung naaangkop, at pagsusuri ng staff.</span></article>
                <article><strong>Protektahan ang iyong impormasyon</strong><span>Personal at sensitibong dokumento lamang ang i-upload kung kailangan. Huwag ibahagi ang password, payment details, o private request link.</span></article>
              </div>
            </section>

            <section id="document-services" className="guide-section">
              <p className="eyebrow">08 / MGA SERBISYONG NASA PORTAL</p>
              <h2>Mga uri ng request</h2>
              <p className="guide-section-lede">Pumili lamang ng serbisyong tumutugma sa iyong kailangan. Para sa eligibility at eksaktong dokumentong ihahanda, sundin ang instructions ng Municipal Registrar para sa iyong sitwasyon.</p>
              <div className="guide-services">
                {services.map(({ title, description }, index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{title}</strong><p>{description}</p></div></article>)}
              </div>
            </section>

            <section className="guide-contact">
              <span className="guide-contact-icon"><MessageSquareText size={22} /></span>
              <div><p className="eyebrow">KAILANGAN NG TULONG?</p><h2>Gamitin ang Messages para sa request-specific na tanong.</h2><p>Mag-sign in, buksan ang request, at magpadala ng mensahe sa awtorisadong staff. Isama ang request reference at huwag magpadala ng sensitibong detalye sa pampublikong post.</p></div>
            </section>
          </div>
      </div>

      {canContinue && <section className="guide-continue">
          <div>
            <p className="eyebrow">SUNOD NA HAKBANG</p>
            <h2>Handa ka na bang mag-request?</h2>
            <p>Pumili ng dokumento at kumpletuhin ang request form sa iyong workspace.</p>
          </div>
          <a href="#new-request" onClick={onContinue}>Continue request <ArrowRight size={17} /></a>
        </section>}
    </div>
  );
}
