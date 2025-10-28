export interface Vacation {
    id?: string;
    teacherId: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
    createdAt: Date;
}