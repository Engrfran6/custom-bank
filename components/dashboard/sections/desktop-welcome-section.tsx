import {Button} from "@/components/ui/button";
import {Plus, RefreshCw, Send, Sparkles} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {useState} from "react";
import {useRouter} from "next/navigation";

interface DesktopWelcomeSectionProps {
  greeting: string;
  profile?: string | null | undefined;
  handleSendMoney: () => void;
  guardAction: (action: () => void, actionName: string) => void;
}

const DesktopWelcomeSection = ({
  greeting,
  profile,
  handleSendMoney,
  guardAction,
}: DesktopWelcomeSectionProps) => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <div className="mb-6 hidden md:block relative md:rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent md:border border-primary/20 p-6 md:p-8">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Welcome back!</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            Good {greeting}, {profile?.split(" ")[0] || "User"}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Here&apos;s what&apos;s happening with your money today
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-border bg-card hover:bg-primary/10"
            onClick={handleSendMoney}>
            <Send className="h-4 w-4" />
            Send Money
          </Button>
          <Button
            className="gap-2"
            onClick={() => guardAction(() => router.push("/dashboard/payments"), "pay bills")}>
            <Plus className="h-4 w-4" />
            Pay Bill
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1500);
            }}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesktopWelcomeSection;
