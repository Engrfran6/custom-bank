"use client";

import {useAvatarUpload} from "@/lib/hooks/use-avatar-upload";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Upload, AlertCircle, Loader} from "lucide-react";
import {useProfile} from "@/lib/hooks/use-profile";
import {cn} from "@/lib/utils/utils";

export function AvatarUpload() {
  // ✅ Read avatar_url directly from the TQ profile cache
  // — no prop drilling, always in sync with the rest of the app
  const {profile} = useProfile();
  const {handleFileChange, uploading, error} = useAvatarUpload(profile?.id as string);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>

          <div>
            <p className="text-sm font-medium">{profile?.full_name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                  profile?.kyc_status === "verified"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : profile?.kyc_status === "pending"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                )}>
                KYC {profile?.kyc_status}
              </span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {profile?.role}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" disabled={uploading} className="relative">
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? (
            <span>
              <Loader className="h-4 w-4" /> Uploading...
            </span>
          ) : (
            "Upload Avatar"
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Could&apos;nt upload your avatar, please try again later</span>
        </div>
      )}
    </div>
  );
}
