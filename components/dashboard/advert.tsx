"use client";

import {useState, useEffect, useCallback} from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  TrendingUp,
  Gift,
  CreditCard,
  PiggyBank,
  Rocket,
  Shield,
  Zap,
  Globe,
  Coffee,
  Smartphone,
  Award,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {cn} from "@/lib/utils/utils";

// Ad Type Definitions
interface Ad {
  id: number;
  title: string;
  description: string;
  cta: string;
  ctaLink: string;
  icon: React.ElementType;
  gradient: string;
  color: string;
  badge?: string;
  discount?: string;
  category: "promotion" | "offer" | "tip" | "feature" | "security";
}

// 10 Different Ads Data
const ads: Ad[] = [
  {
    id: 1,
    title: "Get 5% Cashback",
    description: "On all debit card purchases this month. Limited time offer!",
    cta: "Activate Now",
    ctaLink: "/dashboard/cashback",
    icon: TrendingUp,
    gradient: "from-orange-500 to-pink-500",
    color: "orange",
    badge: "Limited Time",
    discount: "5% Cashback",
    category: "promotion",
  },
  {
    id: 2,
    title: "Refer & Earn $50",
    description: "Invite friends to NeoBank and earn $50 for each successful referral.",
    cta: "Invite Now",
    ctaLink: "/dashboard/refer",
    icon: Gift,
    gradient: "from-emerald-500 to-teal-500",
    color: "emerald",
    badge: "Earn Rewards",
    discount: "$50 Bonus",
    category: "offer",
  },
  {
    id: 3,
    title: "Premium Card Launch",
    description: "Get exclusive benefits with our new premium card. No annual fee!",
    cta: "Apply Now",
    ctaLink: "/dashboard/cards",
    icon: CreditCard,
    gradient: "from-purple-500 to-indigo-500",
    color: "purple",
    badge: "New",
    discount: "$0 Annual Fee",
    category: "feature",
  },
  {
    id: 4,
    title: "Start Saving Today",
    description: "Open a high-yield savings account with 4.5% APY. Zero fees.",
    cta: "Open Account",
    ctaLink: "/dashboard/savings",
    icon: PiggyBank,
    gradient: "from-blue-500 to-cyan-500",
    color: "blue",
    badge: "High Yield",
    discount: "4.5% APY",
    category: "feature",
  },
  {
    id: 5,
    title: "Invest with AI",
    description: "Let our AI manage your investments. Start with as little as $10.",
    cta: "Start Investing",
    ctaLink: "/dashboard/invest",
    icon: Rocket,
    gradient: "from-violet-500 to-purple-500",
    color: "violet",
    badge: "AI Powered",
    discount: "Min $10",
    category: "feature",
  },
  {
    id: 6,
    title: "Security Alert",
    description: "Enable 2FA and get a $10 security bonus. Protect your account today!",
    cta: "Secure Account",
    ctaLink: "/dashboard/security",
    icon: Shield,
    gradient: "from-red-500 to-orange-500",
    color: "red",
    badge: "Security",
    discount: "$10 Bonus",
    category: "security",
  },
  {
    id: 7,
    title: "Instant Transfers",
    description: "Send money instantly to any bank. Zero fees for first 5 transfers.",
    cta: "Try Now",
    ctaLink: "/dashboard/transfers",
    icon: Zap,
    gradient: "from-yellow-500 to-orange-500",
    color: "yellow",
    badge: "Instant",
    discount: "0 Fees",
    category: "feature",
  },
  {
    id: 8,
    title: "International Banking",
    description: "Multi-currency accounts with zero foreign transaction fees.",
    cta: "Learn More",
    ctaLink: "/dashboard/international",
    icon: Globe,
    gradient: "from-teal-500 to-cyan-500",
    color: "teal",
    badge: "Global",
    discount: "No FX Fees",
    category: "feature",
  },
  {
    id: 9,
    title: "Coffee Money",
    description: "Round up your purchases and invest the change. Watch your savings grow!",
    cta: "Activate Round-Ups",
    ctaLink: "/dashboard/roundups",
    icon: Coffee,
    gradient: "from-amber-500 to-orange-500",
    color: "amber",
    badge: "Smart Saving",
    discount: "Auto-invest",
    category: "tip",
  },
  {
    id: 10,
    title: "Mobile Banking App",
    description: "Manage everything from your phone. Download our new app today!",
    cta: "Download Now",
    ctaLink: "/download",
    icon: Smartphone,
    gradient: "from-slate-500 to-gray-500",
    color: "slate",
    badge: "Mobile",
    discount: "Free Download",
    category: "feature",
  },
];

// Progress Bar Component
const ProgressBar = ({progress}: {progress: number}) => (
  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
    <div
      className="h-full bg-white/60 rounded-full transition-all duration-1000 ease-linear"
      style={{width: `${progress}%`}}
    />
  </div>
);

// Main Advert Component Props
interface AdvertProps {
  interval?: number; // Time in ms between ad changes (default: 15000 - 15 seconds)
  showProgress?: boolean;
  showControls?: boolean;
  autoRotate?: boolean;
  className?: string;
  onAdChange?: (ad: Ad) => void;
  variant?: "default" | "compact" | "minimal";
}

