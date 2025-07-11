<?php
echo "<h1>PHP Test</h1>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>Server: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p>Current Time: " . date('Y-m-d H:i:s') . "</p>";
phpinfo();
?>
