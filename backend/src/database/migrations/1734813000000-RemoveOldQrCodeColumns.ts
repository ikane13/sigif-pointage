import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOldQrCodeColumns1734813000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les anciennes colonnes QR code
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "qr_code_data"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "qr_code_secret"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "qr_code_expires_at"`);

    console.log('✅ Migration RemoveOldQrCodeColumns : anciennes colonnes supprimées');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recréer les colonnes si on fait un rollback (optionnel)
    await queryRunner.query(`
      ALTER TABLE "events" ADD COLUMN "qr_code_data" TEXT
    `);

    await queryRunner.query(`
      ALTER TABLE "events" ADD COLUMN "qr_code_secret" VARCHAR(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "events" ADD COLUMN "qr_code_expires_at" TIMESTAMP
    `);

    console.log('✅ Migration RemoveOldQrCodeColumns : annulée');
  }
}
