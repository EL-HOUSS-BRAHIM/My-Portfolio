<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <!-- Basic Meta Tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    
    <!-- SEO Meta Tags -->
    <title>Blog - Brahim Elhouss | Full Stack Developer Insights & Tutorials</title>
    <meta name="description" content="Read technical articles and insights by Brahim Elhouss, Full Stack Software Engineer from Morocco. Learn about web development, software engineering, and my journey in tech.">
    <meta name="keywords" content="Brahim Elhouss blog, Brahim El Houss articles, web development tutorials, software engineering, ALX graduate blog, Morocco tech blog">
    <meta name="author" content="Brahim El Houss">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Blog - Brahim Elhouss | Full Stack Developer">
    <meta property="og:description" content="Technical articles and insights by Brahim Elhouss, Full Stack Software Engineer">
    <meta property="og:url" content="https://brahim-elhouss.me/blog.php">
    <meta property="og:site_name" content="Brahim Elhouss Portfolio">
    <meta property="og:image" content="https://brahim-elhouss.me/assets/images/profile-img.jpg">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@brahimelhouss">
    <meta name="twitter:creator" content="@brahimelhouss">
    <meta name="twitter:title" content="Blog - Brahim Elhouss">
    <meta name="twitter:description" content="Technical articles and insights by Brahim Elhouss">
    <meta name="twitter:image" content="https://brahim-elhouss.me/assets/images/profile-img.jpg">
    
    <!-- Favicon -->
    <link rel="icon" href="/icons/favicon.ico" sizes="32x32">
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://brahim-elhouss.me/blog.php">
    
    <!-- Sitemap -->
    <link rel="sitemap" type="application/xml" title="Sitemap" href="https://brahim-elhouss.me/sitemap.xml">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/assets/css/main.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Brahim Elhouss Blog",
        "description": "Technical blog by Brahim Elhouss, Full Stack Software Engineer",
        "url": "https://brahim-elhouss.me/blog.php",
        "author": {
            "@type": "Person",
            "name": "Brahim El Houss",
            "jobTitle": "Full Stack Software Engineer",
            "url": "https://brahim-elhouss.me",
            "sameAs": [
                "https://github.com/EL-HOUSS-BRAHIM",
                "https://linkedin.com/in/brahim-elhouss"
            ]
        },
        "publisher": {
            "@type": "Person",
            "name": "Brahim El Houss"
        }
    }
    </script>
    
    <style>
        body {
            padding-top: 80px;
        }
        
        .blog-hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8rem 0 4rem;
            text-align: center;
        }
        
        .blog-hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .blog-hero p {
            font-size: 1.2rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .blog-container {
            max-width: 1200px;
            margin: 4rem auto;
            padding: 0 2rem;
        }
        
        .blog-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        
        .blog-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
        }
        
        .blog-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        
        .blog-card-image {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
            color: white;
        }
        
        .blog-card-content {
            padding: 1.5rem;
        }
        
        .blog-card-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
            color: #666;
            margin-bottom: 1rem;
        }
        
        .blog-card-meta span {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .blog-card-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #1a202c;
        }
        
        .blog-card-excerpt {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        
        .blog-card-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .blog-tag {
            background: #e6efff;
            color: #667eea;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
        }
        
        .read-more-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #667eea;
            font-weight: 600;
            text-decoration: none;
            transition: gap 0.3s ease;
        }
        
        .read-more-btn:hover {
            gap: 1rem;
        }
        
        .coming-soon {
            text-align: center;
            padding: 3rem;
            background: #f7fafc;
            border-radius: 12px;
            margin-top: 2rem;
        }
        
        .coming-soon h3 {
            font-size: 1.5rem;
            color: #2d3748;
            margin-bottom: 1rem;
        }
        
        .coming-soon p {
            color: #718096;
        }
        
        @media (max-width: 768px) {
            .blog-hero h1 {
                font-size: 2rem;
            }
            
            .blog-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>
    <!-- Navigation -->
    <nav style="position: fixed; top: 0; left: 0; right: 0; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000; padding: 1rem 0;">
        <div style="max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center;">
            <a href="/" style="font-size: 1.5rem; font-weight: 700; color: #667eea; text-decoration: none;">BRAHIM ELHOUSS</a>
            <div style="display: flex; gap: 2rem;">
                <a href="/" style="color: #2d3748; text-decoration: none; font-weight: 500;">Home</a>
                <a href="/blog.php" style="color: #667eea; text-decoration: none; font-weight: 600;">Blog</a>
                <a href="/videos.php" style="color: #2d3748; text-decoration: none; font-weight: 500;">Videos</a>
                <a href="/#contact" style="color: #2d3748; text-decoration: none; font-weight: 500;">Contact</a>
            </div>
        </div>
    </nav>
    
    <!-- Blog Hero -->
    <section class="blog-hero">
        <div class="container">
            <h1>Blog by Brahim Elhouss</h1>
            <p>Technical insights, tutorials, and my journey as a Full Stack Software Engineer</p>
        </div>
    </section>
    
    <!-- Blog Content -->
    <div class="blog-container">
        <div class="blog-grid">
            <!-- Blog Post 1 -->
            <article class="blog-card" onclick="window.location.href='blog/my-journey-from-physics-to-code.php'">
                <div class="blog-card-image">
                    <i class="fas fa-rocket"></i>
                </div>
                <div class="blog-card-content">
                    <div class="blog-card-meta">
                        <span><i class="far fa-calendar"></i> November 2024</span>
                        <span><i class="far fa-clock"></i> 5 min read</span>
                    </div>
                    <h2 class="blog-card-title">Hello, I'm Brahim Elhouss: My Journey from Physics to Code</h2>
                    <p class="blog-card-excerpt">
                        How I transitioned from studying physics to becoming a Full Stack Software Engineer through ALX. My story, challenges, and the lessons I learned along the way.
                    </p>
                    <div class="blog-card-tags">
                        <span class="blog-tag">Career</span>
                        <span class="blog-tag">Personal Story</span>
                        <span class="blog-tag">ALX</span>
                    </div>
                    <a href="blog/my-journey-from-physics-to-code.php" class="read-more-btn">
                        Read More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
            
            <!-- Blog Post 2 - Placeholder -->
            <article class="blog-card" onclick="window.location.href='blog/day-in-life-moroccan-developer.php'">
                <div class="blog-card-image">
                    <i class="fas fa-laptop-code"></i>
                </div>
                <div class="blog-card-content">
                    <div class="blog-card-meta">
                        <span><i class="far fa-calendar"></i> Coming Soon</span>
                        <span><i class="far fa-clock"></i> 6 min read</span>
                    </div>
                    <h2 class="blog-card-title">A Day in the Life of a Moroccan Developer</h2>
                    <p class="blog-card-excerpt">
                        Join me for a typical day building web applications in Casablanca, Morocco. From morning coffee to code commits and everything in between.
                    </p>
                    <div class="blog-card-tags">
                        <span class="blog-tag">Daily Life</span>
                        <span class="blog-tag">Morocco</span>
                        <span class="blog-tag">Work Culture</span>
                    </div>
                    <a href="blog/day-in-life-moroccan-developer.php" class="read-more-btn">
                        Coming Soon <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
            
            <!-- Blog Post 3 - Placeholder -->
            <article class="blog-card" onclick="window.location.href='blog/portfolio-deep-dive.php'">
                <div class="blog-card-image">
                    <i class="fas fa-folder-open"></i>
                </div>
                <div class="blog-card-content">
                    <div class="blog-card-meta">
                        <span><i class="far fa-calendar"></i> Coming Soon</span>
                        <span><i class="far fa-clock"></i> 8 min read</span>
                    </div>
                    <h2 class="blog-card-title">Projects by Brahim Elhouss: A Portfolio Deep Dive</h2>
                    <p class="blog-card-excerpt">
                        An in-depth look at my key projects, the technologies I used, challenges I faced, and the solutions I implemented. From concept to deployment.
                    </p>
                    <div class="blog-card-tags">
                        <span class="blog-tag">Projects</span>
                        <span class="blog-tag">Technical</span>
                        <span class="blog-tag">Case Study</span>
                    </div>
                    <a href="blog/portfolio-deep-dive.php" class="read-more-btn">
                        Coming Soon <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
            
            <!-- Blog Post 4 - Placeholder -->
            <article class="blog-card">
                <div class="blog-card-image">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="blog-card-content">
                    <div class="blog-card-meta">
                        <span><i class="far fa-calendar"></i> Coming Soon</span>
                        <span><i class="far fa-clock"></i> 7 min read</span>
                    </div>
                    <h2 class="blog-card-title">How I Built My Developer Career with ALX</h2>
                    <p class="blog-card-excerpt">
                        Practical advice and lessons learned from completing the ALX Software Engineering program. What worked, what didn't, and how you can succeed too.
                    </p>
                    <div class="blog-card-tags">
                        <span class="blog-tag">Education</span>
                        <span class="blog-tag">Career Advice</span>
                        <span class="blog-tag">ALX</span>
                    </div>
                    <span class="read-more-btn" style="opacity: 0.5; cursor: not-allowed;">
                        Coming Soon <i class="fas fa-arrow-right"></i>
                    </span>
                </div>
            </article>
        </div>
        
        <!-- Coming Soon Section -->
        <div class="coming-soon">
            <h3>More Articles Coming Soon!</h3>
            <p>I'm actively writing new content about web development, software engineering, and tech in Morocco.</p>
            <p>Follow me on <a href="https://linkedin.com/in/brahim-elhouss" target="_blank" style="color: #667eea;">LinkedIn</a> and <a href="https://twitter.com/brahimelhouss" target="_blank" style="color: #667eea;">Twitter</a> to get notified when new posts are published.</p>
        </div>
    </div>
    
    <!-- Footer will be added here -->
    
    <script src="/assets/js/main.js"></script>
</body>
</html>
