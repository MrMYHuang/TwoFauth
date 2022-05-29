export interface ShareTextModal {
    text: string;
    show: boolean;
}

export interface TmpSettings {
    shareTextModal: ShareTextModal;
}

export const defaultTmpSettings = {
    shareTextModal: { text: '', show: false },
} as TmpSettings;