export function Advert({
  interval = 15000,
  showProgress = true,
  showControls = true,
  autoRotate = true,
  className,
  onAdChange,
  variant = "default",
}: AdvertProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoRotate);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const currentAd = ads[currentIndex];

  const nextAd = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
    setProgress(0);
    onAdChange?.(ads[(currentIndex + 1) % ads.length]);
  }, [currentIndex, onAdChange]);

  const previousAd = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    setProgress(0);
    onAdChange?.(ads[(currentIndex - 1 + ads.length) % ads.length]);
  }, [currentIndex, onAdChange]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setProgress(0);
  };

  const dismissAd = () => {
    setDismissed(true);
  };

  // Auto-rotate ads
  useEffect(() => {
    if (!isPlaying || dismissed) return;

    let startTime: number;
    let animationFrame: number;

    const updateProgress = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const newProgress = Math.min((elapsed / interval) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };

    const timer = setTimeout(() => {
      nextAd();
    }, interval);

    if (showProgress) {
      animationFrame = requestAnimationFrame(updateProgress);
    }

    return () => {
      clearTimeout(timer);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [currentIndex, isPlaying, interval, showProgress, dismissed]);

  const getColorStyles = (color: string) => {
    const colors: Record<string, string> = {
      orange: "hover:shadow-orange-500/20",
      emerald: "hover:shadow-emerald-500/20",
      purple: "hover:shadow-purple-500/20",
      blue: "hover:shadow-blue-500/20",
      violet: "hover:shadow-violet-500/20",
      red: "hover:shadow-red-500/20",
      yellow: "hover:shadow-yellow-500/20",
      teal: "hover:shadow-teal-500/20",
      amber: "hover:shadow-amber-500/20",
      slate: "hover:shadow-slate-500/20",
    };
    return colors[color] || "hover:shadow-primary/20";
  };

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="w-full rounded-xl border border-border bg-card p-3 text-center text-sm text-muted-foreground hover:bg-muted/20 transition-colors">
        Show ads again →
      </button>
    );
  }

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-gradient-to-r p-3",
          currentAd.gradient,
          className,
        )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <currentAd.icon className="h-5 w-5 text-white" />
            <div>
              <p className="text-xs font-semibold text-white">{currentAd.title}</p>
              <p className="text-[10px] text-white/80">{currentAd.description}</p>
            </div>
          </div>
          <a
            href={currentAd.ctaLink}
            className="shrink-0 rounded-lg bg-white/20 px-2 py-1 text-[10px] font-medium text-white hover:bg-white/30 transition">
            {currentAd.cta}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-gradient-to-r transition-all duration-300 hover:shadow-xl",
        currentAd.gradient,
        getColorStyles(currentAd.color),
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/20" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-white/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5" />
      </div>

      {/* Badge */}
      {currentAd.badge && (
        <div className="absolute top-3 right-3 z-10">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {currentAd.badge}
          </span>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={dismissAd}
        className="absolute top-3 left-3 z-10 rounded-full bg-black/20 p-1 text-white/60 transition-all hover:bg-black/30 hover:text-white md:opacity-0 md:group-hover:opacity-100">
        <X className="h-3 w-3" />
      </button>

      <div className="relative z-10 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Icon and Content */}
          <div className="flex items-start gap-3 flex-1">
            <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-sm">
              <currentAd.icon className="h-6 w-6 text-white md:h-7 md:w-7" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white md:text-lg">{currentAd.title}</h3>
                {currentAd.discount && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {currentAd.discount}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-white/80 sm:text-sm">{currentAd.description}</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-2">
            <a
              href={currentAd.ctaLink}
              className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/30 hover:scale-105 active:scale-95 md:px-4 md:py-2.5 md:text-sm">
              {currentAd.cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </a>

            {/* Controls */}
            {showControls && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={previousAd}
                  className="rounded-lg bg-black/20 p-1.5 text-white/70 transition-all hover:bg-black/30 hover:text-white">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {autoRotate && (
                  <button
                    onClick={togglePlay}
                    className="rounded-lg bg-black/20 p-1.5 text-white/70 transition-all hover:bg-black/30 hover:text-white">
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                )}
                <button
                  onClick={nextAd}
                  className="rounded-lg bg-black/20 p-1.5 text-white/70 transition-all hover:bg-black/30 hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && isPlaying && !hovered && (
          <div className="mt-3">
            <ProgressBar progress={progress} />
          </div>
        )}

        {/* Ad Indicator Dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebar
export function CompactAdvert({interval = 15000}: {interval?: number}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentAd = ads[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r p-3 transition-all hover:shadow-lg">
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-10", currentAd.gradient)} />
      <div className="relative flex items-start gap-2">
        <div
          className={cn(
            "rounded-lg p-1.5 text-white",
            currentAd.color === "orange" && "bg-orange-500/20",
            currentAd.color === "emerald" && "bg-emerald-500/20",
          )}>
          <currentAd.icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">{currentAd.title}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
            {currentAd.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// Newsletter signup variant
export function NewsletterAdvert() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail("");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-4 md:p-5">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/20" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-white/20" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-5 w-5 text-white" />
          <h3 className="font-semibold text-white">Weekly Financial Tips</h3>
        </div>

        {submitted ? (
          <div className="flex items-center gap-2 rounded-lg bg-white/20 p-2">
            <CheckCircle2 className="h-4 w-4 text-white" />
            <p className="text-xs text-white">Thanks for subscribing!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg bg-white/20 px-3 py-2 text-xs text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-white/90">
              Subscribe
            </button>
          </form>
        )}
        <p className="mt-2 text-[10px] text-white/70">No spam, unsubscribe anytime.</p>
      </div>
    </div>
  );
}

export default Advert;
