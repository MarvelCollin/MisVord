<?php
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
    <title>ChatAPI Test</title>
    <script>
        function checkChatAPI() {
            console.log('🔍 ChatAPI Status Check:', {
                ChatAPI: typeof window.ChatAPI,
                chatAPI: typeof window.chatAPI,
                instance: window.ChatAPI,
                methods: window.ChatAPI ? Object.getOwnPropertyNames(Object.getPrototypeOf(window.ChatAPI)) : 'N/A'
            });
            
            document.getElementById('status').innerHTML = `
                <h3>ChatAPI Status:</h3>
                <p>window.ChatAPI: ${typeof window.ChatAPI}</p>
                <p>window.chatAPI: ${typeof window.chatAPI}</p>
                <p>Ready: ${window.ChatAPI ? '✅ YES' : '❌ NO'}</p>
            `;
        }
    </script>
</head>
<body>
    <h1>ChatAPI Status Test</h1>
    <button onclick="checkChatAPI()">Check ChatAPI Status</button>
    <div id="status"></div>
    
    <script src="/public/js/api/chat-api.js?v=<?php echo time(); ?>"></script>
    <script>
        setTimeout(checkChatAPI, 100);
    </script>
</body>
</html> 