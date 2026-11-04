import type { Metadata } from "next";
import { DemoTopBar } from "@/components/demo/DemoTopBar";
import { StudentDemo } from "@/components/demo/student/StudentDemo";

export const metadata: Metadata = { title: "Demo do aluno" };

export default async function StudentDemoPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return (
    <>
      <DemoTopBar current="aluno" />
      <StudentDemo initialTab={tab} />
    </>
  );
}
