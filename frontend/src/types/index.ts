import { LucideIcon } from 'lucide-react';

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
}

export interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}
