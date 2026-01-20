import { Card } from "@components/common/Card";
import styles from "./AdminPages.module.scss";

export const AdminAuditLogsPage = () => {
  return (
    <div className={styles.page}>
      <Card header="Logs & audits">
        <div className={styles.placeholder}>
          Historique des actions (créations, modifications, suppressions).
        </div>
      </Card>
    </div>
  );
};
