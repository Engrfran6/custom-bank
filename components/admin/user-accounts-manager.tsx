// components/admin/UserAccountsManager.tsx
"use client";

import {useState, useEffect} from "react";
import {useUserAccounts, useAccountTransactions} from "@/lib/hooks/use-admin-accounts";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Plus, DollarSign, Eye, History, Ban, Loader2, CreditCard, Wallet} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {fmt} from "@/lib/helper";

interface UserAccountsManagerProps {
  userId: string;
  userName: string;
}

const accountTypeColors = {
  checking: "bg-blue-100 text-blue-700",
  savings: "bg-emerald-100 text-emerald-700",
  investment: "bg-purple-100 text-purple-700",
  system_reserve: "bg-orange-100 text-orange-700",
};

const transactionTypeColors = {
  deposit: "bg-emerald-100 text-emerald-700",
  withdrawal: "bg-red-100 text-red-700",
  transfer: "bg-blue-100 text-blue-700",
  admin_funding: "bg-purple-100 text-purple-700",
  savings_deposit: "bg-emerald-100 text-emerald-700",
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function UserAccountsManager({userId, userName}: UserAccountsManagerProps) {
  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
    loadAccounts,
    createAccount,
    fundAccount,
    closeAccount,
  } = useUserAccounts(userId);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundDescription, setFundDescription] = useState("");
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [newAccountType, setNewAccountType] = useState("checking");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("accounts");

  useEffect(() => {
    if (userId) {
      loadAccounts();
    }
  }, [userId, loadAccounts]);

  const handleFundAccount = async () => {
    if (!selectedAccountId || !fundAmount) return;

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await fundAccount(selectedAccountId, amount, fundDescription);
      setFundDialogOpen(false);
      setFundAmount("");
      setFundDescription("");
      setSelectedAccountId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAccount = async () => {
    try {
      await createAccount(newAccountType);
      setCreateDialogOpen(false);
      setNewAccountType("checking");
    } catch (err) {
      console.error(err);
    }
  };

  if (accountsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">Error loading accounts: {accountsError}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{userName}&apos;s Accounts</h2>
          <p className="text-muted-foreground">Manage user accounts and transactions</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={accounts.length === 3} className="hidden md:flex">
              <Plus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>Create a new account for {userName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={newAccountType} onValueChange={setNewAccountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAccount} disabled={accountsLoading}>
                {accountsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">
            <Wallet className="mr-2 h-4 w-4" />
            Accounts
          </TabsTrigger>
          {selectedAccountId && (
            <TabsTrigger value="transactions">
              <History className="mr-2 h-4 w-4" />
              Transactions
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {accountsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No accounts found for this user
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <Card key={account.id} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{account.account_type}</span>
                      <Badge
                        className={cn(
                          "capitalize",
                          accountTypeColors[account.account_type as keyof typeof accountTypeColors],
                        )}>
                        {account.account_type}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Account Number: {account.account_number}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="text-2xl font-bold">{fmt(account.balance)}</p>
                        <p className="text-xs text-muted-foreground">{account.currency}</p>
                      </div>
                      <div className="flex gap-2">
                        {account.balance !== 0 && account.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAccountId(account.id);
                              setActiveTab("transactions");
                            }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Transactions
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAccountId(account.id);
                            setFundDialogOpen(true);
                          }}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Fund
                        </Button>
                        {account.balance === 0 && account.status === "active" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => closeAccount(account.id)}>
                            <Ban className="mr-2 h-4 w-4" />
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {selectedAccountId && (
          <TabsContent value="transactions">
            <AccountTransactions
              userId={userId}
              accountId={selectedAccountId}
              onBack={() => setActiveTab("accounts")}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Fund Account Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Account</DialogTitle>
            <DialogDescription>Fund account for {userName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter amount"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Add a note about this funding"
                value={fundDescription}
                onChange={(e) => setFundDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFundAccount} disabled={accountsLoading}>
              {accountsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fund Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Account Transactions Component
// function AccountTransactions({
//   userId,
//   accountId,
//   onBack,
// }: {
//   userId: string;
//   accountId: string;
//   onBack: () => void;
// }) {
//   const {transactions, total, page, totalPages, loading, loadTransactions, setPage} =
//     useAccountTransactions(userId, accountId);

//   useEffect(() => {
//     loadTransactions(1);
//   }, [loadTransactions]);

//   const formatCurrency = (amount: string) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//     }).format(parseFloat(amount));
//   };

//   const getTransactionIcon = (type: string) => {
//     switch (type) {
//       case "deposit":
//       case "admin_funding":
//         return <CreditCard className="h-4 w-4 text-emerald-500" />;
//       case "withdrawal":
//         return <Ban className="h-4 w-4 text-red-500" />;
//       default:
//         return <History className="h-4 w-4 text-blue-500" />;
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="">
//         <Button variant="ghost" onClick={onBack} className="mb-4">
//           ← Back to Accounts
//         </Button>
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="text-lg font-semibold">Transaction History</h3>
//             <p className="text-sm text-muted-foreground">Total {total} transactions</p>
//           </div>

//           <div className="flex gap-6 items-center">
//             <Button className="text-lg font-semibold">Create Transaction</Button>
//             <Button className="text-lg font-semibold">Batch Transactions</Button>
//           </div>
//         </div>
//       </div>

//       {loading ? (
//         <div className="flex justify-center py-12">
//           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//         </div>
//       ) : transactions.length === 0 ? (
//         <Card>
//           <CardContent className="pt-6">
//             <div className="text-center text-muted-foreground">
//               No transactions found for this account
//             </div>
//           </CardContent>
//         </Card>
//       ) : (
//         <>
//           <div className="rounded-md border">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Date</TableHead>
//                   <TableHead>Type</TableHead>
//                   <TableHead>Description</TableHead>
//                   <TableHead>Amount</TableHead>
//                   <TableHead>Status</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {transactions.map((tx) => (
//                   <TableRow key={tx.id}>
//                     <TableCell className="whitespace-nowrap">{formatDate(tx.created_at)}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         {getTransactionIcon(tx.type)}
//                         <Badge
//                           className={cn(
//                             "capitalize",
//                             transactionTypeColors[tx.type as keyof typeof transactionTypeColors],
//                           )}>
//                           {tx.type.replace("_", " ")}
//                         </Badge>
//                       </div>
//                     </TableCell>
//                     <TableCell className="max-w-md truncate">
//                       {tx.description || tx.reference}
//                     </TableCell>
//                     <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
//                     <TableCell>
//                       <Badge
//                         variant={tx.status === "completed" ? "default" : "secondary"}
//                         className="capitalize">
//                         {tx.status}
//                       </Badge>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>

//           {totalPages > 1 && (
//             <div className="flex justify-center gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setPage(page - 1)}
//                 disabled={page === 1}>
//                 Previous
//               </Button>
//               <span className="py-2 px-3 text-sm">
//                 Page {page} of {totalPages}
//               </span>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setPage(page + 1)}
//                 disabled={page === totalPages}>
//                 Next
//               </Button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }
// Account Transactions Component (updated)
function AccountTransactions({
  userId,
  accountId,
  onBack,
}: {
  userId: string;
  accountId: string;
  onBack: () => void;
}) {
  const {transactions, total, page, totalPages, loading, loadTransactions, setPage} =
    useAccountTransactions(userId, accountId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Single transaction form state
  const [singleTx, setSingleTx] = useState({
    amount: "",
    type: "deposit",
    description: "",
  });

  // Batch transaction form state
  const [batchTx, setBatchTx] = useState({
    numberOfTransactions: 20,
    minAmount: 10,
    maxAmount: 500,
    type: "deposit",
    descriptionPrefix: "Batch transaction",
  });

  // Preview batch transactions
  const [batchPreview, setBatchPreview] = useState<Array<{amount: number; description: string}>>(
    [],
  );

  useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  useEffect(() => {
    // Generate preview when batch params change
    if (showBatchForm) {
      generateBatchPreview();
    }
  }, [batchTx.numberOfTransactions, batchTx.minAmount, batchTx.maxAmount, showBatchForm]);

  const generateBatchPreview = () => {
    const preview = [];
    for (let i = 0; i < Math.min(batchTx.numberOfTransactions, 10); i++) {
      const amount = Math.random() * (batchTx.maxAmount - batchTx.minAmount) + batchTx.minAmount;
      preview.push({
        amount: Math.round(amount * 100) / 100,
        description: `${batchTx.descriptionPrefix} ${i + 1}`,
      });
    }
    setBatchPreview(preview);
  };

  const handleCreateSingleTransaction = async () => {
    if (!singleTx.amount || parseFloat(singleTx.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/accounts/${accountId}/transactions`,
        {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            amount: parseFloat(singleTx.amount),
            type: singleTx.type,
            description: singleTx.description || `${singleTx.type} transaction`,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create transaction");
      }

      // Reset form and refresh transactions
      setSingleTx({amount: "", type: "deposit", description: ""});
      setShowCreateForm(false);
      await loadTransactions(1);

      alert("Transaction created successfully!");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create transaction");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateBatchTransactions = async () => {
    if (batchTx.numberOfTransactions < 1 || batchTx.numberOfTransactions > 100) {
      alert("Number of transactions must be between 1 and 100");
      return;
    }

    if (batchTx.minAmount <= 0 || batchTx.maxAmount <= 0) {
      alert("Amounts must be greater than 0");
      return;
    }

    if (batchTx.minAmount > batchTx.maxAmount) {
      alert("Minimum amount cannot be greater than maximum amount");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/accounts/${accountId}/transactions/batch`,
        {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            numberOfTransactions: batchTx.numberOfTransactions,
            minAmount: batchTx.minAmount,
            maxAmount: batchTx.maxAmount,
            type: batchTx.type,
            descriptionPrefix: batchTx.descriptionPrefix,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create batch transactions");
      }

      const data = await response.json();

      // Reset form and refresh transactions
      setShowBatchForm(false);
      await loadTransactions(1);

      alert(`Successfully created ${data.count} transactions!`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create batch transactions");
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "admin_funding":
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case "withdrawal":
        return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return <History className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back to Accounts
        </Button>

        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Transaction History</h3>
            <p className="text-sm text-muted-foreground">Total {total} transactions</p>
          </div>

          <div className="flex gap-2">
            {!showCreateForm && !showBatchForm && (
              <div className="flex flex-col gap-3 md:flex md:flex-row">
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Transaction
                </Button>
                <Button variant="outline" onClick={() => setShowBatchForm(true)}>
                  <History className="mr-2 h-4 w-4" />
                  Batch Transactions
                </Button>
              </div>
            )}
            {(showCreateForm || showBatchForm) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false);
                  setShowBatchForm(false);
                }}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Create Single Transaction Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Transaction</CardTitle>
              <CardDescription>Create a single transaction for this account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter amount"
                    value={singleTx.amount}
                    onChange={(e) => setSingleTx({...singleTx, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select
                    value={singleTx.type}
                    onValueChange={(value) => setSingleTx({...singleTx, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="admin_funding">Admin Funding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Add a description"
                  value={singleTx.description}
                  onChange={(e) => setSingleTx({...singleTx, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSingleTransaction} disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Batch Transactions Form */}
        {showBatchForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Batch Transactions</CardTitle>
              <CardDescription>Create multiple random transactions at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Transactions (1-100)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={batchTx.numberOfTransactions}
                    onChange={(e) =>
                      setBatchTx({...batchTx, numberOfTransactions: parseInt(e.target.value) || 20})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select
                    value={batchTx.type}
                    onValueChange={(value) => setBatchTx({...batchTx, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="admin_funding">Admin Funding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={batchTx.minAmount}
                    onChange={(e) =>
                      setBatchTx({...batchTx, minAmount: parseFloat(e.target.value) || 10})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={batchTx.maxAmount}
                    onChange={(e) =>
                      setBatchTx({...batchTx, maxAmount: parseFloat(e.target.value) || 500})
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description Prefix</Label>
                <Input
                  placeholder="e.g., Batch transaction"
                  value={batchTx.descriptionPrefix}
                  onChange={(e) => setBatchTx({...batchTx, descriptionPrefix: e.target.value})}
                />
              </div>

              {/* Preview Section */}
              {batchPreview.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview (first {batchPreview.length} transactions)</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1">#</th>
                          <th className="text-left py-1">Amount</th>
                          <th className="text-left py-1">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchPreview.map((tx, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-1">{idx + 1}</td>
                            <td className="py-1">{formatCurrency(tx.amount)}</td>
                            <td className="py-1">{tx.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    + {batchTx.numberOfTransactions - batchPreview.length} more transactions...
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBatchForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBatchTransactions} disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create {batchTx.numberOfTransactions} Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No transactions found for this account
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(tx.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <Badge
                          className={cn(
                            "capitalize",
                            transactionTypeColors[tx.type as keyof typeof transactionTypeColors],
                          )}>
                          {tx.type.replace("_", " ")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {tx.description || tx.reference}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.status === "completed" ? "default" : "secondary"}
                        className="capitalize">
                        {tx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}>
                Previous
              </Button>
              <span className="py-2 px-3 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
