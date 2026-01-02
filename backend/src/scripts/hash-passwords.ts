import { createConnection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

async function hashPasswords() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'sigif_user',
    password: process.env.DB_PASSWORD || 'Inconnue13!',
    database: process.env.DB_NAME || 'sigif_pointage',
    entities: [path.join(__dirname, '..', 'database', 'entities', '*.entity.{ts,js}')],
  });

  const userRepository = connection.getRepository('User');

  // Hash du mot de passe par défaut : Admin@2025!
  const password = 'Admin@2025!';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  console.log('🔐 Mise à jour des mots de passe...');
  console.log(`Hash généré pour "Admin@2025!" : ${passwordHash.substring(0, 20)}...`);

  // Mettre à jour tous les utilisateurs
  await userRepository.update({}, { passwordHash });

  console.log('✅ Mots de passe mis à jour avec succès !');
  console.log('');
  console.log('Comptes disponibles :');
  console.log('  - admin@sigif.gouv.sn / Admin@2025!');
  console.log('  - mamadou.diop@sigif.gouv.sn / Admin@2025!');
  console.log('  - fatou.sall@sigif.gouv.sn / Admin@2025!');

  await connection.close();
}

hashPasswords().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
