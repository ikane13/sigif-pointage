import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrCodeToEvents1734812000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ajouter la colonne qrToken (sans isUnique dans TableColumn)
    await queryRunner.query(`
      ALTER TABLE "events" 
      ADD COLUMN "qrToken" VARCHAR(64)
    `);

    // 2. Ajouter la contrainte UNIQUE explicitement
    await queryRunner.query(`
      ALTER TABLE "events" 
      ADD CONSTRAINT "UQ_events_qrToken" UNIQUE ("qrToken")
    `);

    // 3. Ajouter la colonne qrGeneratedAt
    await queryRunner.query(`
      ALTER TABLE "events" 
      ADD COLUMN "qrGeneratedAt" TIMESTAMP
    `);

    // 4. Ajouter la colonne qrScanCount avec default SQL correct
    await queryRunner.query(`
      ALTER TABLE "events" 
      ADD COLUMN "qrScanCount" INTEGER NOT NULL DEFAULT 0
    `);

    // 5. Créer l'index sur qrToken pour optimiser les recherches
    await queryRunner.query(`
      CREATE INDEX "IDX_events_qrToken" ON "events" ("qrToken")
    `);

    console.log('✅ Migration AddQrCodeToEvents : colonnes ajoutées');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer dans l'ordre inverse

    // 1. Supprimer l'index
    await queryRunner.query(`DROP INDEX "IDX_events_qrToken"`);

    // 2. Supprimer les colonnes (la contrainte UNIQUE sera supprimée automatiquement)
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "qrScanCount"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "qrGeneratedAt"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "qrToken"`);

    console.log('✅ Migration AddQrCodeToEvents : annulée');
  }
}
