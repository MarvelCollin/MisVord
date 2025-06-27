class EventValidator {
    constructor() {
        this.schemas = {
            'new-channel-message': {
                required: ['id', 'channel_id', 'content', 'user_id', 'username', 'source'],
                optional: ['message_type', 'attachment_url', 'timestamp', 'message', 'reply_message_id']
            },
            'user-message-dm': {
                required: ['id', 'room_id', 'content', 'user_id', 'username', 'source'],
                optional: ['message_type', 'attachment_url', 'timestamp', 'message', 'reply_message_id']
            },
            'message-updated': {
                required: ['message_id', 'user_id', 'username', 'source'],
                optional: ['content', 'message', 'timestamp']
            },
            'message-deleted': {
                required: ['message_id', 'user_id', 'username', 'source'],
                optional: ['timestamp']
            },
            'reaction-added': {
                required: ['message_id', 'user_id', 'username', 'emoji', 'source'],
                optional: ['target_type', 'target_id', 'action', 'timestamp']
            },
            'reaction-removed': {
                required: ['message_id', 'user_id', 'username', 'emoji', 'source'],
                optional: ['target_type', 'target_id', 'action', 'timestamp']
            },
            'message-pinned': {
                required: ['message_id', 'user_id', 'username', 'source'],
                optional: ['target_type', 'target_id', 'action', 'message', 'timestamp']
            },
            'message-unpinned': {
                required: ['message_id', 'user_id', 'username', 'source'],
                optional: ['target_type', 'target_id', 'action', 'timestamp']
            },
            'typing': {
                required: [],
                optional: ['channel_id', 'room_id']
            },
            'stop-typing': {
                required: [],
                optional: ['channel_id', 'room_id']
            }
        };
    }

    validate(eventName, data) {
        const schema = this.schemas[eventName];
        if (!schema) {
            return { valid: true, warnings: [`No validation schema for event: ${eventName}`] };
        }

        const errors = [];
        const warnings = [];

        schema.required.forEach(field => {
            if (!(field in data) || data[field] === null || data[field] === undefined) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        if (eventName.includes('channel') && !data.channel_id) {
            errors.push('Channel events must include channel_id');
        }

        if (eventName.includes('dm') && !data.room_id) {
            errors.push('DM events must include room_id');
        }

        if (data.source && !['server-originated', 'client-originated', 'api-relay'].includes(data.source)) {
            warnings.push(`Unknown source value: ${data.source}`);
        }

        if (eventName.includes('message') && !eventName.includes('typing') && data.source !== 'server-originated') {
            errors.push('Message events must have source: server-originated');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    validateAndLog(eventName, data, context = '') {
        const result = this.validate(eventName, data);
        
        if (!result.valid) {
            console.error(`❌ Event validation failed for ${eventName} ${context}:`, {
                errors: result.errors,
                data: data
            });
        }

        if (result.warnings.length > 0) {
            console.warn(`⚠️ Event validation warnings for ${eventName} ${context}:`, {
                warnings: result.warnings,
                data: data
            });
        }

        return result;
    }
}

module.exports = new EventValidator(); 