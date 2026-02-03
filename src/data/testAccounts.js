/**
 * Accès de test par rôle — implantés dans le projet pour tester depuis l’app.
 * Créés une fois avec : npm run seed:dev (voir docs/comptes-dev.md)
 */
export const TEST_ACCOUNTS_PASSWORD = 'CeripDev2025!';

export const TEST_ACCOUNTS = [
  { email: 'superadmin@cerip-dev.sn', role: 'SUPER_ADMIN', label: 'Super Admin' },
  { email: 'admin@cerip-dev.sn', role: 'ADMIN_ORG', label: 'Admin Organisation' },
  { email: 'coach@cerip-dev.sn', role: 'COACH', label: 'Coach' },
  { email: 'certificateur@cerip-dev.sn', role: 'CERTIFICATEUR', label: 'Certificateur' },
  { email: 'incube@cerip-dev.sn', role: 'INCUBE', label: 'Incubé' },
];
