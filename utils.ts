// FIX: Changed import to be a relative path.
import { Theme, AppearanceSettings } from './types';

export const formatCurrency = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '';
    }
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

export const formatNumber = (value: number, digits = 2): string => {
    if (isNaN(value) || !isFinite(value)) return '0.00';
    return value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export const formatDistanceToNow = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `vor ${Math.floor(interval)} Jahren`;
    interval = seconds / 2592000;
    if (interval > 1) return `vor ${Math.floor(interval)} Monaten`;
    interval = seconds / 86400;
    if (interval > 1) return `vor ${Math.floor(interval)} Tagen`;
    interval = seconds / 3600;
    if (interval > 1) return `vor ${Math.floor(interval)} Stunden`;
    interval = seconds / 60;
    if (interval > 1) return `vor ${Math.floor(interval)} Minuten`;
    return 'gerade eben';
};

// Helper to get ISO week number
export const getWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '0 82 204';
};

export const applyTheme = (theme: Theme) => {
    document.documentElement.style.setProperty('--color-primary', hexToRgb(theme.primary));
    document.documentElement.style.setProperty('--color-primary-hover', hexToRgb(theme.hover));
    localStorage.setItem('app-theme-colors', JSON.stringify(theme));
};

export const applyAppearanceSettings = (settings: Partial<AppearanceSettings>) => {
    const doc = document.documentElement;

    // Mode (Dark/Light/System)
    if (settings.mode) {
        if (settings.mode === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            doc.classList.toggle('dark', systemPrefersDark);
        } else {
            doc.classList.toggle('dark', settings.mode === 'dark');
        }
        localStorage.setItem('app-theme-mode', settings.mode);
    }
    
    // Font Size
    if (settings.fontSize) {
        let size = '1rem';
        if (settings.fontSize === 'sm') size = '0.875rem';
        if (settings.fontSize === 'lg') size = '1.125rem';
        doc.style.setProperty('--font-size-base', size);
        localStorage.setItem('app-theme-fontSize', settings.fontSize);
    }

    // Density
    if (settings.density) {
        doc.style.setProperty('--layout-density-multiplier', 
            settings.density === 'compact' ? '0.8' : '1'
        );
        localStorage.setItem('app-theme-density', settings.density);
    }
};

export const loadAndApplyInitialAppearance = () => {
    const settings: AppearanceSettings = {
        mode: localStorage.getItem('app-theme-mode') as AppearanceSettings['mode'] || 'system',
        fontSize: localStorage.getItem('app-theme-fontSize') as AppearanceSettings['fontSize'] || 'md',
        density: localStorage.getItem('app-theme-density') as AppearanceSettings['density'] || 'comfortable',
    };
    applyAppearanceSettings(settings);

    // Also apply color theme
    const savedThemeColors = localStorage.getItem('app-theme-colors');
    if (savedThemeColors) {
        try {
            applyTheme(JSON.parse(savedThemeColors));
        } catch (e) { console.error('Failed to parse color theme', e); }
    }
};