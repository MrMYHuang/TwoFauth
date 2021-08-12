import { Bookmark } from "./Bookmark";

export class Settings {
    version: number = 1;
    hasAppLog: boolean = true;
    theme: number = 2;
    uiFontSize: number = 24;
    isInitialized: boolean = false;
    bookmarks: Bookmark[] = [];
}
