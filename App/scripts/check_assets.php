<?php

require_once dirname(__DIR__) . '/config/helpers.php';

echo "Checking asset directories structure...\n";

$directories = [
    dirname(__DIR__) . '/public/images',
    dirname(__DIR__) . '/public/images/landing-page',
    dirname(__DIR__) . '/public/css',
    dirname(__DIR__) . '/public/js',
    dirname(__DIR__) . '/public/js/sections'
];

foreach ($directories as $directory) {
    if (!file_exists($directory)) {
        echo "Creating directory: $directory\n";
        mkdir($directory, 0755, true);
    } else {
        echo "Directory exists: $directory\n";
    }
}

echo "\nAll necessary directories are in place!\n";

$landingPageDir = dirname(__DIR__) . '/public/images/landing-page';
if (file_exists($landingPageDir)) {
    echo "\nImages in landing-page directory:\n";
    $images = scandir($landingPageDir);
    foreach ($images as $image) {
        if ($image != '.' && $image != '..') {
            echo "- $image\n";
        }
    }
} else {
    echo "\nLanding page image directory does not exist yet.\n";
}

echo "\nMake sure to put your images in the correct directories!\n";    
echo "Image paths should be: /images/landing-page/your-image.webp\n";
echo "JS paths should be: /js/your-script.js\n";
echo "CSS paths should be: /css/your-style.css\n";

echo "\nFinished checking assets structure!\n";