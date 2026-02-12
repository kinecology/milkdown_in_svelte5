import { writable } from 'svelte/store';

export type DigitalNoteType = {
    title: string,
    body: string,
    tags: string[],
};

export const journalEditorDirty = writable(false);
export const showDirtySaveButtons = writable(false);
export const cameraIsActive = writable(false);
export const isMobileScreen = writable(false);
export const innerScreenWidth = writable(1000);
export const isMobileDevice = writable(/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)); // independent of screen size
