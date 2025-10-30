<?php
/**
 * Education Management Page
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
    <title>Manage Education - Admin Dashboard</title>
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
        
        .badge-current {
            background: #d1ecf1;
            color: #0c5460;
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
        <h1><i class="fas fa-graduation-cap"></i> Manage Education</h1>
        <div class="header-actions">
            <a href="dashboard.php" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
            <button onclick="openAddModal()" class="btn btn-primary">
                <i class="fas fa-plus"></i> Add New Education
            </button>
        </div>
    </header>
    
    <div class="container">
        <div id="alertContainer"></div>
        
        <div class="card">
            <h2>Education List</h2>
            <div id="educationTable" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading education records...
            </div>
        </div>
    </div>
    
    <!-- Add/Edit Modal -->
    <div id="educationModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">Add New Education</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <form id="educationForm">
                <input type="hidden" id="educationId" name="id">
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="institution">Institution *</label>
                        <input type="text" id="institution" name="institution" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="degree">Degree *</label>
                        <input type="text" id="degree" name="degree" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="field_of_study">Field of Study</label>
                        <input type="text" id="field_of_study" name="field_of_study">
                    </div>
                    
                    <div class="form-group">
                        <label for="location">Location</label>
                        <input type="text" id="location" name="location">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="start_date">Start Date *</label>
                        <input type="date" id="start_date" name="start_date" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="end_date">End Date</label>
                        <input type="date" id="end_date" name="end_date">
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="checkbox-group">
                        <input type="checkbox" id="is_current" name="is_current" value="1">
                        <label for="is_current" style="margin-bottom: 0;">Currently Studying</label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="achievements">Achievements (one per line)</label>
                    <textarea id="achievements" name="achievements" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="skills">Skills (one per line)</label>
                    <textarea id="skills" name="skills" rows="3"></textarea>
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
                        <i class="fas fa-save"></i> Save Education
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let educationRecords = [];
        
        // Load education records on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadEducation();
        });
        
        async function loadEducation() {
            try {
                const response = await fetch('/src/api/education.php?active=false');
                const data = await response.json();
                
                if (data.success) {
                    educationRecords = data.data.education || data.data;
                    renderEducationTable();
                } else {
                    showAlert('Error loading education records: ' + data.message, 'error');
                }
            } catch (error) {
                showAlert('Error loading education records: ' + error.message, 'error');
            }
        }
        
        function formatDateRange(startDate, endDate, isCurrent) {
            const start = new Date(startDate);
            const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            if (isCurrent) {
                return `${startFormatted} - Present`;
            }
            
            if (endDate) {
                const end = new Date(endDate);
                const endFormatted = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return `${startFormatted} - ${endFormatted}`;
            }
            
            return startFormatted;
        }
        
        function renderEducationTable() {
            const container = document.getElementById('educationTable');
            
            if (educationRecords.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">No education records found. Add your first education record!</p>';
                return;
            }
            
            let html = `
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Institution</th>
                                <th>Degree</th>
                                <th>Period</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            educationRecords.forEach(edu => {
                const period = formatDateRange(edu.start_date, edu.end_date, edu.is_current);
                html += `
                    <tr>
                        <td><strong>${edu.institution}</strong></td>
                        <td>
                            ${edu.degree}
                            ${edu.field_of_study ? '<br><small style="color: #666;">' + edu.field_of_study + '</small>' : ''}
                        </td>
                        <td>
                            ${period}
                            ${edu.is_current ? '<br><span class="badge badge-current">Current</span>' : ''}
                        </td>
                        <td>${edu.location || '-'}</td>
                        <td>
                            <span class="badge badge-${edu.is_active ? 'active' : 'inactive'}">
                                ${edu.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="actions">
                            <button onclick="editEducation(${edu.id})" class="btn btn-primary btn-small">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteEducation(${edu.id}, '${edu.institution}')" class="btn btn-danger btn-small">
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
            document.getElementById('modalTitle').textContent = 'Add New Education';
            document.getElementById('educationForm').reset();
            document.getElementById('educationId').value = '';
            document.getElementById('educationModal').style.display = 'block';
        }
        
        function editEducation(id) {
            const edu = educationRecords.find(e => e.id == id);
            if (!edu) return;
            
            document.getElementById('modalTitle').textContent = 'Edit Education';
            document.getElementById('educationId').value = edu.id;
            document.getElementById('institution').value = edu.institution;
            document.getElementById('degree').value = edu.degree;
            document.getElementById('field_of_study').value = edu.field_of_study || '';
            document.getElementById('location').value = edu.location || '';
            document.getElementById('start_date').value = edu.start_date;
            document.getElementById('end_date').value = edu.end_date || '';
            document.getElementById('is_current').checked = edu.is_current;
            document.getElementById('description').value = edu.description || '';
            document.getElementById('achievements').value = edu.achievements || '';
            document.getElementById('skills').value = edu.skills || '';
            document.getElementById('order_position').value = edu.order_position;
            document.getElementById('is_active').value = edu.is_active ? '1' : '0';
            
            document.getElementById('educationModal').style.display = 'block';
        }
        
        function closeModal() {
            document.getElementById('educationModal').style.display = 'none';
        }
        
        document.getElementById('educationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Convert to proper types
            data.order_position = parseInt(data.order_position);
            data.is_active = data.is_active === '1';
            data.is_current = document.getElementById('is_current').checked;
            
            // If is_current is true, clear end_date
            if (data.is_current) {
                data.end_date = null;
            }
            
            const id = data.id;
            const isEdit = id !== '';
            
            try {
                const response = await fetch('/src/api/education.php', {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert(result.data.message || 'Education record saved successfully!', 'success');
                    closeModal();
                    loadEducation();
                } else {
                    showAlert('Error: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('Error saving education record: ' + error.message, 'error');
            }
        });
        
        async function deleteEducation(id, institution) {
            if (!confirm(`Are you sure you want to delete "${institution}"?`)) return;
            
            try {
                const response = await fetch('/src/api/education.php?id=' + id, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('Education record deleted successfully!', 'success');
                    loadEducation();
                } else {
                    showAlert('Error: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('Error deleting education record: ' + error.message, 'error');
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
            const modal = document.getElementById('educationModal');
            if (event.target === modal) {
                closeModal();
            }
        }
        
        // Handle is_current checkbox
        document.getElementById('is_current').addEventListener('change', function() {
            const endDateInput = document.getElementById('end_date');
            if (this.checked) {
                endDateInput.value = '';
                endDateInput.disabled = true;
            } else {
                endDateInput.disabled = false;
            }
        });
    </script>
</body>
</html>
