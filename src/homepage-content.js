export const DEFAULT_HOMEPAGE_CONTENT = {
  heroEyebrow: 'DOCUQUEST · NAUJAN, ORIENTAL MINDORO',
  heroHeadline: 'Mga dokumento ng Naujan,',
  heroEmphasis: 'mas madaling i-request.',
  heroDescription: 'Pumili ng serbisyo, isumite ang iyong detalye at mga kailangang file, at subaybayan ang tugon ng staff—lahat sa iisang account.',
  heroAssurance: 'Online submission ito; ibe-verify muna ng staff ang request bago iproseso.',
  trustItems: ['Mga serbisyo ng Naujan', 'Status at updates sa account', 'Secure na file handling'],
  processHeading: ['Simple ang proseso,', 'malinaw ang bawat hakbang.'],
  processDescription: 'Gawin ang request online at tingnan sa iyong account kung ano ang susunod na kailangang gawin.',
  steps: [
    { title: 'Piliin ang serbisyong kailangan mo', text: 'Gumawa ng account, mag-sign in, at piliin ang naaangkop na uri ng dokumento o request.' },
    { title: 'Kumpletuhin at isumite ang form', text: 'Ilagay ang tamang contact details, barangay, at layunin. Ilakip ang hinihinging supporting files kung mayroon.' },
    { title: 'Hintayin ang review at subaybayan ang update', text: 'Susuriin ng staff ang iyong request. Tingnan ang status at mga mensahe sa account para sa karagdagang requirements, bayad kung naaangkop, o susunod na hakbang.' },
  ],
  documentsHeading: 'Anong serbisyo ang kailangan mo?',
  documentsDescription: 'Tingnan ang mga request na maaaring isumite sa DocuQuest. Maaaring mag-iba ang requirements ayon sa uri ng dokumento at detalye ng iyong kaso; hintayin ang kumpirmasyon ng staff.',
  documents: [
    'Application for Marriage License',
    'Authentication of Record',
    'Endorsement',
    'Issuance of Certificate of Birth/Marriage/Death on Municipal Forms (1A, 2B, 3C)',
    'Petition for Correction of Clerical Error (RA 9048/10172) or Change of First Name (RA 9048)',
    'Registration of Death',
    'Registration of Live Birth',
    'Supplemental Report/Annotation (Birth/Marriage/Death)',
  ],
  trackingHeading: ['Subaybayan ang', 'bawat update.'],
  trackingDescription: 'Tingnan ang kasalukuyang status, timeline, at mensahe ng staff sa iyong account. Doon din makikita kung may kailangan pang isumite o asikasuhin.',
  faqsHeading: 'Mga dapat malaman.',
  faqsDescription: 'Mga paalala bago simulan ang iyong request.',
  faqs: [
    { question: 'Paano magsumite ng request?', answer: 'Gumawa ng account at mag-sign in. Piliin ang serbisyo, kumpletuhin ang form, ilakip ang supporting files kung kailangan, at isumite ang request.' },
    { question: 'Ilang request ang puwede bawat araw?', answer: 'Hanggang 5 requests lamang bawat account kada araw. Piliin nang tama ang serbisyo at tiyaking kumpleto ang detalye bago magsumite.' },
    { question: 'Paano ko malalaman ang status ng request?', answer: 'Mag-sign in at buksan ang iyong workspace para makita ang status at timeline. Tingnan din ang Messages para sa update o karagdagang instructions mula sa staff.' },
    { question: 'Anong files ang puwedeng ilakip?', answer: 'Tumatanggap ang request form ng PDF, JPG, at PNG. Ilakip lamang ang mga dokumentong hinihingi para sa iyong request.' },
    { question: 'May bayad ba ang request at kailan makukuha ang dokumento?', answer: 'Depende sa uri ng serbisyo at sa pagsusuri ng staff kung may kailangang bayaran o karagdagang requirements. Sundin ang instructions sa iyong account; doon ipapaalam ang susunod na hakbang at release details.' },
  ],
  closingHeading: 'Handa ka na bang magsimula?',
  closingDescription: 'Gumawa ng account para magsumite ng request at makatanggap ng updates mula sa Naujan staff.',
  footerDescription: 'Mas malinaw na pagsumite at pagsubaybay ng document requests.',
};

export function mergeHomepageContent(content = {}) {
  return {
    ...DEFAULT_HOMEPAGE_CONTENT,
    ...content,
    trustItems: Array.isArray(content.trustItems) ? content.trustItems : DEFAULT_HOMEPAGE_CONTENT.trustItems,
    processHeading: Array.isArray(content.processHeading) ? content.processHeading : DEFAULT_HOMEPAGE_CONTENT.processHeading,
    trackingHeading: Array.isArray(content.trackingHeading) ? content.trackingHeading : DEFAULT_HOMEPAGE_CONTENT.trackingHeading,
    steps: Array.isArray(content.steps) ? content.steps : DEFAULT_HOMEPAGE_CONTENT.steps,
    documents: Array.isArray(content.documents) ? content.documents : DEFAULT_HOMEPAGE_CONTENT.documents,
    faqs: Array.isArray(content.faqs) ? content.faqs : DEFAULT_HOMEPAGE_CONTENT.faqs,
  };
}
