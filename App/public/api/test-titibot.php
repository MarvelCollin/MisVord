<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$results = [];

function testSocketServerStatus() {
    $results = [
        'service' => 'Socket Server',
        'status' => 'unknown',
        'details' => []
    ];
    
    try {
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'method' => 'GET'
            ]
        ]);
        
        $response = @file_get_contents('http://localhost:1002/health', false, $context);
        
        if ($response !== false) {
            $data = json_decode($response, true);
            if ($data && isset($data['status']) && $data['status'] === 'ok') {
                $results['status'] = 'running';
                $results['details']['uptime'] = $data['uptime'] ?? 'unknown';
                $results['details']['service'] = $data['service'] ?? 'unknown';
            } else {
                $results['status'] = 'error';
                $results['details']['error'] = 'Invalid response format';
            }
        } else {
            $results['status'] = 'offline';
            $results['details']['error'] = 'Cannot connect to socket server';
        }
    } catch (Exception $e) {
        $results['status'] = 'error';
        $results['details']['error'] = $e->getMessage();
    }
    
    return $results;
}

function testBotDatabase() {
    $results = [
        'service' => 'Bot Database',
        'status' => 'unknown',
        'details' => []
    ];
    
    try {
        require_once __DIR__ . '/../../database/repositories/UserRepository.php';
        $userRepo = new UserRepository();
        
        $bot = $userRepo->findByUsername('titibot');
        
        if ($bot) {
            $results['status'] = 'found';
            $results['details']['bot_id'] = $bot->id;
            $results['details']['username'] = $bot->username;
            $results['details']['is_bot'] = $bot->is_bot ? 'yes' : 'no';
            $results['details']['status'] = $bot->status ?? 'unknown';
        } else {
            $results['status'] = 'not_found';
            $results['details']['error'] = 'TitiBot user not found in database';
        }
    } catch (Exception $e) {
        $results['status'] = 'error';
        $results['details']['error'] = $e->getMessage();
    }
    
    return $results;
}

function testBotEndpoint() {
    $results = [
        'service' => 'Bot API Endpoint',
        'status' => 'unknown',
        'details' => []
    ];
    
    try {
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'method' => 'GET',
                'header' => [
                    'Content-Type: application/json',
                    'User-Agent: TestBot/1.0'
                ]
            ]
        ]);
        
        $response = @file_get_contents('http://localhost:1001/api/bots/public-check/titibot', false, $context);
        
        if ($response !== false) {
            $data = json_decode($response, true);
            if ($data && isset($data['success']) && $data['success']) {
                $results['status'] = 'working';
                $results['details']['exists'] = $data['exists'] ? 'yes' : 'no';
                $results['details']['is_bot'] = $data['is_bot'] ? 'yes' : 'no';
                if (isset($data['bot'])) {
                    $results['details']['bot_id'] = $data['bot']['id'];
                    $results['details']['username'] = $data['bot']['username'];
                }
            } else {
                $results['status'] = 'error';
                $results['details']['error'] = 'API returned failure response';
                $results['details']['response'] = $data;
            }
        } else {
            $results['status'] = 'offline';
            $results['details']['error'] = 'Cannot connect to bot API endpoint';
        }
    } catch (Exception $e) {
        $results['status'] = 'error';
        $results['details']['error'] = $e->getMessage();
    }
    
    return $results;
}

function testBotInitialization() {
    $results = [
        'service' => 'Bot Socket Initialization',
        'status' => 'unknown',
        'details' => []
    ];
    
    try {
        $socketUrl = 'http://localhost:1002';
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 10,
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/json',
                    'User-Agent: TestBot/1.0'
                ],
                'content' => json_encode([
                    'test' => 'bot_status_check',
                    'bot_id' => 4,
                    'username' => 'titibot'
                ])
            ]
        ]);
        
        $response = @file_get_contents($socketUrl . '/health', false, $context);
        
        if ($response !== false) {
            $data = json_decode($response, true);
            if ($data && isset($data['status']) && $data['status'] === 'ok') {
                $results['status'] = 'socket_healthy';
                $results['details']['socket_service'] = $data['service'] ?? 'unknown';
                $results['details']['uptime'] = $data['uptime'] ?? 'unknown';
                $results['details']['note'] = 'Socket server is running, bot should be initialized';
            } else {
                $results['status'] = 'socket_error';
                $results['details']['error'] = 'Invalid socket health response';
            }
        } else {
            $results['status'] = 'socket_offline';
            $results['details']['error'] = 'Socket server not responding';
        }
    } catch (Exception $e) {
        $results['status'] = 'error';
        $results['details']['error'] = $e->getMessage();
    }
    
    return $results;
}

function getBotCommands() {
    return [
        'available_commands' => [
            '/titibot ping' => 'Test if bot is responding',
            '/titibot play {song}' => 'Play a song (simulated)',
            '/titibot stop' => 'Stop current song',
            '/titibot next' => 'Skip to next song',
            '/titibot prev' => 'Go to previous song',
            '/titibot queue {song}' => 'Add song to queue'
        ],
        'usage_examples' => [
            '/titibot ping',
            '/titibot play never gonna give you up',
            '/titibot queue bohemian rhapsody',
            '/titibot stop'
        ]
    ];
}

$tests = [
    'socket_server' => testSocketServerStatus(),
    'bot_database' => testBotDatabase(),
    'bot_endpoint' => testBotEndpoint(),
    'bot_initialization' => testBotInitialization(),
    'bot_commands' => getBotCommands()
];

$allSystemsHealthy = true;
foreach ($tests as $key => $test) {
    if ($key !== 'bot_commands' && isset($test['status']) && 
        !in_array($test['status'], ['running', 'found', 'working', 'socket_healthy'])) {
        $allSystemsHealthy = false;
        break;
    }
}

$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'overall_status' => $allSystemsHealthy ? 'healthy' : 'issues_detected',
    'message' => $allSystemsHealthy 
        ? 'TitiBot system is fully operational and ready to respond to commands'
        : 'Some TitiBot components have issues - check details below',
    'tests' => $tests,
    'next_steps' => $allSystemsHealthy ? [
        'Send a message to any channel with "/titibot ping" to test bot response',
        'Try other commands like "/titibot play song_name"',
        'Check browser developer console for WebSocket events',
        'Monitor Docker logs with: docker logs misvord_socket --follow'
    ] : [
        'Check Docker containers: docker-compose ps',
        'Restart services if needed: docker-compose restart',
        'Check application logs for errors',
        'Verify database connections'
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
?> 