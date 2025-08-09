<?php
function renderFilePreviewCard($file, $index = 0) {
    $fileName = $file['name'] ?? 'Unknown File';
    $fileSize = $file['size'] ?? 0;
    $fileType = $file['type'] ?? '';
    $filePath = $file['path'] ?? '';
    $fileUrl = $file['url'] ?? $filePath;
    
    $isImage = strpos($fileType, 'image/') === 0;
    $isVideo = strpos($fileType, 'video/') === 0;
    $isAudio = strpos($fileType, 'audio/') === 0;
    $isPdf = $fileType === 'application/pdf';
    $isText = strpos($fileType, 'text/') === 0 || in_array(pathinfo($fileName, PATHINFO_EXTENSION), ['txt', 'md', 'log', 'json', 'xml', 'csv']);
    $isDoc = in_array($fileType, ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
    $isExcel = in_array($fileType, ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    
    $cardId = 'file-card-' . $index;
    $previewId = 'file-preview-' . $index;
    
    echo '<div class="file-upload-card bg-[#2b2d31] rounded-lg p-3 flex items-start gap-3 mb-2 transition-all duration-200 hover:bg-[#36393f]" data-file-index="' . $index . '" id="' . $cardId . '">';
            
    echo '<div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[#36393f] flex items-center justify-center">';
    
    if ($isImage) {
        echo '<div class="w-full h-full bg-cover bg-center image-preview" data-preview-url="" style="background-color: #36393f;">';
        echo '<i class="fas fa-image text-[#b5bac1] text-xl"></i>';
        echo '</div>';
    } elseif ($isVideo) {
        echo '<div class="relative w-full h-full bg-[#36393f] flex items-center justify-center">';
        echo '<i class="fas fa-play text-[#b5bac1] text-xl"></i>';
        echo '</div>';
    } elseif ($isAudio) {
        echo '<div class="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#7289da] flex items-center justify-center">';
        echo '<i class="fas fa-music text-white text-xl"></i>';
        echo '</div>';
    } elseif ($isPdf) {
        echo '<div class="w-full h-full bg-gradient-to-br from-[#dc2626] to-[#ef4444] flex items-center justify-center">';
        echo '<i class="fas fa-file-pdf text-white text-xl"></i>';
        echo '</div>';
    } elseif ($isText) {
        echo '<div class="w-full h-full bg-gradient-to-br from-[#16a34a] to-[#22c55e] flex items-center justify-center">';
        echo '<i class="fas fa-file-text text-white text-xl"></i>';
        echo '</div>';
    } elseif ($isDoc) {
        echo '<div class="w-full h-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center">';
        echo '<i class="fas fa-file-word text-white text-xl"></i>';
        echo '</div>';
    } elseif ($isExcel) {
        echo '<div class="w-full h-full bg-gradient-to-br from-[#16a34a] to-[#22c55e] flex items-center justify-center">';
        echo '<i class="fas fa-file-excel text-white text-xl"></i>';
        echo '</div>';
    } else {
        echo '<div class="w-full h-full bg-[#36393f] flex items-center justify-center">';
        echo '<i class="fas fa-file text-[#b5bac1] text-xl"></i>';
        echo '</div>';
    }
    
    echo '</div>';
    
    echo '<div class="flex-1 min-w-0">';
    echo '<div class="flex items-center justify-between">';
    echo '<div class="min-w-0 flex-1">';
    echo '<div class="text-[#f2f3f5] font-medium text-sm truncate" title="' . htmlspecialchars($fileName) . '">' . htmlspecialchars($fileName) . '</div>';
    echo '<div class="text-[#b5bac1] text-xs">' . formatFileSize($fileSize) . '</div>';
    echo '</div>';
    
    echo '<div class="flex items-center gap-1 ml-2">';
    echo '<button class="file-preview-btn w-8 h-8 bg-[#36393f] hover:bg-[#5865f2] rounded-full flex items-center justify-center text-[#b5bac1] hover:text-white transition-all duration-200" data-action="preview" data-file-index="' . $index . '" title="Preview">';
    echo '<i class="fas fa-eye text-sm"></i>';
    echo '</button>';
    echo '<button class="file-edit-btn w-8 h-8 bg-[#36393f] hover:bg-[#5865f2] rounded-full flex items-center justify-center text-[#b5bac1] hover:text-white transition-all duration-200" data-action="edit" data-file-index="' . $index . '" title="Edit">';
    echo '<i class="fas fa-edit text-sm"></i>';
    echo '</button>';
    echo '<button class="file-remove-btn w-8 h-8 bg-[#36393f] hover:bg-[#ed4245] rounded-full flex items-center justify-center text-[#b5bac1] hover:text-white transition-all duration-200" data-action="remove" data-file-index="' . $index . '" title="Remove">';
    echo '<i class="fas fa-times text-sm"></i>';
    echo '</button>';
    echo '</div>';
    echo '</div>';
    
    if ($isText) {
        echo '<div class="mt-2 bg-[#1e1f22] rounded-md p-2 text-xs font-mono text-[#dcddde] max-h-20 overflow-hidden" id="' . $previewId . '">';
        echo '<div class="text-[#72767d]">Loading preview...</div>';
        echo '</div>';
    }
    
    echo '</div>';
    echo '</div>';
}

function formatFileSize($bytes) {
    if (!$bytes || $bytes === 0) {
        return '0 B';
    }
    
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' B';
    }
}

function createFilePreviewModal() {
    echo '<div id="file-preview-modal" class="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] opacity-0 invisible transition-all duration-200" style="display: none;">';
    echo '<div class="bg-[#36393f] rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col shadow-2xl transform scale-95 transition-transform duration-200" id="modal-container">';
    
    echo '<div class="flex items-center justify-between p-4 border-b border-[#3f4147]">';
    echo '<div class="flex items-center gap-2">';
    echo '<div id="modal-file-icon" class="w-6 h-6 flex items-center justify-center text-[#b5bac1]">';
    echo '<i class="fas fa-file"></i>';
    echo '</div>';
    echo '<h3 class="text-white font-semibold text-lg truncate" id="modal-title">File Preview</h3>';
    echo '</div>';
    echo '<div class="flex items-center gap-2">';
    echo '<button class="text-[#b5bac1] hover:text-white p-2 rounded-full hover:bg-[#4f5660] transition-all duration-200" id="modal-download" title="Download">';
    echo '<i class="fas fa-download"></i>';
    echo '</button>';
    echo '<button class="text-[#b5bac1] hover:text-white p-2 rounded-full hover:bg-[#4f5660] transition-all duration-200" id="modal-close" title="Close">';
    echo '<i class="fas fa-times"></i>';
    echo '</button>';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="flex-1 overflow-auto p-4" id="modal-content">';
    echo '<div class="flex items-center justify-center h-64 text-[#b5bac1]">';
    echo '<div class="text-center">';
    echo '<i class="fas fa-spinner fa-spin text-3xl mb-2"></i>';
    echo '<div>Loading...</div>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="border-t border-[#3f4147] p-4 hidden" id="modal-footer">';
    echo '<div class="flex items-center justify-between text-sm text-[#b5bac1]">';
    echo '<div id="modal-file-info"></div>';
    echo '<div class="flex items-center gap-2">';
    echo '<button class="px-3 py-1 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors duration-200" id="modal-open-external">';
    echo 'Open Externally';
    echo '</button>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    echo '</div>';
    echo '</div>';
}

function createFileUploadArea() {
    echo '<div id="file-upload-area" class="hidden">';
    echo '<div class="bg-[#2b2d31] rounded-lg p-4 mb-2">';
    echo '<div class="flex items-center justify-between mb-3">';
    echo '<div class="flex items-center gap-2 text-[#f2f3f5] font-medium">';
    echo '<i class="fas fa-paperclip text-[#b5bac1]"></i>';
    echo '<span>Uploading files</span>';
    echo '<span class="text-xs text-[#b5bac1] bg-[#36393f] px-2 py-1 rounded" id="file-count">0 files</span>';
    echo '</div>';
    echo '<button class="text-[#b5bac1] hover:text-white transition-colors duration-200" id="clear-all-files" title="Remove all files">';
    echo '<i class="fas fa-times"></i>';
    echo '</button>';
    echo '</div>';
    echo '<div id="file-upload-list" class="flex flex-wrap gap-2 max-h-60 overflow-y-auto">';
    echo '</div>';
    echo '</div>';
    echo '</div>';
}
?>
