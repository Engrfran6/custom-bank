"use client";

import {useState} from "react";
import {SettingsProfile} from "@/components/dashboard/settings-profile";
import {SettingsPassword} from "@/components/dashboard/settings-password";
import {SettingsAccounts} from "@/components/dashboard/settings-accounts";
import {SettingsDanger} from "@/components/dashboard/settings-danger";
import {cn} from "@/lib/utils/utils";
import {User, Lock, Landmark, AlertTriangle, Briefcase, FileCheck, Users} from "lucide-react";
import {SettingsEmployment} from "@/components/dashboard/settings-employment";
import {SettingsKyc} from "@/components/dashboard/settings-kyc";
import {SettingsNextOfKin} from "@/components/dashboard/settings-next-of-kin";

const TABS = [
  {id: "profile", label: "Profile", icon: User},
  {id: "employment", label: "Employment", icon: Briefcase},
  {id: "kyc", label: "KYC Verification", icon: FileCheck},
  {id: "nextOfKin", label: "Next of Kin", icon: Users},
  {id: "security", label: "Security", icon: Lock},
  {id: "accounts", label: "Accounts", icon: Landmark},
  {id: "danger", label: "Danger Zone", icon: AlertTriangle},
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, security, and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Tab sidebar */}
        <div className="rounded-xl border border-border bg-card p-3 xl:col-span-1">
          <nav className="flex flex-col gap-1">
            {TABS.map(({id, label, icon: Icon}) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  tab === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  id === "danger" &&
                    tab !== "danger" &&
                    "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10",
                )}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="rounded-xl border border-border bg-card p-6 xl:col-span-3">
          {tab === "profile" && (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold">Profile Information</h2>
                <p className="text-sm text-muted-foreground">
                  Update your personal information and contact details
                </p>
              </div>
              <SettingsProfile />
            </>
          )}

          {tab === "employment" && (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold">Employment & Financial Info</h2>
                <p className="text-sm text-muted-foreground">
                  Update your employment status, income, and source of funds
                </p>
              </div>
              <SettingsEmployment />
            </>
          )}

          {tab === "kyc" && (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold">Identity Verification (KYC)</h2>
                <p className="text-sm text-muted-foreground">
                  Verify your identity to unlock all features
                </p>
              </div>
              <SettingsKyc />
            </>
          )}

          {tab === "nextOfKin" && (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold">Next of Kin</h2>
                <p className="text-sm text-muted-foreground">
                  Update your emergency contact information
                </p>
              </div>
              <SettingsNextOfKin />
            </>
          )}

          {tab === "security" && (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold">Security & Password</h2>
                <p className="text-sm text-muted-foreground">
                  Update your password and security settings
                </p>
              </div>
              <SettingsPassword />
            </>
          )}

          {tab === "accounts" && (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold">My Accounts</h2>
                <p className="text-sm text-muted-foreground">
                  View your linked bank accounts and balances
                </p>
              </div>
              <SettingsAccounts />
            </>
          )}

          {tab === "danger" && (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold text-red-500">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">
                  Irreversible actions — proceed with caution
                </p>
              </div>
              <SettingsDanger />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
