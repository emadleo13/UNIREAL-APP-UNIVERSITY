/**
 * Curated, evergreen scholarship programs for international students in the
 * region. Descriptions stay general (amounts/deadlines change yearly) and
 * always point to the official source.
 */
export type Scholarship = {
  id: string;
  name: string;
  provider: string;
  /** STUDY_COUNTRIES slugs this applies to; empty = region-wide. */
  countrySlugs: string[];
  url: string;
  summary: { en: string; ro: string; fa: string };
};

export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'stipendium-hungaricum',
    name: 'Stipendium Hungaricum',
    provider: 'Government of Hungary',
    countrySlugs: ['hungary'],
    url: 'https://stipendiumhungaricum.hu/',
    summary: {
      en: 'Hungary’s flagship scholarship: full tuition waiver, monthly stipend, housing contribution and health insurance for bachelor’s, master’s and PhD studies. Applications usually open in November with a mid-January deadline.',
      ro: 'Bursa emblematică a Ungariei: scutire completă de taxe, alocație lunară, contribuție la cazare și asigurare de sănătate pentru licență, master și doctorat. Aplicațiile se deschid de obicei în noiembrie, cu termen la mijlocul lui ianuarie.',
      fa: 'بورسیه اصلی دولت مجارستان: معافیت کامل شهریه، کمک‌هزینه ماهانه، کمک‌هزینه مسکن و بیمه درمانی برای مقاطع کارشناسی، ارشد و دکتری. ثبت‌نام معمولاً از نوامبر شروع می‌شود و مهلت آن اواسط ژانویه است.',
    },
  },
  {
    id: 'nawa-banach',
    name: 'NAWA Banach Scholarship',
    provider: 'Polish National Agency for Academic Exchange (NAWA)',
    countrySlugs: ['poland'],
    url: 'https://nawa.gov.pl/en/students/foreign-students',
    summary: {
      en: 'Polish government program for students from developing countries: monthly stipend for second-degree (master’s) studies in Polish public universities, mainly in engineering, science and agriculture.',
      ro: 'Program al guvernului polonez pentru studenți din țări în curs de dezvoltare: alocație lunară pentru studii de master la universități publice poloneze, mai ales în inginerie, științe și agricultură.',
      fa: 'برنامه دولت لهستان برای دانشجویان کشورهای در حال توسعه: کمک‌هزینه ماهانه برای تحصیل در مقطع کارشناسی ارشد در دانشگاه‌های دولتی لهستان، عمدتاً در رشته‌های مهندسی، علوم و کشاورزی.',
    },
  },
  {
    id: 'poland-my-first-choice',
    name: 'Poland My First Choice (NAWA)',
    provider: 'Polish National Agency for Academic Exchange (NAWA)',
    countrySlugs: ['poland'],
    url: 'https://nawa.gov.pl/en/students/foreign-students',
    summary: {
      en: 'NAWA scholarship encouraging top international candidates to pick Poland: monthly stipend for full-cycle studies at Polish universities across most disciplines.',
      ro: 'Bursă NAWA care încurajează candidații internaționali de top să aleagă Polonia: alocație lunară pentru studii complete la universități poloneze, în majoritatea disciplinelor.',
      fa: 'بورسیه NAWA برای جذب بهترین متقاضیان بین‌المللی به لهستان: کمک‌هزینه ماهانه برای یک دوره کامل تحصیلی در دانشگاه‌های لهستان در اکثر رشته‌ها.',
    },
  },
  {
    id: 'romanian-government',
    name: 'Romanian Government Scholarship',
    provider: 'Ministry of Foreign Affairs of Romania',
    countrySlugs: ['romania'],
    url: 'https://studyinromania.gov.ro/',
    summary: {
      en: 'Scholarships for non-EU citizens at Romanian public universities: tuition waiver, subsidized accommodation and a monthly allowance. Studies are mostly in Romanian (a free preparatory language year is included); applications typically run January–March.',
      ro: 'Burse pentru cetățeni non-UE la universități publice românești: scutire de taxe, cazare subvenționată și alocație lunară. Studiile sunt în mare parte în română (cu an pregătitor gratuit de limbă); aplicațiile au loc de regulă în ianuarie–martie.',
      fa: 'بورسیه برای شهروندان غیراتحادیه اروپا در دانشگاه‌های دولتی رومانی: معافیت شهریه، خوابگاه یارانه‌ای و کمک‌هزینه ماهانه. تحصیل عمدتاً به زبان رومانیایی است (با یک سال رایگان آموزش زبان)؛ ثبت‌نام معمولاً ژانویه تا مارس است.',
    },
  },
  {
    id: 'czech-government',
    name: 'Czech Government Scholarship',
    provider: 'Ministry of Education, Youth and Sports of the Czech Republic',
    countrySlugs: ['czech-republic'],
    url: 'https://www.mzv.gov.cz/jnp/en/information_for_aliens/scholarships/index.html',
    summary: {
      en: 'Development-cooperation scholarships for students from eligible countries: tuition-free study plus a monthly stipend, for selected master’s and PhD programs (some in English).',
      ro: 'Burse de cooperare pentru dezvoltare pentru studenți din țări eligibile: studii fără taxe plus alocație lunară, pentru programe selectate de master și doctorat (unele în engleză).',
      fa: 'بورسیه‌های همکاری توسعه‌ای برای دانشجویان کشورهای واجد شرایط: تحصیل رایگان به‌علاوه کمک‌هزینه ماهانه، برای برنامه‌های منتخب ارشد و دکتری (برخی به زبان انگلیسی).',
    },
  },
  {
    id: 'slovak-national',
    name: 'National Scholarship Programme of Slovakia',
    provider: 'SAIA (Slovak Academic Information Agency)',
    countrySlugs: ['slovakia'],
    url: 'https://www.scholarships.sk/',
    summary: {
      en: 'Mobility scholarships for international students, PhD candidates and researchers spending a study or research stay at Slovak universities; monthly allowance covers living costs.',
      ro: 'Burse de mobilitate pentru studenți internaționali, doctoranzi și cercetători care fac un stagiu de studiu sau cercetare la universități slovace; alocația lunară acoperă costurile de trai.',
      fa: 'بورسیه‌های تبادل برای دانشجویان بین‌المللی، دانشجویان دکتری و پژوهشگران برای دوره تحصیل یا پژوهش در دانشگاه‌های اسلواکی؛ کمک‌هزینه ماهانه هزینه زندگی را پوشش می‌دهد.',
    },
  },
  {
    id: 'visegrad',
    name: 'Visegrad Scholarship Program',
    provider: 'International Visegrad Fund',
    countrySlugs: ['poland', 'hungary', 'czech-republic', 'slovakia'],
    url: 'https://www.visegradfund.org/apply/mobilities/visegrad-scholarship/',
    summary: {
      en: 'Master’s and post-master’s scholarships for study in the Visegrad region (Poland, Hungary, Czech Republic, Slovakia) and for students from nearby Eastern European countries; semester-based stipends paid to both student and host university.',
      ro: 'Burse de master și post-master pentru studii în regiunea Visegrad (Polonia, Ungaria, Cehia, Slovacia) și pentru studenți din țări est-europene apropiate; alocații pe semestru plătite atât studentului, cât și universității gazdă.',
      fa: 'بورسیه ارشد و بالاتر برای تحصیل در منطقه ویشگراد (لهستان، مجارستان، چک، اسلواکی) و برای دانشجویان کشورهای اروپای شرقی نزدیک؛ کمک‌هزینه به‌صورت هر نیم‌سال به دانشجو و دانشگاه میزبان پرداخت می‌شود.',
    },
  },
  {
    id: 'ceepus',
    name: 'CEEPUS Exchange Program',
    provider: 'Central European Exchange Program for University Studies',
    countrySlugs: ['poland', 'hungary', 'czech-republic', 'slovakia', 'romania', 'bulgaria', 'croatia', 'serbia', 'slovenia', 'moldova'],
    url: 'https://www.ceepus.info/',
    summary: {
      en: 'Intra-regional exchange network across Central and Eastern Europe: semester mobility grants between member universities without tuition fees, plus stipends from the host country.',
      ro: 'Rețea de schimburi în Europa Centrală și de Est: granturi de mobilitate pe semestru între universitățile membre, fără taxe de școlarizare, plus alocații din partea țării gazdă.',
      fa: 'شبکه تبادل منطقه‌ای در اروپای مرکزی و شرقی: کمک‌هزینه تحصیل یک نیم‌سال بین دانشگاه‌های عضو بدون شهریه، به‌علاوه کمک‌هزینه از کشور میزبان.',
    },
  },
  {
    id: 'erasmus-plus',
    name: 'Erasmus+',
    provider: 'European Union',
    countrySlugs: [],
    url: 'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students',
    summary: {
      en: 'The EU’s flagship mobility program: once enrolled at a participating university (including most universities on UNIREAL), you can spend funded exchange semesters or traineeships across Europe.',
      ro: 'Programul emblematic de mobilitate al UE: odată înscris la o universitate participantă (inclusiv majoritatea universităților de pe UNIREAL), poți petrece semestre de schimb sau stagii finanțate în toată Europa.',
      fa: 'برنامه اصلی تبادل اتحادیه اروپا: بعد از ثبت‌نام در یک دانشگاه عضو (شامل اکثر دانشگاه‌های UNIREAL)، می‌توانید نیم‌سال‌های تبادلی یا کارآموزی با بودجه در سراسر اروپا بگذرانید.',
    },
  },
  {
    id: 'latvian-state',
    name: 'Latvian State Scholarships',
    provider: 'State Education Development Agency of Latvia (VIAA)',
    countrySlugs: ['latvia'],
    url: 'https://www.viaa.gov.lv/en/scholarships-studies-research-or-summer-schools',
    summary: {
      en: 'Latvian government scholarships for studies, research and summer schools at Latvian higher-education institutions, open to citizens of partner countries; monthly allowance for the study period.',
      ro: 'Burse ale guvernului leton pentru studii, cercetare și școli de vară la instituții de învățământ superior din Letonia, deschise cetățenilor din țările partenere; alocație lunară pe perioada studiilor.',
      fa: 'بورسیه‌های دولت لتونی برای تحصیل، پژوهش و مدارس تابستانی در مؤسسات آموزش عالی لتونی، برای شهروندان کشورهای طرف قرارداد؛ با کمک‌هزینه ماهانه در طول دوره.',
    },
  },
];

/** Scholarships relevant to a study-destination country (incl. region-wide). */
export function scholarshipsForCountry(slug: string): Scholarship[] {
  return SCHOLARSHIPS.filter(
    (s) => s.countrySlugs.length === 0 || s.countrySlugs.includes(slug)
  );
}

export function scholarshipSummary(s: Scholarship, locale: string): string {
  return s.summary[locale as keyof typeof s.summary] ?? s.summary.en;
}
