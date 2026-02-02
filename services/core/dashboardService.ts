// services/dashboardService.ts

import {
  userAdminRepository,
  classRepository,
  // paymentRepository // A ser usado no futuro
} from "@/repositories";

// Usando instâncias singleton centralizadas
const userAdminRepo = userAdminRepository;
const classRepo = classRepository;
// const paymentRepo = paymentRepository;

export class DashboardService {
  async getDashboardData() {
    // Busca todos os dados necessários em paralelo para máxima performance
    const [
      newUsersCount,
      activeTeachersCount,
      classesTodayCount,
      recentClasses,
      // Dados financeiros (placeholders)
      monthlyRevenue,
      revenueTrend,
      revenueLast6Months,
    ] = await Promise.all([
      userAdminRepo.countNewUsersThisMonth(),
      userAdminRepo.countActiveTeachers(),
      classRepo.countClassesForToday(),
      classRepo.findRecentClassesWithUserDetails(5), // Busca as últimas 5 aulas com detalhes
      // paymentRepo.getRevenueThisMonth(), // Futura implementação
      // paymentRepo.getRevenueTrend(), // Futura implementação
      Promise.resolve(1234.56), // Placeholder para receita mensal
      Promise.resolve(0.15), // Placeholder para tendência (+15%)
      Promise.resolve([
        { month: "Jan", revenue: 5000 },
        { month: "Fev", revenue: 6200 },
        { month: "Mar", revenue: 5800 },
        { month: "Abr", revenue: 7100 },
        { month: "Mai", revenue: 8500 },
        { month: "Jun", revenue: 9200 },
      ]), // Placeholder para últimos 6 meses
    ]);

    return {
      newUsersCount,
      activeTeachersCount,
      classesTodayCount,
      recentClasses,
      monthlyRevenue,
      revenueTrend,
      revenueLast6Months,
    };
  }
}

export const dashboardService = new DashboardService();
