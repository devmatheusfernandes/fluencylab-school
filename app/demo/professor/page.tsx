import type { Metadata } from "next";
import { DemoTopBar } from "@/components/demo/DemoTopBar";
import { TeacherDemo } from "@/components/demo/teacher/TeacherDemo";

export const metadata: Metadata = { title: "Demo do professor" };

export default async function TeacherDemoPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return (
    <>
      <DemoTopBar current="professor" />
      <TeacherDemo initialTab={tab} />
    </>
  );
}
