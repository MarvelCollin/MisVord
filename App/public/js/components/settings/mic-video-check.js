class VoiceVideoSettings {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;
        this.micTest = {
            isActive: false,
            testStream: null,
            inputGainNode: null,
            outputGainNode: null
        };
        this.videoTest = {
            isActive: false,
            videoStream: null,
            videoElement: null
        };
        this.devices = {
            input: [],
            output: [],
            video: []
        };
        this.settings = this.loadSettings();
        this.visualizerInterval = null;
        
        this.init();
    }

    async init() {
        await this.loadDevices();
        this.setupEventListeners();
        this.updateUI();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('misvord_audio_settings');
            return saved ? JSON.parse(saved) : {
                inputVolume: 50,
                outputVolume: 75
            };
        } catch {
            return {
                inputVolume: 50,
                outputVolume: 75
            };
        }
    }

    saveSettings() {
        localStorage.setItem('misvord_audio_settings', JSON.stringify(this.settings));
    }

    async loadDevices() {
        try {
            this.addDebugInfo('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.addDebugInfo('Microphone access granted - using REAL audio stream');
            
            stream.getTracks().forEach(track => track.stop());
            
            this.addDebugInfo('Enumerating real audio devices...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            this.devices.input = devices.filter(device => device.kind === 'audioinput');
            this.devices.output = devices.filter(device => device.kind === 'audiooutput');
            this.devices.video = devices.filter(device => device.kind === 'videoinput');
            
            this.addDebugInfo(`Found ${this.devices.input.length} real input devices`);
            this.addDebugInfo(`Found ${this.devices.output.length} real output devices`);
            this.addDebugInfo(`Found ${this.devices.video.length} real video devices`);
            
            if (this.devices.input.length === 0) {
                this.addDebugInfo('WARNING: No real input devices detected!');
            }
            
            this.addDebugInfo('=== DETECTED INPUT DEVICES ===');
            this.devices.input.forEach((device, index) => {
                this.addDebugInfo(`Input ${index + 1}: ${device.label || 'Unnamed device'}`);
                this.addDebugInfo(`  Device ID: ${device.deviceId.slice(0, 12)}...`);
                this.addDebugInfo(`  Group ID: ${device.groupId.slice(0, 8)}...`);
            });
            
            this.addDebugInfo('=== DETECTED OUTPUT DEVICES ===');
            this.devices.output.forEach((device, index) => {
                this.addDebugInfo(`Output ${index + 1}: ${device.label || 'Unnamed device'}`);
                this.addDebugInfo(`  Device ID: ${device.deviceId.slice(0, 12)}...`);
                this.addDebugInfo(`  Group ID: ${device.groupId.slice(0, 8)}...`);
            });
            
            this.addDebugInfo('=== DETECTED VIDEO DEVICES ===');
            this.devices.video.forEach((device, index) => {
                this.addDebugInfo(`Video ${index + 1}: ${device.label || 'Unnamed camera'}`);
                this.addDebugInfo(`  Device ID: ${device.deviceId.slice(0, 12)}...`);
                this.addDebugInfo(`  Group ID: ${device.groupId.slice(0, 8)}...`);
            });
            
            this.displayCurrentDevices();
        } catch (error) {
            this.addDebugInfo(`REAL device access failed: ${error.message}`);
            this.addDebugInfo('This means no mock data - real hardware access required');
        }
    }

    displayCurrentDevices() {
        this.displayCurrentInputDevice();
        this.displayCurrentOutputDevice();
        this.displayCurrentVideoDevice();
    }

    displayCurrentInputDevice() {
        const inputDisplay = document.getElementById('current-input-device');
        if (inputDisplay) {
            // Show default microphone device
            const defaultInputDevice = this.devices.input[0];
            if (defaultInputDevice) {
                inputDisplay.innerHTML = `
                    <i class="fas fa-microphone mr-2 text-green-400"></i>
                    <span>${defaultInputDevice.label || 'Default Microphone'}</span>
                `;
                this.addDebugInfo(`Displaying input device: ${defaultInputDevice.label}`);
            } else {
                inputDisplay.innerHTML = `
                    <i class="fas fa-microphone mr-2 text-red-400"></i>
                    <span>No microphone detected</span>
                `;
            }
        }
    }

    displayCurrentOutputDevice() {
        const outputDisplay = document.getElementById('current-output-device');
        if (outputDisplay) {
            const defaultOutputDevice = this.devices.output[0];
            if (defaultOutputDevice) {
                outputDisplay.innerHTML = `
                    <i class="fas fa-headphones mr-2 text-blue-400"></i>
                    <span>${defaultOutputDevice.label || 'Default Speakers'}</span>
                `;
                this.addDebugInfo(`Displaying output device: ${defaultOutputDevice.label}`);
            } else {
                outputDisplay.innerHTML = `
                    <i class="fas fa-headphones mr-2 text-red-400"></i>
                    <span>No speakers detected</span>
                `;
            }
        }
    }

    displayCurrentVideoDevice() {
        const videoDisplay = document.getElementById('current-video-device');
        if (videoDisplay) {
            const defaultVideoDevice = this.devices.video[0];
            if (defaultVideoDevice) {
                videoDisplay.innerHTML = `
                    <i class="fas fa-video mr-2 text-purple-400"></i>
                    <span>${defaultVideoDevice.label || 'Default Camera'}</span>
                `;
                this.addDebugInfo(`Displaying video device: ${defaultVideoDevice.label}`);
            } else {
                videoDisplay.innerHTML = `
                    <i class="fas fa-video mr-2 text-red-400"></i>
                    <span>No camera detected</span>
                `;
            }
        }
    }

    getDeviceName(type, deviceId) {
        const devices = type === 'input' ? this.devices.input : this.devices.output;
        const device = devices.find(d => d.deviceId === deviceId);
        return device ? device.label || 'Unnamed Device' : 'Unknown Device';
    }

    checkBluetoothWarning() {
        const inputDevice = this.devices.input.find(d => d.deviceId === this.settings.inputDevice);
        const outputDevice = this.devices.output.find(d => d.deviceId === this.settings.outputDevice);
        const warning = document.getElementById('bluetooth-warning');
        
        if (warning && inputDevice && outputDevice) {
            const isBluetooth = (device) => 
                device.label.toLowerCase().includes('bluetooth') ||
                device.label.toLowerCase().includes('airpods') ||
                device.label.toLowerCase().includes('headset');
            
            if (isBluetooth(inputDevice) && isBluetooth(outputDevice) && 
                inputDevice.deviceId === outputDevice.deviceId) {
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.voice-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        const inputVolumeSlider = document.getElementById('input-volume');
        const outputVolumeSlider = document.getElementById('output-volume');
        // Device selectors removed - now using display-only elements
        const micTestBtn = document.getElementById('mic-test-btn');
        const videoTestBtn = document.getElementById('video-test-btn');

        if (inputVolumeSlider) {
            inputVolumeSlider.addEventListener('input', (e) => {
                this.settings.inputVolume = parseInt(e.target.value);
                this.updateVolumeIndicator('input', this.settings.inputVolume);
                this.updateInputGain();
                this.saveSettings();
                this.addDebugInfo(`Input volume changed to ${this.settings.inputVolume}%`);
            });
        }

        if (outputVolumeSlider) {
            outputVolumeSlider.addEventListener('input', (e) => {
                this.settings.outputVolume = parseInt(e.target.value);
                this.updateVolumeIndicator('output', this.settings.outputVolume);
                this.updateOutputGain();
                this.saveSettings();
                this.addDebugInfo(`Output volume changed to ${this.settings.outputVolume}%`);
            });
        }

        // Device displays are now read-only - no change events needed

        if (micTestBtn) {
            micTestBtn.addEventListener('click', () => this.toggleMicTest());
        }

        if (videoTestBtn) {
            videoTestBtn.addEventListener('click', () => this.toggleVideoTest());
        }


    }



    getVideoConstraints() {
        return {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            facingMode: 'user'
        };
    }

    switchTab(tabName) {
        document.querySelectorAll('.voice-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-content`).classList.remove('hidden');

        if (tabName === 'video') {
            this.displayCurrentVideoDevice();
        }
    }

        updateUI() {
        const inputVolumeSlider = document.getElementById('input-volume');
        const outputVolumeSlider = document.getElementById('output-volume');
        
        if (inputVolumeSlider) {
            inputVolumeSlider.value = this.settings.inputVolume;
            this.updateVolumeIndicator('input', this.settings.inputVolume);
        }
        
        if (outputVolumeSlider) {
            outputVolumeSlider.value = this.settings.outputVolume;
            this.updateVolumeIndicator('output', this.settings.outputVolume);
        }
    }

    updateVolumeIndicator(type, value) {
        const indicator = document.getElementById(`${type}-level`);
        if (indicator) {
            indicator.style.width = `${value}%`;
            
            // Update color based on volume level
            if (value > 80) {
                indicator.style.background = 'linear-gradient(to right, #43b581, #faa61a, #f04747)';
            } else if (value > 50) {
                indicator.style.background = 'linear-gradient(to right, #43b581, #faa61a)';
            } else {
                indicator.style.background = '#43b581';
            }
        }
    }

    updateInputGain() {
        if (this.micTest.inputGainNode) {
            // Convert percentage to gain (0-100% = 0-2 gain)
            const gain = (this.settings.inputVolume / 100) * 2;
            this.micTest.inputGainNode.gain.value = gain;
            this.addDebugInfo(`Input gain updated to ${gain.toFixed(2)} (${this.settings.inputVolume}%)`);
        }
    }

    updateOutputGain() {
        if (this.micTest.outputGainNode) {
            // Convert percentage to gain (0-100% = 0-1 gain)
            const gain = this.settings.outputVolume / 100;
            this.micTest.outputGainNode.gain.value = gain;
            this.addDebugInfo(`Output gain updated to ${gain.toFixed(2)} (${this.settings.outputVolume}%)`);
        }
    }

    async startVolumeMonitoring() {
        try {
            if (this.audioContext) {
                this.audioContext.close();
            }

            this.addDebugInfo('Creating REAL AudioContext with echo cancellation...');
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.addDebugInfo(`AudioContext state: ${this.audioContext.state}`);
            
            const constraints = {
                audio: {
                    deviceId: this.settings.inputDevice !== 'default' ? 
                        { exact: this.settings.inputDevice } : undefined,
                    echoCancellation: true,  // ENABLE echo cancellation
                    noiseSuppression: true,  // ENABLE noise suppression  
                    autoGainControl: true    // ENABLE auto gain control
                }
            };

            this.addDebugInfo('Requesting REAL microphone stream with echo cancellation...');
            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const tracks = this.mediaStream.getAudioTracks();
            if (tracks.length > 0) {
                this.addDebugInfo(`Using REAL audio track with echo cancellation: ${tracks[0].label}`);
                this.addDebugInfo(`Track settings: ${JSON.stringify(tracks[0].getSettings())}`);
            }
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.3;
            
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            this.addDebugInfo('REAL audio analysis pipeline connected with echo cancellation');
            this.startVisualizer();
            this.addDebugInfo('Audio monitoring started with REAL microphone data and echo cancellation');
        } catch (error) {
            this.addDebugInfo(`REAL audio monitoring failed: ${error.message}`);
            this.addDebugInfo('No fallback to mock data - requires real hardware');
        }
    }

    startVisualizer() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const bars = document.querySelectorAll('.visualizer-bars .bar');
        
        let lastDataSum = 0;
        let unchangedCount = 0;
        let dataChangeDetected = false;

        this.addDebugInfo(`Starting REAL audio visualizer with ${bufferLength} frequency bins`);

        const updateVisualizer = () => {
            if (!this.analyser) return;

            this.analyser.getByteFrequencyData(dataArray);
            
            const currentDataSum = dataArray.reduce((sum, value) => sum + value, 0);
            
            if (currentDataSum !== lastDataSum) {
                unchangedCount = 0;
                if (!dataChangeDetected) {
                    dataChangeDetected = true;
                    this.addDebugInfo('REAL audio data detected - visualizer showing live microphone input');
                }
            } else {
                unchangedCount++;
                if (unchangedCount > 300 && dataChangeDetected) {
                    this.addDebugInfo('Audio data static - check if microphone is working');
                }
            }
            lastDataSum = currentDataSum;

            bars.forEach((bar, index) => {
                const barIndex = Math.floor((index / bars.length) * bufferLength);
                const barHeight = (dataArray[barIndex] / 255) * 100;
                
                bar.classList.remove('active', 'medium', 'high');
                
                if (barHeight > 60) {
                    bar.classList.add('high');
                } else if (barHeight > 30) {
                    bar.classList.add('medium');
                } else if (barHeight > 10) {
                    bar.classList.add('active');
                }
            });

            requestAnimationFrame(updateVisualizer);
        };

        updateVisualizer();
    }

    async toggleMicTest() {
        const btn = document.getElementById('mic-test-btn');
        
        if (!this.micTest.isActive) {
            await this.startRealTimeMonitoring();
            btn.textContent = 'Stop Test';
            btn.classList.add('recording');
        } else {
            this.stopRealTimeMonitoring();
            btn.textContent = "Let's Check";
            btn.classList.remove('recording');
        }
    }

    async startRealTimeMonitoring() {
        try {
            // Real-time monitoring like Discord
            const constraints = {
                audio: {
                    // Always use default device since selection is removed
                    sampleRate: 44100,
                    channelCount: 1,
                    echoCancellation: false,  // DISABLE for real-time monitoring
                    noiseSuppression: false,  // Keep natural sound
                    autoGainControl: false    // Keep natural volume
                }
            };

            this.addDebugInfo('Starting REAL-TIME microphone monitoring like Discord...');
            this.micTest.testStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const tracks = this.micTest.testStream.getAudioTracks();
            if (tracks.length > 0) {
                const track = tracks[0];
                this.addDebugInfo(`=== ACTIVE INPUT DEVICE ===`);
                this.addDebugInfo(`Device: ${track.label}`);
                this.addDebugInfo(`Device ID: ${track.getSettings().deviceId || 'default'}`);
                this.addDebugInfo(`Sample Rate: ${track.getSettings().sampleRate}Hz`);
                this.addDebugInfo(`Channel Count: ${track.getSettings().channelCount}`);
                this.addDebugInfo(`Echo Cancellation: ${track.getSettings().echoCancellation}`);
                this.addDebugInfo(`Noise Suppression: ${track.getSettings().noiseSuppression}`);
                this.addDebugInfo(`Auto Gain Control: ${track.getSettings().autoGainControl}`);
            }

            // Create AudioContext for real-time processing
            if (this.audioContext) {
                this.audioContext.close();
            }
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create audio nodes for real-time monitoring
            const source = this.audioContext.createMediaStreamSource(this.micTest.testStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.3;
            
            // Create separate gain nodes for input and output control
            this.micTest.inputGainNode = this.audioContext.createGain();
            this.micTest.outputGainNode = this.audioContext.createGain();
            
            // Set initial volumes from settings
            const inputGain = (this.settings.inputVolume / 100) * 2; // 0-200% range for input boost
            const outputGain = this.settings.outputVolume / 100; // 0-100% range for output
            
            this.micTest.inputGainNode.gain.value = inputGain;
            this.micTest.outputGainNode.gain.value = outputGain;
            
            // Connect: Input -> InputGain -> Analyser -> OutputGain -> Output
            source.connect(this.micTest.inputGainNode);
            this.micTest.inputGainNode.connect(this.analyser);
            this.micTest.inputGainNode.connect(this.micTest.outputGainNode);
            this.micTest.outputGainNode.connect(this.audioContext.destination);

            this.micTest.isActive = true;
            this.addDebugInfo('REAL-TIME audio monitoring active - you should hear yourself immediately!');
            this.addDebugInfo(`Input gain: ${inputGain.toFixed(2)} (${this.settings.inputVolume}%)`);
            this.addDebugInfo(`Output gain: ${outputGain.toFixed(2)} (${this.settings.outputVolume}%)`);
            this.addDebugInfo('Using system default output device');
            
            // Start visualizer
            this.startVisualizer();

        } catch (error) {
            this.addDebugInfo(`Real-time monitoring failed: ${error.message}`);
            this.addDebugInfo('No mock audio - requires real microphone hardware');
        }
    }

    stopRealTimeMonitoring() {
        if (this.micTest.isActive) {
            this.micTest.isActive = false;
            
            // Disconnect audio nodes
            if (this.micTest.inputGainNode) {
                this.micTest.inputGainNode.disconnect();
                this.micTest.inputGainNode = null;
            }
            
            if (this.micTest.outputGainNode) {
                this.micTest.outputGainNode.disconnect();
                this.micTest.outputGainNode = null;
            }
            
            // Stop media stream
            if (this.micTest.testStream) {
                this.micTest.testStream.getTracks().forEach(track => track.stop());
                this.micTest.testStream = null;
            }
            
            // Close audio context
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            
            // Clear analyser
            if (this.analyser) {
                this.analyser = null;
            }
            
            // Clear visualizer bars
            const bars = document.querySelectorAll('.visualizer-bars .bar');
            bars.forEach(bar => {
                bar.classList.remove('active', 'medium', 'high');
            });
            
            this.addDebugInfo('Real-time monitoring stopped');
        }
    }

    async toggleVideoTest() {
        const btn = document.getElementById('video-test-btn');
        
        if (!this.videoTest.isActive) {
            await this.startVideoTest();
            btn.textContent = 'Stop Camera';
            btn.classList.add('recording');
        } else {
            this.stopVideoTest();
            btn.textContent = 'Test Camera';
            btn.classList.remove('recording');
        }
    }

    async startVideoTest() {
        try {
            const videoConstraints = this.getVideoConstraints();
            const constraints = {
                video: videoConstraints
            };

            this.addDebugInfo('Starting camera test...');
            this.videoTest.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const videoElement = document.getElementById('video-preview');
            if (videoElement) {
                this.videoTest.videoElement = videoElement;
                videoElement.srcObject = this.videoTest.videoStream;
                videoElement.play();
                
                const videoTrack = this.videoTest.videoStream.getVideoTracks()[0];
                if (videoTrack) {
                    this.addDebugInfo(`=== ACTIVE VIDEO DEVICE ===`);
                    this.addDebugInfo(`Device: ${videoTrack.label}`);
                    this.addDebugInfo(`Device ID: ${videoTrack.getSettings().deviceId || 'default'}`);
                    this.addDebugInfo(`Width: ${videoTrack.getSettings().width}px`);
                    this.addDebugInfo(`Height: ${videoTrack.getSettings().height}px`);
                    this.addDebugInfo(`Frame Rate: ${videoTrack.getSettings().frameRate}fps`);
                    this.addDebugInfo(`Facing Mode: ${videoTrack.getSettings().facingMode || 'user'}`);
                }
            }

            this.videoTest.isActive = true;
            this.addDebugInfo('Camera test active - video feed should be visible!');
            
        } catch (error) {
            this.addDebugInfo(`Camera test failed: ${error.message}`);
            this.addDebugInfo('Camera access denied or no camera available');
        }
    }

    stopVideoTest() {
        if (this.videoTest.isActive) {
            this.videoTest.isActive = false;
            
            if (this.videoTest.videoStream) {
                this.videoTest.videoStream.getTracks().forEach(track => track.stop());
                this.videoTest.videoStream = null;
            }
            
            if (this.videoTest.videoElement) {
                this.videoTest.videoElement.srcObject = null;
                this.videoTest.videoElement = null;
            }
            
            this.addDebugInfo('Camera test stopped');
        }
    }

    async restartAudioContext() {
        await this.startVolumeMonitoring();
    }



    addDebugInfo(message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${message}`;
        
        if (!this.debugLog) {
            this.debugLog = [];
        }
        
        this.debugLog.push(entry);
        
        if (this.debugLog.length > 50) {
            this.debugLog.shift();
        }

        console.log(`Audio Debug: ${entry}`);
    }

    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.micTest.testStream) {
            this.micTest.testStream.getTracks().forEach(track => track.stop());
        }
        if (this.videoTest.videoStream) {
            this.videoTest.videoStream.getTracks().forEach(track => track.stop());
        }
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
        }
    }
}

let voiceVideoSettings = null;

function initVoiceVideoSettings() {
    if (voiceVideoSettings) {
        voiceVideoSettings.destroy();
    }
    voiceVideoSettings = new VoiceVideoSettings();
}

function destroyVoiceVideoSettings() {
    if (voiceVideoSettings) {
        voiceVideoSettings.destroy();
        voiceVideoSettings = null;
    }
}

export { initVoiceVideoSettings, destroyVoiceVideoSettings };
