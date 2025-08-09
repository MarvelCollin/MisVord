class EventValidator {
    constructor() {
        this.schemas = {
            'new-channel-message': {
                required: ['id', 'channel_id', 'content', 'user_id', 'username', 'source'],
                optional: ['message_type', 'attachments', 'attachment_url', 'timestamp', 'message', 'reply_message_id', 'reply_data']
            },
            'user-message-dm': {
                required: ['id', 'room_id', 'content', 'user_id', 'username', 'source'],
                optional: ['message_type', 'attachments', 'attachment_url', 'timestamp', 'message', 'reply_message_id', 'reply_data']
            },
            'message-updated': {
                required: ['message_id', 'user_id', 'username', 'target_type', 'target_id', 'source'],
                optional: ['content', 'message', 'timestamp']
            },
            'message-deleted': {
                required: ['message_id', 'user_id', 'username', 'target_type', 'target_id', 'source'],
                optional: ['timestamp']
            },
            'message_id_updated': {
                required: ['temp_message_id', 'real_message_id', 'message_data', 'timestamp'],
                optional: ['user_id', 'username', 'source']
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

            if (eventName.includes('message') && !eventName.includes('typing') && data.source && !['server-originated', 'client-originated'].includes(data.source)) {
        errors.push('Message events must have valid source');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    validateAndLog(eventName, data, context = '') {

        console.log(`📊 [EVENT-VALIDATOR] Event data overview:`, {
            event: eventName,
            hasId: !!(data.id || data.message_id),
            hasUserId: !!data.user_id,
            hasUsername: !!data.username,
            hasSource: !!data.source,
            hasChannelId: !!data.channel_id,
            hasRoomId: !!data.room_id,
            hasTargetType: !!data.target_type,
            hasTargetId: !!data.target_id,
            hasContent: !!data.content
        });
        
        const result = this.validate(eventName, data);
        
        if (!result.valid) {
            console.error(`❌ [EVENT-VALIDATOR] Event validation failed for ${eventName} ${context}:`, {
                errors: result.errors,
                providedFields: Object.keys(data),
                requiredFields: this.schemas[eventName]?.required || []
            });
        } else {

        }

        if (result.warnings.length > 0) {
            console.warn(`⚠️ [EVENT-VALIDATOR] Event validation warnings for ${eventName} ${context}:`, {
                warnings: result.warnings,
                eventData: {
                    source: data.source,
                    hasRequiredFields: result.valid
                }
            });
        }

        console.log(`📋 [EVENT-VALIDATOR] Validation summary for ${eventName}:`, {
            valid: result.valid,
            errorCount: result.errors.length,
            warningCount: result.warnings.length,
            context: context
        });

        return result;
    }
}

module.exports = new EventValidator(); 