<?php
/**
 * Skills Management Page
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
    <title>Manage Skills - Admin Dashboard</title>
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
        
        .progress-bar {
            width: 100px;
            height: 8px;
            background: #e1e5e9;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: #667eea;
            transition: width 0.3s ease;
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
            max-width: 600px;
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
        <h1><i class="fas fa-cog"></i> Manage Skills</h1>
        <div class="header-actions">
            <a href="dashboard.php" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
            <button onclick="openAddModal()" class="btn btn-primary">
                <i class="fas fa-plus"></i> Add New Skill
            </button>
        </div>
    </header>
    
    <div class="container">
        <div id="alertContainer"></div>
        
        <div class="card">
            <h2>Skills List</h2>
            <div id="skillsTable" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading skills...
            </div>
        </div>
    </div>
    
    <!-- Add/Edit Modal -->
    <div id="skillModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">Add New Skill</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <form id="skillForm">
                <input type="hidden" id="skillId" name="id">
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Category *</label>
                        <select id="category" name="category" required>
                            <option value="">Select category</option>
                            <option value="Frontend Development">Frontend Development</option>
                            <option value="Backend Development">Backend Development</option>
                            <option value="Tools & DevOps">Tools & DevOps</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="name">Skill Name *</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="3"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="level">Level (0-100) *</label>
                        <input type="number" id="level" name="level" min="0" max="100" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="icon">Icon Class</label>
                        <input type="text" id="icon" name="icon" placeholder="e.g., fab fa-js-square">
                    </div>
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
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Skill
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let skills = [];
        
        // Load skills on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadSkills();
        });
        
        async function loadSkills() {
            try {
                const response = await fetch('/src/api/skills.php?active=false');
                const data = await response.json();
                
                if (data.success) {
                    skills = data.data.skills;
                    renderSkillsTable();
                } else {
                    showAlert('Error loading skills: ' + data.message, 'error');
                }
            } catch (error) {
                showAlert('Error loading skills: ' + error.message, 'error');
            }
        }
        
        function renderSkillsTable() {
            const container = document.getElementById('skillsTable');
            
            if (skills.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">No skills found. Add your first skill!</p>';
                return;
            }
            
            const grouped = skills.reduce((acc, skill) => {
                if (!acc[skill.category]) acc[skill.category] = [];
                acc[skill.category].push(skill);
                return acc;
            }, {});
            
            let html = '';
            
            for (const [category, categorySkills] of Object.entries(grouped)) {
                html += `
                    <h3 style="margin-top: 2rem; color: #667eea;">${category}</h3>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Level</th>
                                    <th>Icon</th>
                                    <th>Order</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                categorySkills.forEach(skill => {
                    html += `
                        <tr>
                            <td><strong>${skill.name}</strong></td>
                            <td>${skill.description || '-'}</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${skill.level}%"></div>
                                </div>
                                ${skill.level}%
                            </td>
                            <td><i class="${skill.icon || 'fas fa-code'}"></i></td>
                            <td>${skill.order_position}</td>
                            <td>
                                <span class="badge badge-${skill.is_active ? 'active' : 'inactive'}">
                                    ${skill.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td class="actions">
                                <button onclick="editSkill(${skill.id})" class="btn btn-primary btn-small">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteSkill(${skill.id}, '${skill.name}')" class="btn btn-danger btn-small">
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
            }
            
            container.innerHTML = html;
        }
        
        function openAddModal() {
            document.getElementById('modalTitle').textContent = 'Add New Skill';
            document.getElementById('skillForm').reset();
            document.getElementById('skillId').value = '';
            document.getElementById('skillModal').style.display = 'block';
        }
        
        function editSkill(id) {
            const skill = skills.find(s => s.id == id);
            if (!skill) return;
            
            document.getElementById('modalTitle').textContent = 'Edit Skill';
            document.getElementById('skillId').value = skill.id;
            document.getElementById('category').value = skill.category;
            document.getElementById('name').value = skill.name;
            document.getElementById('description').value = skill.description || '';
            document.getElementById('level').value = skill.level;
            document.getElementById('icon').value = skill.icon || '';
            document.getElementById('order_position').value = skill.order_position;
            document.getElementById('is_active').value = skill.is_active ? '1' : '0';
            
            document.getElementById('skillModal').style.display = 'block';
        }
        
        function closeModal() {
            document.getElementById('skillModal').style.display = 'none';
        }
        
        document.getElementById('skillForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Convert to proper types
            data.level = parseInt(data.level);
            data.order_position = parseInt(data.order_position);
            data.is_active = data.is_active === '1';
            
            const id = data.id;
            const isEdit = id !== '';
            
            try {
                const response = await fetch('/src/api/skills.php', {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert(result.data.message || 'Skill saved successfully!', 'success');
                    closeModal();
                    loadSkills();
                } else {
                    showAlert('Error: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('Error saving skill: ' + error.message, 'error');
            }
        });
        
        async function deleteSkill(id, name) {
            if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
            
            try {
                const response = await fetch('/src/api/skills.php?id=' + id, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('Skill deleted successfully!', 'success');
                    loadSkills();
                } else {
                    showAlert('Error: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('Error deleting skill: ' + error.message, 'error');
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
            const modal = document.getElementById('skillModal');
            if (event.target === modal) {
                closeModal();
            }
        }
    </script>
</body>
</html>
