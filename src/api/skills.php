<?php
/**
 * Skills API Endpoint
 * Handles CRUD operations for skills
 */

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../auth/AdminAuth.php';
require_once __DIR__ . '/../utils/Response.php';

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
    error_log("Skills API error: " . $e->getMessage());
    Response::error('Server error: ' . $e->getMessage(), 500);
}

function handleGet($db) {
    $category = $_GET['category'] ?? null;
    $activeOnly = isset($_GET['active']) ? filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN) : true;
    
    $sql = "SELECT * FROM skills WHERE 1=1";
    $params = [];
    
    if ($activeOnly) {
        $sql .= " AND is_active = ?";
        $params[] = 1;
    }
    
    if ($category) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    
    $sql .= " ORDER BY category, order_position, id";
    
    $skills = $db->fetchAll($sql, $params);
    
    // Group by category
    $grouped = [];
    foreach ($skills as $skill) {
        $cat = $skill['category'];
        if (!isset($grouped[$cat])) {
            $grouped[$cat] = [];
        }
        $grouped[$cat][] = $skill;
    }
    
    Response::success([
        'skills' => $skills,
        'grouped' => $grouped
    ]);
}

function handlePost($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        Response::error('Invalid JSON data', 400);
    }
    
    $required = ['category', 'name', 'level'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            Response::error("Missing required field: $field", 400);
        }
    }
    
    $sql = "INSERT INTO skills (category, name, description, level, icon, order_position, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $data['category'],
        $data['name'],
        $data['description'] ?? null,
        $data['level'],
        $data['icon'] ?? null,
        $data['order_position'] ?? 0,
        $data['is_active'] ?? true
    ];
    
    $result = $db->execute($sql, $params);
    
    if ($result) {
        Response::success([
            'message' => 'Skill created successfully',
            'id' => $db->lastInsertId()
        ], 201);
    } else {
        Response::error('Failed to create skill', 500);
    }
}

function handlePut($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        Response::error('Invalid data or missing ID', 400);
    }
    
    $id = $data['id'];
    
    // Check if skill exists
    $existing = $db->fetchOne("SELECT id FROM skills WHERE id = ?", [$id]);
    if (!$existing) {
        Response::error('Skill not found', 404);
    }
    
    $fields = [];
    $params = [];
    
    $allowedFields = ['category', 'name', 'description', 'level', 'icon', 'order_position', 'is_active'];
    
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
    $sql = "UPDATE skills SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $result = $db->execute($sql, $params);
    
    if ($result) {
        Response::success(['message' => 'Skill updated successfully']);
    } else {
        Response::error('Failed to update skill', 500);
    }
}

function handleDelete($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Response::error('Missing skill ID', 400);
    }
    
    // Check if skill exists
    $existing = $db->fetchOne("SELECT id FROM skills WHERE id = ?", [$id]);
    if (!$existing) {
        Response::error('Skill not found', 404);
    }
    
    $result = $db->execute("DELETE FROM skills WHERE id = ?", [$id]);
    
    if ($result) {
        Response::success(['message' => 'Skill deleted successfully']);
    } else {
        Response::error('Failed to delete skill', 500);
    }
}
