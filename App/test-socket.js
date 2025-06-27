const { io } = require('socket.io-client');
const fetch = require('node-fetch');

class SocketTester {
    constructor() {
        this.kolinSocket = null;
        this.titiSocket = null;
        this.kolinUser = null;
        this.titiUser = null;
        this.eventCounters = { messages: 0, reactions: 0, typing: 0, edits: 0, deletes: 0, dms: 0, voice: 0 };
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    log(level, message, user = '') {
        const timestamp = new Date().toLocaleTimeString();
        const userPrefix = user ? `[${user}] ` : '';
        const prefix = level === 'PASS' ? '✅' : level === 'FAIL' ? '❌' : level === 'INFO' ? '📋' : '⚠️';
        console.log(`${timestamp} ${prefix} ${userPrefix}${message}`);
        
        if (level === 'PASS' || level === 'FAIL') {
            this.testResults.push({ level, message, user });
            this.totalTests++;
            if (level === 'PASS') this.passedTests++;
            if (level === 'FAIL') this.failedTests++;
        }
    }

    async authenticateUser(email, password) {
        try {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('email', email);
            form.append('password', password);

            const response = await fetch('http://localhost:1001/login', {
                method: 'POST',
                body: form,
                redirect: 'manual'
            });
            
            // Check if login was successful (redirects to /home on success)
            if (response.status === 302) {
                const location = response.headers.get('location');
                if (location && (location.includes('/home') || location === '/home')) {
                    // Login successful, extract session cookie
                    const cookies = response.headers.get('set-cookie');
                    
                    // Return mock user data for testing
                    return {
                        id: email === 'kolin@gmail.com' ? '1' : '2',
                        username: email === 'kolin@gmail.com' ? 'kolin' : 'titi',
                        email: email,
                        cookies: cookies
                    };
                }
            }
            
            throw new Error(`Authentication failed: ${response.status} - ${response.statusText}`);
        } catch (error) {
            throw new Error(`Authentication error: ${error.message}`);
        }
    }

    async createSocketConnection(user, userLabel) {
        return new Promise((resolve, reject) => {
            this.log('INFO', `Creating socket connection for ${userLabel}`, userLabel);
            
            const socket = io('http://localhost:1002', {
                transports: ['websocket'],
                timeout: 10000
            });

            const timeout = setTimeout(() => {
                reject(new Error(`${userLabel} socket connection timeout`));
            }, 15000);

            socket.on('connect', () => {
                clearTimeout(timeout);
                this.log('PASS', `Socket connected successfully`, userLabel);
                
                socket.emit('authenticate', {
                    user_id: user.id,
                    username: user.username,
                    email: user.email
                });
            });

            socket.on('auth-success', () => {
                this.log('PASS', `Authentication successful`, userLabel);
                socket.userId = user.id;
                socket.username = user.username;
                resolve(socket);
            });

            socket.on('auth-error', (error) => {
                clearTimeout(timeout);
                this.log('FAIL', `Authentication failed: ${error}`, userLabel);
                reject(new Error(`${userLabel} authentication failed`));
            });

            socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                this.log('FAIL', `Connection error: ${error.message}`, userLabel);
                reject(error);
            });
        });
    }

    setupEventListeners(socket, userLabel) {
        const events = [
            'new-channel-message', 'user-message-dm', 'user-typing', 'user-stop-typing', 
            'reaction-added', 'reaction-removed', 'message-updated', 'message-deleted', 
            'voice-state-update', 'connect', 'disconnect', 'auth-success', 'auth-error',
            'room-joined', 'room-left', 'error'
        ];

        events.forEach(event => {
            socket.on(event, (data) => {
                this.log('INFO', `Received event: ${event} - ${JSON.stringify(data).substring(0, 100)}`, userLabel);
                
                if (event === 'new-channel-message') this.eventCounters.messages++;
                if (event === 'user-message-dm') this.eventCounters.dms++;
                if (event.includes('reaction')) this.eventCounters.reactions++;
                if (event.includes('typing')) this.eventCounters.typing++;
                if (event.includes('updated')) this.eventCounters.edits++;
                if (event.includes('deleted')) this.eventCounters.deletes++;
                if (event === 'voice-state-update') this.eventCounters.voice++;
            });
        });

        // Add error handling
        socket.on('error', (error) => {
            this.log('FAIL', `Socket error: ${error}`, userLabel);
        });

        socket.on('disconnect', (reason) => {
            this.log('INFO', `Socket disconnected: ${reason}`, userLabel);
        });
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testChannelMessages() {
        this.log('INFO', 'Testing channel messages');
        const initialCount = this.eventCounters.messages;
        
        const channelId = '1';
        
        // Join rooms with detailed logging
        this.log('INFO', `Kolin joining room: channel_${channelId}`, 'Kolin');
        this.kolinSocket.emit('join-room', { room_id: `channel_${channelId}`, room_type: 'channel' });
        
        this.log('INFO', `Titi joining room: channel_${channelId}`, 'Titi');
        this.titiSocket.emit('join-room', { room_id: `channel_${channelId}`, room_type: 'channel' });

        await this.wait(2000);

        const testMsg = {
            id: Date.now(),
            channel_id: channelId,
            content: 'Test channel message from Kolin',
            message_type: 'text',
            timestamp: Date.now(),
            user_id: this.kolinUser.id,
            username: this.kolinUser.username,
            source: 'client-originated'
        };

        this.log('INFO', `Sending message: ${JSON.stringify(testMsg)}`, 'Kolin');
        this.kolinSocket.emit('new-channel-message', testMsg);

        await this.wait(4000);

        const received = this.eventCounters.messages - initialCount;
        this.log('INFO', `Message events received: ${received} (expected: 1+)`);
        
        if (received > 0) {
            this.log('PASS', `Channel messages working - Titi received ${received} message(s)`);
        } else {
            this.log('FAIL', 'Channel messages NOT working - Titi did not receive message');
        }
    }

    async testReactions() {
        this.log('INFO', 'Testing reactions');
        const initialCount = this.eventCounters.reactions;

        const msgId = Date.now();
        const testMsg = {
            id: msgId,
            channel_id: '1',
            content: 'Message for reaction test',
            message_type: 'text',
            timestamp: Date.now(),
            user_id: this.kolinUser.id,
            username: this.kolinUser.username,
            source: 'client-originated'
        };

        this.kolinSocket.emit('new-channel-message', testMsg);
        await this.wait(1000);

        const reactionData = {
            message_id: msgId,
            emoji: '❤️',
            user_id: this.titiUser.id,
            username: this.titiUser.username,
            target_type: 'channel',
            target_id: '1',
            action: 'add',
            source: 'client-originated'
        };

        this.log('INFO', `Sending reaction: ${JSON.stringify(reactionData)}`, 'Titi');
        this.titiSocket.emit('reaction-added', reactionData);

        await this.wait(3000);

        const received = this.eventCounters.reactions - initialCount;
        if (received > 0) {
            this.log('PASS', `Reactions working - Kolin received ${received} reaction(s)`);
        } else {
            this.log('FAIL', 'Reactions NOT working - Kolin did not see reaction');
        }
    }

    async testTyping() {
        this.log('INFO', 'Testing typing indicators');
        const initialCount = this.eventCounters.typing;

        this.kolinSocket.emit('typing', {
            channel_id: '1',
            user_id: this.kolinUser.id,
            username: this.kolinUser.username
        });
        this.log('INFO', 'Kolin started typing', 'Kolin');

        await this.wait(2000);

        this.kolinSocket.emit('stop-typing', {
            channel_id: '1',
            user_id: this.kolinUser.id,
            username: this.kolinUser.username
        });

        await this.wait(3000);

        const received = this.eventCounters.typing - initialCount;
        if (received > 0) {
            this.log('PASS', `Typing indicators working - Titi received ${received} typing event(s)`);
        } else {
            this.log('FAIL', 'Typing indicators NOT working');
        }
    }

    async testEditing() {
        this.log('INFO', 'Testing message editing');
        const initialCount = this.eventCounters.edits;

        const msgId = Date.now();
        const originalMsg = {
            id: msgId,
            channel_id: '1',
            content: 'Original message',
            message_type: 'text',
            timestamp: Date.now(),
            user_id: this.kolinUser.id,
            username: this.kolinUser.username,
            source: 'client-originated'
        };

        this.kolinSocket.emit('new-channel-message', originalMsg);
        await this.wait(1500);

        const editData = {
            message_id: msgId,
            message: { content: 'EDITED message' },
            user_id: this.kolinUser.id,
            username: this.kolinUser.username,
            target_type: 'channel',
            target_id: '1',
            source: 'client-originated'
        };

        this.kolinSocket.emit('message-updated', editData);
        await this.wait(3000);

        const received = this.eventCounters.edits - initialCount;
        if (received > 0) {
            this.log('PASS', `Message editing working - Titi received ${received} edit(s)`);
        } else {
            this.log('FAIL', 'Message editing NOT working');
        }
    }

    showResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 FINAL RESULTS');
        console.log('='.repeat(60));
        
        if (this.failedTests === 0) {
            console.log(`🎉 ALL ${this.passedTests} TESTS PASSED!`);
        } else {
            console.log(`⚠️ ${this.failedTests} TESTS FAILED out of ${this.totalTests}`);
            console.log(`✅ Passed: ${this.passedTests} | ❌ Failed: ${this.failedTests}`);
        }

        console.log(`\nEvents: Messages(${this.eventCounters.messages}) Reactions(${this.eventCounters.reactions}) Typing(${this.eventCounters.typing}) Edits(${this.eventCounters.edits})`);
    }

    async runAllTests() {
        try {
            console.log('🚀 SOCKET TEST STARTING');
            console.log('='.repeat(60));

            this.kolinUser = await this.authenticateUser('kolin@gmail.com', 'Miawmiaw123@');
            this.log('PASS', 'Kolin authenticated', 'Kolin');

            this.titiUser = await this.authenticateUser('titi@gmail.com', 'Miawmiaw123@');
            this.log('PASS', 'Titi authenticated', 'Titi');

            this.kolinSocket = await this.createSocketConnection(this.kolinUser, 'Kolin');
            this.titiSocket = await this.createSocketConnection(this.titiUser, 'Titi');

            this.setupEventListeners(this.kolinSocket, 'Kolin');
            this.setupEventListeners(this.titiSocket, 'Titi');

            await this.wait(2000);

            await this.testChannelMessages();
            await this.testReactions();
            await this.testTyping();
            await this.testEditing();

            this.showResults();

        } catch (error) {
            this.log('FAIL', `Test failed: ${error.message}`);
        } finally {
            if (this.kolinSocket) this.kolinSocket.disconnect();
            if (this.titiSocket) this.titiSocket.disconnect();
            process.exit(this.failedTests === 0 ? 0 : 1);
        }
    }
}

if (require.main === module) {
    const tester = new SocketTester();
    tester.runAllTests();
}

module.exports = SocketTester; 