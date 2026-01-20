import { Card } from "@components/common/Card";
import styles from "./AdminPages.module.scss";

export const AdminSecurityPage = () => {
  return (
    <div className={styles.page}>
      <Card header="Sécurité">
        <div className={styles.placeholder}>
          Politiques de mot de passe et durée de session.
        </div>
      </Card>
    </div>
  );
};
