import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";




export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [approvalStates, setApprovalStates] = useState<{ [key: string]: boolean }>({}); 

  const removeDuplicates = (transactions) => {
    const seen = new Set();
    return transactions.filter(transaction => {
      const duplicate = seen.has(transaction.id);
      seen.add(transaction.id);
      return !duplicate;
    });
  };

  const transactions = useMemo(
    () => {
      const allTransactions = [...(paginatedTransactions?.data || []), ...(transactionsByEmployee || [])];
      return removeDuplicates(allTransactions);
    },
    [paginatedTransactions, transactionsByEmployee]
  );

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);


    await employeeUtils.fetchAll();
    setIsLoading(false);
    await paginatedTransactionsUtils.fetchAll();

  }, [employeeUtils, paginatedTransactionsUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData();
      await transactionsByEmployeeUtils.fetchById(employeeId);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  const handleApprovalChange = useCallback((transactionId: string, newValue: boolean) => {
    setApprovalStates(prev => ({
      ...prev,
      [transactionId]: newValue,
    }));
  }, []);

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {

      loadAllTransactions();
      
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (!newValue || !newValue.id) {
              await loadAllTransactions();

              return;
            }

            await loadTransactionsByEmployee(newValue.id);
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions
            transactions={transactions}
            approvalStates={approvalStates}
            onApprovalChange={handleApprovalChange}
          />

          {transactions.length > 0 && paginatedTransactions?.nextPage != null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions();
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
