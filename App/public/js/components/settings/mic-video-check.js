class VoiceVideoSettings {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;
        this.micTest = {
            isRecording: false,
            recordedChunks: [],
            mediaRecorder: null
        };
        this.devices = {
            input: [],
            output: []
        };
        this.settings = this.loadSettings();
        this.visualizerInterval = null;
        
        this.init();
    }

    async init() {
        await this.loadDevices();
        this.setupEventListeners();
        this.updateUI();
        this.startVolumeMonitoring();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('misvord_audio_settings');
            return saved ? JSON.parse(saved) : {
                inputVolume: 50,
                outputVolume: 75,
                inputDevice: 'default',
                outputDevice: 'default'
            };
        } catch {
            return {
                inputVolume: 50,
                outputVolume: 75,
                inputDevice: 'default',
                outputDevice: 'default'
            };
        }
    }

    saveSettings() {
        localStorage.setItem('misvord_audio_settings', JSON.stringify(this.settings));
    }

    async loadDevices() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            this.devices.input = devices.filter(device => device.kind === 'audioinput');
            this.devices.output = devices.filter(device => device.kind === 'audiooutput');
            
            this.populateDeviceSelects();
            this.checkBluetoothWarning();
        } catch (error) {
            this.addDebugInfo('Microphone access denied or not available');
        }
    }

    populateDeviceSelects() {
        const inputSelect = document.getElementById('input-device-select');
        const outputSelect = document.getElementById('output-device-select');
        
        if (inputSelect) {
            inputSelect.innerHTML = '<option value="default">Default</option>';
            this.devices.input.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Microphone ${device.deviceId.slice(0, 5)}`;
                if (device.deviceId === this.settings.inputDevice) {
                    option.selected = true;
                }
                inputSelect.appendChild(option);
            });
        }
        
        if (outputSelect) {
            outputSelect.innerHTML = '<option value="default">Default</option>';
            this.devices.output.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Speaker ${device.deviceId.slice(0, 5)}`;
                if (device.deviceId === this.settings.outputDevice) {
                    option.selected = true;
                }
                outputSelect.appendChild(option);
            });
        }
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
        const inputDeviceSelect = document.getElementById('input-device-select');
        const outputDeviceSelect = document.getElementById('output-device-select');
        const micTestBtn = document.getElementById('mic-test-btn');

        if (inputVolumeSlider) {
            inputVolumeSlider.addEventListener('input', (e) => {
                this.settings.inputVolume = parseInt(e.target.value);
                this.updateVolumeIndicator('input', this.settings.inputVolume);
                this.saveSettings();
            });
        }

        if (outputVolumeSlider) {
            outputVolumeSlider.addEventListener('input', (e) => {
                this.settings.outputVolume = parseInt(e.target.value);
                this.updateVolumeIndicator('output', this.settings.outputVolume);
                this.saveSettings();
            });
        }

        if (inputDeviceSelect) {
            inputDeviceSelect.addEventListener('change', (e) => {
                this.settings.inputDevice = e.target.value;
                this.saveSettings();
                this.checkBluetoothWarning();
                this.restartAudioContext();
            });
        }

        if (outputDeviceSelect) {
            outputDeviceSelect.addEventListener('change', (e) => {
                this.settings.outputDevice = e.target.value;
                this.saveSettings();
                this.checkBluetoothWarning();
            });
        }

        if (micTestBtn) {
            micTestBtn.addEventListener('click', () => this.toggleMicTest());
        }
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

        if (tabName === 'debugging') {
            this.updateDebugInfo();
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
        }
    }

    async startVolumeMonitoring() {
        try {
            if (this.audioContext) {
                this.audioContext.close();
            }

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const constraints = {
                audio: {
                    deviceId: this.settings.inputDevice !== 'default' ? 
                        { exact: this.settings.inputDevice } : undefined
                }
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            this.startVisualizer();
            this.addDebugInfo('Audio monitoring started successfully');
        } catch (error) {
            this.addDebugInfo(`Audio monitoring failed: ${error.message}`);
        }
    }

    startVisualizer() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const bars = document.querySelectorAll('.visualizer-bars .bar');

        const updateVisualizer = () => {
            if (!this.analyser) return;

            this.analyser.getByteFrequencyData(dataArray);
            
            const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
            const normalizedLevel = (average / 255) * 100;

            this.updateVolumeIndicator('input', normalizedLevel);

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
        
        if (!this.micTest.isRecording) {
            await this.startMicTest();
            btn.textContent = 'Stop Test';
            btn.classList.add('recording');
        } else {
            this.stopMicTest();
            btn.textContent = "Let's Check";
            btn.classList.remove('recording');
        }
    }

    async startMicTest() {
        try {
            const constraints = {
                audio: {
                    deviceId: this.settings.inputDevice !== 'default' ? 
                        { exact: this.settings.inputDevice } : undefined
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.micTest.mediaRecorder = new MediaRecorder(stream);
            this.micTest.recordedChunks = [];

            this.micTest.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.micTest.recordedChunks.push(event.data);
                }
            };

            this.micTest.mediaRecorder.onstop = () => {
                this.playRecording();
            };

            this.micTest.mediaRecorder.start();
            this.micTest.isRecording = true;
            this.addDebugInfo('Mic test recording started');

            setTimeout(() => {
                if (this.micTest.isRecording) {
                    this.stopMicTest();
                }
            }, 3000);

        } catch (error) {
            this.addDebugInfo(`Mic test failed: ${error.message}`);
        }
    }

    stopMicTest() {
        if (this.micTest.mediaRecorder && this.micTest.isRecording) {
            this.micTest.mediaRecorder.stop();
            this.micTest.isRecording = false;
            this.addDebugInfo('Mic test recording stopped');
        }
    }

    playRecording() {
        if (this.micTest.recordedChunks.length > 0) {
            const blob = new Blob(this.micTest.recordedChunks, { type: 'audio/webm' });
            const audio = new Audio(URL.createObjectURL(blob));
            audio.volume = this.settings.outputVolume / 100;
            audio.play();
            this.addDebugInfo('Playing back recorded audio');
        }
    }

    async restartAudioContext() {
        await this.startVolumeMonitoring();
    }

    updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo) return;

        const info = [
            `Audio Context State: ${this.audioContext?.state || 'Not initialized'}`,
            `Input Devices: ${this.devices.input.length}`,
            `Output Devices: ${this.devices.output.length}`,
            `Selected Input: ${this.settings.inputDevice}`,
            `Selected Output: ${this.settings.outputDevice}`,
            `Input Volume: ${this.settings.inputVolume}%`,
            `Output Volume: ${this.settings.outputVolume}%`,
            `Media Stream Active: ${this.mediaStream?.active || false}`,
            `Browser: ${navigator.userAgent}`,
            `Platform: ${navigator.platform}`,
            `WebRTC Support: ${!!navigator.mediaDevices}`,
            `Audio Context Support: ${!!(window.AudioContext || window.webkitAudioContext)}`
        ];

        debugInfo.innerHTML = info.map(line => `<div>${line}</div>`).join('');
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

        const debugInfo = document.getElementById('debug-info');
        if (debugInfo && document.querySelector('[data-tab="debugging"]').classList.contains('active')) {
            this.updateDebugInfo();
            debugInfo.innerHTML += `<div style="color: #43b581;">${entry}</div>`;
            debugInfo.scrollTop = debugInfo.scrollHeight;
        }
    }

    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
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
