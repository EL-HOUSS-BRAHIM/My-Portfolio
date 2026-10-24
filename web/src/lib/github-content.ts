import type { Content } from "./models";

// Editorial snapshot reviewed against GitHub on 2026-10-23.
// Private work is described at product level; source links stay empty.
type Copy = [title: string, summary: string, body: string];
function entry(
  number: number,
  kind: Content["kind"],
  slug: string,
  category: string,
  tags: string[],
  source: string,
  en: Copy,
  fr: Copy,
  ar: Copy,
  featured = false,
): Content {
  const translation = ([title, summary, body]: Copy) => ({
    title,
    summary,
    body,
    published: true,
  });
  return {
    id: `a8d39520-43fc-4deb-8c23-${String(number).padStart(12, "0")}`,
    kind,
    slug,
    category,
    tags,
    source_url: source,
    demo_url: "",
    image:
      kind === "project"
        ? slug === "lyvora"
          ? "/images/finance-cover.svg"
          : "/images/log-cover.svg"
        : "",
    featured,
    sort_order: number + 10,
    translations: {
      en: translation(en),
      fr: translation(fr),
      ar: translation(ar),
    },
  };
}

export const githubContent: Content[] = [
  entry(
    1,
    "project",
    "lyvora",
    "web",
    ["Expo", "React Native", "TypeScript"],
    "",
    [
      "Lyvora — personal budgeting on Android",
      "A manual-first finance product, developed through Android previews and over-the-air updates.",
      "## The product\nLyvora is the current Android budgeting product in the Budgetify repository. Its workspace combines an Expo mobile application with shared packages and backend services.\n\n## Engineering focus\nThe repository includes core-package tests, database checks, release validation, and distinct preview and production workflows. APK installation and over-the-air delivery are separate parts of its release process.\n\n## Current stage\nThe repository documents preview releases; a production APK is not yet published. This is separate from the earlier Budgetify web case study. Source code is private.",
    ],
    [
      "Lyvora — le budget personnel sur Android",
      "Un produit de finances personnelles à saisie manuelle, développé avec des versions Android de prévisualisation.",
      "## Le produit\nLyvora est le produit Android actuel du dépôt Budgetify. Il associe une application Expo, des packages partagés et des services backend.\n\n## Travail technique\nTests du cœur métier, vérifications de base de données et validation des versions accompagnent des circuits distincts de prévisualisation et de production.\n\n## État actuel\nLe dépôt présente des préversions ; aucun APK de production n’est encore publié. Ce projet est distinct du précédent Budgetify web. Le code est privé.",
    ],
    [
      "Lyvora — الميزانية الشخصية على أندرويد",
      "منتج مالي يعتمد على الإدخال اليدوي مع نسخ أندرويد تجريبية وتحديثات عن بُعد.",
      "## المنتج\nLyvora هو منتج أندرويد الحالي في مستودع Budgetify، ويجمع تطبيق Expo وحزمًا مشتركة وخدمات خلفية.\n\n## العمل التقني\nيتضمن المستودع اختبارات للحزم الأساسية وفحوص قاعدة البيانات والتحقق من الإصدارات، مع مسارات منفصلة للمعاينة والإنتاج.\n\n## المرحلة الحالية\nالإصدارات المتاحة تجريبية ولم يُنشر APK للإنتاج بعد. هذا المشروع منفصل عن مشروع Budgetify السابق للويب. الشفرة خاصة.",
    ],
    true,
  ),
  entry(
    2,
    "project",
    "watch-party",
    "web",
    ["Next.js", "Django", "PostgreSQL"],
    "https://github.com/EL-HOUSS-BRAHIM/watch-party",
    [
      "Watch Party — connecting the full stack",
      "A web application bringing a Next.js frontend together with a Django API and background workers.",
      "## Architecture\nThe monorepo separates the Next.js interface from a Django backend, with PostgreSQL for persistence and Redis supporting asynchronous services.\n\n## Beyond request and response\nBackend dependencies include Django Channels for WebSockets and Celery for queued work. This makes the project a useful exploration of interactive interfaces and background processing.\n\n## Delivery\nThe repository documents local setup, frontend and backend testing, and deployment configurations. These describe the engineering setup, rather than verified traffic or performance outcomes.",
    ],
    [
      "Watch Party — relier toute la stack",
      "Une interface Next.js, une API Django et des tâches en arrière-plan dans un même projet.",
      "## Architecture\nLe monorepo sépare le frontend Next.js du backend Django. PostgreSQL assure la persistance et Redis soutient les services asynchrones.\n\n## Interactions et tâches\nLes dépendances incluent Django Channels pour les WebSockets et Celery pour les traitements différés.\n\n## Livraison\nLe dépôt documente l’installation locale, les tests et la configuration de déploiement, sans fournir de résultats de trafic vérifiés.",
    ],
    [
      "Watch Party — ربط طبقات التطبيق",
      "واجهة Next.js وواجهة برمجية Django ومهام خلفية ضمن مشروع واحد.",
      "## البنية\nيفصل المستودع واجهة Next.js عن خلفية Django، مع PostgreSQL للتخزين وRedis للخدمات غير المتزامنة.\n\n## التفاعل والمهام\nتشمل الاعتماديات Django Channels لاتصالات WebSocket وCelery لمعالجة المهام.\n\n## التسليم\nيوثق المستودع الإعداد المحلي والاختبارات وإعدادات النشر دون ادعاء نتائج أداء أو استخدام مؤكدة.",
    ],
    true,
  ),
  entry(
    3,
    "project",
    "logistics-platform-foundations",
    "backend",
    ["TypeScript", "Node.js", "PostgreSQL"],
    "",
    [
      "Logistics platform — architecture before scale",
      "Early backend foundations for fleet operations, dispatch, and operational traceability.",
      "## The scope\nA private logistics project exploring fleet and trip workflows through a multi-application architecture.\n\n## Foundations\nThe repository contains a Node.js and TypeScript backend scaffold and architecture documentation. Its priorities include role-based access, auditability, file storage, and reliability.\n\n## Honest boundaries\nThis is planning and scaffolding work. Mobile offline sync, real-time tracking, and AI-assisted optimization are design goals, not completed capabilities. No customer outcomes are claimed.",
    ],
    [
      "Plateforme logistique — poser les fondations",
      "Des fondations backend pour les opérations de flotte et la traçabilité.",
      "## Le périmètre\nUn projet privé de logistique explorant les flottes et les trajets dans une architecture multi-application.\n\n## Fondations\nLe dépôt contient une structure backend Node.js et TypeScript et une documentation d’architecture : droits d’accès, audit, fichiers et fiabilité.\n\n## État du projet\nIl s’agit de conception et de premières structures. Synchronisation hors ligne, suivi en temps réel et optimisation par IA restent des objectifs.",
    ],
    [
      "منصة لوجستية — تأسيس البنية",
      "أسس خلفية لعمليات الأسطول والتوزيع وتتبع العمليات.",
      "## النطاق\nمشروع لوجستي خاص يستكشف إدارة الأساطيل والرحلات عبر بنية متعددة التطبيقات.\n\n## الأسس\nيتضمن المستودع هيكلًا أوليًا لخلفية Node.js وTypeScript ووثائق للصلاحيات والتدقيق وتخزين الملفات والموثوقية.\n\n## المرحلة\nالعمل في مرحلة التخطيط والتأسيس. المزامنة دون اتصال والتتبع المباشر والتحسين بالذكاء الاصطناعي أهداف تصميمية وليست قدرات مكتملة.",
    ],
  ),
  entry(
    4,
    "project",
    "travel-booking-api",
    "backend",
    ["REST API", "Bookings", "OpenAPI"],
    "https://github.com/EL-HOUSS-BRAHIM/alx_travel_app_0x03",
    [
      "Travel API — listings and bookings",
      "An API learning project with explicit resources and interactive documentation.",
      "## Resource design\nThe API documentation defines listings and bookings as separate resources, each with list, create, retrieve, update, and delete endpoints.\n\n## Developer experience\nSwagger and ReDoc routes provide interactive documentation. The focus is a predictable API contract that a frontend can explore and integrate.\n\n## Scope\nAn ALX learning project; payment processing, commercial bookings, and production usage are not claimed.",
    ],
    [
      "API de voyage — annonces et réservations",
      "Un projet d’apprentissage autour de ressources explicites et d’une documentation interactive.",
      "## Ressources\nLes annonces et les réservations disposent chacune d’opérations de liste, création, consultation, modification et suppression.\n\n## Documentation\nDes routes Swagger et ReDoc facilitent l’exploration de l’API.\n\n## Périmètre\nUn projet pédagogique ALX, sans revendication de paiements ni d’utilisation commerciale.",
    ],
    [
      "واجهة سفر — العروض والحجوزات",
      "مشروع تعليمي بموارد واضحة وتوثيق تفاعلي.",
      "## الموارد\nيوثق المشروع العروض والحجوزات كموارد منفصلة مع عمليات العرض والإنشاء والاسترجاع والتعديل والحذف.\n\n## التوثيق\nتوفر مسارات Swagger وReDoc توثيقًا تفاعليًا لتسهيل استكشاف الواجهة.\n\n## النطاق\nمشروع تعليمي ضمن ALX دون ادعاء تشغيل تجاري أو معالجة مدفوعات.",
    ],
  ),
  entry(
    5,
    "project",
    "portfolio-publishing-platform",
    "web",
    ["Next.js", "TypeScript", "next-intl"],
    "https://github.com/EL-HOUSS-BRAHIM/My-Portfolio",
    [
      "This portfolio — a multilingual publishing platform",
      "A portfolio with English, French, Arabic, and a private editorial dashboard.",
      "## Reading experience\nServer-rendered project pages, a filterable work collection, a journal, and light and dark themes support a readable portfolio. Arabic routes use right-to-left layouts.\n\n## Publishing\nThe application models content and translations separately, with per-language publication. Its private dashboard includes content editing and Markdown preview.\n\n## Operations\nThe repository includes Docker packaging, CI verification, and shared-server deployment procedures. Repository support for these workflows does not establish a live deployment.",
    ],
    [
      "Ce portfolio — une plateforme éditoriale multilingue",
      "Un portfolio en anglais, français et arabe avec un espace éditorial privé.",
      "## Lecture\nPages de projets rendues côté serveur, filtres, carnet et thèmes clair et sombre. Les routes arabes utilisent une mise en page de droite à gauche.\n\n## Publication\nLe contenu et les traductions sont séparés, avec publication par langue et aperçu Markdown dans le tableau de bord privé.\n\n## Exploitation\nLe dépôt inclut Docker, des vérifications CI et des procédures de déploiement ; cela ne confirme pas une mise en ligne.",
    ],
    [
      "هذا الموقع — منصة نشر متعددة اللغات",
      "موقع أعمال بالإنجليزية والفرنسية والعربية مع لوحة تحرير خاصة.",
      "## القراءة\nصفحات مشاريع تُعرض من الخادم وتصفية للأعمال ومدونة ووضعان فاتح وداكن. تدعم الصفحات العربية اتجاه اليمين إلى اليسار.\n\n## النشر\nيفصل التطبيق المحتوى عن الترجمات ويتيح النشر لكل لغة ومعاينة Markdown في لوحة خاصة.\n\n## التشغيل\nيتضمن المستودع Docker وفحوص CI وإجراءات نشر، دون أن يعني ذلك تأكيد النشر الفعلي.",
    ],
  ),
  entry(
    6,
    "skill",
    "full-stack-web",
    "web",
    ["Next.js", "Django", "TypeScript"],
    "",
    [
      "Full-stack web development",
      "React and Next.js interfaces connected to Django and Node.js backends, with clear boundaries between presentation, APIs, and storage.",
      "Demonstrated in Watch Party and this portfolio.",
    ],
    [
      "Développement web complet",
      "Interfaces React et Next.js reliées à des backends Django et Node.js, avec séparation entre interface, API et stockage.",
      "Illustré par Watch Party et ce portfolio.",
    ],
    [
      "تطوير الويب المتكامل",
      "واجهات React وNext.js مرتبطة بخلفيات Django وNode.js مع فصل العرض والواجهات البرمجية والتخزين.",
      "تظهر هذه المهارات في Watch Party وهذا الموقع.",
    ],
  ),
  entry(
    7,
    "skill",
    "backend-data",
    "backend",
    ["PostgreSQL", "REST API", "Celery"],
    "",
    [
      "APIs, data, and background work",
      "Resource-oriented APIs, relational persistence, and queued processing, explored through travel-booking and full-stack application projects.",
      "Evidence includes the travel API documentation and Watch Party backend dependencies.",
    ],
    [
      "API, données et tâches de fond",
      "API organisées par ressources, stockage relationnel et traitements différés, explorés dans les projets de voyage et d’applications web.",
      "Exemples : documentation de l’API de voyage et backend Watch Party.",
    ],
    [
      "الواجهات والبيانات والمهام الخلفية",
      "واجهات منظمة حسب الموارد وتخزين علائقي ومعالجة مهام، عبر مشاريع السفر وتطبيقات الويب.",
      "أمثلة من توثيق واجهة السفر واعتماديات Watch Party.",
    ],
  ),
  entry(
    8,
    "skill",
    "systems-foundations",
    "systems",
    ["C", "Unix", "Python"],
    "",
    [
      "Systems and problem-solving foundations",
      "C shells, stack interpreters, and Python parsing exercises provide practical grounding in processes, data structures, and explicit error handling.",
      "See the Simple Shell, Monty, and log-parsing projects.",
    ],
    [
      "Fondations systèmes et résolution de problèmes",
      "Shell en C, interpréteur de pile et analyse de flux Python : une pratique des processus, structures de données et erreurs explicites.",
      "Voir les projets Simple Shell, Monty et analyse de journaux.",
    ],
    [
      "أسس الأنظمة وحل المشكلات",
      "صدفة بلغة C ومفسر مكدسات وتحليل تدفقات ببايثون لبناء فهم للعمليات وهياكل البيانات ومعالجة الأخطاء.",
      "راجع مشاريع الصدفة وMonty وتحليل السجلات.",
    ],
  ),
  entry(
    9,
    "post",
    "separating-preview-from-production",
    "engineering",
    ["Android", "Releases", "Engineering notes"],
    "",
    [
      "Why a preview release needs a clear label",
      "A note on communicating the difference between an installable build and a production release.",
      "## Two different promises\nAn Android preview lets someone explore a product while it is still evolving. Calling it production makes a stronger promise about readiness. The distinction should be visible wherever a build is offered.\n\n## Native builds and updates\nAn APK carries the native application. An over-the-air update depends on an installed compatible build. Clear installation instructions should explain that relationship before the download.\n\n## In this portfolio\nLyvora is presented as a preview product. A release history is evidence of delivery work, but it is not evidence of production adoption.",
    ],
    [
      "Pourquoi identifier clairement une préversion",
      "Distinguer une version installable d’une version de production.",
      "## Deux engagements\nUne préversion Android permet d’explorer un produit en évolution. La qualifier de production implique un engagement plus fort sur sa maturité.\n\n## Installation et mises à jour\nL’APK contient l’application native. Une mise à jour à distance nécessite une version installée compatible. Les instructions doivent expliquer ce lien.\n\n## Dans ce portfolio\nLyvora est présenté comme un produit en prévisualisation. Un historique de versions témoigne du travail de livraison, sans prouver une adoption en production.",
    ],
    [
      "لماذا يجب توضيح أن الإصدار تجريبي",
      "الفرق بين نسخة قابلة للتثبيت وإصدار جاهز للإنتاج.",
      "## التزامان مختلفان\nتتيح نسخة أندرويد التجريبية استكشاف منتج قيد التطوير. وصفها بالإنتاج يقدم وعدًا أكبر بالجاهزية.\n\n## التثبيت والتحديث\nيحمل APK التطبيق الأصلي، بينما يعتمد التحديث عن بُعد على نسخة مثبتة متوافقة. ينبغي توضيح هذه العلاقة قبل التنزيل.\n\n## في هذا الموقع\nيُعرض Lyvora كمنتج تجريبي. تاريخ الإصدارات يدل على عمل التسليم لكنه لا يثبت الاستخدام في الإنتاج.",
    ],
  ),
];
