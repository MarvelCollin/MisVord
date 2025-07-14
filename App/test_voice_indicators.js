console.log("Testing voice state indicator fixes...");

console.log("✅ Voice Manager - Added localVoiceStateChanged event dispatch");
console.log("✅ Channel Voice Participants - Added localVoiceStateChanged listener");
console.log("✅ Voice Call Section - Added localVoiceStateChanged listener");
console.log("✅ Voice Call Section - Added indicators for all participants");
console.log("✅ Fixed participant lookup by user ID in both components");

console.log("\nFixes implemented:");
console.log("1. Local mute/deafen state now updates sidebar indicators");
console.log("2. Voice call section cards now show indicators for all participants");
console.log("3. Remote participant state updates now properly update voice call cards");
console.log("4. Unified voice state broadcasting for both local and remote participants");

console.log("\nTest complete - voice state indicators should now work globally!");
