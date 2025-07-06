<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/NitroRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';

class NitroController extends BaseController {
    private $nitroRepository;
    private $userRepository;

    public function __construct() {
        parent::__construct();
        $this->nitroRepository = new NitroRepository();
        $this->userRepository = new UserRepository();
    }

    public function index() {
        $this->requireAuth();

        $userId = $this->getCurrentUserId();
        $nitroCodes = $this->nitroRepository->findByUserId($userId);

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'nitro_codes' => $nitroCodes
            ]);
        }

        require_once __DIR__ . '/../views/pages/nitro-page.php';
    }

    public function generate() {
        $this->requireAdmin();

        $input = $this->getInput();
        $userId = isset($input['user_id']) && !empty($input['user_id']) ? (int)$input['user_id'] : null;

        $nitro = $this->nitroRepository->generateCode($userId);

        if ($nitro) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'nitro' => [
                        'id' => $nitro->id,
                        'code' => $nitro->code,
                        'user_id' => $nitro->user_id,
                        'created_at' => $nitro->created_at
                    ],
                    'message' => 'Nitro code generated successfully'
                ]);
            }

            $_SESSION['success'] = 'Nitro code generated successfully: ' . $nitro->code;
            header('Location: /admin#nitro');
            exit;
        }

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->serverError('Failed to generate nitro code');
        }

        $_SESSION['error'] = 'Failed to generate nitro code';
        header('Location: /admin#nitro');
        exit;
    }

    public function createTestCodes() {
        try {
                        $sampleCodes = [
                'NITRO2024SAMPLE01',
                'NITRO2024SAMPLE02', 
                'NITRO2024SAMPLE03',
                'DISCORD-NITRO-001',
                'DISCORD-NITRO-002'
            ];

            $createdCodes = [];

            foreach ($sampleCodes as $code) {
                try {
                    $existingNitro = $this->nitroRepository->findByCode($code);
                    if (!$existingNitro) {
                        $nitro = new Nitro();
                        $nitro->code = $code;
                        $nitro->user_id = null; 
                        if ($nitro->save()) {
                            $createdCodes[] = $code;
                                                    }
                    } else {
                                            }
                } catch (Exception $e) {
                                    }
            }

            return $this->success([
                'message' => 'Test codes created successfully',
                'created_codes' => $createdCodes,
                'total_created' => count($createdCodes)
            ]);

        } catch (Exception $e) {
                        return $this->error('Failed to create test codes: ' . $e->getMessage());
        }
    }

    public function redeem() {
        try {
                        $this->requireAuth();

            $input = $this->getInput();
                        $code = isset($input['code']) ? trim($input['code']) : '';

            if (empty($code)) {
                                return $this->error('Nitro code is required');
            }

            $userId = $this->getCurrentUserId();
                        $hasExistingNitro = $this->nitroRepository->getUserNitroStatus($userId);
            if ($hasExistingNitro) {
                                return $this->error('You already have Nitro active! You cannot redeem additional codes.');
            }

                        $nitro = $this->nitroRepository->findUnusedByCode($code);
                        if (!$nitro) {
                return $this->error('Invalid or already used nitro code');
            }

            $nitro->user_id = $userId;

            if ($nitro->save()) {
                                return $this->success([
                    'message' => 'Nitro code redeemed successfully'
                ]);
            }

                        return $this->error('Failed to redeem nitro code');

        } catch (Exception $e) {
                                    return $this->error('An error occurred while redeeming the code: ' . $e->getMessage());
        }
    }

    public function getUserNitroStatus() {
        $this->requireAuth();

        $userId = $this->getCurrentUserId();
        $user = $this->userRepository->find($userId);

        if (!$user) {
            return $this->error('User not found');
        }

        $hasNitro = $this->nitroRepository->getUserNitroStatus($userId);
        $nitroCodes = $this->nitroRepository->findByUserId($userId);

        return $this->success([
            'has_nitro' => $hasNitro,
            'codes_redeemed' => count($nitroCodes),
            'codes' => array_map(function($nitro) {
                return [
                    'code' => substr($nitro->code, 0, 4) . '-****-****-' . substr($nitro->code, -4),
                    'redeemed_at' => $nitro->updated_at
                ];
            }, $nitroCodes)
        ]);
    }

    public function test() {
        try {
                        $query = new Query();
            $nitroCodes = $query->table('nitro')->whereNull('user_id')->get();

            return $this->success([
                'message' => 'Nitro system test successful',
                'database_connection' => 'OK',
                'nitro_table_exists' => true,
                'available_codes' => count($nitroCodes),
                'sample_codes' => array_slice(array_column($nitroCodes, 'code'), 0, 3)
            ]);

        } catch (Exception $e) {
                        return $this->error('Test failed: ' . $e->getMessage());
        }
    }

    public function listCodes() {
        $this->requireAdmin();

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';

        $query = new Query();

        $queryBuilder = $query->table('nitro')
            ->select('nitro.id, nitro.code, nitro.user_id, nitro.created_at, nitro.updated_at, users.username, users.discriminator')
            ->leftJoin('users', 'nitro.user_id', '=', 'users.id');

        if (!empty($search)) {
            $queryBuilder->where('nitro.code', 'LIKE', "%{$search}%");
        }

        $total = $query->table('nitro')->count();

        $offset = ($page - 1) * $limit;
        $codes = $queryBuilder->orderBy('nitro.created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $nitro_codes = [];
        foreach ($codes as $code) {
            $nitro_codes[] = $code;
        }

        return $this->success([
            'nitro_codes' => $nitro_codes,
            'total' => $total,
            'showing' => count($nitro_codes),
            'page' => $page,
            'limit' => $limit
        ]);
    }

    public function getStats() {
        $this->requireAdmin();

        $query = new Query();

        $total = $query->table('nitro')->count();
        $used = $query->table('nitro')->whereNotNull('user_id')->count();
        $active = $query->table('nitro')->whereNull('user_id')->count();

        return $this->success([
            'stats' => [
                'total' => $total,
                'used' => $used,
                'active' => $active
            ]
        ]);
    }

    public function delete($id) {
        $this->requireAdmin();

        $nitro = $this->nitroRepository->find($id);

        if (!$nitro) {
            return $this->error('Nitro code not found');
        }

        if ($nitro->delete()) {
            return $this->success([
                'message' => 'Nitro code deleted successfully'
            ]);
        }

        return $this->error('Failed to delete nitro code');
    }

    protected function requireAdmin() {
        $this->requireAuth();

        $userId = $this->getCurrentUserId();

        if (isset($_SESSION['username']) && $_SESSION['username'] === 'Admin' && 
            isset($_SESSION['discriminator']) && $_SESSION['discriminator'] === '0000') {
            return true;
        }

        $user = $this->userRepository->find($userId);

        if (!$user || $user->email !== 'admin@admin.com') {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->forbidden('Access denied: Admin privileges required');
            }

            header('Location: /home');
            exit;
        }
    }
} 