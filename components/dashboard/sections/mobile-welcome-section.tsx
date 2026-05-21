import {Button} from "@/components/ui/button";
import {RefreshCw} from "lucide-react";
import {cn} from "@/lib/utils/utils";

interface MobileWelcomeSectionProps {
  greeting: string;
  profile?: string | null | undefined;
  currentDate: string;
  refreshing: boolean;
  handleRefresh: () => void;
}

const MobileWelcomeSection = ({
  refreshing,
  handleRefresh,
  greeting,
  profile,
  currentDate,
}: MobileWelcomeSectionProps) => {
  return (
    <div className="md:hidden flex items-center justify-between mb-4">
      <div>
        <div className="flex items-start gap-1 text-xl">
          <h1 className="text-gray-700 dark:text-gray-400 font-mono font-bold">Good {greeting}</h1>
          <h1 className="font-mono font-bold text-gray-900 dark:text-white">
            {profile?.split(" ")[0] || "User"}
          </h1>
        </div>

        <p className="text-xs italic">{currentDate}</p>
      </div>

      <Button
        size="icon"
        variant="outline"
        className="mr-2"
        onClick={() => {
          handleRefresh();
        }}>
        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
      </Button>
    </div>
  );
};

export default MobileWelcomeSection;
