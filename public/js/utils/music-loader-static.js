export function playDiscordoSound() {
    const sound = new Audio('/public/assets/sound/discordo_sound.mp3');
    sound.volume = 0.5;
    
    const playPromise = sound.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => console.error('Error playing Discordo sound:', err));
    }
}

let currentCallSound = null;

export function playCallSound() {
    if (currentCallSound) {
        return;
    }

    currentCallSound = new Audio('/public/assets/sound/call_sound.mp3');
    currentCallSound.volume = 0.4;
    
    const playPromise = currentCallSound.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.error('Error playing Call sound:', err);
            currentCallSound = null;
        });
    }

    currentCallSound.addEventListener('ended', () => {
        currentCallSound = null;
    });
    
    currentCallSound.addEventListener('error', () => {
        currentCallSound = null;
    });
}

export function stopCallSound() {
    if (currentCallSound) {
        currentCallSound.pause();
        currentCallSound.currentTime = 0;
        currentCallSound = null;
    }
}

let currentJoinSound = null;

export function playJoinVoiceSound() {
    if (currentJoinSound) return;

    currentJoinSound = new Audio('/public/assets/sound/join_voice_sound.mp3');
    currentJoinSound.volume = 0.3;
    currentJoinSound.play()
        .catch(err => console.error('Error playing Join Voice sound:', err));
    
    currentJoinSound.addEventListener('ended', () => {
        currentJoinSound = null;
    });
}

export function stopJoinVoiceSound() {
    if (currentJoinSound) {
        currentJoinSound.pause();
        currentJoinSound.currentTime = 0;
        currentJoinSound = null;
    }
}

export function playDisconnectVoiceSound() {
    const sound = new Audio('/public/assets/sound/disconnect_voice_sound.mp3');
    sound.volume = 0.3;
    sound.play()
        .catch(err => console.error('Error playing Disconnect Voice sound:', err));
}

export function playDiscordMuteSound() {
    const sound = new Audio('/public/assets/sound/discord_mute_sound.mp3');
    sound.volume = 0.4;
    sound.play()
        .catch(err => console.error('Error playing Discord Mute sound:', err));
}

export function playDiscordUnmuteSound() {
    const sound = new Audio('/public/assets/sound/discord_unmute_sound.mp3');
    sound.volume = 0.4;
    sound.play()
        .catch(err => console.error('Error playing Discord Unmute sound:', err));
}

const MusicLoaderStatic = {
    playDiscordoSound,
    playCallSound,
    stopCallSound,
    playJoinVoiceSound,
    stopJoinVoiceSound,
    playDisconnectVoiceSound,
    playDiscordMuteSound,
    playDiscordUnmuteSound
};

window.MusicLoaderStatic = MusicLoaderStatic;

export default MusicLoaderStatic;
