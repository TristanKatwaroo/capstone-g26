require('dotenv').config();
// Making sure it reads the key correctly
console.log("AssemblyAI Key:", process.env.ASSEMBLYAI_API_KEY);

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
      speech_model: 'best',
      word_boost: blackList, // Tell AI: "These words are important, don't skip them"
      boost_param: 'high',   // Increase sensitivity to these words
      filter_profanity: false // Explicitly disable any default censoring
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

//Replaces black listed words with "*censor*" for users to easily tell
const filterblackList = (words) => {
  return words.map(wordObj => {
    const cleanDisplayWord = wordObj.text.replace(/[.,?!:;"]/g, "");

    // 2. Clean the text for Comparison (Lowercase)
    const comparisonWord = cleanDisplayWord.toLowerCase();

    // 3. Check against blacklist
    const isMatch = blackList.includes(comparisonWord);

    // 4. Return the object with the NEW clean text
    return { 
        ...wordObj, 
        text: cleanDisplayWord, // <--- Overwrite the original text with the clean version
        isCensored: isMatch 
    };
  });
};

module.exports = { transcribeAudio, filterblackList };