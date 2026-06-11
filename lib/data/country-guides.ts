/**
 * Evergreen country guides rendered on the study-in pages (visa, living
 * costs, application process, work rights). Written to avoid fast-changing
 * specifics; the page adds a "confirm with official sources" disclaimer.
 * Also emitted as FAQPage JSON-LD for rich results.
 */
type Localized = { en: string; ro: string; fa: string };

export type CountryGuide = {
  countrySlug: string;
  visa: Localized;
  livingCosts: Localized;
  application: Localized;
  work: Localized;
};

export const COUNTRY_GUIDES: CountryGuide[] = [
  {
    countrySlug: 'romania',
    visa: {
      en: 'Non-EU students need a long-stay study visa (type D/SD) from a Romanian embassy, issued after the university acceptance and the Ministry of Education approval letter. EU/EEA citizens only register locally after arrival. Start the visa process as soon as you are accepted — it can take several weeks.',
      ro: 'Studenții non-UE au nevoie de viză de lungă ședere pentru studii (tip D/SD) de la o ambasadă a României, emisă după acceptarea la universitate și scrisoarea de aprobare a Ministerului Educației. Cetățenii UE/SEE doar se înregistrează local după sosire. Începe procesul de viză imediat după acceptare — poate dura câteva săptămâni.',
      fa: 'دانشجویان غیراتحادیه اروپا به ویزای تحصیلی بلندمدت (نوع D/SD) از سفارت رومانی نیاز دارند که پس از پذیرش دانشگاه و نامه تأیید وزارت آموزش صادر می‌شود. روند ویزا را بلافاصله بعد از پذیرش شروع کنید — ممکن است چند هفته طول بکشد.',
    },
    livingCosts: {
      en: 'Plan for roughly €350–600 per month outside Bucharest and €500–800 in the capital, covering accommodation, food and transport. University dormitories are the cheapest option at about €50–150 per month.',
      ro: 'Estimează aproximativ 350–600 € pe lună în afara Bucureștiului și 500–800 € în capitală, acoperind cazarea, mâncarea și transportul. Căminele universitare sunt cea mai ieftină opțiune, circa 50–150 € pe lună.',
      fa: 'بودجه حدود ۳۵۰ تا ۶۰۰ یورو در ماه برای شهرهای غیر از بخارست و ۵۰۰ تا ۸۰۰ یورو برای پایتخت در نظر بگیرید (مسکن، غذا و حمل‌ونقل). خوابگاه دانشگاه ارزان‌ترین گزینه است: حدود ۵۰ تا ۱۵۰ یورو در ماه.',
    },
    application: {
      en: 'Apply directly to each university’s international office. The main intake closes in July–September; competitive medical schools often close earlier. Typical documents: apostilled and translated diplomas, passport copy, and proof of language (programs are taught in English, Romanian and French).',
      ro: 'Aplici direct la biroul de relații internaționale al fiecărei universități. Admiterea principală se închide în iulie–septembrie; facultățile de medicină competitive închid adesea mai devreme. Documente tipice: diplome apostilate și traduse, copie pașaport și dovadă de limbă (programe în engleză, română și franceză).',
      fa: 'مستقیماً به دفتر بین‌الملل هر دانشگاه درخواست بدهید. مهلت اصلی پذیرش ژوئیه تا سپتامبر است؛ دانشکده‌های پزشکی رقابتی معمولاً زودتر بسته می‌شوند. مدارک معمول: مدارک تحصیلی تأییدشده (آپوستیل) و ترجمه‌شده، کپی پاسپورت و مدرک زبان (برنامه‌ها به انگلیسی، رومانیایی و فرانسوی ارائه می‌شوند).',
    },
    work: {
      en: 'With a student residence permit, non-EU students may work part-time (up to 4 hours per day) alongside studies; EU students can work without restriction.',
      ro: 'Cu permis de ședere pentru studii, studenții non-UE pot lucra part-time (până la 4 ore pe zi) în paralel cu studiile; studenții UE pot lucra fără restricții.',
      fa: 'با اجازه اقامت دانشجویی، دانشجویان غیراتحادیه اروپا می‌توانند در کنار تحصیل به‌صورت پاره‌وقت (تا ۴ ساعت در روز) کار کنند.',
    },
  },
  {
    countrySlug: 'poland',
    visa: {
      en: 'Non-EU students apply for a national D visa at a Polish consulate with the admission letter, proof of funds and health insurance, then switch to a temporary residence card in Poland for longer stays.',
      ro: 'Studenții non-UE aplică pentru viză națională D la un consulat polonez cu scrisoarea de admitere, dovada fondurilor și asigurare medicală, apoi obțin un permis de ședere temporară în Polonia pentru șederi mai lungi.',
      fa: 'دانشجویان غیراتحادیه اروپا با نامه پذیرش، اثبات تمکن مالی و بیمه درمانی برای ویزای ملی D به کنسولگری لهستان مراجعه می‌کنند و سپس در لهستان کارت اقامت موقت می‌گیرند.',
    },
    livingCosts: {
      en: 'Budget about €450–750 per month depending on the city — Warsaw and Kraków are the most expensive. Student dormitories cost roughly €100–200 per month.',
      ro: 'Bugetează circa 450–750 € pe lună în funcție de oraș — Varșovia și Cracovia sunt cele mai scumpe. Căminele studențești costă aproximativ 100–200 € pe lună.',
      fa: 'بسته به شهر، حدود ۴۵۰ تا ۷۵۰ یورو در ماه در نظر بگیرید — ورشو و کراکوف گران‌ترین‌اند. خوابگاه دانشجویی حدود ۱۰۰ تا ۲۰۰ یورو در ماه است.',
    },
    application: {
      en: 'Apply directly through each university’s online recruitment system (often called IRK). The main October intake usually accepts applications from May to September, and several universities also offer a February intake.',
      ro: 'Aplici direct prin sistemul online de recrutare al fiecărei universități (numit adesea IRK). Admiterea principală din octombrie acceptă de regulă aplicații din mai până în septembrie, iar mai multe universități au și admitere în februarie.',
      fa: 'از طریق سامانه آنلاین پذیرش هر دانشگاه (معمولاً IRK) مستقیماً اقدام کنید. پذیرش اصلی اکتبر معمولاً از مه تا سپتامبر باز است و چند دانشگاه پذیرش فوریه هم دارند.',
    },
    work: {
      en: 'Students with a valid student visa or residence permit may work in Poland without a separate work permit, both during term and holidays.',
      ro: 'Studenții cu viză de student sau permis de ședere valabil pot lucra în Polonia fără permis de muncă separat, atât în timpul semestrului, cât și în vacanțe.',
      fa: 'دانشجویان دارای ویزای دانشجویی یا اقامت معتبر می‌توانند بدون مجوز کار جداگانه در لهستان کار کنند — هم در طول ترم و هم در تعطیلات.',
    },
  },
  {
    countrySlug: 'hungary',
    visa: {
      en: 'Non-EU students need a residence permit for study purposes, applied for at a Hungarian consulate with the admission letter, proof of funds, accommodation and insurance. Stipendium Hungaricum scholarship holders get guided support through the process.',
      ro: 'Studenții non-UE au nevoie de permis de ședere pentru studii, solicitat la un consulat ungar cu scrisoarea de admitere, dovada fondurilor, cazării și asigurării. Bursierii Stipendium Hungaricum primesc sprijin ghidat în acest proces.',
      fa: 'دانشجویان غیراتحادیه اروپا به اجازه اقامت تحصیلی نیاز دارند که با نامه پذیرش، اثبات تمکن مالی، مدرک محل اقامت و بیمه از کنسولگری مجارستان درخواست می‌شود. دارندگان بورسیه Stipendium Hungaricum راهنمایی کامل دریافت می‌کنند.',
    },
    livingCosts: {
      en: 'Expect about €400–700 per month, with Budapest at the higher end. Dormitories and shared flats keep housing costs manageable in most university cities.',
      ro: 'Estimează circa 400–700 € pe lună, Budapesta fiind la capătul superior. Căminele și apartamentele partajate mențin costurile de cazare rezonabile în majoritatea orașelor universitare.',
      fa: 'حدود ۴۰۰ تا ۷۰۰ یورو در ماه در نظر بگیرید؛ بوداپست گران‌تر است. خوابگاه و خانه اشتراکی هزینه مسکن را در اکثر شهرهای دانشگاهی قابل‌مدیریت نگه می‌دارد.',
    },
    application: {
      en: 'Two main routes: the Stipendium Hungaricum scholarship (applications typically close mid-January) or direct fee-paying admission to each university for the September intake. English-taught programs are widespread, especially in medicine and engineering.',
      ro: 'Două rute principale: bursa Stipendium Hungaricum (aplicațiile se închid de regulă la mijlocul lui ianuarie) sau admiterea directă cu taxă la fiecare universitate pentru septembrie. Programele în engleză sunt răspândite, mai ales la medicină și inginerie.',
      fa: 'دو مسیر اصلی: بورسیه Stipendium Hungaricum (مهلت معمولاً اواسط ژانویه) یا پذیرش مستقیم شهریه‌پرداز برای ورودی سپتامبر. برنامه‌های انگلیسی‌زبان به‌ویژه در پزشکی و مهندسی فراوان‌اند.',
    },
    work: {
      en: 'International students may work part-time during the term (around 24 hours per week) and full-time during official breaks.',
      ro: 'Studenții internaționali pot lucra part-time în timpul semestrului (circa 24 de ore pe săptămână) și full-time în vacanțele oficiale.',
      fa: 'دانشجویان بین‌المللی می‌توانند در طول ترم به‌صورت پاره‌وقت (حدود ۲۴ ساعت در هفته) و در تعطیلات رسمی تمام‌وقت کار کنند.',
    },
  },
  {
    countrySlug: 'bulgaria',
    visa: {
      en: 'Non-EU students need a type D visa, issued after the university acceptance and the Ministry of Education admission certificate. Apply at the Bulgarian embassy in your country with translated, legalized documents.',
      ro: 'Studenții non-UE au nevoie de viză tip D, emisă după acceptarea universității și certificatul de admitere al Ministerului Educației. Aplici la ambasada Bulgariei din țara ta cu documente traduse și legalizate.',
      fa: 'دانشجویان غیراتحادیه اروپا به ویزای نوع D نیاز دارند که پس از پذیرش دانشگاه و گواهی وزارت آموزش بلغارستان صادر می‌شود. با مدارک ترجمه و تأییدشده به سفارت بلغارستان مراجعه کنید.',
    },
    livingCosts: {
      en: 'Among the lowest in the EU: about €300–550 per month including rent, food and transport. Sofia and coastal cities are slightly pricier than smaller university towns.',
      ro: 'Printre cele mai mici din UE: circa 300–550 € pe lună, incluzând chirie, mâncare și transport. Sofia și orașele de coastă sunt puțin mai scumpe decât orașele universitare mici.',
      fa: 'از ارزان‌ترین‌های اتحادیه اروپا: حدود ۳۰۰ تا ۵۵۰ یورو در ماه شامل اجاره، غذا و حمل‌ونقل. صوفیه و شهرهای ساحلی کمی گران‌ترند.',
    },
    application: {
      en: 'Apply directly to the university (English-taught medicine and dentistry are especially popular, with entrance exams in biology and chemistry at many schools). Document deadlines usually fall in spring–summer for the October intake.',
      ro: 'Aplici direct la universitate (medicina și stomatologia în engleză sunt deosebit de populare, cu examene de admitere la biologie și chimie la multe facultăți). Termenele pentru documente sunt de regulă primăvara–vara pentru admiterea din octombrie.',
      fa: 'مستقیماً به دانشگاه درخواست بدهید (پزشکی و دندان‌پزشکی انگلیسی‌زبان بسیار محبوب‌اند و بسیاری از دانشکده‌ها آزمون ورودی زیست و شیمی دارند). مهلت ارسال مدارک معمولاً بهار تا تابستان برای ورودی اکتبر است.',
    },
    work: {
      en: 'Non-EU students may work part-time (up to 20 hours per week) during their studies after registering with the employment authorities.',
      ro: 'Studenții non-UE pot lucra part-time (până la 20 de ore pe săptămână) în timpul studiilor, după înregistrarea la autoritățile de ocupare a forței de muncă.',
      fa: 'دانشجویان غیراتحادیه اروپا می‌توانند پس از ثبت‌نام نزد مراجع کار، در طول تحصیل تا ۲۰ ساعت در هفته کار کنند.',
    },
  },
  {
    countrySlug: 'czech-republic',
    visa: {
      en: 'Non-EU students apply for a long-term study visa or residence permit at a Czech embassy, with the admission letter, proof of funds and accommodation. Allow up to 60 days of processing.',
      ro: 'Studenții non-UE aplică pentru viză de studii pe termen lung sau permis de ședere la o ambasadă cehă, cu scrisoarea de admitere, dovada fondurilor și cazarea. Procesarea poate dura până la 60 de zile.',
      fa: 'دانشجویان غیراتحادیه اروپا با نامه پذیرش، اثبات تمکن مالی و مدرک محل اقامت برای ویزای تحصیلی بلندمدت به سفارت چک مراجعه می‌کنند. تا ۶۰ روز برای پردازش زمان بگذارید.',
    },
    livingCosts: {
      en: 'Around €500–800 per month; Prague is noticeably more expensive than Brno, Olomouc or Ostrava. Student dormitories typically cost €150–250 per month.',
      ro: 'În jur de 500–800 € pe lună; Praga este vizibil mai scumpă decât Brno, Olomouc sau Ostrava. Căminele studențești costă de regulă 150–250 € pe lună.',
      fa: 'حدود ۵۰۰ تا ۸۰۰ یورو در ماه؛ پراگ به‌طور محسوسی گران‌تر از برنو، اولوموتس یا اوستراواست. خوابگاه دانشجویی معمولاً ۱۵۰ تا ۲۵۰ یورو در ماه است.',
    },
    application: {
      en: 'A unique perk: degree programs taught in Czech are tuition-free at public universities, even for international students (language preparation needed). English-taught programs charge tuition. Application deadlines for the September intake are usually February–April.',
      ro: 'Un avantaj unic: programele predate în cehă sunt gratuite la universitățile publice, chiar și pentru studenții internaționali (e nevoie de pregătire lingvistică). Programele în engleză au taxă. Termenele de aplicare pentru septembrie sunt de regulă februarie–aprilie.',
      fa: 'مزیت ویژه: برنامه‌های به زبان چکی در دانشگاه‌های دولتی حتی برای دانشجویان بین‌المللی رایگان‌اند (نیاز به آمادگی زبانی). برنامه‌های انگلیسی شهریه دارند. مهلت درخواست برای ورودی سپتامبر معمولاً فوریه تا آوریل است.',
    },
    work: {
      en: 'Students enrolled in accredited study programs may work in the Czech Republic without a work permit.',
      ro: 'Studenții înscriși în programe acreditate pot lucra în Cehia fără permis de muncă.',
      fa: 'دانشجویان برنامه‌های معتبر می‌توانند بدون مجوز کار در جمهوری چک کار کنند.',
    },
  },
  {
    countrySlug: 'slovakia',
    visa: {
      en: 'Non-EU students need temporary residence for study purposes, applied for at a Slovak embassy with the admission letter, proof of funds, accommodation and a clean criminal record certificate.',
      ro: 'Studenții non-UE au nevoie de ședere temporară pentru studii, solicitată la o ambasadă slovacă cu scrisoarea de admitere, dovada fondurilor, cazarea și cazier judiciar curat.',
      fa: 'دانشجویان غیراتحادیه اروپا به اقامت موقت تحصیلی نیاز دارند که با نامه پذیرش، اثبات تمکن مالی، مدرک اقامت و گواهی عدم سوءپیشینه از سفارت اسلواکی درخواست می‌شود.',
    },
    livingCosts: {
      en: 'About €400–650 per month; Bratislava is the most expensive city, while Košice and smaller towns are notably cheaper. Dormitories cost roughly €80–180 per month.',
      ro: 'Circa 400–650 € pe lună; Bratislava este cel mai scump oraș, în timp ce Košice și orașele mici sunt vizibil mai ieftine. Căminele costă aproximativ 80–180 € pe lună.',
      fa: 'حدود ۴۰۰ تا ۶۵۰ یورو در ماه؛ براتیسلاوا گران‌ترین شهر است و کوشیتسه و شهرهای کوچک‌تر ارزان‌ترند. خوابگاه حدود ۸۰ تا ۱۸۰ یورو در ماه است.',
    },
    application: {
      en: 'Apply directly to each faculty — note that in Slovakia deadlines are often set per faculty, commonly in spring (March–April) for the September intake. Studies in Slovak at public universities are tuition-free.',
      ro: 'Aplici direct la fiecare facultate — în Slovacia termenele sunt adesea stabilite per facultate, de regulă primăvara (martie–aprilie) pentru admiterea din septembrie. Studiile în slovacă la universitățile publice sunt gratuite.',
      fa: 'مستقیماً به هر دانشکده درخواست بدهید — در اسلواکی مهلت‌ها معمولاً به تفکیک دانشکده و اغلب در بهار (مارس–آوریل) برای ورودی سپتامبر است. تحصیل به زبان اسلواکی در دانشگاه‌های دولتی رایگان است.',
    },
    work: {
      en: 'International students may work alongside their studies on work agreements, typically up to 20 hours per week during the academic year.',
      ro: 'Studenții internaționali pot lucra în paralel cu studiile pe bază de contracte de muncă, de regulă până la 20 de ore pe săptămână în anul academic.',
      fa: 'دانشجویان بین‌المللی می‌توانند در کنار تحصیل و معمولاً تا ۲۰ ساعت در هفته در سال تحصیلی کار کنند.',
    },
  },
];

export function guideForCountry(slug: string): CountryGuide | undefined {
  return COUNTRY_GUIDES.find((g) => g.countrySlug === slug);
}

export function guideText(
  guide: CountryGuide,
  section: 'visa' | 'livingCosts' | 'application' | 'work',
  locale: string
): string {
  const l = guide[section];
  return l[locale as keyof typeof l] ?? l.en;
}
