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
    // The element has no source until the user selects/restores a track.
    // `none` prevents a browser from speculatively fetching a large audio file.
    audio.preload = 'none';
    audio.loop = true;
    document.body.appendChild(audio);
    return audio;
}
