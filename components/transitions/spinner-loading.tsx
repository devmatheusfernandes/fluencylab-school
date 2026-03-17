import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface SpinnerLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const SpinnerLoading = ({
  className,
  ...props
}: SpinnerLoadingProps) => {
  return (
    <div
      className={cn("flex items-center justify-center h-screen", className)}
      {...props}
    >
      <Spinner className="w-[50px] h-[50px] text-primary animate-spin" />
    </div>
  );
};
