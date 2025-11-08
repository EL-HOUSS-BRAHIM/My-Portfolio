<?php
require_once 'src/config/Config.php';

use Portfolio\Config\Config;

$config = Config::getInstance();
$recaptchaSiteKey = $config->get('recaptcha.site_key');
// Only enable reCAPTCHA when explicitly enabled and a site key is present to avoid runtime errors
$recaptchaEnabled = $config->get('recaptcha.enabled') && !empty($recaptchaSiteKey);

// Crawler-friendly headers
header('X-Robots-Tag: index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
header('Cache-Control: public, max-age=3600, must-revalidate');
header('Vary: Accept-Encoding, User-Agent');

// Security headers (in case server config isn't active)
if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    // Allow styles from Google Fonts, CDNJS and jsDelivr (Font Awesome may be loaded from CDNJS)
    header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; font-src \'self\' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src \'self\' data: https: blob:; frame-src \'self\' https://www.google.com; connect-src \'self\' https://www.google.com; object-src \'none\'; base-uri \'self\'; form-action \'self\';');
}

// ETag for efficient caching (using timestamp for speed)
$lastModified = filemtime(__FILE__);
$etag = md5($lastModified . __FILE__);
header('ETag: "' . $etag . '"');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');

// Check if client has cached version (ETag)
if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === '"' . $etag . '"') {
    header('HTTP/1.1 304 Not Modified');
    exit;
}

