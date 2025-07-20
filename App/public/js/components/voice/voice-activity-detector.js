class VoiceActivityDetector {
    constructor() {
        this.audioContext = null;
        this.analyserNodes = new Map();
        this.speakingStates = new Map();
        this.speakingThreshold = 30;
        this.speakingDuration = 50;
        this.silenceDuration = 100;
        this.speakingTimers = new Map();
        this.silenceTimers = new Map();
        this.animationFrameId = null;
        this.isActive = false;
        this.noiseFloor = new Map();
        this.noiseCalibrationFrames = 10;
        this.init();
    }

    init() {
        this.setupAudioContext();
        this.setupEventListeners();
        this.setupSocketListeners();
        console.log('🎤 [VOICE-ACTIVITY] Voice activity detector initialized');
    }
    
    setupSocketListeners() {
        if (!window.globalSocketManager?.io) {
            setTimeout(() => this.setupSocketListeners(), 1000);
            return;
        }
        
        window.globalSocketManager.io.on('voice-activity-update', (data) => {
            console.log(`📡 [VOICE-ACTIVITY] Received speaking state update:`, data);
            
            if (!data.user_id || !data.channel_id) return;
            
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (data.user_id === currentUserId) return;
            
            if (window.voiceManager?.currentChannelId === data.channel_id) {
                this.updateSidebarSpeakingIndicator(data.user_id, data.is_speaking);
                this.updateCallSectionSpeakingIndicator(data.user_id, data.is_speaking);
            }
        });
    }

    setupAudioContext() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                const resumeAudioContext = () => {
                    this.audioContext.resume().then(() => {
                        console.log('🎤 [VOICE-ACTIVITY] AudioContext resumed');
                    }).catch(error => {
                        console.warn('🎤 [VOICE-ACTIVITY] Failed to resume AudioContext:', error);
                    });
                    
                    document.removeEventListener('click', resumeAudioContext);
                    document.removeEventListener('touchstart', resumeAudioContext);
                };
                
                document.addEventListener('click', resumeAudioContext);
                document.addEventListener('touchstart', resumeAudioContext);
            }
            
            console.log('🎤 [VOICE-ACTIVITY] AudioContext created');
        } catch (error) {
            console.error('🎤 [VOICE-ACTIVITY] Failed to create AudioContext:', error);
        }
    }

    setupEventListeners() {
        window.addEventListener('streamEnabled', (event) => {
            const { participantId, kind, stream } = event.detail;
            if (kind === 'audio' && stream && stream.track) {
                this.startAnalyzing(participantId, stream);
            }
        });

        window.addEventListener('streamDisabled', (event) => {
            const { participantId, kind } = event.detail;
            if (kind === 'audio') {
                this.stopAnalyzing(participantId);
            }
        });

        window.addEventListener('participantJoined', (event) => {
            const { participant } = event.detail;
            if (participant && window.voiceManager) {
                setTimeout(() => {
                    this.checkForLocalParticipantStream(participant);
                }, 500);
            }
        });

        window.addEventListener('participantLeft', (event) => {
            const { participant } = event.detail;
            if (participant) {
                this.stopAnalyzing(participant);
            }
        });

        window.addEventListener('voiceStateChanged', (event) => {
            const { type, state } = event.detail;
            if (type === 'mic') {
                this.handleMicStateChange(state);
                if (state && window.voiceManager) {
                    setTimeout(() => {
                        this.setupLocalParticipantStream();
                    }, 100);
                }
            }
        });

        window.addEventListener('voiceConnect', () => {
            setTimeout(() => {
                this.setupLocalParticipantStream();
            }, 1000);
        });

        window.addEventListener('voiceDisconnect', () => {
            this.cleanup();
        });
    }

    setupLocalParticipantStream() {
        if (!window.voiceManager || !window.voiceManager.localParticipant) return;

        const localParticipant = window.voiceManager.localParticipant;
        
        if (localParticipant.micStream && localParticipant.micStream.track) {
            this.startAnalyzing(localParticipant.id, localParticipant.micStream);
        }
    }

    checkForLocalParticipantStream(participantId) {
        if (!window.voiceManager || !window.voiceManager.localParticipant) return;

        const localParticipant = window.voiceManager.localParticipant;
        
        if (participantId === localParticipant.id && localParticipant.micStream && localParticipant.micStream.track) {
            this.startAnalyzing(participantId, localParticipant.micStream);
        }
    }

    startAnalyzing(participantId, stream) {
        if (!this.audioContext || !stream || !stream.track) return;

        if (this.analyserNodes.has(participantId)) {
            console.log(`🎤 [VOICE-ACTIVITY] Already analyzing participant ${participantId}`);
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const mediaStream = new MediaStream([stream.track]);
            const source = this.audioContext.createMediaStreamSource(mediaStream);
            const analyser = this.audioContext.createAnalyser();
            
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.9;
            analyser.minDecibels = -90;
            analyser.maxDecibels = -10;
            source.connect(analyser);

            this.analyserNodes.set(participantId, {
                analyser,
                source,
                dataArray: new Uint8Array(analyser.frequencyBinCount),
                noiseFloorSamples: [],
                calibrationFrames: 0
            });

            this.speakingStates.set(participantId, false);
            
            if (!this.isActive) {
                this.startDetection();
            }

            console.log(`🎤 [VOICE-ACTIVITY] Started analyzing participant ${participantId}`);
        } catch (error) {
            console.error(`🎤 [VOICE-ACTIVITY] Failed to analyze participant ${participantId}:`, error);
        }
    }

    stopAnalyzing(participantId) {
        const nodeData = this.analyserNodes.get(participantId);
        if (nodeData) {
            try {
                nodeData.source.disconnect();
            } catch (error) {
                console.warn(`🎤 [VOICE-ACTIVITY] Error disconnecting source for ${participantId}:`, error);
            }
            this.analyserNodes.delete(participantId);
        }

        this.speakingStates.delete(participantId);
        this.noiseFloor.delete(participantId);
        this.clearTimers(participantId);
        this.updateSpeakingIndicator(participantId, false);

        if (this.analyserNodes.size === 0) {
            this.stopDetection();
        }

        console.log(`🎤 [VOICE-ACTIVITY] Stopped analyzing participant ${participantId}`);
    }

    startDetection() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.analyzeLoop();
        console.log('🎤 [VOICE-ACTIVITY] Voice activity detection started');
    }

    stopDetection() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log('🎤 [VOICE-ACTIVITY] Voice activity detection stopped');
    }

    analyzeLoop() {
        if (!this.isActive) return;

        this.analyserNodes.forEach((nodeData, participantId) => {
            if (!this.isParticipantMicEnabled(participantId)) {
                const currentlySpeaking = this.speakingStates.get(participantId);
                if (currentlySpeaking) {
                    this.speakingStates.set(participantId, false);
                    this.updateSpeakingIndicator(participantId, false);
                }
                return;
            }

            nodeData.analyser.getByteFrequencyData(nodeData.dataArray);
            
            const average = nodeData.dataArray.reduce((sum, value) => sum + value, 0) / nodeData.dataArray.length;
            
            const voiceFrequencyRange = nodeData.dataArray.slice(4, 40);
            const voiceAverage = voiceFrequencyRange.reduce((sum, value) => sum + value, 0) / voiceFrequencyRange.length;
            
            if (nodeData.calibrationFrames < 10) {
                nodeData.noiseFloorSamples.push(average);
                nodeData.calibrationFrames++;
                return;
            }
            
            if (!this.noiseFloor.has(participantId) && nodeData.noiseFloorSamples.length >= 10) {
                const noiseFloor = nodeData.noiseFloorSamples.reduce((sum, val) => sum + val, 0) / nodeData.noiseFloorSamples.length;
                this.noiseFloor.set(participantId, noiseFloor + 5);
            }
            
            const threshold = Math.max(25, this.noiseFloor.get(participantId) || 25);
            const isSpeaking = voiceAverage > threshold || average > 30;
            const currentlySpeaking = this.speakingStates.get(participantId);

            if (isSpeaking && !currentlySpeaking) {
                this.clearTimers(participantId);
                this.speakingStates.set(participantId, true);
                this.updateSpeakingIndicator(participantId, true);
            } else if (!isSpeaking && currentlySpeaking) {
                this.clearTimers(participantId);
                this.speakingStates.set(participantId, false);
                this.updateSpeakingIndicator(participantId, false);
            }
        });

        this.animationFrameId = requestAnimationFrame(() => this.analyzeLoop());
    }

    isParticipantMicEnabled(participantId) {
        if (!window.voiceManager) return false;

        if (window.voiceManager.localParticipant && participantId === window.voiceManager.localParticipant.id) {
            return window.voiceManager._micOn;
        }

        const meeting = window.voiceManager.meeting;
        if (!meeting) return false;

        const participant = meeting.participants.get(participantId);
        return participant ? participant.micOn : false;
    }

    handleMicStateChange(micEnabled) {
        if (!window.voiceManager || !window.voiceManager.localParticipant) return;

        const localParticipantId = window.voiceManager.localParticipant.id;
        
        if (!micEnabled) {
            const currentlySpeaking = this.speakingStates.get(localParticipantId);
            if (currentlySpeaking) {
                this.clearTimers(localParticipantId);
                this.speakingStates.set(localParticipantId, false);
                this.updateSpeakingIndicator(localParticipantId, false);
            }
        }
    }

    clearTimers(participantId) {
        const speakingTimer = this.speakingTimers.get(participantId);
        const silenceTimer = this.silenceTimers.get(participantId);
        
        if (speakingTimer) {
            clearTimeout(speakingTimer);
            this.speakingTimers.delete(participantId);
        }
        
        if (silenceTimer) {
            clearTimeout(silenceTimer);
            this.silenceTimers.delete(participantId);
        }
    }

    updateSpeakingIndicator(participantId, isSpeaking) {
        const userId = this.getUserId(participantId);
        
        this.updateSidebarSpeakingIndicator(userId, isSpeaking);
        this.updateCallSectionSpeakingIndicator(userId, isSpeaking);
        
        this.broadcastSpeakingState(userId, isSpeaking);
        
        window.dispatchEvent(new CustomEvent('voiceActivityChanged', {
            detail: {
                participantId,
                userId,
                isSpeaking
            }
        }));
    }
    
    broadcastSpeakingState(userId, isSpeaking) {
        if (!window.globalSocketManager?.io || !window.voiceManager?.currentChannelId) return;
        
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
        if (userId !== currentUserId) return;
        
        const speakingData = {
            channel_id: window.voiceManager.currentChannelId,
            user_id: userId,
            is_speaking: isSpeaking,
            timestamp: Date.now()
        };
        
        console.log(`📡 [VOICE-ACTIVITY] Broadcasting speaking state:`, speakingData);
        
        window.globalSocketManager.io.emit('voice-activity-change', speakingData);
    }

    getUserId(participantId) {
        if (!window.voiceManager || !window.voiceManager.participants) return participantId;
        
        const participantData = window.voiceManager.participants.get(participantId);
        if (participantData && participantData.user_id) {
            return participantData.user_id;
        }
        
        if (window.voiceManager.localParticipant && participantId === window.voiceManager.localParticipant.id) {
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (currentUserId) return currentUserId;
        }
        
        return participantId;
    }

    updateSidebarSpeakingIndicator(userId, isSpeaking) {
        const participantCard = document.querySelector(`[data-user-id="${userId}"].voice-participant-card`);
        if (!participantCard) return;

        const avatarContainer = participantCard.querySelector('.relative');
        if (!avatarContainer) return;

        if (isSpeaking) {
            avatarContainer.classList.add('speaking-indicator');
        } else {
            avatarContainer.classList.remove('speaking-indicator');
        }
    }

    updateCallSectionSpeakingIndicator(userId, isSpeaking) {
        const participantCard = document.querySelector(`[data-user-id="${userId}"].participant-card`);
        if (!participantCard) return;

        const avatarContainer = participantCard.querySelector('.participant-avatar');
        if (!avatarContainer) return;

        if (isSpeaking) {
            avatarContainer.classList.add('speaking-indicator');
        } else {
            avatarContainer.classList.remove('speaking-indicator');
        }
    }

    cleanup() {
        this.stopDetection();
        
        const participantIds = Array.from(this.analyserNodes.keys());
        participantIds.forEach(participantId => {
            this.stopAnalyzing(participantId);
        });
        
        this.analyserNodes.clear();
        this.speakingStates.clear();
        this.speakingTimers.clear();
        this.silenceTimers.clear();

        document.querySelectorAll('.speaking-indicator').forEach(element => {
            element.classList.remove('speaking-indicator');
        });

        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (error) {
                console.warn('🎤 [VOICE-ACTIVITY] Error closing AudioContext:', error);
            }
            this.audioContext = null;
        }

        console.log('🎤 [VOICE-ACTIVITY] Voice activity detector cleaned up');
    }
}

if (typeof window !== 'undefined') {
    window.VoiceActivityDetector = VoiceActivityDetector;
    
    if (!window.voiceActivityDetector) {
        window.voiceActivityDetector = new VoiceActivityDetector();
    }
}
