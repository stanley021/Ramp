import { useCallback } from "react";
import { useCustomFetch } from "src/hooks/useCustomFetch";
import { SetTransactionApprovalParams } from "src/utils/types";
import { TransactionPane } from "./TransactionPane";
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types";

export const Transactions: TransactionsComponent = ({
  transactions,
  approvalStates,
  onApprovalChange,
}) => {
  const { fetchWithoutCache, loading } = useCustomFetch();

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      });


      onApprovalChange(transactionId, newValue);
    },
    [fetchWithoutCache, onApprovalChange]
  );

  if (!transactions || transactions.length === 0) {
    return <div className="RampLoading--container">Loading...</div>;
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          approved={approvalStates[transaction.id] ?? transaction.approved}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  );
};
