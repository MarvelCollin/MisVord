// Test queue logic
const queue = [
    { title: "Her", artist: "JVKE", previewUrl: "url1" },
    { title: "APT", artist: "Bruno", previewUrl: "url2" }
];

console.log("Initial queue:", queue);

// Simulate first next command (no song currently playing)
let currentPlayingIndex = queue.findIndex(song => song.isCurrentlyPlaying);
console.log("Current playing index (should be -1):", currentPlayingIndex);

if (currentPlayingIndex === -1) {
    queue.forEach(song => song.isCurrentlyPlaying = false);
    queue[0].isCurrentlyPlaying = true;
    const firstTrack = queue[0];
    console.log("First next command should play:", firstTrack.title, "by", firstTrack.artist);
} else {
    console.log("ERROR: Expected -1 but got", currentPlayingIndex);
}

// Simulate second next command
currentPlayingIndex = queue.findIndex(song => song.isCurrentlyPlaying);
console.log("After first next, current playing index:", currentPlayingIndex);

if (currentPlayingIndex < queue.length - 1) {
    queue.forEach(song => song.isCurrentlyPlaying = false);
    queue[currentPlayingIndex + 1].isCurrentlyPlaying = true;
    const nextTrack = queue[currentPlayingIndex + 1];
    console.log("Second next command should play:", nextTrack.title, "by", nextTrack.artist);
} else {
    console.log("Already at last song");
}

console.log("Final queue state:", queue);
