require('dotenv').config();

const { AssemblyAI } = require('assemblyai');
//const blacklist = ["test", "service"];
const blackList = require('./blackList');

// Initialize the AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

/**
 * Uploads an audio file and returns the transcript with word-level timestamps.
 * @param {string} filePath - The local path to the audio file (e.g., './uploads/audio.mp3')
 * @returns {Promise<Object>} - The transcript object containing the 'words' array.
 */
const transcribeAudio = async (filePath, customWordList = null) => {
  try {
    console.log(`🎤 Starting transcription for: ${filePath}`);

    const activeKeyterms =
      Array.isArray(customWordList) && customWordList.length > 0
        ? customWordList
        : blackList;

    // Step 1: Upload the file to AssemblyAI
    // (AssemblyAI needs a URL to transcribe. This uploads local files to their temp storage.)
    const uploadUrl = await client.files.upload(filePath);
    console.log('✅ File uploaded to AssemblyAI');

    // Step 2: Submit for transcription
    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      speech_models: ['universal-3-pro'],
      keyterms_prompt: activeKeyterms, 
      filter_profanity: false, 
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

const filterblackList = (words, customWordList = null) => {
  const activeList =
    Array.isArray(customWordList) && customWordList.length > 0
      ? customWordList
      : blackList;

  const normalizedList = activeList
    .map((word) => String(word).trim().toLowerCase())
    .filter(Boolean);

  return words.map(wordObj => {
    const cleanDisplayWord = wordObj.text.replace(/[.,?!:;\"]/g, "");
    const comparisonWord = cleanDisplayWord.toLowerCase();

    const isMatch = normalizedList.includes(comparisonWord);

    return { 
      ...wordObj, 
      text: cleanDisplayWord,
      isCensored: isMatch 
    };
  });
};

module.exports = { transcribeAudio, filterblackList };