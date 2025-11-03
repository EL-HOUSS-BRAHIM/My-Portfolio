<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <!-- Basic Meta Tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    
    <!-- SEO Meta Tags -->
    <title>Videos - Brahim Elhouss | Full Stack Developer Video Content</title>
    <meta name="description" content="Watch video content by Brahim Elhouss. Portfolio walkthroughs, coding tutorials, and insights from a Full Stack Software Engineer in Morocco.">
    <meta name="keywords" content="Brahim Elhouss videos, Brahim El Houss YouTube, coding tutorials, portfolio walkthrough, developer content">
    <meta name="author" content="Brahim El Houss">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Videos - Brahim Elhouss">
    <meta property="og:description" content="Video content by Brahim Elhouss, Full Stack Software Engineer">
    <meta property="og:url" content="https://brahim-elhouss.me/videos.php">
    <meta property="og:image" content="https://brahim-elhouss.me/assets/images/profile-img.jpg">
    
    <!-- Favicon -->
    <link rel="icon" href="/icons/favicon.ico" sizes="32x32">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://brahim-elhouss.me/videos.php">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/assets/css/main.css">
    
    <style>
        body {
            padding-top: 80px;
        }
        
        .video-hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8rem 0 4rem;
            text-align: center;
        }
        
        .video-hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .video-hero p {
            font-size: 1.2rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .video-container {
            max-width: 1200px;
            margin: 4rem auto;
            padding: 0 2rem;
        }
        
        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        
        .video-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .video-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        
        .video-thumbnail {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .video-thumbnail-content {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: white;
        }
        
        .play-icon {
            font-size: 4rem;
            opacity: 0.9;
            margin-bottom: 1rem;
        }
        
        .video-card-content {
            padding: 1.5rem;
        }
        
        .video-card-title {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #1a202c;
        }
        
        .video-card-description {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        
        .video-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
            color: #666;
        }
        
        .coming-soon-banner {
            background: #fff3cd;
            color: #856404;
            padding: 0.5rem 1rem;
            text-align: center;
            font-weight: 600;
            border-radius: 4px;
            margin-bottom: 1rem;
        }
        
        .cta-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem;
            border-radius: 12px;
            text-align: center;
            margin: 3rem 0;
        }
        
        .cta-section h2 {
            margin-bottom: 1rem;
            font-size: 2rem;
        }
        
        .cta-section p {
            margin-bottom: 2rem;
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .subscribe-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: white;
            color: #667eea;
            padding: 1rem 2rem;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.3s ease;
        }
        
        .subscribe-btn:hover {
            transform: scale(1.05);
        }
        
        @media (max-width: 768px) {
            .video-hero h1 {
                font-size: 2rem;
            }
            
            .video-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>
    <!-- Video Hero -->
    <section class="video-hero">
        <div class="container">
            <h1>Video Content by Brahim Elhouss</h1>
            <p>Portfolio walkthroughs, coding tutorials, and tech insights from a Full Stack Developer</p>
        </div>
    </section>
    
    <!-- Video Content -->
    <div class="video-container">
        <!-- Coming Soon Banner -->
        <div class="coming-soon-banner">
            <i class="fas fa-video"></i> Video content coming soon! YouTube channel launching shortly.
        </div>
        
        <div class="video-grid">
            <!-- Video 1: Introduction -->
            <article class="video-card">
                <div class="video-thumbnail">
                    <div class="video-thumbnail-content">
                        <i class="fas fa-play-circle play-icon"></i>
                        <span>Coming Soon</span>
                    </div>
                </div>
                <div class="video-card-content">
                    <h2 class="video-card-title">Introduction to Brahim Elhouss</h2>
                    <p class="video-card-description">
                        Meet Brahim Elhouss! A quick introduction to who I am, my background in physics and software engineering, and what drives me as a developer.
                    </p>
                    <div class="video-meta">
                        <span><i class="far fa-clock"></i> 3 min</span>
                        <span><i class="fas fa-tag"></i> Introduction</span>
                    </div>
                </div>
            </article>
            
            <!-- Video 2: Portfolio Walkthrough -->
            <article class="video-card">
                <div class="video-thumbnail">
                    <div class="video-thumbnail-content">
                        <i class="fas fa-play-circle play-icon"></i>
                        <span>Coming Soon</span>
                    </div>
                </div>
                <div class="video-card-content">
                    <h2 class="video-card-title">Portfolio Website Walkthrough</h2>
                    <p class="video-card-description">
                        A detailed tour of brahim-elhouss.me - the technologies used, design decisions, and features that make this portfolio stand out.
                    </p>
                    <div class="video-meta">
                        <span><i class="far fa-clock"></i> 8 min</span>
                        <span><i class="fas fa-tag"></i> Portfolio</span>
                    </div>
                </div>
            </article>
            
            <!-- Video 3: Project Deep Dive -->
            <article class="video-card">
                <div class="video-thumbnail">
                    <div class="video-thumbnail-content">
                        <i class="fas fa-play-circle play-icon"></i>
                        <span>Coming Soon</span>
                    </div>
                </div>
                <div class="video-card-content">
                    <h2 class="video-card-title">Building a Full Stack Application</h2>
                    <p class="video-card-description">
                        Watch me build a complete full stack app from scratch using React, Node.js, and MongoDB. Learn best practices and project structure.
                    </p>
                    <div class="video-meta">
                        <span><i class="far fa-clock"></i> 45 min</span>
                        <span><i class="fas fa-tag"></i> Tutorial</span>
                    </div>
                </div>
            </article>
            
            <!-- Video 4: Day in the Life -->
            <article class="video-card">
                <div class="video-thumbnail">
                    <div class="video-thumbnail-content">
                        <i class="fas fa-play-circle play-icon"></i>
                        <span>Coming Soon</span>
                    </div>
                </div>
                <div class="video-card-content">
                    <h2 class="video-card-title">Day in the Life - Moroccan Developer</h2>
                    <p class="video-card-description">
                        Follow me through a typical day as a software engineer in Casablanca, Morocco. From morning coffee to deploying code.
                    </p>
                    <div class="video-meta">
                        <span><i class="far fa-clock"></i> 12 min</span>
                        <span><i class="fas fa-tag"></i> Vlog</span>
                    </div>
                </div>
            </article>
            
            <!-- Video 5: ALX Journey -->
            <article class="video-card">
                <div class="video-thumbnail">
                    <div class="video-thumbnail-content">
                        <i class="fas fa-play-circle play-icon"></i>
                        <span>Coming Soon</span>
                    </div>
                </div>
                <div class="video-card-content">
                    <h2 class="video-card-title">My ALX Software Engineering Journey</h2>
                    <p class="video-card-description">
                        Everything about the ALX program - what to expect, how to succeed, challenges faced, and advice for prospective students.
                    </p>
                    <div class="video-meta">
                        <span><i class="far fa-clock"></i> 15 min</span>
                        <span><i class="fas fa-tag"></i> Education</span>
                    </div>
                </div>
            </article>
            
            <!-- Video 6: Tech Stack Explained -->
            <article class="video-card">
                <div class="video-thumbnail">
                    <div class="video-thumbnail-content">
                        <i class="fas fa-play-circle play-icon"></i>
                        <span>Coming Soon</span>
                    </div>
                </div>
                <div class="video-card-content">
                    <h2 class="video-card-title">My Tech Stack Explained</h2>
                    <p class="video-card-description">
                        Deep dive into the technologies I use daily - Python, JavaScript, Node.js, React, MongoDB, and more. Why I chose them and how I use them.
                    </p>
                    <div class="video-meta">
                        <span><i class="far fa-clock"></i> 10 min</span>
                        <span><i class="fas fa-tag"></i> Tech Talk</span>
                    </div>
                </div>
            </article>
        </div>
        
        <!-- CTA Section -->
        <div class="cta-section">
            <h2>Subscribe for Updates!</h2>
            <p>
                I'm launching my YouTube channel soon with tutorials, project walkthroughs, and insights from my journey as a Full Stack Developer in Morocco.
            </p>
            <p>
                Follow me on social media to get notified when videos go live:
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
                <a href="https://linkedin.com/in/brahim-elhouss" class="subscribe-btn" target="_blank">
                    <i class="fab fa-linkedin"></i> LinkedIn
                </a>
                <a href="https://twitter.com/brahimelhouss" class="subscribe-btn" target="_blank">
                    <i class="fab fa-twitter"></i> Twitter
                </a>
                <a href="https://github.com/EL-HOUSS-BRAHIM" class="subscribe-btn" target="_blank">
                    <i class="fab fa-github"></i> GitHub
                </a>
            </div>
        </div>
        
        <!-- Video Content Creation Guide -->
        <div style="background: #f7fafc; padding: 2rem; border-radius: 12px; margin-top: 3rem;">
            <h3 style="margin-bottom: 1rem; color: #2d3748;">📹 Upcoming Video Topics</h3>
            <p style="color: #4a5568; margin-bottom: 1rem;">
                Vote for what you'd like to see! Connect with me on social media and let me know which topics interest you most:
            </p>
            <ul style="color: #4a5568; line-height: 2;">
                <li>REST API Development Best Practices</li>
                <li>MongoDB Schema Design Tips</li>
                <li>React Performance Optimization</li>
                <li>Deploying Full Stack Apps to Production</li>
                <li>Career Advice for Junior Developers</li>
                <li>Building a Developer Portfolio That Gets You Hired</li>
                <li>Working Remotely as a Developer in Morocco</li>
                <li>Interview Preparation for Software Engineers</li>
            </ul>
        </div>
        
        <!-- Structured Data for Videos -->
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "VideoGallery",
            "name": "Brahim Elhouss Videos",
            "description": "Video content by Brahim Elhouss, Full Stack Software Engineer",
            "url": "https://brahim-elhouss.me/videos.html",
            "author": {
                "@type": "Person",
                "name": "Brahim El Houss",
                "jobTitle": "Full Stack Software Engineer",
                "url": "https://brahim-elhouss.me",
                "sameAs": [
                    "https://github.com/EL-HOUSS-BRAHIM",
                    "https://linkedin.com/in/brahim-elhouss"
                ]
            }
        }
        </script>
        
        <!-- YouTube Channel Embed (add when channel is created) -->
        <!--
        <div style="margin-top: 3rem;">
            <h3 style="text-align: center; margin-bottom: 2rem;">Latest from YouTube</h3>
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                    <iframe 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        src="https://www.youtube.com/embed/YOUR_VIDEO_ID" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
        </div>
        -->
    </div>
    
    <script src="/assets/js/main.js"></script>
</body>
</html>
