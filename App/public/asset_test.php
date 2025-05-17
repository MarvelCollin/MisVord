<?php
require_once dirname(__DIR__) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Test</title>
    <link rel="stylesheet" href="<?php echo css('landing-page'); ?>">
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .test-item {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        h1 {
            color: #5865F2;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 10px 0;
        }
        .asset-url {
            font-family: monospace;
            background: #f0f0f0;
            padding: 5px;
            border-radius: 3px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>MiscVord Asset Test</h1>
        
        <div class="test-item">
            <h2>Background Image Test</h2>
            <p>URL: <span class="asset-url"><?php echo asset('landing-page/background.png'); ?></span></p>
            <img src="<?php echo asset('landing-page/background.png'); ?>" alt="Background Image">
        </div>
        
        <div class="test-item">
            <h2>Logo Test</h2>
            <p>URL: <span class="asset-url"><?php echo asset('landing-page/main-logo.png'); ?></span></p>
            <img src="<?php echo asset('landing-page/main-logo.png'); ?>" alt="Main Logo">
        </div>
        
        <div class="test-item">
            <h2>CSS Test</h2>
            <p>URL: <span class="asset-url"><?php echo css('landing-page'); ?></span></p>
            <div class="glass-nav" style="padding: 20px; margin-top: 10px;">
                This div should have the glass-nav style from landing-page.css
            </div>
        </div>
        
        <div class="test-item">
            <h2>JavaScript Test</h2>
            <p>URL: <span class="asset-url"><?php echo js('landing-page'); ?></span></p>
            <button id="test-button" style="padding: 10px; background: #5865F2; color: white; border: none; border-radius: 5px; cursor: pointer;">Click to Test JS</button>
            <div id="js-output" style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 5px;"></div>
        </div>
    </div>
    
    <script src="<?php echo js('landing-page'); ?>"></script>
    <script>
        document.getElementById('test-button').addEventListener('click', function() {
            const output = document.getElementById('js-output');
            output.innerHTML = 'JavaScript is working! Landing page JS is loaded.';
            
            // Check if a function from landing-page.js exists
            if (typeof initFloatingElements === 'function') {
                output.innerHTML += '<br>Landing page function initFloatingElements() exists!';
            } else {
                output.innerHTML += '<br>Warning: Landing page function not found.';
            }
        });
    </script>
</body>
</html> 