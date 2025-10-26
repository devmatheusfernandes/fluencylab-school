import { BubbleBackground } from "@/components/ui/shadcn-io/bubble-background";

export default function Hero() {
  return (
    <BubbleBackground interactive={true}>
      <div className="relative z-10 min-h-screen"></div>
    </BubbleBackground>
  );
}
