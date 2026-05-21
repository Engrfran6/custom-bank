"use client";

import Advert from "@/components/dashboard/advert";
import {TransactionActivityChart} from "@/components/dashboard/user-transaction-activity-chart";
import {BeneficiaryList} from "@/components/dashboard/beneficiary-list";
import {FraudBanner} from "@/components/security/fraud-banner";
import SavingGoals from "@/components/dashboard/savings-gaol";
import {TransactionsSection} from "@/components/dashboard/sections/transactions-section";
import {AccountsSection} from "@/components/dashboard/sections/accounts-section";
import {useDashboard} from "@/lib/hooks/use-dashboard";
import {useGreeting} from "@/lib/hooks/use-greetings";
import BillPaymentSection from "@/components/dashboard/sections/bill-payment-section";
import UpcomingBillSection from "@/components/dashboard/sections/upcoming-bill-section";
import VirtualCardSection from "@/components/dashboard/sections/virtual-card-section";
import SpendingChartSection from "@/components/dashboard/sections/spending-chart-section";
import QuickActionSection from "@/components/dashboard/sections/quick-action-section";
import MobileBalanceSection from "@/components/dashboard/sections/mobile-balance-section";
import DesktopBalanceSection from "@/components/dashboard/sections/desktop-balance-section";
import MobileWelcomeSection from "@/components/dashboard/sections/mobile-welcome-section";
import DesktopWelcomeSection from "@/components/dashboard/sections/desktop-welcome-section";
import {Target} from "lucide-react";

export default function DashboardPage() {
  const dashboard = useDashboard();
  const {greeting, currentDate} = useGreeting(); // ✅ hydration-safe

  const {
    accounts,
    accountsLoading,
    totalBalance,
    transactions,
    txLoading,
    cards,
    cardLoading,
    profile,
    stats,
    searchedTransactions,
    searchQuery,
    setSearchQuery,
    showBalance,
    setShowBalance,
    refreshing,
    handleRefresh,
    handleSendMoney,
    handlePayBills,
    handleAddMoney,
    handleRequestMoney,
    guardAction,
    router,
  } = dashboard;

  const getActionHandler = (actionName: string) => {
    switch (actionName) {
      case "send money":
        return handleSendMoney;
      case "add money":
        return handleAddMoney;
      case "pay bills":
        return handlePayBills;
      case "request money":
        return handleRequestMoney;
      default:
        return () => guardAction(() => router.push("/dashboard"), actionName);
    }
  };

  return (
    <div className="">
      <div className="container mx-auto">
        {/* Welcome Banner */}
        <DesktopWelcomeSection
          greeting={greeting}
          profile={profile?.full_name}
          handleSendMoney={handleSendMoney}
          guardAction={guardAction}
        />

        <MobileWelcomeSection
          greeting={greeting}
          profile={profile?.full_name}
          currentDate={currentDate}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
        />

        {/* Balance Overview */}
        <DesktopBalanceSection
          showBalance={showBalance}
          setShowBalance={setShowBalance}
          totalBalance={totalBalance}
          accounts={accounts}
          stats={stats}
        />

        {/* Balance Card mobile - Hero Section */}
        <MobileBalanceSection
          totalBalance={totalBalance}
          showBalance={showBalance}
          setShowBalance={setShowBalance}
          stats={stats}
        />

        <FraudBanner />

        {/* Quick Actions — one per action, fraud-gated */}
        <QuickActionSection getActionHandler={getActionHandler} />

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Spending Chart */}
            <SpendingChartSection txLoading={txLoading} transactions={transactions} />

            {/* Accounts & Savings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Accounts */}
              <AccountsSection accounts={accounts} loading={accountsLoading} />

              {/* Savings Goal + Activity Chart */}
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Savings Goal</h3>
                </div>
                <SavingGoals userId={profile?.id} accounts={accounts} guardAction={guardAction} />
                <div className="w-full h-0.5 bg-border my-6" />
                <div className="hidden md:block w-full">
                  <TransactionActivityChart transactions={transactions} />
                </div>
              </div>
            </div>

            <Advert interval={15000} showProgress showControls autoRotate variant="default" />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Virtual Cards */}
            <VirtualCardSection cardLoading={cardLoading} cards={cards} />

            {/* Upcoming Bills */}
            <UpcomingBillSection guardAction={guardAction} />
            <div className="mb-6">
              <BeneficiaryList />
            </div>
          </div>
        </div>

        {/* Transactions & Bill History */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-5 gap-6">
          <TransactionsSection
            transactions={searchedTransactions}
            loading={txLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            profileId={profile?.id}
          />

          <BillPaymentSection onBillClick={(bill) => console.log("Bill clicked:", bill)} />
        </div>
      </div>
    </div>
  );
}
