import type { Content } from "./models";
import { githubContent } from "./github-content";
import { portfolioContent } from "./portfolio-content";
// Curated repository-derived content. Demo mode never accepts fake form submissions.
export const demoContent: Content[] = [
  ...githubContent,
  {
    id: "3bf3510a-2602-54b9-bed0-576c8f52f16a",
    kind: "project",
    slug: "budgetify",
    category: "web",
    tags: ["React", "Node.js", "MongoDB"],
    image: "/images/finance-cover.svg",
    source_url: "",
    demo_url: "",
    featured: true,
    sort_order: 0,
    translations: {
      en: {
        title: "Budgetify",
        summary: "Exploring a clearer way to understand personal finances.",
        body: "## The project\nA collaborative personal-finance application developed during the ALX programme. The repository describes expense tracking, budgets, analytics, and multi-user support.\n\n## Engineering focus\nConnecting a React interface to a Node.js API and MongoDB data model. The project brings authentication, data validation, and useful financial views together.\n\n## A continuing journey\nThe current Budgetify repository now introduces Lyvora and Android preview releases. This case study describes the earlier web project; it does not claim the current mobile product’s features or outcomes.",
        published: true,
      },
      fr: {
        title: "Budgetify",
        summary: "Explorer une façon plus claire de comprendre ses finances.",
        body: "## Le projet\nUne application collaborative de finances personnelles réalisée pendant le programme ALX : suivi des dépenses, budgets et visualisation des données.\n\n## Approche technique\nRelier une interface React à une API Node.js et un modèle de données MongoDB.\n\n## Un parcours qui continue\nLe dépôt actuel présente désormais Lyvora et ses versions Android. Cette page décrit le projet web initial.",
        published: true,
      },
      ar: {
        title: "بجتيفاي",
        summary: "استكشاف طريقة أوضح لفهم الشؤون المالية الشخصية.",
        body: "## المشروع\nتطبيق تعاوني لإدارة الشؤون المالية الشخصية ضمن برنامج ALX، يتناول تتبع النفقات والميزانيات وعرض البيانات.\n\n## التركيز التقني\nربط واجهة React بواجهة برمجية Node.js ونموذج بيانات MongoDB.\n\n## رحلة مستمرة\nيقدم المستودع الحالي الآن Lyvora ونسخ أندرويد التجريبية. تصف هذه الصفحة مشروع الويب السابق.",
        published: true,
      },
    },
  },
  {
    id: "30f487ff-714c-5871-8be1-8aedaa844c49",
    kind: "project",
    slug: "simple-shell",
    category: "systems",
    tags: ["C", "Unix", "Processes"],
    image: "/images/shell-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/simple_shell",
    demo_url: "",
    featured: true,
    sort_order: 1,
    translations: {
      en: {
        title: "A shell, from the ground up",
        summary:
          "Getting closer to the operating system, one command at a time.",
        body: "## The question\nWhat happens between entering a command and seeing its output?\n\n## The work\nA Unix shell project in C, exploring command execution, process management, environment variables, and system calls.\n\n## Collaboration\nThe repository credits Brahim El Houss and Ayoub Kial as authors.\n\n## What it taught me\nWorking close to the operating system makes memory ownership, error handling, and explicit assumptions impossible to ignore.",
        published: true,
      },
      fr: {
        title: "Un shell, depuis les fondations",
        summary:
          "Comprendre le système d’exploitation, une commande à la fois.",
        body: "## La question\nQue se passe-t-il entre une commande et son résultat ?\n\n## Le travail\nUn shell Unix en C pour explorer l’exécution des commandes, les processus, les variables d’environnement et les appels système.\n\n## Collaboration\nLe dépôt cite Brahim El Houss et Ayoub Kial comme auteurs.\n\n## Apprentissage\nLa gestion de la mémoire et des erreurs doit rester explicite.",
        published: true,
      },
      ar: {
        title: "صدفة أوامر من الأساس",
        summary: "الاقتراب من نظام التشغيل، أمرًا بعد أمر.",
        body: "## السؤال\nماذا يحدث بين إدخال أمر ورؤية نتيجته؟\n\n## العمل\nمشروع صدفة يونكس بلغة C لاستكشاف تنفيذ الأوامر وإدارة العمليات ومتغيرات البيئة واستدعاءات النظام.\n\n## التعاون\nيذكر المستودع إبراهيم الحوس وأيوب كيال كمؤلفين.\n\n## التعلم\nالعمل قريبًا من نظام التشغيل يوضح أهمية إدارة الذاكرة والأخطاء.",
        published: true,
      },
    },
  },
  {
    id: "fd49d81f-74fb-53d1-98e8-1d5b9c8c3dc4",
    kind: "project",
    slug: "log-parser",
    category: "backend",
    tags: ["Python", "Parsing", "Data"],
    image: "/images/log-cover.svg",
    source_url:
      "https://github.com/EL-HOUSS-BRAHIM/alx-interview/tree/main/0x03-log_parsing",
    demo_url: "",
    featured: false,
    sort_order: 2,
    translations: {
      en: {
        title: "Finding signal in the logs",
        summary:
          "Turning a stream of server events into something understandable.",
        body: "## The problem\nServer logs contain useful information hidden in repetitive text.\n\n## The approach\nA Python exercise in reading a stream, extracting relevant values, and computing statistics. It explores parsing, incremental processing, and handling imperfect input.\n\n## The principle\nKeep the processing model simple and make edge cases visible.",
        published: true,
      },
      fr: {
        title: "Lire entre les lignes des journaux",
        summary:
          "Transformer un flux d’événements serveur en informations lisibles.",
        body: "## Le problème\nLes journaux serveur cachent des informations utiles dans un texte répétitif.\n\n## L’approche\nUn exercice Python de lecture en continu, d’extraction et de calcul de statistiques, avec attention aux entrées imparfaites.",
        published: true,
      },
      ar: {
        title: "استخراج المعنى من السجلات",
        summary: "تحويل تدفق أحداث الخادم إلى معلومات مفهومة.",
        body: "## المشكلة\nتختبئ معلومات مفيدة داخل نصوص سجلات الخادم المتكررة.\n\n## النهج\nتمرين بايثون لقراءة تدفق البيانات واستخراج القيم وحساب الإحصاءات مع مراعاة المدخلات غير المثالية.",
        published: true,
      },
    },
  },
  {
    id: "2f3b1a5d-c698-5068-855d-4f981702ba80",
    kind: "project",
    slug: "monty",
    category: "systems",
    tags: ["C", "Stacks", "Interpreter"],
    image: "/images/monty-cover.svg",
    source_url: "https://github.com/EL-HOUSS-BRAHIM/monty",
    demo_url: "",
    featured: false,
    sort_order: 3,
    translations: {
      en: {
        title: "Small instructions, clear behavior",
        summary: "Exploring stacks and queues through a bytecode interpreter.",
        body: "## The project\nA Monty bytecode interpreter written in C.\n\n## The approach\nParse instructions, validate their arguments, and apply operations to a stack or queue.\n\n## Learning\nData structures become easier to reason about when each operation has a precise contract.",
        published: true,
      },
      fr: {
        title: "De petites instructions, un comportement clair",
        summary:
          "Explorer les piles et les files avec un interpréteur de bytecode.",
        body: "## Le projet\nUn interpréteur de bytecode Monty en C.\n\n## L’approche\nAnalyser les instructions et appliquer leurs opérations à une pile ou une file.",
        published: true,
      },
      ar: {
        title: "تعليمات صغيرة وسلوك واضح",
        summary: "استكشاف المكدسات والطوابير عبر مفسر تعليمات.",
        body: "## المشروع\nمفسر تعليمات Monty بلغة C.\n\n## النهج\nتحليل التعليمات والتحقق منها وتنفيذ عملياتها على مكدس أو طابور.",
        published: true,
      },
    },
  },
  ...portfolioContent,
];
