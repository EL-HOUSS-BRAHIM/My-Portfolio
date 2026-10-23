import type { Content } from "./models";

// Reviewed public repository material; dates describe repository history.
export const portfolioContent: Content[] = [
  {
    id: "c3d46932-819b-5a6f-8afb-a52cac93ee58",
    kind: "project",
    slug: "watch-party",
    category: "web",
    tags: ["Next.js", "Django", "PostgreSQL"],
    image: "/images/watch-party-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/watch-party",
    demo_url: "",
    featured: true,
    sort_order: 4,
    translations: {
      en: {
        title: "Watch Party — building shared experiences",
        summary:
          "A full-stack exploration of video libraries, shared viewing, and the systems behind real-time applications.",
        body: "## A shared experience, several moving parts\nWatch Party explores watching video together. The repository brings a Next.js frontend and a Django backend into one workspace, with PostgreSQL for persistent data and Redis-backed workers for asynchronous work.\n\n## The engineering problem\nA viewing interface is only one part of the experience. Video metadata, library management, background processing, and session state must fit together. Keeping the API, worker, and interface responsibilities clear makes failures easier to investigate.\n\n## What the repository shows\nThe documented stack includes Django REST Framework, Django Channels, Celery, TypeScript, and Next.js. Separate frontend and backend directories make those boundaries visible. Setup instructions describe PostgreSQL and Redis as explicit dependencies.\n\n## A useful trade-off\nA split frontend and backend allows each side to evolve independently, but introduces configuration and deployment work. API origins, worker connectivity, and environment-specific settings need as much attention as the screen itself.\n\n## Archived interface\n![Archived Watch Party development interface with video library controls](/images/watch-party-archive.webp)\n\nDevelopment screenshot preserved in the public repository. It shows an unfinished library interface, including placeholder metadata; it is not a current production screenshot.\n\n## Evidence and scope\nThis is a repository-based case study, not a claim about current uptime, audience size, or measured synchronization latency. The illustration is a conceptual cover. See the [source and setup notes](https://github.com/EL-HOUSS-BRAHIM/watch-party) for the implementation and its evolving deployment guidance.",
        published: true,
      },
      fr: {
        title: "Watch Party — des expériences partagées",
        summary:
          "Une exploration du visionnage partagé, des bibliothèques vidéo et des applications temps réel.",
        body: "## Plusieurs composants, une expérience\nLe dépôt réunit une interface Next.js, une API Django, PostgreSQL et des tâches asynchrones avec Redis et Celery. Django Channels figure dans l’architecture documentée.\n\n## Le défi\nRelier la bibliothèque vidéo, les métadonnées, les traitements en arrière-plan et l’état des sessions. Des responsabilités claires rendent les incidents plus faciles à comprendre.\n\n## Le compromis\nSéparer interface et backend facilite leur évolution, mais demande une configuration cohérente des origines API et des services. Cette étude décrit le dépôt ; elle ne revendique ni disponibilité actuelle ni performances mesurées. La couverture est une illustration conceptuelle.\n\n[Consulter le dépôt](https://github.com/EL-HOUSS-BRAHIM/watch-party).",
        published: true,
      },
      ar: {
        title: "Watch Party — بناء تجربة مشتركة",
        summary:
          "استكشاف مشاهدة الفيديو مع الآخرين وإدارة المكتبات وهندسة تطبيقات الوقت الفعلي.",
        body: "## تجربة واحدة ومكونات متعددة\nيجمع المستودع واجهة Next.js وخلفية Django وقاعدة PostgreSQL ومهام غير متزامنة عبر Redis وCelery. تتضمن البنية الموثقة Django Channels.\n\n## التحدي الهندسي\nربط مكتبة الفيديو والبيانات الوصفية والمعالجة الخلفية وحالة الجلسات. يساعد الفصل الواضح للمسؤوليات على فهم الأعطال.\n\n## الموازنة\nيسهل فصل الواجهة والخلفية تطويرهما، لكنه يتطلب ضبط الاتصال والخدمات لكل بيئة. تصف هذه الدراسة المستودع ولا تدعي جاهزية الخدمة الحالية أو أرقام أداء مقاسة. الغلاف رسم تصوري.\n\n[المستودع](https://github.com/EL-HOUSS-BRAHIM/watch-party).",
        published: true,
      },
    },
  },
  {
    id: "1d11bbfe-2ace-5797-bddb-15c710da6b94",
    kind: "project",
    slug: "school-news-portal",
    category: "web",
    tags: ["PHP", "MySQL", "Publishing"],
    image: "/images/publishing-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/School-News-Portal",
    demo_url: "",
    featured: false,
    sort_order: 5,
    translations: {
      en: {
        title: "School News Portal",
        summary:
          "A PHP publishing project built around articles, categories, comments, and an editorial dashboard.",
        body: "## The purpose\nGive a school a structured place to publish news and organize information. The repository describes article management, categories, comments, breaking news, image uploads, and a dashboard.\n\n## Behind the pages\nThe documented requirements are PHP, MySQL, and Composer. The project separates configuration from the public web directory and provides a database initialization step. A publishing workflow needs more than an attractive article page: it needs predictable storage, image handling, and clear navigation for readers and editors.\n\n## The design lesson\nCategories and meaningful URLs help readers find information. An editorial dashboard should reduce the work between drafting an announcement and making it readable. Comments and uploads also create validation and moderation responsibilities.\n\n## Scope\nThis is a personal repository project. It is not presented as a commissioned school deployment, and no traffic or client outcomes are claimed. The cover is a conceptual illustration of a publishing workspace.\n\n[Repository and documented features](https://github.com/EL-HOUSS-BRAHIM/School-News-Portal).",
        published: true,
      },
      fr: {
        title: "School News Portal",
        summary:
          "Un projet de publication en PHP : articles, catégories, commentaires et tableau de bord.",
        body: "## Le besoin\nOrganiser les actualités d’un établissement. Le dépôt décrit la gestion des articles, catégories, commentaires et images, ainsi qu’un tableau de bord.\n\n## L’approche\nPHP, MySQL et Composer, avec configuration séparée du répertoire public et initialisation de la base. Les URL lisibles et les catégories servent autant la navigation que la publication.\n\n## Leçon\nUn outil éditorial doit faciliter le passage du brouillon à une information accessible. Commentaires et images impliquent validation et modération. Ce projet personnel n’est pas présenté comme une prestation pour un établissement. La couverture est conceptuelle.\n\n[Source](https://github.com/EL-HOUSS-BRAHIM/School-News-Portal).",
        published: true,
      },
      ar: {
        title: "بوابة أخبار المدرسة",
        summary:
          "مشروع نشر بلغة PHP لتنظيم المقالات والفئات والتعليقات ولوحة التحرير.",
        body: "## الهدف\nتنظيم أخبار المؤسسة في مكان واضح. يصف المستودع إدارة المقالات والفئات والتعليقات والصور ولوحة التحكم.\n\n## النهج\nPHP وMySQL وComposer، مع فصل الإعدادات عن المجلد العام وخطوة لتهيئة قاعدة البيانات. تساعد الفئات والروابط المقروءة القراء والمحررين.\n\n## الدرس\nينبغي لأداة النشر تسهيل تحويل المسودة إلى معلومة مفيدة. تتطلب الصور والتعليقات التحقق والإشراف. هذا مشروع شخصي وليس ادعاء بتنفيذ خدمة لمدرسة. الغلاف تصوري.\n\n[المصدر](https://github.com/EL-HOUSS-BRAHIM/School-News-Portal).",
        published: true,
      },
    },
  },
  {
    id: "cc2fab28-86ef-5adb-8157-169c03f82bd2",
    kind: "project",
    slug: "travel-api",
    category: "backend",
    tags: ["Python", "REST", "Bookings"],
    image: "/images/travel-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/alx_travel_app_0x03",
    demo_url: "",
    featured: false,
    sort_order: 6,
    translations: {
      en: {
        title: "Travel API — making resources explicit",
        summary:
          "A backend learning project with documented listing and booking endpoints.",
        body: "## Start with the resource\nA travel application needs a shared understanding of what a listing and a booking mean. This repository documents collection and individual-resource endpoints for both.\n\n## The API contract\nThe README lists GET and POST for collections, then GET, PUT, PATCH, and DELETE for individual listings and bookings. It also points developers to Swagger and ReDoc documentation. Naming routes consistently makes an API easier to explore and integrate.\n\n## Questions worth asking\nWho may change a booking? Which listing fields are required? How should invalid input and unavailable resources be represented? These are review questions for a reliable API, not claims that every policy has been verified in this project.\n\n## What this work represents\nAn ALX backend exercise in resource-oriented API design and documentation. It is not a live booking service, payment integration endorsement, or production readiness report.\n\n[Endpoint documentation](https://github.com/EL-HOUSS-BRAHIM/alx_travel_app_0x03).",
        published: true,
      },
      fr: {
        title: "API de voyage — des ressources explicites",
        summary:
          "Un projet backend pédagogique avec des routes documentées pour annonces et réservations.",
        body: "## Partir des ressources\nLe dépôt documente les collections et les ressources individuelles pour les annonces et réservations : GET, POST, PUT, PATCH et DELETE selon la route. Swagger et ReDoc sont mentionnés pour explorer le contrat.\n\n## Les bonnes questions\nQui peut modifier une réservation ? Quels champs sont obligatoires ? Comment décrire une entrée invalide ? Ce sont des questions de revue, sans prétendre que toutes ces règles ont été vérifiées.\n\nCe travail ALX est un exercice d’API, pas un service de réservation en production. La couverture est conceptuelle.\n\n[Documentation](https://github.com/EL-HOUSS-BRAHIM/alx_travel_app_0x03).",
        published: true,
      },
      ar: {
        title: "واجهة السفر — موارد واضحة",
        summary: "مشروع تعليمي للخلفية مع مسارات موثقة للإعلانات والحجوزات.",
        body: "## البداية من الموارد\nيوثق المستودع مسارات المجموعات والعناصر للإعلانات والحجوزات باستخدام GET وPOST وPUT وPATCH وDELETE حسب المسار، ويشير إلى Swagger وReDoc لاستكشاف الواجهة.\n\n## أسئلة المراجعة\nمن يحق له تغيير الحجز؟ ما الحقول المطلوبة؟ كيف تمثل الأخطاء؟ هذه أسئلة هندسية ولا تعني أن جميع السياسات اختبرت في المشروع.\n\nهذا تمرين ALX في تصميم الواجهات وتوثيقها وليس منصة حجز جاهزة للإنتاج. الغلاف تصوري.\n\n[التوثيق](https://github.com/EL-HOUSS-BRAHIM/alx_travel_app_0x03).",
        published: true,
      },
    },
  },
  {
    id: "97eecce5-6ae3-5547-a1fd-e52620836c6f",
    kind: "project",
    slug: "portfolio",
    category: "web",
    tags: ["Next.js", "TypeScript", "i18n"],
    image: "/images/portfolio-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/My-Portfolio",
    demo_url: "",
    featured: false,
    sort_order: 7,
    translations: {
      en: {
        title: "This portfolio — a living project",
        summary:
          "From PHP pages to a multilingual publishing application with English, French, and Arabic.",
        body: "## A portfolio that can grow\nThis site is also an engineering project. The repository preserves the earlier PHP application while the current application lives in web/, built with Next.js and strict TypeScript.\n\n## More than translation\nEnglish, French, and Arabic have separate routes and publication states. Arabic needs a genuine right-to-left layout, including navigation, spacing, and readable text. The content model separates projects, articles, capabilities, and milestones so each page has a clear purpose.\n\n## Publishing with care\nThe documented architecture uses Supabase for content and a private publishing dashboard. Publication is per language; submitted messages and testimonials are distinct from public content. A testimonial should only appear after review and consent.\n\n## The continuing work\nCase studies should explain the problem, the approach, and the evidence. Screenshots need context. Timelines should distinguish repository history from employment. This update fills those editorial gaps without inventing client numbers or credentials.\n\n[Explore the source](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio).",
        published: true,
      },
      fr: {
        title: "Ce portfolio — un projet vivant",
        summary:
          "De pages PHP à une application de publication en anglais, français et arabe.",
        body: "## Un site qui évolue\nLe dépôt conserve l’application PHP et accueille l’application Next.js et TypeScript dans web/. Les contenus ont des routes et des états de publication distincts pour chaque langue.\n\n## Au-delà de la traduction\nL’arabe exige une vraie mise en page de droite à gauche. Le modèle distingue projets, articles, compétences et étapes du parcours. Supabase et le tableau de bord privé servent la publication.\n\n## Une ligne éditoriale\nExpliquer les problèmes, les choix et les preuves. Donner du contexte aux images et distinguer histoire des dépôts et emploi, sans inventer de résultats clients.\n\n[Source](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio).",
        published: true,
      },
      ar: {
        title: "هذا الموقع — مشروع يتطور",
        summary: "من صفحات PHP إلى تطبيق نشر بالإنجليزية والفرنسية والعربية.",
        body: "## موقع قابل للنمو\nيحتفظ المستودع بتطبيق PHP السابق، ويضع تطبيق Next.js وTypeScript في web/. لكل لغة مسارات وحالة نشر مستقلة.\n\n## أكثر من ترجمة\nتحتاج العربية إلى تخطيط حقيقي من اليمين إلى اليسار. يفصل نموذج المحتوى بين المشاريع والمقالات والمهارات ومحطات المسار. تستخدم البنية Supabase ولوحة نشر خاصة.\n\n## أسلوب النشر\nشرح المشكلة والقرارات والأدلة، وتوضيح سياق الصور، والتمييز بين تاريخ المستودعات والخبرة الوظيفية دون اختراع نتائج للعملاء.\n\n[المصدر](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio).",
        published: true,
      },
    },
  },
  {
    id: "9d6c2744-feac-5c97-afe9-8060cff076d5",
    kind: "experience",
    slug: "systems-foundations",
    category: "2023",
    tags: [],
    image: "",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/alx-low_level_programming",
    demo_url: "",
    featured: false,
    sort_order: 24,
    translations: {
      en: {
        title: "2023 · Systems foundations",
        summary:
          "C exercises, a Unix shell, and a Monty interpreter form the early public repository trail.",
        body: "The C learning repository was created in August 2023, simple_shell in October, and monty in November. These dates mark repository history, not employment.",
        published: true,
      },
      fr: {
        title: "2023 · Fondations système",
        summary:
          "Exercices en C, shell Unix et interpréteur Monty jalonnent les premiers dépôts.",
        body: "Le dépôt C date d’août 2023, simple_shell d’octobre et monty de novembre. Ces dates décrivent les dépôts, pas un emploi.",
        published: true,
      },
      ar: {
        title: "2023 · أسس الأنظمة",
        summary:
          "تمارين C وصدفة يونكس ومفسر Monty تمثل بدايات المسار في المستودعات العامة.",
        body: "أنشئ مستودع C في أغسطس وsimple_shell في أكتوبر وmonty في نوفمبر 2023. هذه تواريخ مستودعات وليست تواريخ عمل.",
        published: true,
      },
    },
  },
  {
    id: "2afa6e89-f2f5-5e7e-b99b-ec4abed80a59",
    kind: "experience",
    slug: "publishing-applications",
    category: "2024",
    tags: [],
    image: "",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/School-News-Portal",
    demo_url: "",
    featured: false,
    sort_order: 25,
    translations: {
      en: {
        title: "2024 · Publishing applications",
        summary:
          "School News Portal brings articles, categories, comments, and editorial tools together.",
        body: "The repository was created in December 2024. It records a move toward complete publishing workflows with PHP and MySQL.",
        published: true,
      },
      fr: {
        title: "2024 · Applications de publication",
        summary:
          "School News Portal réunit articles, catégories, commentaires et outils éditoriaux.",
        body: "Créé en décembre 2024, le dépôt illustre un travail sur les parcours de publication en PHP et MySQL.",
        published: true,
      },
      ar: {
        title: "2024 · تطبيقات النشر",
        summary:
          "تجمع بوابة الأخبار المقالات والفئات والتعليقات وأدوات التحرير.",
        body: "أنشئ المستودع في ديسمبر 2024، وهو يوثق العمل على مسارات النشر باستخدام PHP وMySQL.",
        published: true,
      },
    },
  },
  {
    id: "7c9fe104-cb4a-53e4-b0e5-d012786c6c90",
    kind: "experience",
    slug: "connected-products",
    category: "2025",
    tags: [],
    image: "",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/watch-party",
    demo_url: "",
    featured: false,
    sort_order: 26,
    translations: {
      en: {
        title: "2025 · Connected products",
        summary:
          "Travel API exercises and Watch Party expand the work into APIs and shared experiences.",
        body: "The travel API repository and Watch Party were created in July 2025. Their documentation explores resource contracts, separate application services, and background work.",
        published: true,
      },
      fr: {
        title: "2025 · Produits connectés",
        summary:
          "Les exercices d’API de voyage et Watch Party élargissent le travail aux services et aux expériences partagées.",
        body: "Ces dépôts datent de juillet 2025 et abordent contrats API, services séparés et tâches en arrière-plan.",
        published: true,
      },
      ar: {
        title: "2025 · منتجات متصلة",
        summary:
          "توسع تمارين واجهة السفر وWatch Party العمل إلى الخدمات والتجارب المشتركة.",
        body: "أنشئ المستودعان في يوليو 2025 ويتناول توثيقهما عقود الواجهات وفصل الخدمات والمهام الخلفية.",
        published: true,
      },
    },
  },
  {
    id: "2f110070-3d59-5e68-a8f6-119742b07621",
    kind: "experience",
    slug: "multilingual-portfolio",
    category: "2026",
    tags: [],
    image: "",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/My-Portfolio",
    demo_url: "",
    featured: false,
    sort_order: 27,
    translations: {
      en: {
        title: "2026 · Making the work legible",
        summary:
          "The portfolio evolves into a multilingual application with case studies and a publishing dashboard.",
        body: "The October 2026 repository contains the Next.js application, English/French/Arabic routes, content models, and deployment runbooks. The focus is communicating the work with evidence.",
        published: true,
      },
      fr: {
        title: "2026 · Rendre le travail lisible",
        summary:
          "Le portfolio devient une application multilingue avec études de cas et tableau de bord.",
        body: "Le dépôt d’octobre 2026 contient Next.js, trois langues, le modèle de contenu et les guides de déploiement. Le but est de présenter le travail avec des preuves.",
        published: true,
      },
      ar: {
        title: "2026 · توضيح العمل",
        summary:
          "يتطور الموقع إلى تطبيق متعدد اللغات مع دراسات حالة ولوحة نشر.",
        body: "يتضمن مستودع أكتوبر 2026 تطبيق Next.js وثلاث لغات ونموذج محتوى وأدلة تشغيل، بهدف تقديم العمل بأدلة واضحة.",
        published: true,
      },
    },
  },
  {
    id: "cc1ec33d-8c3f-5682-9cb9-c4d76fae6ec4",
    kind: "education",
    slug: "alx-foundations",
    category: "Learning",
    tags: ["ALX", "C", "Python"],
    image: "",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/alx-low_level_programming",
    demo_url: "",
    featured: false,
    sort_order: 30,
    translations: {
      en: {
        title: "ALX · Learning through implementation",
        summary:
          "A project-based path through C, Unix, Python, APIs, data structures, and backend engineering.",
        body: "The public repositories document coursework and exercises. They demonstrate a learning path rather than independently verified certification or graduation dates.",
        published: true,
      },
      fr: {
        title: "ALX · Apprendre par la pratique",
        summary:
          "Un parcours par projets en C, Unix, Python, API, structures de données et backend.",
        body: "Les dépôts publics documentent les exercices. Ils ne constituent pas une vérification indépendante d’un diplôme ou de dates de certification.",
        published: true,
      },
      ar: {
        title: "ALX · التعلم بالتطبيق",
        summary:
          "مسار مشاريع في C ويونكس وبايثون والواجهات وهياكل البيانات وهندسة الخلفية.",
        body: "توثق المستودعات العامة التمارين ومسار التعلم ولا تمثل إثباتا مستقلا لشهادة أو تاريخ تخرج.",
        published: true,
      },
    },
  },
  {
    id: "e69a08ed-e61b-55e6-b10c-8f2791c0b870",
    kind: "skill",
    slug: "systems",
    category: "Capabilities",
    tags: ["C", "Unix", "Data structures"],
    image: "",
    source_url: "",
    demo_url: "",
    featured: false,
    sort_order: 49,
    translations: {
      en: {
        title: "Systems & fundamentals",
        summary:
          "C, process management, memory ownership, stacks, and queues — explored through shell and interpreter projects.",
        body: "",
        published: true,
      },
      fr: {
        title: "Systèmes et fondations",
        summary:
          "C, processus, mémoire, piles et files — explorés dans les projets de shell et d’interpréteur.",
        body: "",
        published: true,
      },
      ar: {
        title: "الأنظمة والأسس",
        summary:
          "C وإدارة العمليات والذاكرة والمكدسات والطوابير عبر مشاريع الصدفة والمفسر.",
        body: "",
        published: true,
      },
    },
  },
  {
    id: "f3a6027e-bc62-5f83-87b2-fd37c375e188",
    kind: "skill",
    slug: "backend",
    category: "Capabilities",
    tags: ["Python", "REST", "SQL"],
    image: "",
    source_url: "",
    demo_url: "",
    featured: false,
    sort_order: 50,
    translations: {
      en: {
        title: "Backend & data",
        summary:
          "Resource-oriented APIs, relational data, parsing, and asynchronous services, grounded in public learning repositories.",
        body: "",
        published: true,
      },
      fr: {
        title: "Backend et données",
        summary:
          "API orientées ressources, données relationnelles, analyse de flux et services asynchrones, illustrés dans les dépôts.",
        body: "",
        published: true,
      },
      ar: {
        title: "الخلفية والبيانات",
        summary:
          "واجهات مبنية حول الموارد وبيانات علائقية وتحليل تدفقات وخدمات غير متزامنة توثقها المستودعات.",
        body: "",
        published: true,
      },
    },
  },
  {
    id: "ddcb03ef-de63-518e-8224-c39416c2bd8d",
    kind: "skill",
    slug: "web",
    category: "Capabilities",
    tags: ["TypeScript", "Next.js", "PHP"],
    image: "",
    source_url: "",
    demo_url: "",
    featured: false,
    sort_order: 51,
    translations: {
      en: {
        title: "Web & publishing",
        summary:
          "Responsive interfaces, multilingual content, and editorial workflows using TypeScript, Next.js, and PHP.",
        body: "",
        published: true,
      },
      fr: {
        title: "Web et publication",
        summary:
          "Interfaces adaptatives, contenu multilingue et parcours éditoriaux avec TypeScript, Next.js et PHP.",
        body: "",
        published: true,
      },
      ar: {
        title: "الويب والنشر",
        summary:
          "واجهات متجاوبة ومحتوى متعدد اللغات ومسارات تحرير باستخدام TypeScript وNext.js وPHP.",
        body: "",
        published: true,
      },
    },
  },
  {
    id: "60179009-746d-52f8-b7bb-03afbde3643b",
    kind: "service",
    slug: "web-applications",
    category: "Services",
    tags: [],
    image: "",
    source_url: "",
    demo_url: "",
    featured: false,
    sort_order: 72,
    translations: {
      en: {
        title: "Web applications & publishing",
        summary:
          "Plan and build responsive pages, content structures, and practical editorial tools. We agree the audience, scope, and review points together.",
        body: "",
        published: true,
      },
      fr: {
        title: "Applications web et publication",
        summary:
          "Concevoir des pages adaptatives, une structure de contenu et des outils éditoriaux utiles. Public, périmètre et étapes de revue sont convenus ensemble.",
        body: "",
        published: true,
      },
      ar: {
        title: "تطبيقات الويب والنشر",
        summary:
          "تخطيط صفحات متجاوبة وهيكلة المحتوى وأدوات تحرير عملية، مع الاتفاق على الجمهور والنطاق ومراحل المراجعة.",
        body: "",
        published: true,
      },
    },
  },
  {
    id: "6606ccb3-84ca-55bc-8788-d130554f4fe9",
    kind: "service",
    slug: "apis-integrations",
    category: "Services",
    tags: [],
    image: "",
    source_url: "",
    demo_url: "",
    featured: false,
    sort_order: 73,
    translations: {
      en: {
        title: "APIs & data workflows",
        summary:
          "Design clear resources and data flows, connect application services, and document assumptions so another developer can continue the work.",
        body: "",
        published: true,
      },
      fr: {
        title: "API et flux de données",
        summary:
          "Définir les ressources, relier les services et documenter les hypothèses pour faciliter la suite du travail.",
        body: "",
        published: true,
      },
      ar: {
        title: "الواجهات ومسارات البيانات",
        summary:
          "تحديد الموارد وربط الخدمات وتوثيق الافتراضات حتى يستطيع مطور آخر مواصلة العمل.",
        body: "",
        published: true,
      },
    },
  },
  {
    id: "c4d10ccf-74b5-50cb-a749-08053419c8c5",
    kind: "service",
    slug: "product-reviews",
    category: "Services",
    tags: [],
    image: "",
    source_url: "",
    demo_url: "",
    featured: false,
    sort_order: 74,
    translations: {
      en: {
        title: "Product improvements & technical reviews",
        summary:
          "Investigate existing behavior, explain the findings, and make focused improvements to usability and maintainability. Deliverables can include a concise technical report.",
        body: "",
        published: true,
      },
      fr: {
        title: "Améliorations et revues techniques",
        summary:
          "Examiner le comportement existant, expliquer les constats et améliorer l’usage et la maintenance. Un rapport technique peut accompagner les changements.",
        body: "",
        published: true,
      },
      ar: {
        title: "تحسين المنتجات والمراجعات التقنية",
        summary:
          "فهم السلوك الحالي وشرح النتائج وإجراء تحسينات محددة للاستخدام والصيانة، مع تقرير تقني عند الحاجة.",
        body: "",
        published: true,
      },
    },
  },
  {
    id: "f7bedff2-1bab-51ee-b3e8-1a59ab74a2f9",
    kind: "post",
    slug: "from-c-to-connected-products",
    category: "Journey",
    tags: ["Journey", "2023–2026"],
    image: "/images/journey-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/alx-low_level_programming",
    demo_url: "",
    featured: false,
    sort_order: 0,
    translations: {
      en: {
        title: "From C to connected products",
        summary:
          "A repository-based timeline of a learning path, from Unix fundamentals to multilingual web applications.",
        body: "## Start close to the machine\nThe public trail begins with C exercises in 2023. A [low-level programming repository](https://github.com/EL-HOUSS-BRAHIM/alx-low_level_programming) was created in August; [simple_shell](https://github.com/EL-HOUSS-BRAHIM/simple_shell) followed in October and [monty](https://github.com/EL-HOUSS-BRAHIM/monty) in November. Working on a shell makes process execution and environment handling concrete. An interpreter turns stacks and instruction parsing into visible behavior.\n\n## Move toward complete workflows\n[School News Portal](https://github.com/EL-HOUSS-BRAHIM/School-News-Portal), created in December 2024, shifts the focus toward readers and editors. Articles need categories, images, navigation, and a place to be managed. The interesting unit is no longer just a function; it is the path through a product.\n\n## Connect the pieces\nJuly 2025 repository dates introduce the [travel API](https://github.com/EL-HOUSS-BRAHIM/alx_travel_app_0x03) and [Watch Party](https://github.com/EL-HOUSS-BRAHIM/watch-party). One makes resource contracts explicit. The other documents separate frontend, backend, database, and worker components.\n\n## Make the work understandable\nIn October 2026, this portfolio contains a multilingual Next.js application and a publishing model. Explaining a project clearly is part of the engineering: what was the problem, what was built, and what does the evidence support?\n\n## How to read this timeline\nDates are repository creation dates except the 2026 milestone, which describes the current portfolio revision. They are not employment dates, course completion dates, or proof of continuous activity. This is a selection of work, not a complete biography.",
        published: true,
      },
      fr: {
        title: "Du C aux produits connectés",
        summary:
          "Un parcours documenté par les dépôts, des fondations Unix aux applications web multilingues.",
        body: "## 2023 · Comprendre les fondations\nLe dépôt de programmation C date d’août 2023, simple_shell d’octobre et monty de novembre. Processus, environnement et piles deviennent concrets par l’implémentation.\n\n## 2024 · Penser le parcours complet\nSchool News Portal, créé en décembre 2024, relie articles, images, catégories et outils éditoriaux. Le travail porte désormais sur une expérience complète.\n\n## 2025 · Relier les services\nL’API de voyage et Watch Party apparaissent en juillet 2025 : contrats de ressources, interface, backend et tâches asynchrones.\n\n## 2026 · Expliquer le travail\nLe portfolio actuel ajoute une application Next.js multilingue et un modèle de publication. Présenter problème, approche et preuves fait partie de l’ingénierie.\n\nLes dates sont celles de création des dépôts, sauf l’étape 2026 qui décrit la révision actuelle. Ce ne sont ni des dates d’emploi ni des attestations de formation.\n\n[Voir les dépôts](https://github.com/EL-HOUSS-BRAHIM).",
        published: true,
      },
      ar: {
        title: "من C إلى المنتجات المتصلة",
        summary:
          "مسار تعلم توثقه المستودعات، من أسس يونكس إلى تطبيقات ويب متعددة اللغات.",
        body: "## 2023 · فهم الأسس\nأنشئ مستودع C في أغسطس وsimple_shell في أكتوبر وmonty في نوفمبر. يجعل التطبيق العملي إدارة العمليات والبيئة والمكدسات ملموسة.\n\n## 2024 · التفكير في المسار الكامل\nأنشئت بوابة أخبار المدرسة في ديسمبر 2024، لتربط المقالات والصور والفئات وأدوات التحرير في تجربة نشر كاملة.\n\n## 2025 · ربط الخدمات\nظهر مستودعا واجهة السفر وWatch Party في يوليو 2025، مع عقود الموارد والواجهات والخلفية والمهام غير المتزامنة.\n\n## 2026 · شرح العمل\nيتضمن الموقع الحالي تطبيقا متعدد اللغات ونموذج نشر. شرح المشكلة والنهج والأدلة جزء من الهندسة.\n\nالتواريخ هي تواريخ إنشاء المستودعات، باستثناء محطة 2026 التي تصف الإصدار الحالي للموقع. ليست تواريخ توظيف أو إثباتات لإتمام الدراسة.\n\n[المستودعات](https://github.com/EL-HOUSS-BRAHIM).",
        published: true,
      },
    },
  },
  {
    id: "022f32d8-d7ec-5e78-a298-b4e78f147602",
    kind: "post",
    slug: "watch-party-architecture-report",
    category: "Engineering report",
    tags: ["Architecture", "Report"],
    image: "/images/watch-party-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/watch-party",
    demo_url: "",
    featured: false,
    sort_order: 1,
    translations: {
      en: {
        title: "Engineering report · The boundaries inside Watch Party",
        summary:
          "A reading of the documented architecture: what each component owns, and what should be verified next.",
        body: "## Scope and evidence\nThis report reads the public [Watch Party repository](https://github.com/EL-HOUSS-BRAHIM/watch-party), particularly its README and directory structure, reviewed on 23 October 2026. It is an architectural reading, not a penetration test, load test, or production acceptance report.\n\n## Finding 1 · Separate responsibilities are visible\nThe repository separates frontend and backend. Next.js and TypeScript describe the interface; Django REST Framework describes the API. This boundary helps explain where a screen ends and a data contract begins. It also creates a configuration obligation: both deployments must agree on API origins and authentication behavior.\n\n## Finding 2 · Background work is a first-class concern\nThe documented backend includes Celery, Redis, and video metadata processing. Long-running work belongs outside an interactive request when possible. A useful next verification is to interrupt a job and check retry behavior, duplicate handling, and the status shown to the user. Those checks are recommendations, not completed results.\n\n## Finding 3 · Deployment notes need chronology\nThe README includes newer guidance for Vercel/Render alongside historical Lightsail/Docker notes. A reader should distinguish the current recommendation from older operational material. A deployment matrix naming each environment, its source revision, and its owner would reduce ambiguity.\n\n## Next verification\nStart with an isolated environment: test the API contract, reconnect a shared viewing session, stop and restart a worker, and confirm the interface represents failure clearly. Record the exact revision and observed results before making reliability or latency claims.\n\n## Conclusion\nThe clearest strength is an explicit separation of application responsibilities. The next useful evidence is behavioral: what happens when a service disconnects, a task retries, or two clients disagree about state?",
        published: true,
      },
      fr: {
        title: "Rapport technique · Les frontières de Watch Party",
        summary:
          "Lecture de l’architecture documentée : responsabilités et prochaines vérifications utiles.",
        body: "## Périmètre\nLecture du [dépôt public](https://github.com/EL-HOUSS-BRAHIM/watch-party) le 23 octobre 2026. Ce n’est ni un test de charge ni un audit de sécurité.\n\n## Constats\nLe frontend Next.js et le backend Django sont séparés. Cette frontière clarifie le contrat API, mais impose une configuration cohérente entre déploiements. Celery et Redis signalent l’importance des traitements en arrière-plan.\n\nLe README juxtapose des recommandations Vercel/Render et des notes historiques Lightsail/Docker. Une matrice des environnements et révisions rendrait leur statut plus lisible.\n\n## Vérifier ensuite\nDans un environnement isolé : reconnexion d’une session, interruption puis reprise d’une tâche, traitement des doublons et affichage des erreurs. Ce sont des recommandations, pas des résultats déjà obtenus.\n\nLa prochaine preuve utile concerne le comportement quand un service échoue, pas seulement la liste des composants.",
        published: true,
      },
      ar: {
        title: "تقرير هندسي · حدود المكونات في Watch Party",
        summary:
          "قراءة للبنية الموثقة ومسؤوليات المكونات وما يستحق التحقق لاحقا.",
        body: "## النطاق\nقراءة [المستودع العام](https://github.com/EL-HOUSS-BRAHIM/watch-party) في 23 أكتوبر 2026. ليست اختبار حمل أو تدقيقا أمنيا.\n\n## النتائج\nيفصل المشروع واجهة Next.js عن خلفية Django. يوضح ذلك عقد الواجهة لكنه يتطلب إعدادا متناسقا للخدمات. وجود Celery وRedis يبرز أهمية المعالجة الخلفية.\n\nيجمع README بين إرشادات Vercel/Render الأحدث وملاحظات Lightsail/Docker التاريخية. سيساعد جدول يوضح البيئات وإصداراتها في إزالة الالتباس.\n\n## التحقق التالي\nفي بيئة معزولة: إعادة اتصال الجلسة وإيقاف مهمة ثم استئنافها ومعالجة التكرار وإظهار الخطأ للمستخدم. هذه توصيات وليست نتائج اختبارات مكتملة.\n\nالدليل الأهم لاحقا هو سلوك النظام عند فشل خدمة، وليس مجرد قائمة مكوناته.",
        published: true,
      },
    },
  },
  {
    id: "a010d6be-894c-511e-af56-c7781d788366",
    kind: "post",
    slug: "portfolio-content-report",
    category: "Editorial report",
    tags: ["Publishing", "Report"],
    image: "/images/portfolio-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/My-Portfolio",
    demo_url: "",
    featured: false,
    sort_order: 2,
    translations: {
      en: {
        title: "Publishing report · A portfolio with evidence",
        summary:
          "The editorial decisions behind the project pages, timeline, illustrations, and multilingual content.",
        body: "## What this update addresses\nA portfolio should help a reader understand the work without having to reconstruct it from repository names. This edition adds project narratives, a repository-based timeline, capabilities, services, and technical writing in English, French, and Arabic.\n\n## What counts as evidence\nProject descriptions refer to public README files and repository structure. Creation dates support the timeline. The earlier Budgetify description comes from this portfolio’s existing public project data; it is kept separate from the newer private product. No private implementation details are reproduced.\n\n## What the pictures mean\nNew covers are conceptual illustrations, not screenshots or proof of a running service. Existing project artwork belongs to the portfolio repository. Visuals introduce the subject; linked source material supports the engineering claims.\n\n## What is deliberately absent\nNo invented client testimonials, user counts, performance scores, employment history, or independently unverified certifications. A README can describe an intended feature without proving its security or production behavior.\n\n## Publication and maintenance\nEach language has its own publication state. Reports identify their scope and separate observed documentation from suggested tests. Future updates should name the revision being reviewed, refresh changed links, and replace conceptual art with contextualized screenshots when useful.\n\n## Sources\n[Portfolio source](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio), [Watch Party](https://github.com/EL-HOUSS-BRAHIM/watch-party), [School News Portal](https://github.com/EL-HOUSS-BRAHIM/School-News-Portal), [travel API](https://github.com/EL-HOUSS-BRAHIM/alx_travel_app_0x03), and the linked systems repositories. Reviewed 23 October 2026.",
        published: true,
      },
      fr: {
        title: "Rapport éditorial · Un portfolio étayé",
        summary:
          "Les choix derrière les études de cas, le parcours, les illustrations et les trois langues.",
        body: "## Objectif\nRendre le travail compréhensible sans demander au lecteur de reconstruire chaque projet depuis GitHub. Cette édition ajoute récits de projets, étapes, compétences, services et rapports dans trois langues.\n\n## Preuves et limites\nLes README et structures des dépôts soutiennent les descriptions. Les dates de création étayent le parcours, sans devenir des dates d’emploi. Budgetify reste décrit d’après les données publiques déjà présentes dans ce portfolio ; aucun détail privé du produit actuel n’est reproduit.\n\n## Images\nLes nouvelles couvertures sont conceptuelles : elles ne prouvent pas qu’un service est en ligne. Aucun témoignage, nombre d’utilisateurs ou résultat de performance n’est inventé.\n\n## Entretien\nLa publication reste distincte pour chaque langue. Les rapports séparent documentation observée et vérifications proposées. Revue du 23 octobre 2026.\n\n[Sources et application](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio).",
        published: true,
      },
      ar: {
        title: "تقرير النشر · موقع يستند إلى الأدلة",
        summary:
          "القرارات التحريرية وراء دراسات الحالة والمسار والرسوم والمحتوى متعدد اللغات.",
        body: "## الهدف\nشرح العمل دون مطالبة القارئ بإعادة بناء كل مشروع من أسماء مستودعاته. تضيف هذه النسخة دراسات حالة ومحطات ومهارات وخدمات وتقارير بثلاث لغات.\n\n## الأدلة والحدود\nتعتمد الأوصاف على README وبنية المستودعات، والمسار على تواريخ إنشائها لا على تواريخ العمل. يبقى وصف Budgetify مستندا إلى بياناته العامة الموجودة سابقا في الموقع، دون كشف تفاصيل خاصة للمنتج الحالي.\n\n## الصور\nالأغلفة الجديدة تصورية وليست دليلا على تشغيل الخدمة. لم تضاف شهادات عملاء أو أعداد مستخدمين أو نتائج أداء مخترعة.\n\n## الصيانة\nلكل لغة حالة نشر مستقلة. تميز التقارير بين ما توثقه المصادر وما يقترح اختباره. تمت المراجعة في 23 أكتوبر 2026.\n\n[المصدر والتطبيق](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio).",
        published: true,
      },
    },
  },
];
