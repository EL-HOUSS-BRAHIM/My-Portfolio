<?php
/**
 * Projects Management Page
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
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Projects - Admin Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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
        
        .header-actions {
            display: flex;
            gap: 1rem;
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
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .btn-success:hover {
            background: #218838;
        }
        
        .btn-danger {
            background: #e74c3c;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c0392b;
        }
        
        .btn-small {
            padding: 4px 8px;
            font-size: 12px;
        }
        
        .container {
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .card h2 {
            margin-bottom: 1.5rem;
            color: #333;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            border-color: #667eea;
            outline: none;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: auto;
        }
        
        .table-responsive {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e1e5e9;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .badge-active {
            background: #d4edda;
            color: #155724;
        }
        
        .badge-inactive {
            background: #f8d7da;
            color: #721c24;
        }
        
        .badge-featured {
            background: #fff3cd;
            color: #856404;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            overflow-y: auto;
        }
        
        .modal-content {
            background: white;
            max-width: 800px;
            margin: 50px auto;
            border-radius: 10px;
            padding: 2rem;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .modal-header h3 {
            color: #333;
        }
        
        .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        
        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 1rem;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .tech-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tech-tag {
            background: #e9ecef;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 0 1rem;
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
            
            table {
                font-size: 12px;
            }
            
            th, td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1><i class="fas fa-folder-open"></i> Manage Projects</h1>
        <div class="header-actions">
            <a href="dashboard.php" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
            <button onclick="openAddModal()" class="btn btn-primary">
                <i class="fas fa-plus"></i> Add New Project
            </button>
        </div>
    </header>
    
    <div class="container">
        <div id="alertContainer"></div>
        
        <div class="card">
            <h2>Projects List</h2>
            <div id="projectsTable" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading projects...
            </div>
        </div>
    </div>
    
    <!-- Add/Edit Modal -->
    <div id="projectModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">Add New Project</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <form id="projectForm">
                <input type="hidden" id="projectId" name="id">
                
                <div class="form-group">
                    <label for="title">Project Title *</label>
                    <input type="text" id="title" name="title" required>
                </div>
                
                <div class="form-group">
                    <label for="short_description">Short Description</label>
                    <input type="text" id="short_description" name="short_description">
                </div>
                
                <div class="form-group">
                    <label for="description">Full Description *</label>
                    <textarea id="description" name="description" rows="4" required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Category</label>
                        <input type="text" id="category" name="category" placeholder="e.g., Web Development, Mobile App">
                    </div>
                    
                    <div class="form-group">
                        <label for="image_url">Image URL</label>
                        <input type="text" id="image_url" name="image_url">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="demo_url">Demo URL</label>
                        <input type="url" id="demo_url" name="demo_url">
                    </div>
                    
                    <div class="form-group">
                        <label for="github_url">GitHub URL</label>
                        <input type="url" id="github_url" name="github_url">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="technologies">Technologies (one per line or comma-separated)</label>
                    <textarea id="technologies" name="technologies" rows="3"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="order_position">Order Position</label>
                        <input type="number" id="order_position" name="order_position" value="0">
                    </div>
                    
                    <div class="form-group">
                        <label for="is_active">Status</label>
                        <select id="is_active" name="is_active">
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="checkbox-group">
                        <input type="checkbox" id="featured" name="featured" value="1">
                        <label for="featured" style="margin-bottom: 0;">Featured Project</label>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Project
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let projects = [];
        
        // Load projects on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadProjects();
        });
        
        async function loadProjects() {
            try {
                const response = await fetch('/src/api/projects.php?active=false');
                const data = await response.json();
                
                if (data.success) {
                    projects = data.data.projects || data.data;
                    renderProjectsTable();
                } else {
                    showAlert('Error loading projects: ' + data.message, 'error');
                }
            } catch (error) {
                showAlert('Error loading projects: ' + error.message, 'error');
            }
        }
        
        function parseTechnologies(techString) {
            if (!techString) return [];
            
            // Try to parse as JSON array first
            try {
                const parsed = JSON.parse(techString);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // Not JSON, continue
            }
            
            // Split by comma or newline
            return techString.split(/[,\n]/).map(t => t.trim()).filter(t => t);
        }
        
        function renderProjectsTable() {
            const container = document.getElementById('projectsTable');
            
            if (projects.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">No projects found. Add your first project!</p>';
                return;
            }
            
            let html = `
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Technologies</th>
                                <th>Featured</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            projects.forEach(project => {
                const technologies = parseTechnologies(project.technologies);
                const techDisplay = technologies.slice(0, 3).join(', ') + (technologies.length > 3 ? '...' : '');
                
                html += `
                    <tr>
                        <td>
                            <strong>${project.title}</strong>
                            ${project.short_description ? '<br><small style="color: #666;">' + project.short_description + '</small>' : ''}
                        </td>
                        <td>${project.category || '-'}</td>
                        <td>
                            <div class="tech-tags">
                                ${technologies.slice(0, 3).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                                ${technologies.length > 3 ? '<span class="tech-tag">+' + (technologies.length - 3) + '</span>' : ''}
                            </div>
                        </td>
                        <td>
                            ${project.featured ? '<span class="badge badge-featured"><i class="fas fa-star"></i> Featured</span>' : '-'}
                        </td>
                        <td>
                            <span class="badge badge-${project.is_active ? 'active' : 'inactive'}">
                                ${project.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="actions">
                            <button onclick="editProject(${project.id})" class="btn btn-primary btn-small">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProject(${project.id}, '${project.title.replace(/'/g, "\\'")}')" class="btn btn-danger btn-small">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = html;
        }
        
        function openAddModal() {
            document.getElementById('modalTitle').textContent = 'Add New Project';
            document.getElementById('projectForm').reset();
            document.getElementById('projectId').value = '';
            document.getElementById('projectModal').style.display = 'block';
        }
        
        function editProject(id) {
            const project = projects.find(p => p.id == id);
            if (!project) return;
            
            document.getElementById('modalTitle').textContent = 'Edit Project';
            document.getElementById('projectId').value = project.id;
            document.getElementById('title').value = project.title;
            document.getElementById('short_description').value = project.short_description || '';
            document.getElementById('description').value = project.description || '';
            document.getElementById('category').value = project.category || '';
            document.getElementById('image_url').value = project.image_url || '';
            document.getElementById('demo_url').value = project.demo_url || '';
            document.getElementById('github_url').value = project.github_url || '';
            
            // Handle technologies
            const technologies = parseTechnologies(project.technologies);
            document.getElementById('technologies').value = technologies.join('\n');
            
            document.getElementById('order_position').value = project.order_position;
            document.getElementById('is_active').value = project.is_active ? '1' : '0';
            document.getElementById('featured').checked = project.featured;
            
            document.getElementById('projectModal').style.display = 'block';
        }
        
        function closeModal() {
            document.getElementById('projectModal').style.display = 'none';
        }
        
        document.getElementById('projectForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Convert to proper types
            data.order_position = parseInt(data.order_position);
            data.is_active = data.is_active === '1';
            data.featured = document.getElementById('featured').checked;
            
            // Convert technologies to array
            if (data.technologies) {
                const techArray = data.technologies.split(/[,\n]/).map(t => t.trim()).filter(t => t);
                data.technologies = JSON.stringify(techArray);
            }
            
            const id = data.id;
            const isEdit = id !== '';
            
            try {
                const response = await fetch('/src/api/projects.php', {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert(result.data.message || 'Project saved successfully!', 'success');
                    closeModal();
                    loadProjects();
                } else {
                    showAlert('Error: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('Error saving project: ' + error.message, 'error');
            }
        });
        
        async function deleteProject(id, title) {
            if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
            
            try {
                const response = await fetch('/src/api/projects.php?id=' + id, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('Project deleted successfully!', 'success');
                    loadProjects();
                } else {
                    showAlert('Error: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('Error deleting project: ' + error.message, 'error');
            }
        }
        
        function showAlert(message, type) {
            const container = document.getElementById('alertContainer');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.textContent = message;
            container.appendChild(alert);
            
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('projectModal');
            if (event.target === modal) {
                closeModal();
            }
        }
    </script>
</body>
</html>
