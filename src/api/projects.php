<?php
/**
 * Projects API Endpoint
 * Handles CRUD operations for projects
 */

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../auth/AdminAuth.php';
require_once __DIR__ . '/../utils/Response.php';

use Portfolio\Config\Database;
use Portfolio\Utils\Response;

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance();
$auth = new AdminAuth();

try {
    switch ($method) {
        case 'GET':
            handleGet($db);
            break;
            
        case 'POST':
            if (!$auth->isAuthenticated()) {
                Response::error('Unauthorized', 401);
            }
            handlePost($db);
            break;
            
        case 'PUT':
            if (!$auth->isAuthenticated()) {
                Response::error('Unauthorized', 401);
            }
            handlePut($db);
            break;
            
        case 'DELETE':
            if (!$auth->isAuthenticated()) {
                Response::error('Unauthorized', 401);
            }
            handleDelete($db);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Projects API error: " . $e->getMessage());
    Response::error('Server error: ' . $e->getMessage(), 500);
}

function handleGet(Database $db): void {
    $category = $_GET['category'] ?? null;
    $featured = isset($_GET['featured']) ? filter_var($_GET['featured'], FILTER_VALIDATE_BOOLEAN) : null;
    $activeOnly = isset($_GET['active']) ? filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN) : true;
    
    $sql = "SELECT * FROM projects WHERE 1=1";
    $params = [];
    
    if ($activeOnly) {
        $sql .= " AND is_active = ?";
        $params[] = 1;
    }
    
    if ($category) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    
    if ($featured !== null) {
        $sql .= " AND featured = ?";
        $params[] = $featured ? 1 : 0;
    }
    
    $sql .= " ORDER BY featured DESC, order_position, id DESC";
    
    $projects = $db->fetchAll($sql, $params);
    
    Response::success(['projects' => $projects]);
}

function handlePost(Database $db): void {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        Response::error('Invalid JSON data', 400);
    }
    
    $required = ['title', 'description'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            Response::error("Missing required field: $field", 400);
        }
    }
    
    $sql = "INSERT INTO projects (title, description, short_description, image_url, demo_url, 
            github_url, technologies, category, featured, order_position, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $data['title'],
        $data['description'],
        $data['short_description'] ?? null,
        $data['image_url'] ?? null,
        $data['demo_url'] ?? null,
        $data['github_url'] ?? null,
        $data['technologies'] ?? null,
        $data['category'] ?? null,
        $data['featured'] ?? false,
        $data['order_position'] ?? 0,
        $data['is_active'] ?? true
    ];
    
    $result = $db->execute($sql, $params);
    
    if ($result) {
        Response::success([
            'message' => 'Project created successfully',
            'id' => $db->lastInsertId()
        ], 201);
    } else {
        Response::error('Failed to create project', 500);
    }
}

function handlePut(Database $db): void {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        Response::error('Invalid data or missing ID', 400);
    }
    
    $id = $data['id'];
    
    // Check if project exists
    $existing = $db->fetchOne("SELECT id FROM projects WHERE id = ?", [$id]);
    if (!$existing) {
        Response::error('Project not found', 404);
    }
    
    $fields = [];
    $params = [];
    
    $allowedFields = ['title', 'description', 'short_description', 'image_url', 'demo_url', 
                      'github_url', 'technologies', 'category', 'featured', 'order_position', 'is_active'];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $params[] = $data[$field];
        }
    }
    
    if (empty($fields)) {
        Response::error('No fields to update', 400);
    }
    
    $params[] = $id;
    $sql = "UPDATE projects SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $result = $db->execute($sql, $params);
    
    if ($result) {
        Response::success(['message' => 'Project updated successfully']);
    } else {
        Response::error('Failed to update project', 500);
    }
}

function handleDelete(Database $db): void {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Response::error('Missing project ID', 400);
    }
    
    // Check if project exists
    $existing = $db->fetchOne("SELECT id FROM projects WHERE id = ?", [$id]);
    if (!$existing) {
        Response::error('Project not found', 404);
    }
    
    $result = $db->execute("DELETE FROM projects WHERE id = ?", [$id]);
    
    if ($result) {
        Response::success(['message' => 'Project deleted successfully']);
    } else {
        Response::error('Failed to delete project', 500);
    }
}
