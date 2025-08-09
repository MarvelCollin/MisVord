<?php

require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/BaseController.php';

class ExploreController extends BaseController
{
    private $serverRepository;
    private $userServerMembershipRepository;

    public function __construct()
    {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
    }

    public function getPublicServers()
    {
        try {
            $servers = $this->serverRepository->getPublicServersWithMemberCount();

            return array_map(function($server) {
                return is_array($server) ? $server : (array) $server;
            }, $servers);
        } catch (Exception $e) {
            return [];
        }
    }

    public function getPaginatedServers($page = 1, $perPage = 12, $sort = 'alphabetical', $category = '', $search = '') {
        try {
            $offset = ($page - 1) * $perPage;
            $currentUserId = $_SESSION['user_id'] ?? 0;
            

            $baseServers = $this->serverRepository->getPublicServersWithMemberCount();
            $userServerIds = $this->getUserServerIds($currentUserId);
            

            $servers = array_map(function($server) use ($userServerIds) {
                $serverArray = is_array($server) ? $server : (array) $server;
                $serverArray['is_member'] = in_array($serverArray['id'], $userServerIds);
                return $serverArray;
            }, $baseServers);
            

            if (!empty($category)) {
                $servers = array_filter($servers, function($server) use ($category) {
                    return $server['category'] === $category;
                });
            }
            
            if (!empty($search)) {
                $searchLower = strtolower($search);
                $servers = array_filter($servers, function($server) use ($searchLower) {
                    return strpos(strtolower($server['name']), $searchLower) !== false ||
                           strpos(strtolower($server['description'] ?? ''), $searchLower) !== false;
                });
            }
            

            switch ($sort) {
                case 'alphabetical':
                    usort($servers, function($a, $b) {
                        return strcmp($a['name'], $b['name']);
                    });
                    break;
                case 'alphabetical-desc':
                    usort($servers, function($a, $b) {
                        return strcmp($b['name'], $a['name']);
                    });
                    break;
                case 'members-desc':
                    usort($servers, function($a, $b) {
                        return ($b['member_count'] ?? 0) - ($a['member_count'] ?? 0);
                    });
                    break;
                case 'members-asc':
                    usort($servers, function($a, $b) {
                        return ($a['member_count'] ?? 0) - ($b['member_count'] ?? 0);
                    });
                    break;
                case 'newest':
                    usort($servers, function($a, $b) {
                        return $b['id'] - $a['id'];
                    });
                    break;
                case 'oldest':
                    usort($servers, function($a, $b) {
                        return $a['id'] - $b['id'];
                    });
                    break;
            }
            
            $total = count($servers);
            $paginatedServers = array_slice($servers, $offset, $perPage);
            $hasMore = ($offset + $perPage) < $total;
            

            $formattedServers = array_map(function($server) {
                return [
                    'id' => $server['id'],
                    'name' => $server['name'],
                    'description' => $server['description'] ?: 'No description available.',
                    'category' => $server['category'] ?? '',
                    'member_count' => intval($server['member_count'] ?? 0),
                    'is_member' => boolval($server['is_member'] ?? false),
                    'image_url' => $server['image_url'] ?? null,
                    'banner_url' => $server['banner_url'] ?? null,
                    'created_at' => $server['created_at'] ?? null
                ];
            }, $paginatedServers);
            
            return [
                'servers' => $formattedServers,
                'has_more' => $hasMore,
                'total' => $total,
                'current_page' => $page,
                'total_pages' => ceil($total / $perPage)
            ];
            
        } catch (Exception $e) {
            error_log("Error in getPaginatedServers: " . $e->getMessage());
            throw $e;
        }
    }

    private function getFeaturedServers($limit = 3)
    {
        try {
            $featuredServers = $this->serverRepository->getFeaturedServersWithMemberCount($limit);

            return array_map(function($server) {
                return is_array($server) ? $server : (array) $server;
            }, $featuredServers);
        } catch (Exception $e) {
            return [];
        }
    }

    private function getUserServerIds($userId)
    {
        try {
            return $this->userServerMembershipRepository->getServerIdsForUser($userId);
        } catch (Exception $e) {
            return [];
        }
    }

    public function prepareExploreData()
    {
        $currentUserId = $_SESSION['user_id'] ?? 0;

        $userServers = $this->serverRepository->getForUser($currentUserId);
        $userServers = array_map(function($server) {
            return is_array($server) ? $server : (array) $server;
        }, $userServers);

        $initialData = $this->getPaginatedServers(1, 6);
        $servers = $initialData['servers'];
        $userServerIds = $this->getUserServerIds($currentUserId);

        $categories = [
            'gaming' => 'Gaming',
            'music' => 'Music',
            'education' => 'Education',
            'science' => 'Science & Tech',
            'entertainment' => 'Entertainment',
            'community' => 'Community'
        ];

        return [
            'userServers' => $userServers,
            'servers' => $servers,
            'userServerIds' => $userServerIds,
            'categories' => $categories,
            'currentUserId' => $currentUserId,
            'initialData' => $initialData
        ];
    }

}