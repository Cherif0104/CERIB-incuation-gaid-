/**
 * Géographie administrative du Sénégal : régions → départements → communes.
 * Structure hiérarchique pour listes déroulantes en cascade.
 * Source : découpage administratif (ANSD, 14 régions, 46 départements).
 */
export const SENEGAL_GEO = [
  {
    id: 'dakar',
    label: 'Dakar',
    departments: [
      { id: 'dakar', label: 'Dakar', communes: [{ id: 'dakar', label: 'Dakar' }] },
      { id: 'pikine', label: 'Pikine', communes: [{ id: 'pikine', label: 'Pikine' }] },
      { id: 'rufisque', label: 'Rufisque', communes: [{ id: 'rufisque', label: 'Rufisque' }] },
      { id: 'guediawaye', label: 'Guédiawaye', communes: [{ id: 'guediawaye', label: 'Guédiawaye' }] },
      { id: 'keur-massar', label: 'Keur Massar', communes: [{ id: 'keur-massar', label: 'Keur Massar' }] },
    ],
  },
  {
    id: 'ziguinchor',
    label: 'Ziguinchor',
    departments: [
      { id: 'bignona', label: 'Bignona', communes: [{ id: 'bignona', label: 'Bignona' }] },
      { id: 'oussouye', label: 'Oussouye', communes: [{ id: 'oussouye', label: 'Oussouye' }] },
      { id: 'ziguinchor', label: 'Ziguinchor', communes: [{ id: 'ziguinchor', label: 'Ziguinchor' }] },
    ],
  },
  {
    id: 'diourbel',
    label: 'Diourbel',
    departments: [
      { id: 'bambey', label: 'Bambey', communes: [{ id: 'bambey', label: 'Bambey' }] },
      { id: 'diourbel', label: 'Diourbel', communes: [{ id: 'diourbel', label: 'Diourbel' }] },
      { id: 'mbacke', label: 'Mbacké', communes: [{ id: 'mbacke', label: 'Mbacké' }] },
    ],
  },
  {
    id: 'saint-louis',
    label: 'Saint-Louis',
    departments: [
      { id: 'dagana', label: 'Dagana', communes: [{ id: 'dagana', label: 'Dagana' }] },
      { id: 'podor', label: 'Podor', communes: [{ id: 'podor', label: 'Podor' }] },
      { id: 'saint-louis', label: 'Saint-Louis', communes: [{ id: 'saint-louis', label: 'Saint-Louis' }] },
    ],
  },
  {
    id: 'tambacounda',
    label: 'Tambacounda',
    departments: [
      { id: 'bakel', label: 'Bakel', communes: [{ id: 'bakel', label: 'Bakel' }] },
      { id: 'tambacounda', label: 'Tambacounda', communes: [{ id: 'tambacounda', label: 'Tambacounda' }] },
      { id: 'goudiry', label: 'Goudiry', communes: [{ id: 'goudiry', label: 'Goudiry' }] },
      { id: 'koumpentoum', label: 'Koumpentoum', communes: [{ id: 'koumpentoum', label: 'Koumpentoum' }] },
    ],
  },
  {
    id: 'kaolack',
    label: 'Kaolack',
    departments: [
      { id: 'kaolack', label: 'Kaolack', communes: [{ id: 'kaolack', label: 'Kaolack' }] },
      { id: 'nioro-du-rip', label: 'Nioro du Rip', communes: [{ id: 'nioro-du-rip', label: 'Nioro du Rip' }] },
      { id: 'guinguineo', label: 'Guinguinéo', communes: [{ id: 'guinguineo', label: 'Guinguinéo' }] },
    ],
  },
  {
    id: 'thies',
    label: 'Thiès',
    departments: [
      { id: 'mbour', label: "M'bour", communes: [{ id: 'mbour', label: "M'bour" }] },
      { id: 'thies', label: 'Thiès', communes: [{ id: 'thies', label: 'Thiès' }] },
      { id: 'tivaouane', label: 'Tivaouane', communes: [{ id: 'tivaouane', label: 'Tivaouane' }] },
    ],
  },
  {
    id: 'louga',
    label: 'Louga',
    departments: [
      { id: 'kebemer', label: 'Kébémer', communes: [{ id: 'kebemer', label: 'Kébémer' }] },
      { id: 'linguere', label: 'Linguère', communes: [{ id: 'linguere', label: 'Linguère' }] },
      { id: 'louga', label: 'Louga', communes: [{ id: 'louga', label: 'Louga' }] },
    ],
  },
  {
    id: 'fatick',
    label: 'Fatick',
    departments: [
      { id: 'fatick', label: 'Fatick', communes: [{ id: 'fatick', label: 'Fatick' }] },
      { id: 'foundiougne', label: 'Foundiougne', communes: [{ id: 'foundiougne', label: 'Foundiougne' }] },
      { id: 'gossas', label: 'Gossas', communes: [{ id: 'gossas', label: 'Gossas' }] },
    ],
  },
  {
    id: 'kolda',
    label: 'Kolda',
    departments: [
      { id: 'kolda', label: 'Kolda', communes: [{ id: 'kolda', label: 'Kolda' }] },
      { id: 'velingara', label: 'Vélingara', communes: [{ id: 'velingara', label: 'Vélingara' }] },
      { id: 'medina-yoro-foulah', label: 'Médina Yoro Foulah', communes: [{ id: 'medina-yoro-foulah', label: 'Médina Yoro Foulah' }] },
    ],
  },
  {
    id: 'matam',
    label: 'Matam',
    departments: [
      { id: 'kanel', label: 'Kanel', communes: [{ id: 'kanel', label: 'Kanel' }] },
      { id: 'matam', label: 'Matam', communes: [{ id: 'matam', label: 'Matam' }] },
      { id: 'ranerou', label: 'Ranérou', communes: [{ id: 'ranerou', label: 'Ranérou' }] },
    ],
  },
  {
    id: 'kaffrine',
    label: 'Kaffrine',
    departments: [
      { id: 'kaffrine', label: 'Kaffrine', communes: [{ id: 'kaffrine', label: 'Kaffrine' }] },
      { id: 'birkelane', label: 'Birkelane', communes: [{ id: 'birkelane', label: 'Birkelane' }] },
      { id: 'koungheul', label: 'Koungheul', communes: [{ id: 'koungheul', label: 'Koungheul' }] },
      { id: 'malem-hodar', label: 'Malem-Hodar', communes: [{ id: 'malem-hodar', label: 'Malem-Hodar' }] },
    ],
  },
  {
    id: 'kedougou',
    label: 'Kédougou',
    departments: [
      { id: 'kedougou', label: 'Kédougou', communes: [{ id: 'kedougou', label: 'Kédougou' }] },
      { id: 'salemata', label: 'Salemata', communes: [{ id: 'salemata', label: 'Salemata' }] },
      { id: 'saraya', label: 'Saraya', communes: [{ id: 'saraya', label: 'Saraya' }] },
    ],
  },
  {
    id: 'sedhiou',
    label: 'Sédhiou',
    departments: [
      { id: 'sedhiou', label: 'Sédhiou', communes: [{ id: 'sedhiou', label: 'Sédhiou' }] },
      { id: 'bounkiling', label: 'Bounkiling', communes: [{ id: 'bounkiling', label: 'Bounkiling' }] },
      { id: 'goudomp', label: 'Goudomp', communes: [{ id: 'goudomp', label: 'Goudomp' }] },
    ],
  },
];

/** Liste des régions (labels pour affichage) */
export const REGIONS = SENEGAL_GEO.map((r) => ({ id: r.id, label: r.label }));

/** Départements pour une région donnée */
export function getDepartmentsByRegion(regionId) {
  const region = SENEGAL_GEO.find((r) => r.id === regionId);
  return region ? region.departments.map((d) => ({ id: d.id, label: d.label })) : [];
}

/** Communes pour un département d'une région donnée */
export function getCommunesByDepartment(regionId, departmentId) {
  const region = SENEGAL_GEO.find((r) => r.id === regionId);
  if (!region) return [];
  const dept = region.departments.find((d) => d.id === departmentId);
  return dept ? dept.communes : [];
}
