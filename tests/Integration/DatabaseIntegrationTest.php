<?php

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;

class DatabaseIntegrationTest extends TestCase
{
    private $pdo;
    
    protected function setUp(): void
    {
        $this->pdo = getTestDatabaseConnection();
        resetTestDatabase();
        createTestData();
    }
    
    protected function tearDown(): void
    {
        resetTestDatabase();
    }
    
    public function testDatabaseConnection(): void
    {
        $this->assertInstanceOf(\PDO::class, $this->pdo);
        
        // Test connection with a simple query
        $stmt = $this->pdo->query("SELECT 1 as test");
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        $this->assertEquals(1, $result['test']);
    }
    
    public function testTestimonialsTable(): void
    {
        // Test inserting a testimonial
        $stmt = $this->pdo->prepare("
            INSERT INTO testimonials (name, email, message, status) 
            VALUES (?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            'Test User',
            'test@example.com',
            'This is a test testimonial',
            'pending'
        ]);
        
        $this->assertTrue($result);
        
        // Test retrieving testimonials
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM testimonials");
        $count = $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
        
        $this->assertGreaterThan(0, $count);
    }
    
    public function testContactMessagesTable(): void
    {
        // Test inserting a contact message
        $stmt = $this->pdo->prepare("
            INSERT INTO contact_messages (name, email, subject, message, ip_address) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            'Contact User',
            'contact@example.com',
            'Test Subject',
            'This is a test contact message',
            '127.0.0.1'
        ]);
        
        $this->assertTrue($result);
        
        // Test retrieving contact messages
        $stmt = $this->pdo->query("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 1");
        $message = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        $this->assertNotFalse($message);
        $this->assertEquals('Contact User', $message['name']);
        $this->assertEquals('contact@example.com', $message['email']);
    }
    
    public function testAdminUsersTable(): void
    {
        // Test retrieving admin user
        $stmt = $this->pdo->query("SELECT * FROM admin_users WHERE username = 'testadmin'");
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        $this->assertNotFalse($user);
        $this->assertEquals('testadmin', $user['username']);
        $this->assertEquals('admin@test.com', $user['email']);
        $this->assertTrue(password_verify('testpassword', $user['password_hash']));
    }
    
    public function testTransactionRollback(): void
    {
        $this->pdo->beginTransaction();
        
        try {
            // Insert a testimonial
            $stmt = $this->pdo->prepare("
                INSERT INTO testimonials (name, email, message) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute(['Trans User', 'trans@example.com', 'Transaction test']);
            
            // Get count before rollback
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM testimonials");
            $countDuringTransaction = $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
            
            // Rollback transaction
            $this->pdo->rollback();
            
            // Get count after rollback
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM testimonials");
            $countAfterRollback = $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
            
            $this->assertGreaterThan($countAfterRollback, $countDuringTransaction);
            
        } catch (\Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    public function testPreparedStatementSecurity(): void
    {
        // Test that prepared statements handle malicious input safely
        $maliciousInput = "'; DROP TABLE testimonials; --";
        
        $stmt = $this->pdo->prepare("
            INSERT INTO testimonials (name, email, message) 
            VALUES (?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $maliciousInput,
            'malicious@example.com',
            'This should not break the database'
        ]);
        
        $this->assertTrue($result);
        
        // Verify that the table still exists and data is properly escaped
        $stmt = $this->pdo->query("SELECT name FROM testimonials WHERE email = 'malicious@example.com'");
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        $this->assertEquals($maliciousInput, $user['name']);
    }
    
    public function testDatabasePerformance(): void
    {
        $startTime = microtime(true);
        
        // Insert multiple records to test performance
        $stmt = $this->pdo->prepare("
            INSERT INTO testimonials (name, email, message) 
            VALUES (?, ?, ?)
        ");
        
        for ($i = 0; $i < 100; $i++) {
            $stmt->execute([
                "User $i",
                "user$i@example.com",
                "Test message $i"
            ]);
        }
        
        $insertTime = microtime(true) - $startTime;
        
        // Test retrieval performance
        $startTime = microtime(true);
        $stmt = $this->pdo->query("SELECT * FROM testimonials ORDER BY created_at DESC");
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $selectTime = microtime(true) - $startTime;
        
        // Basic performance assertions
        $this->assertLessThan(1.0, $insertTime, 'Insert operation should complete within 1 second');
        $this->assertLessThan(0.5, $selectTime, 'Select operation should complete within 0.5 seconds');
        $this->assertCount(101, $results); // 100 inserted + 1 from test data
    }
}