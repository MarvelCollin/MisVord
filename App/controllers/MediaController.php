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
        
        // Always store uploads inside the project public/storage directory so
        // files are accessible during local development and testing.
        $this->uploadPath = dirname(__DIR__) . '/public/storage/';
        
        $this->ensureUploadDirectories();
    }

    private function ensureUploadDirectories()
    {
        error_log("Checking storage directory: $this->uploadPath");
        
        if (!is_dir($this->uploadPath)) {
            error_log("Storage directory does not exist, creating: $this->uploadPath");
            if (!mkdir($this->uploadPath, 0777, true)) {
                error_log("Failed to create storage directory: $this->uploadPath");
                throw new Exception("Failed to create storage directory");
            }
            error_log("Successfully created storage directory: $this->uploadPath");
        }
        
        if (!is_writable($this->uploadPath)) {
            error_log("Storage directory not writable, attempting to fix permissions: $this->uploadPath");
            if (!chmod($this->uploadPath, 0777)) {
                error_log("Failed to set permissions for storage directory: $this->uploadPath");
                throw new Exception("Storage directory not writable and cannot fix permissions");
            }
            error_log("Successfully set permissions for storage directory: $this->uploadPath");
        }
        
        error_log("Storage directory ready: $this->uploadPath (writable: " . (is_writable($this->uploadPath) ? 'yes' : 'no') . ")");
    }

    public function uploadMedia()
    {
        $this->requireAuth();
        
        try {
            header('Content-Type: application/json');
            
            error_log("Upload request received. POST data: " . print_r($_POST, true));
            error_log("Files data: " . print_r($_FILES, true));
            error_log("Content-Type header: " . ($_SERVER['CONTENT_TYPE'] ?? 'none'));
            error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
            
            if (empty($_FILES)) {
                error_log("No files found in upload request");
                return $this->validationError(['file' => 'No files detected in request']);
            }
            
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                $errorCode = $_FILES['file']['error'] ?? 'no_file';
                error_log("File upload error. Error code: $errorCode");
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
                error_log("Storage directory still not writable after setup: $this->uploadPath");
                return $this->serverError('Storage directory not writable');
            }

            error_log("Attempting to move file from $tempPath to $absolutePath");
            
            if (!move_uploaded_file($tempPath, $absolutePath)) {
                $uploadError = error_get_last();
                error_log("Failed to move uploaded file: " . print_r($uploadError, true));
                return $this->serverError('Failed to save uploaded file: ' . ($uploadError['message'] ?? 'Unknown error'));
            }

            $fileUrl = "/public/storage/{$fileName}";
            
            return $this->success([
                'file_url' => $fileUrl,
                'file_name' => $originalName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType
            ]);

        } catch (Exception $e) {
            error_log("Media upload error: " . $e->getMessage());
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

                $uploadedFiles[] = [
                    'file_url' => "/public/storage/{$fileName}",
                    'file_name' => $originalName,
                    'file_size' => $fileSize,
                    'mime_type' => $mimeType,

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



    public function getGifs()
    {
        $this->requireAuth();
        
        $query = $_GET['q'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        
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
}
