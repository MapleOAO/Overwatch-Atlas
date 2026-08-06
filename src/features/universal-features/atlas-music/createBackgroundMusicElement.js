/**
 * createBackgroundMusicElement — mounts the persistent `<audio id="backgroundMusic">`
 * element that drives all music playback. Mounted once at boot by `MusicLoaders.loadMusic`.
 */

/**
 * @returns {HTMLAudioElement}
 */
export function createBackgroundMusicElement() {
    const audio = document.createElement('audio');
    audio.id = 'backgroundMusic';
    // Music is selected/played on demand. The old auto value caused the
    // browser to start fetching audio before the user opened the music panel.
    audio.preload = 'none';
    audio.loop = true;
    document.body.appendChild(audio);
    return audio;
}
