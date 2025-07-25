<?php
define('BYPASS_IFRAME_CHECK', true);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Not Allowed - MisVord</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem 2rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 500px;
            width: 90%;
        }
        
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        
        .subtitle {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            line-height: 1.5;
        }
        
        .message {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            border-left: 4px solid #ff6b6b;
        }
        
        .feature-list {
            text-align: left;
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border-radius: 10px;
            margin-top: 1rem;
        }
        
        .feature-list h3 {
            margin-bottom: 1rem;
            color: #ffd93d;
        }
        
        .feature-list ul {
            list-style: none;
        }
        
        .feature-list li {
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        
        .feature-list li:before {
            content: "🔒";
            position: absolute;
            left: 0;
        }
        
        .contact-info {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="icon">🚫</span>
        <h1>Access Not Allowed</h1>
        <p class="subtitle">This application can only be accessed through an authorized iframe</p>
        
        <div class="message">
            <strong>Direct browser access is restricted.</strong><br>
            MisVord is designed to work exclusively within embedded iframe environments for security and functionality purposes.
        </div>
        
        <div class="feature-list">
            <h3>Security Features Active:</h3>
            <ul>
                <li>Iframe-only access validation</li>
                <li>Cross-origin request monitoring</li>
                <li>Embedded session management</li>
                <li>Secure authentication flow</li>
            </ul>
        </div>
        
        <div class="contact-info">
            If you believe this is an error, please contact your system administrator<br>
            or access MisVord through the authorized platform.
        </div>
    </div>
</body>
</html>