import { Bookmark } from "./Bookmark";

export interface Settings {
    version: number;
    hasAppLog: boolean;
    theme: number;
    uiFontSize: number;
    isInitialized: boolean;
    bookmarks: Bookmark[]
}

export const defaultSettings = {
    version: 1,
    hasAppLog: true,
    theme: 2,
    uiFontSize: 24,
    isInitialized: false,
    bookmarks: [],
} as Settings;
