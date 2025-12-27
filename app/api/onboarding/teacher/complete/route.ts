// app/api/onboarding/teacher/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { TeacherOnboardingData } from "@/types/onboarding/teacher";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Starting teacher onboarding completion...");

    const session = await getServerSession(authOptions);
    console.log("👤 Session user:", {
      id: session?.user?.id,
      role: session?.user?.role,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can complete teacher onboarding" },
        { status: 403 }
      );
    }

    const data: TeacherOnboardingData = await request.json();
    console.log("📝 Received onboarding data:", {
      nickname: data.nickname,
      scheduleSlots: data.scheduleSlots?.length,
      hasBankingInfo: !!data.bankingInfo,
    });

    // Update user document with onboarding completion
    console.log("📄 Updating user document...");
    const userRef = adminDb.doc(`users/${session.user.id}`);
    await userRef.update({
      nickname: data.nickname,
      interfaceLanguage: data.interfaceLanguage,
      theme: data.theme,
      tutorialCompleted: true,
      onboardingCompletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log("✅ User document updated successfully");

    // Save banking information (in a real app, this should be encrypted and stored securely)
    console.log("🏦 Saving banking information...");
    const bankingInfoRef = adminDb.collection("teacherBankingInfo");
    await bankingInfoRef.add({
      teacherId: session.user.id,
      fullName: data.bankingInfo.fullName,
      cpf: data.bankingInfo.cpf,
      bankCode: data.bankingInfo.bankCode,
      bankName: data.bankingInfo.bankName,
      accountType: data.bankingInfo.accountType,
      agency: data.bankingInfo.agency,
      accountNumber: data.bankingInfo.accountNumber,
      accountDigit: data.bankingInfo.accountDigit,
      createdAt: FieldValue.serverTimestamp(),
      isActive: true,
    });
    console.log("✅ Banking information saved successfully");

    // Save availability slots
    console.log("📅 Saving availability slots...");
    const availabilityPromises = data.scheduleSlots.map(async (slot, index) => {
      console.log(`📅 Creating slot ${index + 1}:`, {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: slot.title,
      });

      // Create a start date for this slot (next occurrence of the day)
      const now = new Date();
      const startDate = new Date(now);

      // Calculate the next occurrence of this day of week
      const daysUntilTarget = (slot.dayOfWeek - now.getDay() + 7) % 7;
      if (
        daysUntilTarget === 0 &&
        now.getHours() >= parseInt(slot.startTime.split(":")[0])
      ) {
        // If it's today but the time has passed, schedule for next week
        startDate.setDate(now.getDate() + 7);
      } else {
        startDate.setDate(now.getDate() + daysUntilTarget);
      }

      // Set the time
      const [hours, minutes] = slot.startTime.split(":").map(Number);
      startDate.setHours(hours, minutes, 0, 0);

      // Calculate 6 months from start date for the contract duration
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);

      const availabilityRef = adminDb.collection("availabilities");
      return availabilityRef.add({
        teacherId: session.user.id,
        title: slot.title || (slot.type === "makeup" ? "Horário de Reposição" : "Aula Regular"),
        type: slot.type || "regular",
        startDate: startDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        repeating: {
          type: "weekly",
          interval: 1,
          endDate: Timestamp.fromDate(endDate), // Contract duration of 6 months
        },
        color: slot.type === "makeup" ? "purple" : "blue", // Visual distinction
      });
    });

    await Promise.all(availabilityPromises);
    console.log("✅ All availability slots saved successfully");

    return NextResponse.json({
      success: true,
      message: "Teacher onboarding completed successfully",
    });
  } catch (error) {
    console.error("Error completing teacher onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
