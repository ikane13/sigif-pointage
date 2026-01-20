import { Card } from "@components/common/Card";
import styles from "./AdminPages.module.scss";

export const AdminSettingsPage = () => {
  return (
    <div className={styles.page}>
      <Card header="Paramètres généraux">
        <div className={styles.placeholder}>
          Nom de l’organisme, logo, contact, informations publiques.
        </div>
      </Card>
    </div>
  );
};
