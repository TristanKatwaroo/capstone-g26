require('dotenv').config();
const { AssemblyAI } = require('assemblyai');

// Initialize the AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

/**
 * Uploads an audio file and returns the transcript with word-level timestamps.
 * @param {string} filePath - The local path to the audio file (e.g., './uploads/audio.mp3')
 * @returns {Promise<Object>} - The transcript object containing the 'words' array.
 */
const transcribeAudio = async (filePath) => {
  try {
    console.log(`🎤 Starting transcription for: ${filePath}`);

    // Step 1: Upload the file to AssemblyAI
    // (AssemblyAI needs a URL to transcribe. This uploads local files to their temp storage.)
    const uploadUrl = await client.files.upload(filePath);
    console.log('✅ File uploaded to AssemblyAI');

    // Step 2: Submit for transcription
    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      // We don't need speaker labels for the MVP, but we absolutely need word timestamps
      // which AssemblyAI provides by default.
    });

    // Step 3: Check status
    if (transcript.status === 'error') {
      throw new Error(transcript.error);
    }

    console.log('✅ Transcription complete!');
    
    // We return the full transcript object because your Blacklist Matcher
    // will need the 'words' array (which contains start/end timestamps).
    return transcript;

  } catch (error) {
    console.error('❌ Error in transcriptionService:', error);
    throw error;
  }
};

module.exports = { transcribeAudio };