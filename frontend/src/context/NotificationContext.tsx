import React, { createContext, useContext, useState } from 'react';

export interface NotificationItem {
    id: string; // unique key like freightId_status
    freightId: number;
    status: string;
    type: 'pickup' | 'delivery'; // 'pickup' for IN_TRANSIT, 'delivery' for DELIVERED
    description: string;
}

interface NotificationContextType {
    pendingItems: NotificationItem[];
    setPendingItems: (items: NotificationItem[]) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    pendingItems: [],
    setPendingItems: () => { }
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pendingItems, setPendingItems] = useState<NotificationItem[]>([]);

    return (
        <NotificationContext.Provider value={{ pendingItems, setPendingItems }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
