// Define functions
export function playDiscordoSound() {
    const sound = new Audio('/public/assets/sound/discordo_sound.mp3');
    sound.volume = 0.5;
    sound.play()
        .catch(err => console.error('Error playing Discordo sound:', err));
}

export function playCallSound() {
    const sound = new Audio('/public/assets/sound/call_sound.mp3');
    sound.volume = 0.4;
    sound.play()
        .catch(err => console.error('Error playing Call sound:', err));
}

window.MusicLoaderStatic = {
    playDiscordoSound,
    playCallSound
};
