class JaroWinkler {
    constructor() {
        this.defaultThreshold = 0.7;
        this.prefixScale = 0.1;
        this.maxPrefixLength = 4;
    }

    calculateDistance(s1, s2) {
        if (!s1 || !s2) return 0;
        if (s1 === s2) return 1;

        s1 = s1.toLowerCase().trim();
        s2 = s2.toLowerCase().trim();

        if (s1 === s2) return 1;
        if (s1.length === 0 || s2.length === 0) return 0;

        const jaroDistance = this.calculateJaro(s1, s2);
        if (jaroDistance < this.defaultThreshold) return jaroDistance;

        const prefixLength = this.getCommonPrefixLength(s1, s2);
        return jaroDistance + (prefixLength * this.prefixScale * (1 - jaroDistance));
    }

    calculateJaro(s1, s2) {
        const len1 = s1.length;
        const len2 = s2.length;

        if (len1 === 0 && len2 === 0) return 1;
        if (len1 === 0 || len2 === 0) return 0;

        const matchWindow = Math.max(len1, len2) / 2 - 1;
        if (matchWindow < 0) return 0;

        const s1Matches = new Array(len1).fill(false);
        const s2Matches = new Array(len2).fill(false);

        let matches = 0;
        let transpositions = 0;

        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchWindow);
            const end = Math.min(i + matchWindow + 1, len2);

            for (let j = start; j < end; j++) {
                if (s2Matches[j] || s1[i] !== s2[j]) continue;
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }

        if (matches === 0) return 0;

        let k = 0;
        for (let i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue;
            while (!s2Matches[k]) k++;
            if (s1[i] !== s2[k]) transpositions++;
            k++;
        }

        return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    }

    getCommonPrefixLength(s1, s2) {
        let prefixLength = 0;
        const maxLength = Math.min(s1.length, s2.length, this.maxPrefixLength);

        for (let i = 0; i < maxLength; i++) {
            if (s1[i] === s2[i]) {
                prefixLength++;
            } else {
                break;
            }
        }

        return prefixLength;
    }

    searchUsers(users, query, options = {}) {
        if (!query || !users || users.length === 0) return users;

        const {
            threshold = 0.3,
            maxResults = 20,
            fields = ['username', 'display_name', 'email'],
            weights = { username: 1.0, display_name: 0.8, email: 0.6 }
        } = options;

        const queryLower = query.toLowerCase().trim();
        const results = [];

        for (const user of users) {
            let bestScore = 0;
            let matchedField = '';

            for (const field of fields) {
                const fieldValue = user[field];
                if (!fieldValue) continue;

                let score = 0;
                const fieldWeight = weights[field] || 1.0;

                if (field === 'email') {
                    const emailParts = fieldValue.split('@');
                    const localPart = emailParts[0];
                    score = Math.max(
                        this.calculateDistance(fieldValue, queryLower),
                        this.calculateDistance(localPart, queryLower)
                    );
                } else if (field === 'username' || field === 'display_name') {
                    score = this.calculateDistance(fieldValue, queryLower);
                    
                    if (fieldValue.toLowerCase().startsWith(queryLower)) {
                        score = Math.max(score, 0.9);
                    }
                    
                    if (fieldValue.toLowerCase().includes(queryLower)) {
                        score = Math.max(score, 0.7);
                    }
                }

                const weightedScore = score * fieldWeight;
                if (weightedScore > bestScore) {
                    bestScore = weightedScore;
                    matchedField = field;
                }
            }

            if (bestScore >= threshold) {
                results.push({
                    user,
                    score: bestScore,
                    matchedField,
                    relevance: this.calculateRelevance(user, queryLower, matchedField)
                });
            }
        }

        results.sort((a, b) => {
            if (Math.abs(a.score - b.score) < 0.01) {
                return b.relevance - a.relevance;
            }
            return b.score - a.score;
        });

        return results.slice(0, maxResults).map(result => result.user);
    }

    calculateRelevance(user, query, matchedField) {
        let relevance = 0;

        const username = (user.username || '').toLowerCase();
        const displayName = (user.display_name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();

        if (username.startsWith(query)) relevance += 100;
        if (displayName.startsWith(query)) relevance += 80;
        if (email.startsWith(query)) relevance += 60;

        if (username.includes(query)) relevance += 50;
        if (displayName.includes(query)) relevance += 40;
        if (email.includes(query)) relevance += 30;

        if (matchedField === 'username') relevance += 20;
        if (matchedField === 'display_name') relevance += 15;
        if (matchedField === 'email') relevance += 10;

        const usernameParts = username.split(/[\s_.-]/);
        const displayNameParts = displayName.split(/[\s_.-]/);
        
        for (const part of usernameParts) {
            if (part.startsWith(query)) relevance += 25;
        }
        
        for (const part of displayNameParts) {
            if (part.startsWith(query)) relevance += 20;
        }

        return relevance;
    }

    highlightMatches(text, query) {
        if (!text || !query) return text;
        
        const textLower = text.toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (textLower.includes(queryLower)) {
            const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
            return text.replace(regex, '<mark class="bg-yellow-200 text-black">$1</mark>');
        }
        
        return text;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    getMatchExplanation(user, query, score, matchedField) {
        const explanation = {
            score: Math.round(score * 100),
            field: matchedField,
            reason: ''
        };

        if (score >= 0.9) {
            explanation.reason = 'Exact or near-exact match';
        } else if (score >= 0.7) {
            explanation.reason = 'Strong similarity';
        } else if (score >= 0.5) {
            explanation.reason = 'Good similarity';
        } else {
            explanation.reason = 'Partial match';
        }

        return explanation;
    }
}

const jaroWinkler = new JaroWinkler();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = JaroWinkler;
} else if (typeof window !== 'undefined') {
    window.JaroWinkler = JaroWinkler;
    window.jaroWinkler = jaroWinkler;
}

export default JaroWinkler;
export { jaroWinkler };
