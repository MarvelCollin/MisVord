<?php

require_once __DIR__ . '/BaseController.php';

class MediaController extends BaseController
{
    private $uploadPath;
    private $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private $allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg'];
    private $maxFileSize = 25 * 1024 * 1024; // 25MB

    public function __construct()
    {
        parent::__construct();
        $this->uploadPath = __DIR__ . '/../public/uploads/';
        
        $this->ensureUploadDirectories();
    }

    private function ensureUploadDirectories()
    {
        $directories = [
            $this->uploadPath,
            $this->uploadPath . 'images/',
            $this->uploadPath . 'audio/',
            $this->uploadPath . 'files/'
        ];

        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }

    public function uploadMedia()
    {
        $this->requireAuth();
        
        try {
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                return $this->validationError(['file' => 'No file uploaded or upload error']);
            }

            $file = $_FILES['file'];
            $originalName = $file['name'];
            $tempPath = $file['tmp_name'];
            $fileSize = $file['size'];
            $mimeType = mime_content_type($tempPath);

            if ($fileSize > $this->maxFileSize) {
                return $this->validationError(['file' => 'File size exceeds 25MB limit']);
            }

            $category = $this->determineFileCategory($mimeType);
            if (!$category) {
                return $this->validationError(['file' => 'Unsupported file type']);
            }

            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $fileName = uniqid() . '_' . time() . '.' . $extension;
            $relativePath = "uploads/{$category}/{$fileName}";
            $absolutePath = $this->uploadPath . "{$category}/{$fileName}";

            if (!move_uploaded_file($tempPath, $absolutePath)) {
                return $this->serverError('Failed to save uploaded file');
            }

            return $this->success([
                'file_url' => '/' . $relativePath,
                'file_name' => $originalName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'category' => $category
            ]);

        } catch (Exception $e) {
            error_log("Media upload error: " . $e->getMessage());
            return $this->serverError('Upload failed');
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
                    $errors[] = "File '{$originalName}': Size exceeds 25MB limit";
                    continue;
                }

                $category = $this->determineFileCategory($mimeType);
                if (!$category) {
                    $errors[] = "File '{$originalName}': Unsupported file type";
                    continue;
                }

                $extension = pathinfo($originalName, PATHINFO_EXTENSION);
                $fileName = uniqid() . '_' . time() . '.' . $extension;
                $relativePath = "uploads/{$category}/{$fileName}";
                $absolutePath = $this->uploadPath . "{$category}/{$fileName}";

                if (!move_uploaded_file($tempPath, $absolutePath)) {
                    $errors[] = "File '{$originalName}': Failed to save";
                    continue;
                }

                $uploadedFiles[] = [
                    'file_url' => '/' . $relativePath,
                    'file_name' => $originalName,
                    'file_size' => $fileSize,
                    'mime_type' => $mimeType,
                    'category' => $category
                ];
            }

            return $this->success([
                'uploaded_files' => $uploadedFiles,
                'errors' => $errors,
                'total_uploaded' => count($uploadedFiles),
                'total_errors' => count($errors)
            ]);

        } catch (Exception $e) {
            error_log("Multiple media upload error: " . $e->getMessage());
            return $this->serverError('Upload failed');
        }
    }

    private function determineFileCategory($mimeType)
    {
        if (in_array($mimeType, $this->allowedImageTypes)) {
            return 'images';
        } elseif (in_array($mimeType, $this->allowedAudioTypes)) {
            return 'audio';
        }
        
        return null;
    }

    public function getGifs()
    {
        $this->requireAuth();
        
        $query = $_GET['q'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 20), 50); // Max 50 GIFs

        if (empty($query)) {
            return $this->validationError(['query' => 'Search query is required']);
        }

        try {
            // Using Tenor API (free tier)
            $apiKey = 'AIzaSyAyimkuYQYF-FzifhRdMndB8AYrLlNVTNY'; // Tenor API key (you should use your own)
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
                // Fallback: return some demo GIFs
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
            error_log("GIF search error: " . $e->getMessage());
            return $this->serverError('GIF search failed');
        }
    }
}
