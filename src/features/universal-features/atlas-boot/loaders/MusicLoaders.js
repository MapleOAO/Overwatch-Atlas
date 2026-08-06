/**
 * MusicLoaders — load/unload pair for music components.
 *
 * `loadMusic` adds only the lightweight music shell to the landing page. The
 * MusicService graph, catalog manifest, and sound effect are loaded on the
 * first click so music cannot block the first paint. `unloadMusic` removes
 * the button + panel and stops any playing audio.
 */

import {
    withLoadLifecycle,
    withUnloadLifecycle,
    checkAlreadyLoaded
} from '../../atlas-shared-ui/loading/LoadingLifecycle.js';
import { loadSoundEffect } from '../../atlas-sound-effects/loadSoundEffects.js';
import { createHeaderHubButton } from '../../atlas-header/HeaderHubButton.js';
import { lookAndAddElement } from '../../atlas-shared-ui/dom/lookAndAddElement.js';
import { createMusicPanel } from '../../atlas-music/panel/musicPanelMarkup.js';
import { removeElementsByIds } from '../../atlas-shared-ui/dom/removeElement.js';
import { updateStatus } from '../../atlas-mode-runtime/statusFeed.js';
import { getRunOperation } from '../../atlas-mode-runtime/loadingOverlayState.js';
import { createBackgroundMusicElement } from '../../atlas-music/createBackgroundMusicElement.js';

let musicActivationPromise = null;
let removeLazyMusicActivation = null;

async function activateMusicService() {
    if (window.MusicManager?.initialized) return;

    if (!musicActivationPromise) {
        musicActivationPromise = (async () => {
            const { initializeMusicService } = await import('../../atlas-music/initializeMusicService.js');
            await import('../../atlas-music/MusicService.js?v=101');
            loadSoundEffect('music', 'src/assets/audio/sfx/Music.mp3', '正在加载音乐音效…');
            initializeMusicService(true);

            if (!window.MusicManager?.initialized) {
                throw new Error('MusicService 初始化失败');
            }
        })().catch((error) => {
            musicActivationPromise = null;
            throw error;
        });
    }

    await musicActivationPromise;
}

function installLazyMusicActivation(button) {
    if (!button || button.dataset.atlasMusicLazy === 'true') return;

    let isLoading = false;
    const onFirstClick = async (event) => {
        if (window.MusicManager?.initialized) {
            button.removeEventListener('click', onFirstClick, true);
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        if (isLoading) return;

        isLoading = true;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.title = '正在加载音乐…';
        updateStatus('正在加载音乐功能…', 'info');

        try {
            await activateMusicService();
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.title = '音乐选项';
            button.removeEventListener('click', onFirstClick, true);
            // Re-dispatch the original intent after the service has attached
            // its normal panel-toggle listeners.
            button.click();
        } catch (error) {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.title = '音乐选项';
            isLoading = false;
            console.error('MusicService lazy load failed:', error);
            updateStatus(`音乐功能加载失败：${error.message}`, 'error');
        }
    };

    button.dataset.atlasMusicLazy = 'true';
    button.addEventListener('click', onFirstClick, true);
    removeLazyMusicActivation = () => {
        button.removeEventListener('click', onFirstClick, true);
        delete button.dataset.atlasMusicLazy;
    };
}

export async function loadMusic(loadedComponents) {
    if (checkAlreadyLoaded(loadedComponents.music, 'Music')) {
        return;
    }

    await withLoadLifecycle(async () => {
        const musicButton = createHeaderHubButton({
            id: 'musicToggle',
            className: '',
            title: '音乐选项',
            label: '音乐',
            iconPath: 'src/assets/images/Icons/Music%20Icons/Music%20Icon.png',
            iconAlt: '音乐',
            parentId: 'headerHubRightButtonGroup',
            baseClass: 'header-hub-btn header-hub-btn--icon',
            headerOrder: 60
        });

        lookAndAddElement('musicPanel', () => {
            updateStatus('Adding music panel...', 'info');
            return createMusicPanel();
        }, 'Music panel');

        lookAndAddElement('backgroundMusic', () => {
            updateStatus('Adding audio element...', 'info');
            return createBackgroundMusicElement();
        }, 'Audio element');

        // MusicService fetches the catalog manifest and wires the whole music
        // panel only after the user opens Music. Keep that graph off the
        // landing-page critical path.
        installLazyMusicActivation(musicButton);

        loadedComponents.music = true;
    }, 'Music', 'loadMusicBtn', getRunOperation());
}

export async function unloadMusic(loadedComponents) {
    if (!loadedComponents.music) {
        updateStatus('Music not loaded', 'info');
        return;
    }

    await withUnloadLifecycle(async () => {
        removeLazyMusicActivation?.();
        removeLazyMusicActivation = null;

        removeElementsByIds([
            { id: 'musicToggle', message: 'Music button removed' },
            { id: 'musicPanel', message: 'Music panel removed' }
        ]);

        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        loadedComponents.music = false;
    }, 'Music', 'loadMusicBtn');
}
