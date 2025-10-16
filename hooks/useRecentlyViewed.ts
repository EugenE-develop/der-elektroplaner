import { useCallback } from 'react';
import { RecentItem } from '../types';

const RECENTLY_VIEWED_KEY = 'hoai-planer-pro-recent';
const MAX_RECENT_ITEMS = 5;

export function useRecentlyViewed() {
    const getRecentItems = useCallback((): RecentItem[] => {
        try {
            const items = localStorage.getItem(RECENTLY_VIEWED_KEY);
            return items ? JSON.parse(items) : [];
        } catch (error) {
            console.error('Failed to parse recently viewed items:', error);
            return [];
        }
    }, []);

    const addRecentItem = useCallback((item: RecentItem) => {
        const currentItems = getRecentItems();
        
        // Remove the item if it already exists to move it to the top
        const filteredItems = currentItems.filter(i => i.id !== item.id);
        
        // Add the new item to the beginning
        const newItems = [item, ...filteredItems];
        
        // Limit the number of items
        const limitedItems = newItems.slice(0, MAX_RECENT_ITEMS);
        
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(limitedItems));
    }, [getRecentItems]);

    return { getRecentItems, addRecentItem };
}