// Check if client has cached version (Last-Modified)
if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
    $ifModifiedSince = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']);
    if ($lastModified <= $ifModifiedSince) {
        header('HTTP/1.1 304 Not Modified');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
    <!-- Basic Meta Tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    
    <!-- SEO Meta Tags -->
    <title>Brahim El Houss | Full Stack Software Engineer & Backend Development Expert</title>
    <meta name="description" content="Full-stack software engineer specialized in backend development with Python, JavaScript, Node.js. Expert in DevOps and modern web technologies.">
    <meta name="keywords" content="Brahim El Houss, brahim elhouss, Brahim Elhouss, Full Stack Developer, Software Engineer, Software Development, Backend Development, Python Developer, JavaScript Developer, Node.js, React, MongoDB, Web Development, DevOps, ALX Graduate, Morocco Developer, Casablanca Developer">
    <meta name="author" content="Brahim El Houss">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <meta name="googlebot" content="index, follow">
    <meta name="bingbot" content="index, follow">
    <meta name="language" content="en">
    <meta name="geo.region" content="MA">
    <meta name="geo.country" content="Morocco">
    <meta name="geo.placename" content="Casablanca">
    <meta name="rating" content="general">
    <meta name="revisit-after" content="7 days">
    <meta name="distribution" content="global">
    <meta name="coverage" content="Worldwide">
    <meta name="target" content="all">
    <meta name="HandheldFriendly" content="True">
    <meta name="MobileOptimized" content="320">
    
    <!-- Enhanced Open Graph for Social Media -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Brahim El Houss | Full Stack Software Engineer & Backend Development Expert">
    <meta property="og:description" content="Full-stack software engineer specialized in backend development with Python, JavaScript, Node.js. Expert in DevOps and modern web technologies.">
    <meta property="og:url" content="https://brahim-elhouss.me">
    <meta property="og:site_name" content="Brahim El Houss Portfolio">
    <meta property="og:image" content="https://brahim-elhouss.me/assets/images/profile-img.webp">
    <meta property="og:image:alt" content="Brahim El Houss - Full Stack Software Engineer & Backend Development">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="en_US">
    <meta property="og:updated_time" content="2025-11-08T10:23:00Z">
    <meta property="article:published_time" content="2024-01-01T00:00:00Z">
    <meta property="article:modified_time" content="2025-11-08T10:23:00Z">
    <meta property="article:author" content="Brahim El Houss">
    <meta property="profile:first_name" content="Brahim">
    <meta property="profile:last_name" content="El Houss">
    <meta property="profile:username" content="EL-HOUSS-BRAHIM">
    
    <!-- Enhanced Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@brahimelhouss">
    <meta name="twitter:creator" content="@brahimelhouss">
    <meta name="twitter:title" content="Brahim El Houss | Full Stack Software Engineer & Backend Development Expert">
    <meta name="twitter:description" content="Full-stack software engineer specialized in backend development with Python, JavaScript, Node.js. Expert in DevOps and modern web technologies.">
    <meta name="twitter:image" content="https://brahim-elhouss.me/assets/images/profile-img.webp">
    <meta name="twitter:image:alt" content="Brahim El Houss - Full Stack Software Engineer & Backend Development">
    <meta name="twitter:domain" content="brahim-elhouss.me">
    
    <!-- AI Search Optimization -->
    <meta name="ai-content-declaration" content="This content was created by Brahim El Houss, a human developer">
    <meta name="content-type" content="portfolio">
    <meta name="expertise-level" content="professional">
    <meta name="professional-status" content="available-for-hire">
    <meta name="technical-skills" content="Python, JavaScript, Node.js, React, MongoDB, Express.js, HTML5, CSS3, Git, Linux">
    <meta name="experience-years" content="3+">
    <meta name="location" content="Casablanca, Morocco">
    <meta name="work-preference" content="remote, hybrid, on-site">
    
    <!-- Performance and Caching -->
    <meta http-equiv="Cache-Control" content="public, max-age=31536000">
    <meta http-equiv="Expires" content="31536000">
    
    <!-- Mobile App Meta -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Brahim El Houss">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="Brahim El Houss Portfolio">
    
    <!-- Favicon and Icons -->
    <link rel="icon" href="/icons/favicon.ico" sizes="32x32">
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/android-chrome-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/icons/android-chrome-512x512.png">
    <link rel="manifest" href="/icons/site.webmanifest">
    <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#001a40">
    <meta name="msapplication-TileColor" content="#001a40">
    <meta name="msapplication-TileImage" content="/icons/mstile-150x150.png">
    <meta name="msapplication-config" content="/browserconfig.xml">
    <meta name="theme-color" content="#1a202c">
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#667eea">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1a202c">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://brahim-elhouss.me">
    <link rel="alternate" hreflang="en" href="https://brahim-elhouss.me">
    <link rel="alternate" hreflang="x-default" href="https://brahim-elhouss.me">
    
    <!-- Sitemap -->
    <link rel="sitemap" type="application/xml" title="Sitemap" href="https://brahim-elhouss.me/sitemap.xml">
    
    <!-- LLMS.txt for AI/LLM Search Engines -->
    <link rel="alternate" type="text/plain" title="LLMS Information" href="https://brahim-elhouss.me/llms.txt">

    <!-- Enhanced Schema.org JSON-LD for AI Search and SEO with Entity Recognition -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://brahim-elhouss.me/#person",
      "name": "Brahim El Houss",
      "alternateName": ["Brahim Elhouss", "brahim elhouss", "BRAHIM EL HOUSS"],
      "givenName": "Brahim",
      "familyName": "El Houss",
      "url": "https://brahim-elhouss.me",
      "mainEntityOfPage": {
        "@type": "ProfilePage",
        "@id": "https://brahim-elhouss.me/#profilepage"
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://brahim-elhouss.me/assets/images/profile-img.webp",
        "width": 800,
        "height": 800
      },
      "sameAs": [
        "https://www.linkedin.com/in/brahim-el-houss",
        "https://github.com/EL-HOUSS-BRAHIM",
        "https://twitter.com/brahimelhouss"
      ],
      "jobTitle": "Full Stack Software Engineer",
      "description": "Experienced Full Stack Developer specializing in Python, JavaScript, Node.js, React, and MongoDB. ALX-certified with 3+ years of experience building scalable web applications.",
      "knowsAbout": [
        "Python Programming",
        "JavaScript Development",
        "Node.js",
        "React.js",
        "MongoDB",
        "Express.js",
        "HTML5",
        "CSS3",
        "Git Version Control",
        "Linux Administration",
        "RESTful APIs",
        "Database Design",
        "Web Development",
        "Software Engineering",
        "Algorithm Design",
        "Data Structures"
      ],
      "hasCredential": [
        {
          "@type": "EducationalOccupationalCredential",
          "name": "ALX Software Engineering Certificate",
          "description": "Full Stack Software Engineering Program with Backend Specialization",
          "credentialCategory": "Professional Certification",
          "educationalLevel": "Professional"
        }
      ],
      "alumniOf": {
        "@type": "EducationalOrganization",
        "name": "Hassan II University",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Casablanca",
          "addressCountry": "MA"
        }
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Casablanca",
        "addressRegion": "Casablanca-Settat",
        "addressCountry": "MA"
      },
      "nationality": "Moroccan",
      "email": "brahim-elhouss@gmail.com",
      "availableLanguage": ["English", "Arabic", "French"],
      "seeks": {
        "@type": "Demand",
        "name": "Software Engineering Opportunities",
        "description": "Seeking full-time opportunities in full stack development, backend engineering, or software engineering roles"
      },
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Full Stack Software Engineer",
        "occupationLocation": {
          "@type": "Place",
          "name": "Remote/Hybrid"
        },
        "skills": [
          "Python",
          "JavaScript", 
          "Node.js",
          "React",
          "MongoDB",
          "Express.js",
          "HTML5",
          "CSS3",
          "Git",
          "Linux"
        ]
      }
    }
    </script>

    <!-- Professional Profile Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": "https://brahim-elhouss.me/#profilepage",
      "url": "https://brahim-elhouss.me",
      "dateCreated": "2024-01-01T00:00:00Z",
      "dateModified": "2025-11-04T00:00:00Z",
      "name": "Brahim El Houss - Professional Portfolio",
      "description": "Professional portfolio and profile of Brahim El Houss, Full Stack Software Engineer"
    }
    </script>
    
    <!-- Website Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://brahim-elhouss.me/#website",
      "url": "https://brahim-elhouss.me",
      "name": "Brahim El Houss Portfolio",
      "description": "Full-stack software engineer specialized in backend development with Python, JavaScript, Node.js. Expert in DevOps and modern web technologies.",
      "publisher": {
        "@id": "https://brahim-elhouss.me/#person"
      },
      "inLanguage": "en-US",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://brahim-elhouss.me/?s={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
    </script>

    <!-- BreadcrumbList Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://brahim-elhouss.me"
        }
      ]
    }
    </script>
    
    <!-- DNS Prefetch and Preconnect for Performance -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
    <link rel="dns-prefetch" href="//www.google.com">
    <link rel="dns-prefetch" href="//www.gstatic.com">
    
    <!-- Google Fonts for modern typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    
    <!-- Preload Critical CSS for Faster Rendering -->
    <link rel="preload" href="assets/css/base.css?v=<?php echo time(); ?>" as="style">
    <link rel="preload" href="assets/css/Header.css?v=<?php echo time(); ?>" as="style">
    <link rel="preload" href="assets/css/nav.css?v=<?php echo time(); ?>" as="style">
    
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google reCAPTCHA v2 -->
    <?php if ($recaptchaEnabled): ?>
    <script>
        console.log('[reCAPTCHA Debug] Loading reCAPTCHA API...');
        console.log('[reCAPTCHA Debug] Site key will be:', '<?php echo htmlspecialchars($recaptchaSiteKey); ?>');
        
        // reCAPTCHA callback functions
        window.onRecaptchaLoad = function() {
            console.log('[reCAPTCHA Debug] reCAPTCHA API loaded successfully');
            console.log('[reCAPTCHA Debug] grecaptcha object:', grecaptcha);
        };
        
        window.onRecaptchaError = function() {
            console.error('[reCAPTCHA Debug] reCAPTCHA failed to load');
        };
        
        window.onRecaptchaExpired = function() {
            console.warn('[reCAPTCHA Debug] reCAPTCHA expired');
        };
    </script>
    <script src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit" async defer onerror="onRecaptchaError()"></script>
    <?php endif; ?>
    
    <!-- Styles and icons -->
    <!-- Base styles and variables -->
    <link rel="stylesheet" href="assets/css/base.css?v=<?php echo time(); ?>">
    
    <!-- Component-specific styles -->
    <link rel="stylesheet" href="assets/css/Header.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/nav.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/Hero.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/about.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/skills.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/projects.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/elevator-pitch.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/experience.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/contact.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/testimonial.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/footer.css?v=<?php echo time(); ?>">
    
    <!-- Google Analytics (GA4) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX', {
            'anonymize_ip': true,
            'cookie_flags': 'SameSite=None;Secure'
        });
    </script>
    
    <link rel="icon" href="/favicon.ico">
