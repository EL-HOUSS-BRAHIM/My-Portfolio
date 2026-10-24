import type { Content } from "./models";

// Reviewed GitHub snapshot: 2026-10-23. Private source links are intentionally omitted.
export const githubContent: Content[] = [
  {
    id: "a8d39520-43fc-4deb-8c23-000000000001",
    kind: "project",
    slug: "lyvora",
    category: "web",
    tags: ["Expo", "React Native", "TypeScript"],
    source_url: "",
    demo_url: "",
    image: "/images/finance-cover.svg",
    featured: true,
    sort_order: 11,
    translations: {
      en: {
        title: "Lyvora — personal budgeting on Android",
        summary:
          "A manual-first finance product, developed through Android previews and over-the-air updates.",
        body: "## The product\nLyvora is the current Android budgeting product in the Budgetify repository. Its workspace combines an Expo mobile application with shared packages and backend services.\n\n## Engineering focus\nThe repository includes core-package tests, database checks, release validation, and distinct preview and production workflows. APK installation and over-the-air delivery are separate parts of its release process.\n\n## Current stage\nThe repository documents preview releases; a production APK is not yet published. This is separate from the earlier Budgetify web case study. Source code is private.",
        published: true,
      },
      fr: {
        title: "Lyvora — le budget personnel sur Android",
        summary:
          "Un produit de finances personnelles à saisie manuelle, développé avec des versions Android de prévisualisation.",
        body: "## Le produit\nLyvora est le produit Android actuel du dépôt Budgetify. Il associe une application Expo, des packages partagés et des services backend.\n\n## Travail technique\nTests du cœur métier, vérifications de base de données et validation des versions accompagnent des circuits distincts de prévisualisation et de production.\n\n## État actuel\nLe dépôt présente des préversions ; aucun APK de production n’est encore publié. Ce projet est distinct du précédent Budgetify web. Le code est privé.",
        published: true,
      },
      ar: {
        title: "Lyvora — الميزانية الشخصية على أندرويد",
        summary:
          "منتج مالي يعتمد على الإدخال اليدوي مع نسخ أندرويد تجريبية وتحديثات عن بُعد.",
        body: "## المنتج\nLyvora هو منتج أندرويد الحالي في مستودع Budgetify، ويجمع تطبيق Expo وحزمًا مشتركة وخدمات خلفية.\n\n## العمل التقني\nيتضمن المستودع اختبارات للحزم الأساسية وفحوص قاعدة البيانات والتحقق من الإصدارات، مع مسارات منفصلة للمعاينة والإنتاج.\n\n## المرحلة الحالية\nالإصدارات المتاحة تجريبية ولم يُنشر APK للإنتاج بعد. هذا المشروع منفصل عن مشروع Budgetify السابق للويب. الشفرة خاصة.",
        published: true,
      },
    },
  },
  {
    id: "a8d39520-43fc-4deb-8c23-000000000003",
    kind: "project",
    slug: "logistics-platform-foundations",
    category: "backend",
    tags: ["TypeScript", "Node.js", "PostgreSQL"],
    source_url: "",
    demo_url: "",
    image: "/images/log-cover.svg",
    featured: false,
    sort_order: 13,
    translations: {
      en: {
        title: "Logistics platform — architecture before scale",
        summary:
          "Early backend foundations for fleet operations, dispatch, and operational traceability.",
        body: "## The scope\nA private logistics project exploring fleet and trip workflows through a multi-application architecture.\n\n## Foundations\nThe repository contains a Node.js and TypeScript backend scaffold and architecture documentation. Its priorities include role-based access, auditability, file storage, and reliability.\n\n## Honest boundaries\nThis is planning and scaffolding work. Mobile offline sync, real-time tracking, and AI-assisted optimization are design goals, not completed capabilities. No customer outcomes are claimed.",
        published: true,
      },
      fr: {
        title: "Plateforme logistique — poser les fondations",
        summary:
          "Des fondations backend pour les opérations de flotte et la traçabilité.",
        body: "## Le périmètre\nUn projet privé de logistique explorant les flottes et les trajets dans une architecture multi-application.\n\n## Fondations\nLe dépôt contient une structure backend Node.js et TypeScript et une documentation d’architecture : droits d’accès, audit, fichiers et fiabilité.\n\n## État du projet\nIl s’agit de conception et de premières structures. Synchronisation hors ligne, suivi en temps réel et optimisation par IA restent des objectifs.",
        published: true,
      },
      ar: {
        title: "منصة لوجستية — تأسيس البنية",
        summary: "أسس خلفية لعمليات الأسطول والتوزيع وتتبع العمليات.",
        body: "## النطاق\nمشروع لوجستي خاص يستكشف إدارة الأساطيل والرحلات عبر بنية متعددة التطبيقات.\n\n## الأسس\nيتضمن المستودع هيكلًا أوليًا لخلفية Node.js وTypeScript ووثائق للصلاحيات والتدقيق وتخزين الملفات والموثوقية.\n\n## المرحلة\nالعمل في مرحلة التخطيط والتأسيس. المزامنة دون اتصال والتتبع المباشر والتحسين بالذكاء الاصطناعي أهداف تصميمية وليست قدرات مكتملة.",
        published: true,
      },
    },
  },
  {
    id: "a8d39520-43fc-4deb-8c23-000000000009",
    kind: "post",
    slug: "separating-preview-from-production",
    category: "engineering",
    tags: ["Android", "Releases", "Engineering notes"],
    source_url: "",
    demo_url: "",
    image: "",
    featured: false,
    sort_order: 19,
    translations: {
      en: {
        title: "Why a preview release needs a clear label",
        summary:
          "A note on communicating the difference between an installable build and a production release.",
        body: "## Two different promises\nAn Android preview lets someone explore a product while it is still evolving. Calling it production makes a stronger promise about readiness. The distinction should be visible wherever a build is offered.\n\n## Native builds and updates\nAn APK carries the native application. An over-the-air update depends on an installed compatible build. Clear installation instructions should explain that relationship before the download.\n\n## In this portfolio\nLyvora is presented as a preview product. A release history is evidence of delivery work, but it is not evidence of production adoption.",
        published: true,
      },
      fr: {
        title: "Pourquoi identifier clairement une préversion",
        summary:
          "Distinguer une version installable d’une version de production.",
        body: "## Deux engagements\nUne préversion Android permet d’explorer un produit en évolution. La qualifier de production implique un engagement plus fort sur sa maturité.\n\n## Installation et mises à jour\nL’APK contient l’application native. Une mise à jour à distance nécessite une version installée compatible. Les instructions doivent expliquer ce lien.\n\n## Dans ce portfolio\nLyvora est présenté comme un produit en prévisualisation. Un historique de versions témoigne du travail de livraison, sans prouver une adoption en production.",
        published: true,
      },
      ar: {
        title: "لماذا يجب توضيح أن الإصدار تجريبي",
        summary: "الفرق بين نسخة قابلة للتثبيت وإصدار جاهز للإنتاج.",
        body: "## التزامان مختلفان\nتتيح نسخة أندرويد التجريبية استكشاف منتج قيد التطوير. وصفها بالإنتاج يقدم وعدًا أكبر بالجاهزية.\n\n## التثبيت والتحديث\nيحمل APK التطبيق الأصلي، بينما يعتمد التحديث عن بُعد على نسخة مثبتة متوافقة. ينبغي توضيح هذه العلاقة قبل التنزيل.\n\n## في هذا الموقع\nيُعرض Lyvora كمنتج تجريبي. تاريخ الإصدارات يدل على عمل التسليم لكنه لا يثبت الاستخدام في الإنتاج.",
        published: true,
      },
    },
  },
];
