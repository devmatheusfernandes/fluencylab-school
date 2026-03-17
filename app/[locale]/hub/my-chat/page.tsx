import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRoles } from "@/types/users/userRoles";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function MyChatRedirectPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const role = session.user.role;
  const sp = await searchParams;
  const queryParams = new URLSearchParams();
  if (sp) {
    Object.entries(sp).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
  }
  const queryString = queryParams.toString();
  const query = queryString ? `?${queryString}` : "";

  if (role === UserRoles.STUDENT) {
    redirect(`/hub/student/my-chat${query}`);
  } else if (role === UserRoles.TEACHER) {
    redirect(`/hub/teacher/my-chat${query}`);
  } else {
    redirect("/hub");
  }
}
