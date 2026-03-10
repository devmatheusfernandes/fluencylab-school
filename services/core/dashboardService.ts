// services/dashboardService.ts

import {
  userAdminRepository,
  classRepository,
  paymentRepository
} from "@/repositories";

// Usando instâncias singleton centralizadas
const userAdminRepo = userAdminRepository;
const classRepo = classRepository;
const paymentRepo = paymentRepository;

export class DashboardService {
  async getDashboardData() {
    const now = new Date();
    
    // Período: Mês Atual (do dia 1 até agora)
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Período: Mês Anterior (todo o mês passado)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Busca todos os dados necessários em paralelo para máxima performance
    const [
      newUsersCount,
      activeTeachersCount,
      classesTodayCount,
      recentClasses,
      revenueThisMonth,
      revenueLastMonth,
      revenueLast6Months,
    ] = await Promise.all([
      userAdminRepo.countNewUsersThisMonth(),
      userAdminRepo.countActiveTeachers(),
      classRepo.countClassesForToday(),
      classRepo.findRecentClassesWithUserDetails(5),
      paymentRepo.getRevenueInPeriod(startOfCurrentMonth, now),
      paymentRepo.getRevenueInPeriod(startOfLastMonth, endOfLastMonth),
      paymentRepo.getRevenueLast6Months(),
    ]);

    // Calcula tendência
    let revenueTrend = 0;
    if (revenueLastMonth > 0) {
      revenueTrend = (revenueThisMonth - revenueLastMonth) / revenueLastMonth;
    } else if (revenueThisMonth > 0) {
      revenueTrend = 1; // 100% de crescimento se saiu de 0 para algo
    }

    return {
      newUsersCount,
      activeTeachersCount,
      classesTodayCount,
      recentClasses,
      monthlyRevenue: revenueThisMonth,
      revenueTrend,
      revenueLast6Months,
    };
  }
}

export const dashboardService = new DashboardService();
