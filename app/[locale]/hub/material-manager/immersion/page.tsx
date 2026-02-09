import { Header } from "@/components/ui/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ImmersionManagerPage() {
  const items = [
    {
      title: "Podcasts",
      description: "Manage audio content, episodes, and transcripts.",
      href: "/hub/material-manager/immersion/podcasts",
      icon: Mic,
      color: "text-blue-500",
    },
    {
      title: "Blogs",
      description: "Manage articles, reading materials, and resources.",
      href: "/hub/material-manager/immersion/blogs",
      icon: BookOpen,
      color: "text-green-500",
    },
  ];

  return (
    <div className="container-padding">
      <Header
        heading="Immersion Management"
        subheading="Manage podcasts and blogs for student immersion."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-2 hover:border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg bg-background border ${item.color}`}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