</head>

<body>
    <!-- Loading Screen -->
    <div class="loading-screen">
        <div class="loading-spinner"></div>
    </div>

    <!-- Animated background -->
    <div class="background-animation">
        <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
            <div class="shape shape-5"></div>
        </div>
    </div>

	<header role="banner">
        <!-- Skip to main content for accessibility -->
        <a href="#main-content" class="skip-link">Skip to main content</a>
        
		<nav class="nav" id="navbar" role="navigation" aria-label="Main navigation">
            <div class="nav__container">
                <div class="nav__brand">
                    <a href="#home" class="nav__logo-link" aria-label="Brahim El Houss - Home">
                        <div class="nav__logo"></div>
                    </a>
                    <span class="nav__title">BRAHIM EL HOUSS</span>
                </div>
                
                <ul class="nav__menu" id="nav-menu" role="menubar">
                    <li class="nav__item" role="none">
                        <a href="#home" class="nav__link" role="menuitem">
                            <i class="fas fa-home" aria-hidden="true"></i>
                            <span>Home</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="#about" class="nav__link" role="menuitem">
                            <i class="fas fa-user" aria-hidden="true"></i>
                            <span>About</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="about.php" class="nav__link" role="menuitem">
                            <i class="fas fa-file-alt" aria-hidden="true"></i>
                            <span>More About Me</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="#skills" class="nav__link" role="menuitem">
                            <i class="fas fa-cog" aria-hidden="true"></i>
                            <span>Skills</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="#portfolio" class="nav__link" role="menuitem">
                            <i class="fas fa-briefcase" aria-hidden="true"></i>
                            <span>Portfolio</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="#elevator-pitch" class="nav__link" role="menuitem">
                            <i class="fas fa-microphone" aria-hidden="true"></i>
                            <span>Elevator Pitch</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="#experience" class="nav__link" role="menuitem">
                            <i class="fas fa-graduation-cap" aria-hidden="true"></i>
                            <span>Experience</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="blog.php" class="nav__link" role="menuitem">
                            <i class="fas fa-blog" aria-hidden="true"></i>
                            <span>Blog</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="videos.php" class="nav__link" role="menuitem">
                            <i class="fas fa-video" aria-hidden="true"></i>
                            <span>Videos</span>
                        </a>
                    </li>
                    <li class="nav__item" role="none">
                        <a href="#contact" class="nav__link" role="menuitem">
                            <i class="fas fa-envelope" aria-hidden="true"></i>
                            <span>Contact</span>
                        </a>
                    </li>
                </ul>
                
                <div class="nav__actions">
                    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle light/dark theme" aria-pressed="false">
                        <i class="fas fa-moon" aria-hidden="true"></i>
                    </button>
                    <a href="https://github.com/EL-HOUSS-BRAHIM" class="cta-button" target="_blank" rel="noopener noreferrer" aria-label="Visit my GitHub profile">
                        <i class="fab fa-github" aria-hidden="true"></i>
                        <span>GitHub</span>
                    </a>
                    <button class="nav__toggle" id="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-menu">
                        <span class="nav__toggle-bar"></span>
                        <span class="nav__toggle-bar"></span>
                        <span class="nav__toggle-bar"></span>
                    </button>
                </div>
            </div>
        </nav>
    </header>

    <main id="main-content" role="main">
        <!-- Hero Section -->
        <section id="home" class="hero" aria-label="Introduction and welcome">
            <div class="hero__container">
                <div class="hero__content">
                    <div class="hero__text">
                        <div class="hero__title">
                            <span class="hero__greeting" aria-label="Greeting">Hello, I'm</span>
                            <h1 class="hero__name">Brahim El Houss</h1>
                            <span class="hero__role">Full Stack Software Engineer</span>
                        </div>
                        <p class="hero__description">
                            I craft innovative digital solutions with clean code and modern technologies. 
                            Passionate about building scalable applications that make a difference.
                        </p>
                        <div class="hero__stats" aria-label="Professional statistics">
                            <div class="stat">
                                <span class="stat__number" aria-label="Years of experience">3+</span>
                                <span class="stat__label">Years Experience</span>
                            </div>
                            <div class="stat">
                                <span class="stat__number" aria-label="Projects completed">15+</span>
                                <span class="stat__label">Projects Completed</span>
                            </div>
                            <div class="stat">
                                <span class="stat__number" aria-label="Client satisfaction rate">100%</span>
                                <span class="stat__label">Client Satisfaction</span>
                            </div>
                        </div>
                        <div class="hero__actions">
                            <a href="#portfolio" class="btn btn--primary" aria-label="View portfolio projects">
                                <i class="fas fa-rocket" aria-hidden="true"></i>
                                View My Work
                            </a>
                            <a href="#contact" class="btn btn--secondary" aria-label="Contact form">
                                <i class="fas fa-envelope" aria-hidden="true"></i>
                                Get In Touch
                            </a>
                            <a href="/assets/Brahim-ElHouss-Portfolio.pdf" class="btn btn--outline" download aria-label="Download Brahim El Houss resume PDF">
                                <i class="fas fa-download" aria-hidden="true"></i>
                                Download CV
                            </a>
                        </div>
                    </div>
                    <div class="hero__visual">
                        <div class="hero__image-container">
                            <div class="hero__image" role="img" aria-label="Profile picture of Brahim El Houss"></div>
                            <div class="hero__badge">
                                <i class="fas fa-code" aria-hidden="true"></i>
                                <span>Available for hire</span>
                            </div>
                        </div>
                        <div class="tech-stack-preview" aria-label="Technology stack preview">
                            <div class="tech-item" aria-label="JavaScript">
                                <i class="fab fa-js-square" aria-hidden="true"></i>
                            </div>
                            <div class="tech-item" aria-label="React">
                                <i class="fab fa-react" aria-hidden="true"></i>
                            </div>
                            <div class="tech-item" aria-label="Node.js">
                                <i class="fab fa-node-js" aria-hidden="true"></i>
                            </div>
                            <div class="tech-item" aria-label="Python">
                                <i class="fab fa-python" aria-hidden="true"></i>
                            </div>
                            <div class="tech-item" aria-label="Database">
                                <i class="fas fa-database" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="scroll-indicator" aria-label="Scroll down to explore more content">
                    <span>Scroll to explore</span>
                    <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </div>
            </div>
        </section>
        <!-- About Section -->
        <section id="about" class="about">
            <div class="container">
                <div class="section-header">
                    <span class="section-tag">Get to know me</span>
                    <h2 class="section-title">About Me</h2>
                    <p class="section-subtitle">
                        Passionate developer with a love for creating innovative solutions
                    </p>
                </div>
                
                <div class="about__content">
                    <div class="about__text">
                        <div class="about__intro">
                            <h3>Creative Problem Solver & Technology Enthusiast</h3>
                            <p>
                                With a deep passion for technology that began in my early years, I've evolved into a 
                                full-stack software engineer who thrives on tackling complex challenges and creating 
                                elegant, efficient solutions.
                            </p>
                        </div>
                        
                        <div class="about__details">
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <i class="fas fa-code"></i>
                                    <div>
                                        <h4>Clean Code Advocate</h4>
                                        <p>I believe in writing maintainable, scalable code that follows industry best practices.</p>
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-lightbulb"></i>
                                    <div>
                                        <h4>Innovation Driven</h4>
                                        <p>Always exploring new technologies and methodologies to deliver cutting-edge solutions.</p>
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-users"></i>
                                    <div>
                                        <h4>Team Collaboration</h4>
                                        <p>Experienced in agile development and working with cross-functional teams.</p>
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-graduation-cap"></i>
                                    <div>
                                        <h4>Continuous Learning</h4>
                                        <p>Committed to staying updated with the latest industry trends and technologies.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="about__interests">
                            <h4>When I'm not coding...</h4>
                            <div class="interests-list">
                                <span class="interest-tag">
                                    <i class="fas fa-book"></i>
                                    Reading Manga & Manhwa
                                </span>
                                <span class="interest-tag">
                                    <i class="fas fa-music"></i>
                                    Music
                                </span>
                                <span class="interest-tag">
                                    <i class="fas fa-plane"></i>
                                    Traveling
                                </span>
                                <span class="interest-tag">
                                    <i class="fas fa-mountain"></i>
                                    Adventure
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="about__visual">
                        <div class="about__image-container">
                            <div class="about__image"></div>
                            <div class="experience-badge">
                                <span class="badge-number">2+</span>
                                <span class="badge-text">Years of Experience</span>
                            </div>
                        </div>
                        
                        <div class="tech-philosophy">
                            <blockquote>
                                "Code is like humor. When you have to explain it, it's bad."
                                <cite>- Cory House</cite>
                            </blockquote>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Skills Section -->
        <section id="skills" class="skills">
            <div class="container">
                <div class="section-header">
                    <span class="section-tag">Technical Expertise</span>
                    <h2 class="section-title">Skills & Technologies</h2>
                    <p class="section-subtitle">
                        A comprehensive toolkit for building modern web applications
                    </p>
                </div>
                
                <div class="skills__content">
                    <div class="skills-category">
                        <div class="category-header">
                            <div class="category-icon">
                                <i class="fas fa-laptop-code"></i>
                            </div>
                            <h3>Frontend Development</h3>
                            <p>Creating engaging user experiences with modern frameworks and tools</p>
                        </div>
                        <div class="skills-grid">
                            <div class="skill-item" data-level="90">
                                <div class="skill-icon">
                                    <i class="fab fa-js-square"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>JavaScript / ES6+</h4>
                                    <p>Modern JavaScript, async/await, modules</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 90%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="85">
                                <div class="skill-icon">
                                    <i class="fab fa-react"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>React</h4>
                                    <p>Hooks, Context API, Component Architecture</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 85%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="95">
                                <div class="skill-icon">
                                    <i class="fab fa-html5"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>HTML5</h4>
                                    <p>Semantic markup, accessibility, SEO</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 95%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="90">
                                <div class="skill-icon">
                                    <i class="fab fa-css3-alt"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>CSS3 / SCSS</h4>
                                    <p>Flexbox, Grid, Animations, Responsive Design</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 90%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="80">
                                <div class="skill-icon">
                                    <i class="fab fa-bootstrap"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Bootstrap</h4>
                                    <p>Rapid prototyping, component library</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 80%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="75">
                                <div class="skill-icon">
                                    <i class="fab fa-figma"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Figma</h4>
                                    <p>UI/UX design, prototyping</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 75%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="skills-category">
                        <div class="category-header">
                            <div class="category-icon">
                                <i class="fas fa-server"></i>
                            </div>
                            <h3>Backend Development</h3>
                            <p>Building robust server-side applications and APIs</p>
                        </div>
                        <div class="skills-grid">
                            <div class="skill-item" data-level="85">
                                <div class="skill-icon">
                                    <i class="fab fa-node-js"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Node.js</h4>
                                    <p>Express.js, RESTful APIs, middleware</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 85%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="88">
                                <div class="skill-icon">
                                    <i class="fab fa-python"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Python</h4>
                                    <p>Flask, data structures, algorithms</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 88%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="75">
                                <div class="skill-icon">
                                    <i class="fab fa-php"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>PHP</h4>
                                    <p>Server-side scripting, web development</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 75%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="80">
                                <div class="skill-icon">
                                    <i class="fas fa-database"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>MongoDB</h4>
                                    <p>NoSQL, aggregation, indexing</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 80%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="78">
                                <div class="skill-icon">
                                    <i class="fas fa-database"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>PostgreSQL</h4>
                                    <p>Relational databases, complex queries</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 78%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="82">
                                <div class="skill-icon">
                                    <i class="fas fa-fire"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Firebase</h4>
                                    <p>Real-time database, authentication</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 82%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="skills-category">
                        <div class="category-header">
                            <div class="category-icon">
                                <i class="fas fa-tools"></i>
                            </div>
                            <h3>Tools & DevOps</h3>
                            <p>Development tools and deployment technologies</p>
                        </div>
                        <div class="skills-grid">
                            <div class="skill-item" data-level="90">
                                <div class="skill-icon">
                                    <i class="fab fa-git-alt"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Git</h4>
                                    <p>Version control, branching, collaboration</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 90%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="85">
                                <div class="skill-icon">
                                    <i class="fab fa-linux"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Linux</h4>
                                    <p>Command line, server administration</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 85%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="80">
                                <div class="skill-icon">
                                    <i class="fas fa-cloud"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Cloud Platforms</h4>
                                    <p>Heroku, deployment, hosting</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 80%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="88">
                                <div class="skill-icon">
                                    <i class="fas fa-code"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>VS Code</h4>
                                    <p>Advanced debugging, extensions</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 88%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="75">
                                <div class="skill-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>Analytics</h4>
                                    <p>Google Analytics, performance monitoring</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 75%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="skill-item" data-level="82">
                                <div class="skill-icon">
                                    <i class="fas fa-search"></i>
                                </div>
                                <div class="skill-info">
                                    <h4>SEO</h4>
                                    <p>Search optimization, performance</p>
                                    <div class="skill-progress">
                                        <div class="skill-bar" style="width: 82%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Portfolio Section -->
        <section id="portfolio" class="projects">
            <div class="container">
                <div class="section-header">
                    <span class="section-tag">My Portfolio</span>
                    <h2 class="section-title">Professional Portfolio</h2>
                    <p class="section-subtitle">
                        Showcasing my technical expertise and collaborative project experience
                    </p>
                </div>
                
                <div class="portfolio-content">
                    <!-- Portfolio Download Options -->
                    <div class="portfolio-options">
                        <h3>Complete Portfolio</h3>
                        <p>Download my comprehensive portfolio showcasing all projects and technical achievements</p>
                        <div class="download-options">
                            <a href="/assets/Brahim-ElHouss-Portfolio.pdf" class="btn btn--outline" download>
                                <i class="fas fa-download"></i>
                                Download Full Portfolio (PDF)
                            </a>
                            <a href="https://github.com/EL-HOUSS-BRAHIM" class="btn btn--outline" target="_blank" rel="noopener noreferrer">
                                <i class="fab fa-github"></i>
                                View GitHub Portfolio
                            </a>
                        </div>
                    </div>
                    
                    <!-- Additional Projects Preview -->
                    <div class="additional-projects">
                        <h3>Other Notable Projects</h3>
                        <div class="projects-grid">
                            <div class="project-card">
                                <div class="project-image">
                                    <img src="assets/images/log_parsing.webp" alt="Log Parsing Project" loading="lazy">
                                </div>
                                <div class="project-content">
                                    <h4>Real-time Log Parser</h4>
                                    <p>Python-based system for processing log data in real-time</p>
                                    <div class="project-tech">
                                        <span class="tech-tag">Python</span>
                                        <span class="tech-tag">Regex</span>
                                        <span class="tech-tag">Data Processing</span>
                                    </div>
                                    <a href="https://github.com/EL-HOUSS-BRAHIM/alx-interview/tree/main/0x03-log_parsing" class="project-link" target="_blank" rel="noopener noreferrer">
                                        View Project
                                    </a>
                                </div>
                            </div>
                            
                            <div class="project-card">
                                <div class="project-image">
                                    <img src="assets/images/simple shell.webp" alt="Simple Shell Project" loading="lazy">
                                </div>
                                <div class="project-content">
                                    <h4>Custom Shell Implementation</h4>
                                    <p>Unix shell implementation in C with process management</p>
                                    <div class="project-tech">
                                        <span class="tech-tag">C</span>
                                        <span class="tech-tag">Unix Systems</span>
                                        <span class="tech-tag">System Calls</span>
                                    </div>
                                    <a href="https://github.com/EL-HOUSS-BRAHIM/simple_shell" class="project-link" target="_blank" rel="noopener noreferrer">
                                        View Project
                                    </a>
                                </div>
                            </div>
                            
                            <div class="project-card">
                                <div class="project-image">
                                    <img src="assets/images/Monty Interpreter.webp" alt="Monty Interpreter Project" loading="lazy">
                                </div>
                                <div class="project-content">
                                    <h4>Monty ByteCode Interpreter</h4>
                                    <p>Stack-based interpreter for Monty ByteCode files</p>
                                    <div class="project-tech">
                                        <span class="tech-tag">C</span>
                                        <span class="tech-tag">Data Structures</span>
                                        <span class="tech-tag">Interpreter Design</span>
                                    </div>
                                    <a href="https://github.com/EL-HOUSS-BRAHIM/monty" class="project-link" target="_blank" rel="noopener noreferrer">
                                        View Project
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Elevator Pitch Section -->
        <section id="elevator-pitch" class="elevator-pitch">
            <div class="container">
                <div class="section-header">
                    <span class="section-tag">Professional Introduction</span>
                    <h2 class="section-title">Elevator Pitch</h2>
                    <p class="section-subtitle">
                        A concise introduction to my professional background and career aspirations
                    </p>
                </div>
                
                <div class="elevator-pitch-content">
                    <div class="video-container">
                        <div class="video-wrapper">
                            <video 
                                id="elevator-pitch-video" 
                                class="elevator-video"
                                controls 
                                preload="metadata"
                                poster="assets/images/elevator-pitch-poster.jpg"
                                controlslist="nodownload"
                                disablepictureinpicture
                                width="100%"
                                height="auto">
                                <source src="assets/media/videos/elevator-pitch.mp4" type="video/mp4">
                                <source src="assets/media/videos/elevator-pitch.webm" type="video/webm">
                                <p class="video-fallback">
                                    Your browser doesn't support video playback. 
                                    <a href="mailto:brahim.elhouss@example.com">Contact me</a> for alternative access to my elevator pitch.
                                </p>
                            </video>
                            
                            <div class="video-overlay" id="video-overlay">
                                <div class="play-button" id="play-button">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="video-info">
                            <div class="video-header">
                                <h3>
                                    <i class="fas fa-microphone-alt"></i>
                                    Professional Elevator Pitch
                                </h3>
                                <span class="video-duration">2:30</span>
                            </div>
                            <p class="video-description">
                                Get to know me as a Full Stack Software Engineer - my background, expertise, and passion for creating innovative solutions.
                            </p>
                        </div>
                    </div>
                    
                    <div class="pitch-highlights">
                        <div class="highlight-item">
                            <div class="highlight-icon">
                                <i class="fas fa-code"></i>
                            </div>
                            <h4>Technical Expertise</h4>
                            <p>Python, JavaScript, Node.js, React, MongoDB</p>
                        </div>
                        
                        <div class="highlight-item">
                            <div class="highlight-icon">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <h4>ALX Graduate</h4>
                            <p>Software Engineering Program</p>
                        </div>
                        
                        <div class="highlight-item">
                            <div class="highlight-icon">
                                <i class="fas fa-rocket"></i>
                            </div>
                            <h4>Innovation Focus</h4>
                            <p>Building scalable, modern web solutions</p>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Experience Section -->
        <section id="experience" class="experience">
            <div class="container">
                <div class="section-header">
                    <span class="section-tag">Career Journey</span>
                    <h2 class="section-title">Experience & Education</h2>
                    <p class="section-subtitle">
                        My professional development and educational background
                    </p>
                </div>
                
                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>Novate Ltd</h3>
                                <span class="timeline-date">July 2025 - October 2025</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Full Stack Software Engineer & DevOps</h4>
                                <p>
                                    Started as a Frontend Developer and evolved into a Full Stack Software Engineer role, managing end-to-end development. 
                                    Responsible for frontend, backend, database architecture, cloud infrastructure (GCP), and DevOps practices. 
                                    Leading full development lifecycle from design to deployment and maintenance.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">Frontend Development</span>
                                    <span class="skill-badge">Backend Development</span>
                                    <span class="skill-badge">Database Management</span>
                                    <span class="skill-badge">GCP</span>
                                    <span class="skill-badge">DevOps</span>
                                    <span class="skill-badge">CI/CD</span>
                                    <span class="skill-badge">Cloud Infrastructure</span>
                                    <span class="skill-badge">Full Stack Architecture</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>Google Foundations of Cybersecurity</h3>
                                <span class="timeline-date">November 2025</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Cybersecurity Fundamentals</h4>
                                <p>
                                    Comprehensive introduction to cybersecurity concepts, security frameworks, and best practices. 
                                    Learned about threat detection, risk management, and security protocols.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">Cybersecurity</span>
                                    <span class="skill-badge">Security Frameworks</span>
                                    <span class="skill-badge">Threat Detection</span>
                                    <span class="skill-badge">Risk Management</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>Backend Professional Web Development</h3>
                                <span class="timeline-date">August 2025</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Advanced Backend Development</h4>
                                <p>
                                    Professional-level backend development training covering server-side programming, 
                                    database design, API development, and scalable application architecture.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">Backend Development</span>
                                    <span class="skill-badge">Server-Side Programming</span>
                                    <span class="skill-badge">API Design</span>
                                    <span class="skill-badge">Database Architecture</span>
                                    <span class="skill-badge">Scalability</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>Frontend Professional Web Development</h3>
                                <span class="timeline-date">August 2025</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Advanced Frontend Development</h4>
                                <p>
                                    Professional frontend development training covering modern JavaScript frameworks, 
                                    responsive design, UI/UX principles, and performance optimization.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">Frontend Development</span>
                                    <span class="skill-badge">React/Vue</span>
                                    <span class="skill-badge">Responsive Design</span>
                                    <span class="skill-badge">UI/UX</span>
                                    <span class="skill-badge">Performance Optimization</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>AI Starter Kit</h3>
                                <span class="timeline-date">June 2025</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Artificial Intelligence Fundamentals</h4>
                                <p>
                                    Introduction to artificial intelligence concepts, machine learning basics, 
                                    and practical applications of AI in modern software development.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">Artificial Intelligence</span>
                                    <span class="skill-badge">ML Basics</span>
                                    <span class="skill-badge">AI Applications</span>
                                    <span class="skill-badge">Neural Networks</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>DevOps Bootcamp</h3>
                                <span class="timeline-date">January 2025</span>
                            </div>
                            <div class="timeline-body">
                                <h4>DevOps Engineering & Practices</h4>
                                <p>
                                    Intensive bootcamp covering DevOps methodologies, CI/CD pipelines, 
                                    containerization, cloud infrastructure, and automated deployment strategies.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">DevOps</span>
                                    <span class="skill-badge">CI/CD</span>
                                    <span class="skill-badge">Docker</span>
                                    <span class="skill-badge">Kubernetes</span>
                                    <span class="skill-badge">Cloud Infrastructure</span>
                                    <span class="skill-badge">Automation</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>Machine Learning</h3>
                                <span class="timeline-date">May 2024</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Machine Learning Fundamentals</h4>
                                <p>
                                    Comprehensive training in machine learning algorithms, data analysis, 
                                    model training, and practical implementation of ML solutions.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">Machine Learning</span>
                                    <span class="skill-badge">Data Analysis</span>
                                    <span class="skill-badge">Model Training</span>
                                    <span class="skill-badge">Python/Scikit-learn</span>
                                    <span class="skill-badge">Algorithms</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>ALX Software Engineering</h3>
                                <span class="timeline-date">2023 - 2024</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Certified Full Stack Software Engineer (Backend Specialization)</h4>
                                <p>
                                    Intensive 12-month covering full-stack development with backend specialization. 
                                    Gained expertise in modern software engineering practices, data structures, algorithms, and web technologies.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">C Programming</span>
                                    <span class="skill-badge">Python</span>
                                    <span class="skill-badge">JavaScript/Node.js</span>
                                    <span class="skill-badge">SQL/MySQL</span>
                                    <span class="skill-badge">Linux/DevOps</span>
                                    <span class="skill-badge">Web Servers</span>
                                    <span class="skill-badge">APIs</span>
                                    <span class="skill-badge">TypeScript</span>
                                    <span class="skill-badge">NoSQL</span>
                                    <span class="skill-badge">Redis</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-university"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>Hassan II University, Casablanca</h3>
                                <span class="timeline-date">2022 - Present</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Higher Education in Physics Sciences</h4>
                                <p>
                                    Advanced studies in physics and related mathematical concepts. 
                                    Developed strong analytical and problem-solving skills applicable to software engineering.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">Mathematical Analysis</span>
                                    <span class="skill-badge">Physics</span>
                                    <span class="skill-badge">Scientific Computing</span>
                                    <span class="skill-badge">Research Methods</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h3>Lycée Tayeb Lkhamal Dar Bouazza</h3>
                                <span class="timeline-date">Graduated 2022</span>
                            </div>
                            <div class="timeline-body">
                                <h4>Bachelor's Degree in Physics</h4>
                                <p>
                                    Strong foundation in physics, mathematics, and scientific methodology. 
                                    Developed critical thinking and analytical skills.
                                </p>
                                <div class="timeline-skills">
                                    <span class="skill-badge">Physics</span>
                                    <span class="skill-badge">Mathematics</span>
                                    <span class="skill-badge">Scientific Method</span>
                                    <span class="skill-badge">Problem Solving</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="certifications">
                    <h3>Certifications & Achievements</h3>
                    <div class="cert-grid">
                        <div class="cert-item">
                            <i class="fas fa-award"></i>
                            <h4>ALX Certified Full Stack Engineer</h4>
                            <p>Backend Specialization</p>
                        </div>
                        <div class="cert-item">
                            <i class="fas fa-code"></i>
                            <h4>Advanced C Programming</h4>
                            <p>Data Structures & Algorithms</p>
                        </div>
                        <div class="cert-item">
                            <i class="fas fa-server"></i>
                            <h4>DevOps & Linux Administration</h4>
                            <p>System Administration</p>
                        </div>
                        <div class="cert-item">
                            <i class="fas fa-database"></i>
                            <h4>Database Management</h4>
                            <p>SQL & NoSQL Databases</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="contact">
            <div class="container">
                <div class="section-header">
                    <span class="section-tag">Get In Touch</span>
                    <h2 class="section-title">Let's Work Together</h2>
                    <p class="section-subtitle">
                        Have a project in mind? Let's discuss how I can help bring your ideas to life
                    </p>
                </div>
                
                <div class="contact-content">
                    <div class="contact-info">
                        <div class="contact-item">
                            <div class="contact-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="contact-details">
                                <h4>Email</h4>
                                <p>brahim-elhouss@gmail.com</p>
                                <a href="mailto:brahim-elhouss@gmail.com">Send a message</a>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <div class="contact-icon">
                                <i class="fab fa-linkedin"></i>
                            </div>
                            <div class="contact-details">
                                <h4>LinkedIn</h4>
                                <p>Let's connect professionally</p>
                                <a href="https://www.linkedin.com/in/brahim-el-houss" target="_blank" rel="noopener noreferrer">View Profile</a>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <div class="contact-icon">
                                <i class="fab fa-github"></i>
                            </div>
                            <div class="contact-details">
                                <h4>GitHub</h4>
                                <p>Check out my code</p>
                                <a href="https://github.com/EL-HOUSS-BRAHIM" target="_blank" rel="noopener noreferrer">View Repositories</a>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <div class="contact-icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <div class="contact-details">
                                <h4>Location</h4>
                                <p>Casablanca, Morocco</p>
                                <span>Open to remote work</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="contact-form-container">
                        <form id="contactForm" class="contact-form" action="src/api/contact.php" method="POST">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="name">Full Name *</label>
                                    <input type="text" id="name" name="name" required>
                                    <span class="form-underline"></span>
                                </div>
                                <div class="form-group">
                                    <label for="email">Email Address *</label>
                                    <input type="email" id="email" name="email" required>
                                    <span class="form-underline"></span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="subject">Subject</label>
                                <input type="text" id="subject" name="subject">
                                <span class="form-underline"></span>
                            </div>
                            
                            <div class="form-group">
                                <label for="message">Message *</label>
                                <textarea id="message" name="message" required rows="5"></textarea>
                                <span class="form-underline"></span>
                            </div>
                            
                            <!-- reCAPTCHA Widget -->
                            <?php if ($recaptchaEnabled): ?>
                            <div class="form-group">
                                <div class="g-recaptcha" data-sitekey="<?php echo htmlspecialchars($recaptchaSiteKey); ?>"></div>
                                <div class="recaptcha-error" style="display: none; color: var(--color-error); font-size: var(--font-size-sm); margin-top: 0.5rem;">
                                    Please complete the CAPTCHA verification.
                                </div>
                            </div>
                            <?php endif; ?>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn--primary">
                                    <i class="fas fa-paper-plane"></i>
                                    <span>Send Message</span>
                                </button>
                            </div>
                        </form>
                        
                        <div id="responseMessage" class="response-message" style="display:none;"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Testimonial Section -->
        <section id="testimonials" class="testimonials">
            <h2>Testimonials</h2>
            <div class="testimonial-slider" aria-live="polite">
                <!-- Testimonials will be dynamically inserted here -->
            </div>
            <button id="prevTestimonial" aria-label="Previous testimonial">&lt;</button>
            <button id="nextTestimonial" aria-label="Next testimonial">&gt;</button>
            <button id="addTestimonialBtn">Add Your Testimonial</button>

            <div id="testimonialFormContainer" class="hidden">
                <form id="testimonialForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="testimonialName">Name:</label>
                        <input type="text" id="testimonialName" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="testimonialImage">Profile Image:</label>
                        <input type="file" id="testimonialImage" name="image" accept="image/*" required>
                    </div>
                    <div class="form-group">
                        <label for="testimonialRating">Rating (1-5 stars):</label>
                        <input type="number" id="testimonialRating" name="rating" min="1" max="5" required>
                    </div>
                    <div class="form-group">
                        <label for="testimonialText">Your Testimonial:</label>
                        <textarea id="testimonialText" name="testimonial" required></textarea>
                    </div>
                    
                    <!-- reCAPTCHA Widget for Testimonials -->
                    <?php if ($recaptchaEnabled): ?>
                    <div class="form-group">
                        <div class="g-recaptcha" data-sitekey="<?php echo htmlspecialchars($recaptchaSiteKey); ?>"></div>
                        <div class="recaptcha-error" style="display: none; color: var(--color-error); font-size: var(--font-size-sm); margin-top: 0.5rem;">
                            Please complete the CAPTCHA verification.
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <button type="submit">Submit Testimonial</button>
                </form>
            </div>
        </section>

    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <div class="footer-logo">
                        <i class="fas fa-code"></i>
                        <span>Brahim El Houss</span>
                    </div>
                    <p class="footer-tagline">
                        Crafting digital experiences with passion and precision
                    </p>
                </div>
                
                <div class="footer-links">
                    <div class="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="#about">About</a></li>
                            <li><a href="about.php">More About Me</a></li>
                            <li><a href="#skills">Skills</a></li>
                            <li><a href="#portfolio">Portfolio</a></li>
                            <li><a href="#elevator-pitch">Elevator Pitch</a></li>
                            <li><a href="#experience">Experience</a></li>
                            <li><a href="#testimonials">Testimonials</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-section">
                        <h4>Connect</h4>
                        <ul>
                            <li><a href="#contact">Contact Me</a></li>
                            <li><a href="blog.php">Blog</a></li>
                            <li><a href="videos.php">Videos</a></li>
                            <li><a href="https://linkedin.com/in/brahim-el-houss" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                            <li><a href="https://github.com/EL-HOUSS-BRAHIM" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                            <li><a href="https://twitter.com/Brahim_EL_houss" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-section">
                        <h4>Services</h4>
                        <ul>
                            <li><span>Web Development</span></li>
                            <li><span>Backend Development</span></li>
                            <li><span>API Development</span></li>
                            <li><span>Database Design</span></li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer-social">
                    <h4>Follow Me</h4>
                    <div class="social-links">
                        <a href="https://www.linkedin.com/in/brahim-el-houss" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                            <i class="fab fa-linkedin"></i>
                        </a>
                        <a href="https://twitter.com/Brahim_EL_houss" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="https://www.instagram.com/brahimel205_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="https://www.facebook.com/brahim.el.102977" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <i class="fab fa-facebook"></i>
                        </a>
                        <a href="https://t.me/BrahimElHouss" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                            <i class="fab fa-telegram"></i>
                        </a>
                        <a href="https://github.com/EL-HOUSS-BRAHIM" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                            <i class="fab fa-github"></i>
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <div class="footer-copyright">
                    <p>&copy; 2025 Brahim El Houss. All rights reserved.</p>
                </div>
                <div class="footer-legal">
                    <a href="/">Home</a>
                    <a href="about.php">About</a>
                    <a href="blog.php">Blog</a>
                    <a href="videos.php">Videos</a>
                    <a href="/sitemap.xml">Sitemap</a>
                    <a href="/robots.txt">Robots</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Back to top button -->
    <button class="back-to-top" id="backToTop" aria-label="Back to top">
        <i class="fas fa-chevron-up"></i>
    </button>
    
    <!-- Minified JavaScript modules -->
    <script src="assets/js/minified/utils.min.js"></script>
    <script src="assets/js/minified/theme.min.js"></script>
    <script src="assets/js/minified/navigation.min.js"></script>
    <script src="assets/js/minified/mobile.min.js"></script>
    <script src="assets/js/minified/animations.min.js"></script>
    <script src="assets/js/minified/hero.min.js"></script>
    <script src="assets/js/minified/viewport.min.js"></script>
    <script src="assets/js/minified/projects.min.js"></script>
    <script src="assets/js/minified/elevator-pitch.min.js"></script>
    <script src="assets/js/minified/contact.min.js"></script>
    <script src="assets/js/minified/testimonials.min.js"></script>
    <script src="assets/js/minified/app.min.js"></script>

    <!-- reCAPTCHA Debug Script -->
    <?php if ($recaptchaEnabled): ?>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[reCAPTCHA Debug] DOM loaded, checking reCAPTCHA status...');
            
            function checkRecaptcha() {
                if (typeof grecaptcha !== 'undefined') {
                    console.log('[reCAPTCHA Debug] grecaptcha is available');
                    
                    // Try to render reCAPTCHA manually for debugging
                    const recaptchaElements = document.querySelectorAll('.g-recaptcha');
                    console.log('[reCAPTCHA Debug] Found', recaptchaElements.length, 'reCAPTCHA elements');
                    
                    recaptchaElements.forEach((element, index) => {
                        const sitekey = element.getAttribute('data-sitekey');
                        console.log('[reCAPTCHA Debug] Element', index, 'sitekey:', sitekey);
                        
                        if (!element.innerHTML.trim()) {
                            console.log('[reCAPTCHA Debug] Rendering element', index);
                            try {
                                const widgetId = grecaptcha.render(element, {
                                    'sitekey': sitekey,
                                    'callback': function(response) {
                                        console.log('[reCAPTCHA Debug] Callback success for element', index, 'response:', response);
                                    },
                                    'expired-callback': function() {
                                        console.log('[reCAPTCHA Debug] Expired callback for element', index);
                                    },
                                    'error-callback': function() {
                                        console.error('[reCAPTCHA Debug] Error callback for element', index);
                                    }
                                });
                                console.log('[reCAPTCHA Debug] Widget ID for element', index, ':', widgetId);
                            } catch (error) {
                                console.error('[reCAPTCHA Debug] Error rendering element', index, ':', error);
                            }
                        } else {
                            console.log('[reCAPTCHA Debug] Element', index, 'already has content');
                        }
                    });
                } else {
                    console.log('[reCAPTCHA Debug] grecaptcha not available yet, retrying in 1 second...');
                    setTimeout(checkRecaptcha, 1000);
                }
            }
            
            // Start checking
            checkRecaptcha();
        });
    </script>
    <?php endif; ?>

</body>

</html>
