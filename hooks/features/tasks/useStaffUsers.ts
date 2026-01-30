import { useState, useEffect } from 'react';
import { getStaffUsers } from '@/actions/tasks';

export interface StaffUser {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
}

export function useStaffUsers() {
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        getStaffUsers()
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);
    
    return { users, loading };
}
