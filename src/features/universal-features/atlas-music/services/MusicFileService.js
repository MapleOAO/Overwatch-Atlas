/**
 * MusicFileService — manifest-driven catalog + grid UI.
 */

import { fetchMusicManifest } from '../Initialization/musicManifestFetch.js';
import { renderMusicGridButtons, updateMusicGridSelection } from '../panel/musicGridButtons.js';

const getLogAssetLoad = () =>
    (typeof window !== 'undefined' && typeof window.logAssetLoad === 'function')
        ? window.logAssetLoad
        : () => {};

export class MusicFileService {
    constructor() {
        this.musicFiles = [];
    }

    async loadMusicFiles() {
        try {
            const manifest = await fetchMusicManifest();

            if (manifest.music && manifest.music.length > 0) {
                this.musicFiles = manifest.music;
                console.log(`Loaded ${this.musicFiles.length} music files from manifest:`, this.musicFiles.map((s) => s.name));

                const logAssetLoad = getLogAssetLoad();
                this.musicFiles.forEach((song) => {
                    logAssetLoad('MUSIC_FILE', `${song.filename} (${song.name})`);
                });

                return this.musicFiles;
            }
            console.warn('No music files found in manifest.json');
            return [];
        } catch (error) {
            console.error('Error loading manifest.json:', error);
            throw error;
        }
    }

    preloadPrioritySong(songPath, encodeMusicPath) {
        if (!songPath) return;

        const logAssetLoad = getLogAssetLoad();
        const prioritySongFile = this.musicFiles.find((s) => {
            const filePath = `src/assets/audio/music/${s.filename}`;
            return filePath === songPath || filePath.replace(/ /g, '%20') === songPath;
        });

        if (prioritySongFile) {
            logAssetLoad('MUSIC_PRIORITY', `Preloading current song: ${prioritySongFile.filename}`);
            const encodedPath = encodeMusicPath(`src/assets/audio/music/${prioritySongFile.filename}`);
            const priorityAudio = new Audio(encodedPath);
            priorityAudio.preload = 'auto';
            priorityAudio.load();
        }
    }

    preloadAllMusic() {
        // Kept as a compatibility no-op because the boot sequence still calls
        // this hook. Audio is loaded by the single shared audio element when
        // the current track is played; creating 80+ auto-preload elements here
        // consumed the majority of the first-load bandwidth.
    }

    createMusicButtons(musicGrid, currentSong, onSongClick, matchesSongPath) {
        renderMusicGridButtons(
            this.musicFiles,
            musicGrid,
            currentSong,
            onSongClick,
            matchesSongPath
        );
    }

    updateSelectedButton(currentSong, matchesSongPathFn) {
        updateMusicGridSelection(currentSong, matchesSongPathFn);
    }
}
