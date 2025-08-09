<?php
define('BYPASS_IFRAME_CHECK', true);

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GO BACK TO WORK ! - MisVord</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #2c2f33; 
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
        }
        
        .icon {
            width: 500px;
            height: 500px;
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 48px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <img src="<?php echo asset('common/susdog.png'); ?>" alt="Susdog" class="icon">
    <h1>BALIK KERJA WOI</h1>
</body>
</html>