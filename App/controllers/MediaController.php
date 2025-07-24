<?php

require_once __DIR__ . '/BaseController.php';

class MediaController extends BaseController
{
    private $uploadPath;
    private $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private $allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg'];
    private $allowedFileTypes = [
        'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip', 'application/x-rar-compressed', 'video/mp4', 'video/avi', 'video/mov'
    ];
    private $maxFileSize = 100 * 1024 * 1024;

    public function __construct()
    {
        parent::__construct();

        $this->uploadPath = dirname(__DIR__) . '/public/storage/';

        $this->ensureUploadDirectories();
    }

    private function ensureUploadDirectories()
    {
        if (!is_dir($this->uploadPath)) {
            if (!mkdir($this->uploadPath, 0777, true)) {
                throw new Exception("Failed to create storage directory");
            }
            chmod($this->uploadPath, 0777);
        }

        if (!is_writable($this->uploadPath)) {
            chmod($this->uploadPath, 0777);
            if (!is_writable($this->uploadPath)) {
                throw new Exception("Storage directory not writable and cannot fix permissions");
            }
        }
    }

    public function uploadMedia()
    {
        $this->requireAuth();

        try {
            header('Content-Type: application/json');

                                                            if (empty($_FILES)) {
                                return $this->validationError(['file' => 'No files detected in request']);
            }

            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                $errorCode = $_FILES['file']['error'] ?? 'no_file';
                                return $this->validationError(['file' => 'No file uploaded or upload error. Code: ' . $errorCode]);
            }

            $file = $_FILES['file'];
            $originalName = $file['name'];
            $tempPath = $file['tmp_name'];
            $fileSize = $file['size'];
            $mimeType = mime_content_type($tempPath);

            if ($fileSize > $this->maxFileSize) {
                return $this->validationError(['file' => 'File size exceeds 100MB limit']);
            }

            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $fileName = uniqid() . '_' . time() . '.' . $extension;
            $absolutePath = $this->uploadPath . $fileName;

            $this->ensureUploadDirectories();

            if (!is_writable($this->uploadPath)) {
                                return $this->serverError('Storage directory not writable');
            }

                        if (!move_uploaded_file($tempPath, $absolutePath)) {
                $uploadError = error_get_last();
                return $this->serverError('Failed to save uploaded file: ' . ($uploadError['message'] ?? 'Unknown error'));
            }

            chmod($absolutePath, 0644);

            $fileUrl = "/public/storage/{$fileName}";

            return $this->success([
                'file_url' => $fileUrl,
                'file_name' => $originalName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType
            ]);

        } catch (Exception $e) {
                        return $this->serverError('Upload failed: ' . $e->getMessage());
        }
    }

    public function uploadMultipleMedia()
    {
        $this->requireAuth();

        try {
            if (!isset($_FILES['files']) || !is_array($_FILES['files']['name'])) {
                return $this->validationError(['files' => 'No files uploaded']);
            }

            $files = $_FILES['files'];
            $uploadedFiles = [];
            $errors = [];

            $fileCount = count($files['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($files['error'][$i] !== UPLOAD_ERR_OK) {
                    $errors[] = "File {$i}: Upload error";
                    continue;
                }

                $originalName = $files['name'][$i];
                $tempPath = $files['tmp_name'][$i];
                $fileSize = $files['size'][$i];
                $mimeType = mime_content_type($tempPath);

                if ($fileSize > $this->maxFileSize) {
                    $errors[] = "File '{$originalName}': Size exceeds 100MB limit";
                    continue;
                }

                $extension = pathinfo($originalName, PATHINFO_EXTENSION);
                $fileName = uniqid() . '_' . time() . '.' . $extension;
                $absolutePath = $this->uploadPath . $fileName;

                if (!move_uploaded_file($tempPath, $absolutePath)) {
                    $errors[] = "File '{$originalName}': Failed to save";
                    continue;
                }

                chmod($absolutePath, 0644);

                $uploadedFiles[] = [
                    'file_url' => "/public/storage/{$fileName}",
                    'file_name' => $originalName,
                    'file_size' => $fileSize,
                    'mime_type' => $mimeType
                ];
            }

            return $this->success([
                'uploaded_files' => $uploadedFiles,
                'errors' => $errors,
                'total_uploaded' => count($uploadedFiles),
                'total_errors' => count($errors)
            ]);

        } catch (Exception $e) {
                        return $this->serverError('Upload failed');
        }
    }

    public function getGifs()
    {
        $this->requireAuth();

        $query = $_GET['q'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 20), 50);

        if (empty($query)) {
            return $this->validationError(['query' => 'Search query is required']);
        }

        try {        
        $apiKey = EnvLoader::get('TENOR_API_KEY');
        
        if (empty($apiKey)) {
            return $this->error('TENOR_API_KEY environment variable is required but not set', 500);
        }
            $url = "https://tenor.googleapis.com/v2/search?" . http_build_query([
                'q' => $query,
                'key' => $apiKey,
                'limit' => $limit,
                'media_filter' => 'gif',
                'contentfilter' => 'medium'
            ]);

            $context = stream_context_create([
                'http' => [
                    'timeout' => 10,
                    'user_agent' => 'MisVord/1.0'
                ]
            ]);

            $response = file_get_contents($url, false, $context);

            if ($response === false) {

                return $this->success([
                    'results' => [
                        [
                            'id' => 'demo1',
                            'title' => 'Demo GIF 1',
                            'media_formats' => [
                                'gif' => [
                                    'url' => 'https://media.tenor.com/images/5c4a4d3c0f4a4d3c0f4a4d3c/tenor.gif',
                                    'preview' => 'https://media.tenor.com/images/5c4a4d3c0f4a4d3c0f4a4d3c/tenor.gif'
                                ]
                            ]
                        ]
                    ]
                ]);
            }

            $data = json_decode($response, true);

            if (!$data || !isset($data['results'])) {
                return $this->success(['results' => []]);
            }

            return $this->success($data);

        } catch (Exception $e) {
                        $demoGifs = [
                [
                    'id' => 'demo1',
                    'title' => 'Demo GIF 1',
                    'url' => 'https://media.tenor.com/images/5c4a4d3c0f4a4d3c0f4a4d3c/tenor.gif',
                    'preview' => 'https://media.tenor.com/images/5c4a4d3c0f4a4d3c0f4a4d3c/tenor.gif'
                ]
            ];

            return $this->success([
                'results' => $demoGifs
            ]);
        }
    }

    public function searchMusic()
    {
        try {
            $query = $_GET['query'] ?? '';
            $limit = $_GET['limit'] ?? 10;
            
            if (empty($query)) {
                return $this->error('Query parameter is required', 400);
            }

            $apiUrl = 'https://itunes.apple.com/search?' . http_build_query([
                'term' => $query,
                'media' => 'music',
                'limit' => $limit,
                'country' => 'us'
            ]);

            $context = stream_context_create([
                'http' => [
                    'timeout' => 8,
                    'user_agent' => 'MisVord/1.0',
                    'ignore_errors' => true
                ]
            ]);

            $startTime = microtime(true);
            $response = @file_get_contents($apiUrl, false, $context);
            $endTime = microtime(true);
            $requestTime = $endTime - $startTime;
            
            error_log("Music search API request time: {$requestTime}s for query: {$query}");
            
            if ($response === false) {
                error_log("iTunes API request failed for query: {$query}");
                
                return $this->success([
                    'results' => [
                        [
                            'title' => 'Sample Track',
                            'artist' => 'Sample Artist', 
                            'album' => 'Sample Album',
                            'previewUrl' => 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                            'artworkUrl' => '/public/assets/default-music-art.jpg',
                            'duration' => 30000,
                            'id' => 999999,
                            'price' => 0,
                            'releaseDate' => date('Y-m-d\TH:i:s\Z')
                        ]
                    ]
                ]);
            }

            $data = json_decode($response, true);
            
            if (!$data || !isset($data['results'])) {
                return $this->error('Invalid response from music API', 500);
            }

            $filteredResults = array_filter($data['results'], function($track) {
                return isset($track['previewUrl']) && !empty($track['previewUrl']);
            });

            if (empty($filteredResults)) {
                return $this->success([
                    'results' => [
                        [
                            'title' => 'Sample Track',
                            'artist' => 'Sample Artist', 
                            'album' => 'Sample Album',
                            'previewUrl' => 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                            'artworkUrl' => '/public/assets/default-music-art.jpg',
                            'duration' => 30000,
                            'id' => 999999,
                            'price' => 0,
                            'releaseDate' => date('Y-m-d\TH:i:s\Z')
                        ]
                    ]
                ]);
            }

            $formattedResults = array_map(function($track) {
                return [
                    'title' => $track['trackName'] ?? '',
                    'artist' => $track['artistName'] ?? '',
                    'album' => $track['collectionName'] ?? '',
                    'previewUrl' => $track['previewUrl'] ?? '',
                    'artworkUrl' => $track['artworkUrl100'] ?? '',
                    'duration' => $track['trackTimeMillis'] ?? 0,
                    'id' => $track['trackId'] ?? 0,
                    'price' => $track['trackPrice'] ?? 0,
                    'releaseDate' => $track['releaseDate'] ?? ''
                ];
            }, $filteredResults);

            return $this->success([
                'results' => array_values($formattedResults)
            ]);

        } catch (Exception $e) {
            error_log("Music search error: " . $e->getMessage());
            return $this->error('Music search failed', 500);
        }
    }
}
