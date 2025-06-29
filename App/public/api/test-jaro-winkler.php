<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jaro-Winkler Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #2f3136; color: white; }
        .container { max-width: 800px; margin: 0 auto; }
        .test-section { margin: 20px 0; padding: 20px; background: #36393f; border-radius: 8px; }
        input { padding: 10px; margin: 10px; background: #40444b; color: white; border: 1px solid #72767d; border-radius: 4px; }
        button { padding: 10px 20px; background: #5865f2; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .results { margin-top: 20px; }
        .user-item { padding: 10px; margin: 5px 0; background: #40444b; border-radius: 4px; }
        mark { background-color: rgba(250, 168, 26, 0.3); color: #faa81a; padding: 1px 2px; border-radius: 2px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Jaro-Winkler Algorithm Test</h1>
        
        <div class="test-section">
            <h3>Basic Distance Test</h3>
            <input type="text" id="string1" placeholder="String 1" value="john_doe">
            <input type="text" id="string2" placeholder="String 2" value="johndoe">
            <button onclick="testDistance()">Calculate Distance</button>
            <div id="distance-result"></div>
        </div>
        
        <div class="test-section">
            <h3>User Search Test</h3>
            <input type="text" id="search-query" placeholder="Search query" value="john">
            <button onclick="testUserSearch()">Search Users</button>
            <div id="search-results" class="results"></div>
        </div>
    </div>

    <script type="module">
        import { jaroWinkler } from '../js/utils/jaro-winkler.js';
        
        window.jaroWinkler = jaroWinkler;
        
        window.testDistance = function() {
            const str1 = document.getElementById('string1').value;
            const str2 = document.getElementById('string2').value;
            const distance = jaroWinkler.calculateDistance(str1, str2);
            
            document.getElementById('distance-result').innerHTML = 
                `<p>Distance: <strong>${distance.toFixed(4)}</strong></p>`;
        };
        
        window.testUserSearch = function() {
            const query = document.getElementById('search-query').value;
            const mockUsers = [
                { id: 1, username: 'john_doe', display_name: 'John Doe', email: 'john@example.com' },
                { id: 2, username: 'jane_smith', display_name: 'Jane Smith', email: 'jane@example.com' },
                { id: 3, username: 'johnathan', display_name: 'Johnathan Brown', email: 'johnathan@example.com' },
                { id: 4, username: 'johnny', display_name: 'Johnny Cash', email: 'johnny@music.com' },
                { id: 5, username: 'admin', display_name: 'Administrator', email: 'admin@admin.com' },
                { id: 6, username: 'user123', display_name: 'Regular User', email: 'user@test.com' }
            ];
            
            const results = jaroWinkler.searchUsers(mockUsers, query, {
                threshold: 0.3,
                maxResults: 10,
                fields: ['username', 'display_name', 'email'],
                weights: { username: 1.0, display_name: 0.8, email: 0.6 }
            });
            
            let html = '<h4>Search Results:</h4>';
            if (results.length === 0) {
                html += '<p>No results found</p>';
            } else {
                results.forEach(user => {
                    const highlightedUsername = jaroWinkler.highlightMatches(user.username, query);
                    const highlightedDisplayName = jaroWinkler.highlightMatches(user.display_name, query);
                    const highlightedEmail = jaroWinkler.highlightMatches(user.email, query);
                    
                    html += `
                        <div class="user-item">
                            <strong>${highlightedUsername}</strong> (${highlightedDisplayName})<br>
                            <small>${highlightedEmail}</small>
                        </div>
                    `;
                });
            }
            
            document.getElementById('search-results').innerHTML = html;
        };
        
        // Auto-run tests
        setTimeout(() => {
            testDistance();
            testUserSearch();
        }, 100);
    </script>
</body>
</html> 