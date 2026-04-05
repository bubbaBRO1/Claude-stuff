/**
 * youtube.js  —  YouTube transcript fetcher
 *
 * Uses the youtube-transcript npm package (CEP Node.js runtime).
 * Falls back to a plain-text description prompt if transcript unavailable.
 */

'use strict';

(function (global) {

  var YoutubeTranscript;
  try {
    YoutubeTranscript = require('youtube-transcript').YoutubeTranscript;
  } catch (e) {
    console.warn('[youtube.js] youtube-transcript not loaded:', e.message);
  }

  /**
   * Extract the video ID from any YouTube URL format:
   *   https://www.youtube.com/watch?v=VIDEO_ID
   *   https://youtu.be/VIDEO_ID
   *   https://www.youtube.com/shorts/VIDEO_ID
   */
  function extractVideoId(url) {
    var patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /shorts\/([A-Za-z0-9_-]{11})/,
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = url.match(patterns[i]);
      if (m) return m[1];
    }
    return null;
  }

  /**
   * Fetch the full transcript for a YouTube video.
   * Returns a plain string of all transcript text joined together.
   *
   * @param {string} url  - YouTube video URL
   * @returns {Promise<{text: string, videoId: string}>}
   */
  async function getTranscript(url) {
    var videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Could not parse a YouTube video ID from: ' + url);
    }

    if (!YoutubeTranscript) {
      throw new Error(
        'youtube-transcript package not found. Run:\n  npm install\ninside the ae-connector folder.'
      );
    }

    var segments;
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (e) {
      throw new Error(
        'Could not fetch transcript for video ' + videoId + '.\n' +
        'The video may have no captions, or YouTube blocked the request.\n' +
        'Error: ' + e.message
      );
    }

    // Join all text segments into a single string with spaces
    var text = segments.map(function (s) { return s.text; }).join(' ');

    return { text: text, videoId: videoId };
  }

  /**
   * Quick check: is a string a YouTube URL?
   */
  function isYouTubeUrl(str) {
    return /youtube\.com|youtu\.be/.test(str);
  }

  global.YouTubeClient = { getTranscript: getTranscript, isYouTubeUrl: isYouTubeUrl };

})(window);
