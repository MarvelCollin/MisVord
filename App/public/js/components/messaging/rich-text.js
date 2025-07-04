class RichTextHandler {
    constructor() {
        this.mentionRegex = /@(\w+)/g;
        this.allMentionRegex = /@all/g;
        this.roleMentionRegex = /@(admin|members|owner)/g;
        this.urlRegex = /(https?:\/\/[^\s]+)/g;
        this.emojiRegex = /:([a-zA-Z0-9_]+):/g;
        this.boldRegex = /\*\*(.*?)\*\*/g;
        this.italicRegex = /\*(.*?)\*/g;
        this.codeRegex = /`(.*?)`/g;
        this.codeBlockRegex = /```([\s\S]*?)```/g;
    }

    formatMessageContent(content, availableUsers = new Map()) {
        if (!content || typeof content !== 'string') {
            return '';
        }

        let formatted = content;

        formatted = this.formatCodeBlocks(formatted);
        formatted = this.formatInlineCode(formatted);
        formatted = this.formatMentions(formatted, availableUsers);
        formatted = this.formatUrls(formatted);
        formatted = this.formatTextStyles(formatted);
        formatted = this.formatEmojis(formatted);

        return formatted;
    }

    formatMentions(content, availableUsers = new Map()) {
        content = content.replace(this.allMentionRegex, 
            '<span class="mention mention-all bubble-mention bubble-mention-all user-profile-trigger text-orange-400 bg-orange-900/30 px-1 rounded font-medium" data-mention-type="all" title="Mention everyone">@all</span>'
        );

        content = content.replace(this.roleMentionRegex, 
            '<span class="mention mention-role bubble-mention bubble-mention-role text-purple-400 bg-purple-900/30 px-1 rounded font-medium" data-mention-type="role" title="Mention role">@$1</span>'
        );

        content = content.replace(this.mentionRegex, (match, username) => {
            if (['all', 'admin', 'members', 'owner'].includes(username.toLowerCase())) {
                return match;
            }
            const user = availableUsers.get(username.toLowerCase());
            if (user) {
                return `<span class="mention mention-user bubble-mention bubble-mention-user user-profile-trigger text-blue-400 bg-blue-900/30 px-1 rounded font-medium" data-mention-type="user" data-user-id="${user.id}" data-username="${user.username}" title="@${user.username}">@${user.username}</span>`;
            }
            return match;
        });

        return content;
    }

    formatUrls(content) {
        return content.replace(this.urlRegex, (url) => {
            const displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 hover:underline">${displayUrl}</a>`;
        });
    }

    formatTextStyles(content) {
        content = content.replace(this.boldRegex, '<strong class="font-bold">$1</strong>');
        content = content.replace(this.italicRegex, '<em class="italic">$1</em>');
        return content;
    }

    formatInlineCode(content) {
        return content.replace(this.codeRegex, '<code class="bg-gray-800 text-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    }

    formatCodeBlocks(content) {
        return content.replace(this.codeBlockRegex, '<pre class="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto"><code class="font-mono text-sm">$1</code></pre>');
    }

    formatEmojis(content) {
        return content.replace(this.emojiRegex, (match, emojiName) => {
            const emojiMap = {
                'smile': '😄',
                'heart': '❤️',
                'thumbsup': '👍',
                'thumbsdown': '👎',
                'fire': '🔥',
                'party': '🎉',
                'eyes': '👀',
                'thinking': '🤔',
                'laughing': '😂',
                'cry': '😭',
                'angry': '😠',
                'cool': '😎',
                'wave': '👋',
                'clap': '👏',
                'check': '✅',
                'cross': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            };
            
            return emojiMap[emojiName.toLowerCase()] || match;
        });
    }

    parseMentions(content) {
        const mentions = [];
        
        if (this.allMentionRegex.test(content)) {
            mentions.push({
                type: 'all',
                username: 'all',
                user_id: 'all'
            });
        }

        let roleMatch;
        this.roleMentionRegex.lastIndex = 0;
        while ((roleMatch = this.roleMentionRegex.exec(content)) !== null) {
            mentions.push({
                type: 'role',
                username: roleMatch[1],
                user_id: roleMatch[1]
            });
        }

        let match;
        this.mentionRegex.lastIndex = 0;
        while ((match = this.mentionRegex.exec(content)) !== null) {
            if (['all', 'admin', 'members', 'owner'].includes(match[1].toLowerCase())) {
                continue;
            }
            mentions.push({
                type: 'user',
                username: match[1],
                user_id: null
            });
        }

        return mentions;
    }

    extractPlainText(htmlContent) {
        if (!htmlContent) return '';
        
        const div = document.createElement('div');
        div.innerHTML = htmlContent;
        return div.textContent || div.innerText || '';
    }

    highlightText(content, searchTerm) {
        if (!searchTerm || !content) return content;
        
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return content.replace(regex, '<mark class="bg-yellow-300 text-black px-1 rounded">$1</mark>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    unescapeHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    truncateContent(content, maxLength = 100) {
        if (!content || content.length <= maxLength) {
            return content;
        }
        
        const plainText = this.extractPlainText(content);
        if (plainText.length <= maxLength) {
            return content;
        }
        
        return plainText.substring(0, maxLength - 3) + '...';
    }

    renderMentionInInput(inputElement, mentionText, startIndex, endIndex) {
        if (!inputElement || !mentionText) return;

        const value = inputElement.value;
        const beforeMention = value.substring(0, startIndex);
        const afterMention = value.substring(endIndex);
        
        const newValue = beforeMention + mentionText + ' ' + afterMention;
        inputElement.value = newValue;
        
        const newCursorPosition = startIndex + mentionText.length + 1;
        inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        inputElement.focus();
    }

    detectMentionInProgress(inputValue, cursorPosition) {
        const beforeCursor = inputValue.substring(0, cursorPosition);
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        
        if (mentionMatch) {
            return {
                isInProgress: true,
                searchTerm: mentionMatch[1].toLowerCase(),
                startIndex: mentionMatch.index,
                fullMatch: mentionMatch[0]
            };
        }
        
        return {
            isInProgress: false,
            searchTerm: '',
            startIndex: -1,
            fullMatch: ''
        };
    }

    renderMessagePreview(content, maxLength = 200) {
        if (!content) return '';
        
        const truncated = this.truncateContent(content, maxLength);
        return this.formatMessageContent(truncated);
    }

    sanitizeInput(input) {
        if (!input || typeof input !== 'string') return '';
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    createMentionElement(username, userId, type = 'user') {
        const span = document.createElement('span');
        span.className = `mention mention-${type} bubble-mention bubble-mention-${type} user-profile-trigger`;
        
        if (type === 'all') {
            span.className += ' text-orange-400 bg-orange-900/30 px-1 rounded font-medium';
            span.textContent = '@all';
            span.title = 'Mention everyone';
            span.setAttribute('data-mention-type', 'all');
        } else {
            span.className += ' text-blue-400 bg-blue-900/30 px-1 rounded font-medium';
            span.textContent = `@${username}`;
            span.title = `@${username}`;
            span.setAttribute('data-mention-type', 'user');
            span.setAttribute('data-username', username);
            if (userId) {
                span.setAttribute('data-user-id', userId);
            }
        }
        
        return span;
    }

    addMentionToInput(inputElement, mention) {
        if (!inputElement || !mention) return;

        const cursorPosition = inputElement.selectionStart;
        const value = inputElement.value;
        
        const detection = this.detectMentionInProgress(value, cursorPosition);
        
        if (detection.isInProgress) {
            const beforeMention = value.substring(0, detection.startIndex);
            const afterCursor = value.substring(cursorPosition);
            
            const mentionText = mention.type === 'all' ? '@all' : `@${mention.username}`;
            const newValue = beforeMention + mentionText + ' ' + afterCursor;
            
            inputElement.value = newValue;
            const newCursorPosition = detection.startIndex + mentionText.length + 1;
            inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        } else {
            const beforeCursor = value.substring(0, cursorPosition);
            const afterCursor = value.substring(cursorPosition);
            
            const needsSpace = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
            const mentionText = mention.type === 'all' ? '@all' : `@${mention.username}`;
            const insertText = needsSpace ? ` ${mentionText} ` : `${mentionText} `;
            
            const newValue = beforeCursor + insertText + afterCursor;
            inputElement.value = newValue;
            const newCursorPosition = cursorPosition + insertText.length;
            inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        }
        
        inputElement.focus();
    }
}


window.RichTextHandler = RichTextHandler;
window.richTextHandler = new RichTextHandler();

export default RichTextHandler;
