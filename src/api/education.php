<?php
/**
 * Education API Endpoint
 * Handles CRUD operations for education entries
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
    error_log("Education API error: " . $e->getMessage());
    Response::error('Server error: ' . $e->getMessage(), 500);
}

function handleGet(Database $db): void {
    $activeOnly = isset($_GET['active']) ? filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN) : true;
    
    $sql = "SELECT * FROM education WHERE 1=1";
    $params = [];
    
    if ($activeOnly) {
        $sql .= " AND is_active = ?";
        $params[] = 1;
    }
    
    $sql .= " ORDER BY order_position, start_date DESC";
    
    $education = $db->fetchAll($sql, $params);
    
    Response::success(['education' => $education]);
}

function handlePost(Database $db): void {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        Response::error('Invalid JSON data', 400);
    }
    
    $required = ['institution', 'degree', 'start_date'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            Response::error("Missing required field: $field", 400);
        }
    }
    
    $sql = "INSERT INTO education (institution, degree, field_of_study, start_date, end_date, 
            is_current, description, location, achievements, skills, order_position, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $data['institution'],
        $data['degree'],
        $data['field_of_study'] ?? null,
        $data['start_date'],
        $data['end_date'] ?? null,
        $data['is_current'] ?? false,
        $data['description'] ?? null,
        $data['location'] ?? null,
        $data['achievements'] ?? null,
        $data['skills'] ?? null,
        $data['order_position'] ?? 0,
        $data['is_active'] ?? true
    ];
    
    $result = $db->execute($sql, $params);
    
    if ($result) {
        Response::success([
            'message' => 'Education entry created successfully',
            'id' => $db->lastInsertId()
        ], 201);
    } else {
        Response::error('Failed to create education entry', 500);
    }
}

function handlePut(Database $db): void {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        Response::error('Invalid data or missing ID', 400);
    }
    
    $id = $data['id'];
    
    // Check if entry exists
    $existing = $db->fetchOne("SELECT id FROM education WHERE id = ?", [$id]);
    if (!$existing) {
        Response::error('Education entry not found', 404);
    }
    
    $fields = [];
    $params = [];
    
    $allowedFields = ['institution', 'degree', 'field_of_study', 'start_date', 'end_date', 
                      'is_current', 'description', 'location', 'achievements', 'skills', 
                      'order_position', 'is_active'];
    
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
    $sql = "UPDATE education SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $result = $db->execute($sql, $params);
    
    if ($result) {
        Response::success(['message' => 'Education entry updated successfully']);
    } else {
        Response::error('Failed to update education entry', 500);
    }
}

function handleDelete(Database $db): void {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Response::error('Missing education ID', 400);
    }
    
    // Check if entry exists
    $existing = $db->fetchOne("SELECT id FROM education WHERE id = ?", [$id]);
    if (!$existing) {
        Response::error('Education entry not found', 404);
    }
    
    $result = $db->execute("DELETE FROM education WHERE id = ?", [$id]);
    
    if ($result) {
        Response::success(['message' => 'Education entry deleted successfully']);
    } else {
        Response::error('Failed to delete education entry', 500);
    }
}
