<?php
/**
 * Admin Dashboard
 */

require_once __DIR__ . '/../src/config/Config.php';
require_once __DIR__ . '/../src/config/Database.php';
require_once __DIR__ . '/../src/auth/AdminAuth.php';

$config = Config::getInstance();
$auth = new AdminAuth();

// Check authentication
if (!$auth->isAuthenticated()) {
    header('Location: login.php');
    exit;
}

$user = $auth->getCurrentUser();
$db = Database::getInstance();

// Get dashboard stats
try {
    // Skills stats
    $skillsStats = $db->fetchOne("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM skills
    ");
    
    // Education stats
    $educationStats = $db->fetchOne("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM education
    ");
    
    // Projects stats
    $projectsStats = $db->fetchOne("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured
        FROM projects
    ");
    
    // Testimonials stats
    $testimonialStats = $db->fetchOne("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM testimonials
    ");
    
    // Contact messages stats
    $contactStats = $db->fetchOne("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread,
            SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
            SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied
        FROM contact_messages
    ");
    
    // Recent testimonials
    $recentTestimonials = $db->fetchAll("
        SELECT id, name, rating, testimonial, status, created_at 
        FROM testimonials 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    
    // Recent contact messages
    $recentMessages = $db->fetchAll("
        SELECT id, name, email, message, status, created_at 
        FROM contact_messages 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    
} catch (Exception $e) {
    error_log("Dashboard error: " . $e->getMessage());
    $skillsStats = ['total' => 0, 'active' => 0];
    $educationStats = ['total' => 0, 'active' => 0];
    $projectsStats = ['total' => 0, 'active' => 0, 'featured' => 0];
    $testimonialStats = ['total' => 0, 'pending' => 0, 'approved' => 0, 'rejected' => 0];
    $contactStats = ['total' => 0, 'unread' => 0, 'read' => 0, 'replied' => 0];
    $recentTestimonials = [];
    $recentMessages = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - <?php echo htmlspecialchars($config->get('app.name', 'Portfolio')); ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        .header {
            background: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            color: #333;
            font-size: 24px;
        }
        
        .user-menu {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #666;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-block;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5a6fd8;
        }
        
        .btn-danger {
            background: #e74c3c;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c0392b;
        }
        
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-2px);
        }
        
        .card h3 {
            color: #333;
            margin-bottom: 1rem;
            font-size: 18px;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        
        .stats-breakdown {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        
        .stat-item {
            background: #f8f9fa;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 12px;
        }
        
        .stat-item .number {
            font-weight: bold;
            color: #333;
        }
        
        .stat-item .label {
            color: #666;
        }
        
        .recent-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 2rem;
        }
        
        .item-list {
            list-style: none;
        }
        
        .item-list li {
            padding: 1rem 0;
            border-bottom: 1px solid #eee;
        }
        
        .item-list li:last-child {
            border-bottom: none;
        }
        
        .item-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .item-name {
            font-weight: 600;
            color: #333;
        }
        
        .item-date {
            font-size: 12px;
            color: #666;
        }
        
        .item-content {
            color: #666;
            font-size: 14px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .status-badge {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-pending { background: #fff3cd; color: #856404; }
        .status-approved { background: #d4edda; color: #155724; }
        .status-rejected { background: #f8d7da; color: #721c24; }
        .status-unread { background: #cce5ff; color: #004085; }
        .status-read { background: #e2e3e5; color: #383d41; }
        .status-replied { background: #d4edda; color: #155724; }
        
        .quick-actions {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 0 1rem;
            }
            
            .header {
                padding: 1rem;
                flex-direction: column;
                gap: 1rem;
            }
            
            .recent-items {
                grid-template-columns: 1fr;
            }
            
            .quick-actions {
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>Admin Dashboard</h1>
        <div class="user-menu">
            <div class="user-info">
                <span>Welcome, <?php echo htmlspecialchars($user['first_name'] ?? $user['username']); ?></span>
                <span class="status-badge status-approved"><?php echo htmlspecialchars($user['role']); ?></span>
            </div>
            <a href="logout.php" class="btn btn-danger">Logout</a>
        </div>
    </header>
    
    <div class="container">
        <div class="quick-actions">
            <a href="manage-skills.php" class="btn btn-primary">
                <i class="fas fa-cog"></i> Manage Skills
            </a>
            <a href="manage-education.php" class="btn btn-primary">
                <i class="fas fa-graduation-cap"></i> Manage Education
            </a>
            <a href="manage-projects.php" class="btn btn-primary">
                <i class="fas fa-folder"></i> Manage Projects
            </a>
            <a href="testimonials.php" class="btn btn-primary">
                <i class="fas fa-comments"></i> Manage Testimonials
            </a>
            <a href="messages.php" class="btn btn-primary">
                <i class="fas fa-envelope"></i> View Messages
            </a>
            <a href="../index.php" class="btn btn-primary" target="_blank">
                <i class="fas fa-external-link-alt"></i> View Site
        <div class="dashboard-grid">
            <div class="card">
                <h3><i class="fas fa-cog"></i> Skills</h3>
                <div class="stat-number"><?php echo number_format($skillsStats['total'] ?? 0); ?></div>
                <div class="stat-label">Total Skills</div>
                <div class="stats-breakdown">
                    <div class="stat-item">
                        <div class="number"><?php echo $skillsStats['active'] ?? 0; ?></div>
                        <div class="label">Active</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-graduation-cap"></i> Education</h3>
                <div class="stat-number"><?php echo number_format($educationStats['total'] ?? 0); ?></div>
                <div class="stat-label">Education Entries</div>
                <div class="stats-breakdown">
                    <div class="stat-item">
                        <div class="number"><?php echo $educationStats['active'] ?? 0; ?></div>
                        <div class="label">Active</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-folder"></i> Projects</h3>
                <div class="stat-number"><?php echo number_format($projectsStats['total'] ?? 0); ?></div>
                <div class="stat-label">Total Projects</div>
                <div class="stats-breakdown">
                    <div class="stat-item">
                        <div class="number"><?php echo $projectsStats['active'] ?? 0; ?></div>
                        <div class="label">Active</div>
                    </div>
                    <div class="stat-item">
                        <div class="number"><?php echo $projectsStats['featured'] ?? 0; ?></div>
                        <div class="label">Featured</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-comments"></i> Testimonials</h3>
                <div class="stat-number"><?php echo number_format($testimonialStats['total'] ?? 0); ?></div>
                <div class="stat-label">Total Testimonials</div>
                <div class="stats-breakdown">
                    <div class="stat-item">
                        <div class="number"><?php echo $testimonialStats['pending'] ?? 0; ?></div>
                        <div class="label">Pending</div>
                    </div>
                    <div class="stat-item">
                        <div class="number"><?php echo $testimonialStats['approved'] ?? 0; ?></div>
                        <div class="label">Approved</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-envelope"></i> Messages</h3>
                <div class="stat-number"><?php echo number_format($contactStats['total'] ?? 0); ?></div>
                <div class="stat-label">Contact Messages</div>
                <div class="stats-breakdown">
                    <div class="stat-item">
                        <div class="number"><?php echo $contactStats['unread'] ?? 0; ?></div>
                        <div class="label">Unread</div>
                    </div>
                    <div class="stat-item">
                        <div class="number"><?php echo $contactStats['replied'] ?? 0; ?></div>
                        <div class="label">Replied</div>
                    </div>
                </div>
            </div>
        </div>      </div>
                </div>
            </div>
        </div>
        
        <div class="recent-items">
            <div class="card">
                <h3>Recent Testimonials</h3>
                <?php if (empty($recentTestimonials)): ?>
                    <p style="color: #666; text-align: center; padding: 2rem;">No testimonials yet</p>
                <?php else: ?>
                    <ul class="item-list">
                        <?php foreach ($recentTestimonials as $testimonial): ?>
                            <li>
                                <div class="item-header">
                                    <span class="item-name"><?php echo htmlspecialchars($testimonial['name']); ?></span>
                                    <span class="status-badge status-<?php echo $testimonial['status']; ?>">
                                        <?php echo htmlspecialchars($testimonial['status']); ?>
                                    </span>
                                </div>
                                <div class="item-date"><?php echo date('M j, Y g:i A', strtotime($testimonial['created_at'])); ?></div>
                                <div class="item-content"><?php echo htmlspecialchars($testimonial['testimonial']); ?></div>
                                <div style="margin-top: 0.5rem;">
                                    Rating: <?php echo str_repeat('★', $testimonial['rating']) . str_repeat('☆', 5 - $testimonial['rating']); ?>
                                </div>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </div>
            
            <div class="card">
                <h3>Recent Messages</h3>
                <?php if (empty($recentMessages)): ?>
                    <p style="color: #666; text-align: center; padding: 2rem;">No messages yet</p>
                <?php else: ?>
                    <ul class="item-list">
                        <?php foreach ($recentMessages as $message): ?>
                            <li>
                                <div class="item-header">
                                    <span class="item-name"><?php echo htmlspecialchars($message['name']); ?></span>
                                    <span class="status-badge status-<?php echo $message['status']; ?>">
                                        <?php echo htmlspecialchars($message['status']); ?>
                                    </span>
                                </div>
                                <div class="item-date"><?php echo date('M j, Y g:i A', strtotime($message['created_at'])); ?></div>
                                <div style="font-size: 12px; color: #666; margin-bottom: 0.5rem;">
                                    <?php echo htmlspecialchars($message['email']); ?>
                                </div>
                                <div class="item-content"><?php echo htmlspecialchars($message['message']); ?></div>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </div>
        </div>
    </div>
</body>
</html>
