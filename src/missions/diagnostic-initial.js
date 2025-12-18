/**
 * DIAGNOSTIC INITIAL — Évaluation du Niveau de Projet
 * CERIP — Plateforme d'Incubation
 */

export const DIAGNOSTIC_INITIAL_CONFIG = {
  metadata: {
    ID: 'diagnostic_initial',
    TITLE: 'Diagnostic Initial',
    DESCRIPTION: 'Évaluez votre niveau pour trouver votre point de départ optimal',
    DURATION_ESTIMEE: '5 minutes'
  },

  // Question profil universelle (toujours la première)
  profileQuestion: {
    id: 'q1',
    question: 'Quel est votre profil ?',
    type: 'single_choice',
    options: [
      { 
        label: 'Porteur de projet / Idéateur (je veux créer mon entreprise)', 
        value: 'porteur_projet', 
        segment: 'ideateur',
        description: 'Vous avez une idée d\'entreprise et souhaitez la concrétiser'
      },
      { 
        label: 'Entreprise existante / Startup en développement (j\'ai déjà une activité avec CA)', 
        value: 'entreprise', 
        segment: 'entreprise',
        description: 'Vous dirigez déjà une entreprise et souhaitez la développer'
      },
      { 
        label: 'Salarié / Professionnel indépendant (je veux développer mes compétences)', 
        value: 'salarie', 
        segment: 'formation',
        description: 'Vous travaillez et souhaitez améliorer vos compétences professionnelles'
      },
      { 
        label: 'Dirigeant d\'entreprise (je veux former mon personnel)', 
        value: 'dirigeant', 
        segment: 'formation_personnel',
        description: 'Vous voulez former et développer les compétences de vos équipes'
      },
      {
        label: 'Étudiant / Jeune diplômé (je prépare mon avenir professionnel)',
        value: 'etudiant',
        segment: 'ideateur',
        description: 'Vous êtes en formation et préparez votre entrée dans la vie professionnelle'
      },
      {
        label: 'Chômeur / En reconversion (je veux créer mon activité)',
        value: 'reconversion',
        segment: 'ideateur',
        description: 'Vous cherchez une nouvelle orientation et souhaitez créer votre activité'
      },
      {
        label: 'Coopérative / Association (nous voulons structurer notre organisation)',
        value: 'cooperative',
        segment: 'entreprise',
        description: 'Vous représentez un groupement et souhaitez le professionnaliser'
      },
      {
        label: 'Investisseur / Partenaire (je cherche à identifier des talents)',
        value: 'investisseur',
        segment: 'formation',
        description: 'Vous recherchez des profils formés et certifiés pour vos projets'
      }
    ],
    required: true
  },

  // Questions par profil
  questionsByProfile: {
    porteur_projet: [
      {
        id: 'q2',
        question: 'À quel stade se trouve votre projet actuellement ?',
        type: 'single_choice',
        options: [
          { label: 'J\'ai juste une idée dans ma tête, je réfléchis encore', value: 'idee', score: { monde1: 10, monde2: 0 } },
          { label: 'J\'ai identifié un problème que je veux résoudre', value: 'probleme_identifie', score: { monde1: 8, monde2: 2 } },
          { label: 'J\'ai testé mon idée avec quelques personnes', value: 'test_preliminaire', score: { monde1: 6, monde2: 4 } },
          { label: 'J\'ai un prototype ou une version testable (MVP)', value: 'mvp', score: { monde1: 3, monde2: 7 } },
          { label: 'J\'ai déjà quelques clients qui ont testé/payé', value: 'clients_test', score: { monde1: 1, monde2: 9 } }
        ],
        required: true
      },
      {
        id: 'q3',
        question: 'Avez-vous déjà réalisé des entretiens ou des recherches sur vos clients cibles ?',
        type: 'single_choice',
        options: [
          { label: 'Non, pas encore. Je ne sais pas vraiment qui sont mes clients', value: 'non', score: { monde1: 10, monde2: 0 } },
          { label: 'Oui, j\'ai fait quelques recherches mais sans entretiens directs', value: 'recherche', score: { monde1: 8, monde2: 2 } },
          { label: 'Oui, quelques entretiens exploratoires (1-5 personnes)', value: 'quelques', score: { monde1: 6, monde2: 4 } },
          { label: 'Oui, plusieurs entretiens (6-15 personnes)', value: 'plusieurs', score: { monde1: 3, monde2: 7 } },
          { label: 'Oui, régulièrement avec ma clientèle cible (15+)', value: 'regulier', score: { monde1: 1, monde2: 9 } }
        ],
        required: true
      },
      {
        id: 'q4',
        question: 'Quel est votre niveau de connaissance sur l\'entrepreneuriat ?',
        type: 'single_choice',
        options: [
          { label: 'Débutant complet, je découvre l\'entrepreneuriat', value: 'debutant', score: { monde1: 10, monde2: 0 } },
          { label: 'J\'ai quelques notions grâce à des lectures/vidéos', value: 'notions', score: { monde1: 8, monde2: 2 } },
          { label: 'J\'ai déjà suivi une formation ou un atelier', value: 'formation', score: { monde1: 5, monde2: 5 } },
          { label: 'Je connais les bases : BMC, Lean Canvas, MVP', value: 'bases', score: { monde1: 2, monde2: 8 } },
          { label: 'J\'ai déjà créé ou aidé à créer une entreprise', value: 'experience', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      },
      {
        id: 'q5',
        question: 'Avez-vous déjà défini votre modèle économique (Business Model) ?',
        type: 'single_choice',
        options: [
          { label: 'Non, je ne sais pas vraiment ce que c\'est', value: 'non', score: { monde1: 10, monde2: 0 } },
          { label: 'J\'ai une idée mais je ne l\'ai pas formalisée', value: 'idee', score: { monde1: 8, monde2: 2 } },
          { label: 'Oui, j\'ai un Business Model Canvas mais incomplet', value: 'partiel', score: { monde1: 5, monde2: 5 } },
          { label: 'Oui, j\'ai un BMC complet et validé', value: 'complet', score: { monde1: 1, monde2: 9 } },
          { label: 'Oui, et j\'ai testé plusieurs modèles', value: 'teste', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      },
      {
        id: 'q6',
        question: 'Quelle est votre priorité immédiate pour votre projet ?',
        type: 'single_choice',
        options: [
          { label: 'Valider que mon idée répond à un vrai problème client', value: 'valider_probleme', score: { monde1: 10, monde2: 0 } },
          { label: 'Définir précisément ma solution et mon positionnement', value: 'solution', score: { monde1: 8, monde2: 2 } },
          { label: 'Construire un prototype ou MVP testable', value: 'prototype', score: { monde1: 5, monde2: 5 } },
          { label: 'Trouver mes premiers clients payants', value: 'clients', score: { monde1: 2, monde2: 8 } },
          { label: 'Lever des fonds, recruter ou structurer mon équipe', value: 'fond_equipe', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      }
    ],
    
    entreprise: [
      {
        id: 'q2',
        question: 'Depuis combien de temps votre entreprise existe-t-elle ?',
        type: 'single_choice',
        options: [
          { label: 'Moins de 6 mois', value: 'moins_6mois', score: { monde1: 5, monde2: 5 } },
          { label: 'Entre 6 mois et 1 an', value: '6mois_1an', score: { monde1: 2, monde2: 8 } },
          { label: 'Entre 1 et 3 ans', value: '1_3ans', score: { monde1: 0, monde2: 10 } },
          { label: 'Plus de 3 ans', value: 'plus_3ans', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      },
      {
        id: 'q3',
        question: 'Quel est votre chiffre d\'affaires mensuel actuel ?',
        type: 'single_choice',
        options: [
          { label: 'Aucun CA pour le moment', value: 'aucun', score: { monde1: 5, monde2: 5 } },
          { label: 'Moins de 500 000 FCFA', value: 'moins_500k', score: { monde1: 2, monde2: 8 } },
          { label: 'Entre 500 000 et 2 millions FCFA', value: '500k_2M', score: { monde1: 0, monde2: 10 } },
          { label: 'Plus de 2 millions FCFA', value: 'plus_2M', score: { monde1: 0, monde2: 10 } },
          { label: 'Je préfère ne pas répondre', value: 'np', score: { monde1: 1, monde2: 9 } }
        ],
        required: true
      },
      {
        id: 'q4',
        question: 'Quel est votre principal défi actuel ?',
        type: 'single_choice',
        options: [
          { label: 'Stabiliser mon modèle économique', value: 'stabiliser', score: { monde1: 3, monde2: 7 } },
          { label: 'Développer mes ventes et trouver de nouveaux clients', value: 'ventes', score: { monde1: 1, monde2: 9 } },
          { label: 'Améliorer ma gestion financière et administrative', value: 'gestion', score: { monde1: 0, monde2: 10 } },
          { label: 'Recruter et structurer mon équipe', value: 'recrutement', score: { monde1: 0, monde2: 10 } },
          { label: 'Lever des fonds pour accélérer ma croissance', value: 'fond', score: { monde1: 0, monde2: 10 } },
          { label: 'Améliorer ma positionnement et ma différenciation', value: 'positionnement', score: { monde1: 1, monde2: 9 } }
        ],
        required: true
      },
      {
        id: 'q5',
        question: 'Combien d\'employés avez-vous actuellement ?',
        type: 'single_choice',
        options: [
          { label: 'Aucun, je travaille seul(e)', value: 'seul', score: { monde1: 2, monde2: 8 } },
          { label: '1 à 5 employés', value: '1_5', score: { monde1: 0, monde2: 10 } },
          { label: '6 à 20 employés', value: '6_20', score: { monde1: 0, monde2: 10 } },
          { label: 'Plus de 20 employés', value: 'plus_20', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      },
      {
        id: 'q6',
        question: 'Quelle est votre priorité immédiate pour développer votre entreprise ?',
        type: 'single_choice',
        options: [
          { label: 'Optimiser ma stratégie commerciale et mes ventes', value: 'commercial', score: { monde1: 0, monde2: 10 } },
          { label: 'Structurer ma gestion et mes processus internes', value: 'structuration', score: { monde1: 0, monde2: 10 } },
          { label: 'Diversifier mes activités ou lancer de nouveaux produits', value: 'diversification', score: { monde1: 1, monde2: 9 } },
          { label: 'Améliorer ma visibilité et mon positionnement marché', value: 'positionnement', score: { monde1: 1, monde2: 9 } },
          { label: 'Lever des fonds ou trouver des partenaires financiers', value: 'financement', score: { monde1: 0, monde2: 10 } },
          { label: 'Former et développer les compétences de mon équipe', value: 'formation', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      }
    ],
    
    salarie: [
      {
        id: 'q2',
        question: 'Dans quel domaine travaillez-vous actuellement ?',
        type: 'single_choice',
        options: [
          { label: 'Commerce / Vente / Marketing', value: 'commercial', score: { monde1: 5, monde2: 5 } },
          { label: 'Gestion / Administration / Finance', value: 'gestion', score: { monde1: 5, monde2: 5 } },
          { label: 'Technique / Production / Industrie', value: 'technique', score: { monde1: 5, monde2: 5 } },
          { label: 'Services / Hôtellerie / Tourisme', value: 'services', score: { monde1: 5, monde2: 5 } },
          { label: 'Santé / Social / Éducation', value: 'sante', score: { monde1: 5, monde2: 5 } },
          { label: 'Autre secteur', value: 'autre', score: { monde1: 5, monde2: 5 } }
        ],
        required: true
      },
      {
        id: 'q3',
        question: 'Quel est votre objectif principal de formation ?',
        type: 'single_choice',
        options: [
          { label: 'Développer mes compétences dans mon poste actuel', value: 'poste_actuel', score: { monde1: 5, monde2: 5 } },
          { label: 'Me préparer à un changement de poste ou promotion', value: 'promotion', score: { monde1: 5, monde2: 5 } },
          { label: 'Acquérir de nouvelles compétences pour changer de secteur', value: 'changement', score: { monde1: 6, monde2: 4 } },
          { label: 'Me préparer à créer ma propre entreprise', value: 'creation', score: { monde1: 8, monde2: 2 } },
          { label: 'Améliorer ma posture professionnelle et mon leadership', value: 'leadership', score: { monde1: 4, monde2: 6 } }
        ],
        required: true
      },
      {
        id: 'q4',
        question: 'Quels domaines de compétences souhaitez-vous développer en priorité ?',
        type: 'single_choice',
        options: [
          { label: 'Entrepreneuriat et création d\'entreprise', value: 'entrepreneuriat', score: { monde1: 8, monde2: 2 } },
          { label: 'Gestion de projet et méthodologies', value: 'gestion_projet', score: { monde1: 5, monde2: 5 } },
          { label: 'Posture commerciale et vente', value: 'commercial', score: { monde1: 4, monde2: 6 } },
          { label: 'Développement personnel et leadership', value: 'leadership', score: { monde1: 4, monde2: 6 } },
          { label: 'Marketing digital et communication', value: 'marketing', score: { monde1: 3, monde2: 7 } },
          { label: 'Finance et gestion d\'entreprise', value: 'finance', score: { monde1: 3, monde2: 7 } }
        ],
        required: true
      },
      {
        id: 'q5',
        question: 'Quel est votre niveau d\'expérience professionnelle ?',
        type: 'single_choice',
        options: [
          { label: 'Débutant (moins de 2 ans)', value: 'debutant', score: { monde1: 8, monde2: 2 } },
          { label: 'Intermédiaire (2 à 5 ans)', value: 'intermediaire', score: { monde1: 5, monde2: 5 } },
          { label: 'Expérimenté (5 à 10 ans)', value: 'experimente', score: { monde1: 3, monde2: 7 } },
          { label: 'Expert (plus de 10 ans)', value: 'expert', score: { monde1: 2, monde2: 8 } }
        ],
        required: true
      },
      {
        id: 'q6',
        question: 'Comment souhaitez-vous appliquer ces compétences ?',
        type: 'single_choice',
        options: [
          { label: 'Dans mon poste actuel pour améliorer ma performance', value: 'poste_actuel', score: { monde1: 4, monde2: 6 } },
          { label: 'Pour évoluer vers un poste à plus de responsabilités', value: 'evolution', score: { monde1: 3, monde2: 7 } },
          { label: 'Pour créer ma propre activité ou entreprise', value: 'creation', score: { monde1: 8, monde2: 2 } },
          { label: 'Pour changer de secteur ou de carrière', value: 'changement', score: { monde1: 6, monde2: 4 } }
        ],
        required: true
      }
    ],
    
    dirigeant: [
      {
        id: 'q2',
        question: 'Combien de personnes souhaitez-vous former dans votre entreprise ?',
        type: 'single_choice',
        options: [
          { label: '1 à 5 personnes', value: '1_5', score: { monde1: 0, monde2: 8 } },
          { label: '6 à 15 personnes', value: '6_15', score: { monde1: 0, monde2: 9 } },
          { label: '16 à 50 personnes', value: '16_50', score: { monde1: 0, monde2: 10 } },
          { label: 'Plus de 50 personnes', value: 'plus_50', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      },
      {
        id: 'q3',
        question: 'Quels sont les besoins de formation prioritaires de votre équipe ?',
        type: 'single_choice',
        options: [
          { label: 'Posture commerciale et techniques de vente', value: 'commercial', score: { monde1: 0, monde2: 10 } },
          { label: 'Gestion de projet et organisation', value: 'gestion', score: { monde1: 0, monde2: 10 } },
          { label: 'Leadership et développement personnel', value: 'leadership', score: { monde1: 0, monde2: 10 } },
          { label: 'Digital et transformation numérique', value: 'digital', score: { monde1: 0, monde2: 10 } },
          { label: 'Finance et gestion d\'entreprise', value: 'finance', score: { monde1: 0, monde2: 10 } },
          { label: 'Développement de compétences métier spécifiques', value: 'metier', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      },
      {
        id: 'q4',
        question: 'Quel est l\'objectif principal de cette formation pour votre entreprise ?',
        type: 'single_choice',
        options: [
          { label: 'Améliorer les performances commerciales', value: 'performance', score: { monde1: 0, monde2: 10 } },
          { label: 'Développer l\'autonomie et la responsabilisation', value: 'autonomie', score: { monde1: 0, monde2: 10 } },
          { label: 'Préparer l\'équipe à de nouvelles responsabilités', value: 'responsabilites', score: { monde1: 0, monde2: 10 } },
          { label: 'Favoriser l\'innovation et la créativité', value: 'innovation', score: { monde1: 0, monde2: 10 } },
          { label: 'Accompagner une transformation ou un changement', value: 'transformation', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      },
      {
        id: 'q5',
        question: 'Quel est votre secteur d\'activité ?',
        type: 'single_choice',
        options: [
          { label: 'Commerce / Distribution', value: 'commercial', score: { monde1: 0, monde2: 8 } },
          { label: 'Services', value: 'services', score: { monde1: 0, monde2: 8 } },
          { label: 'Industrie / Production', value: 'industrie', score: { monde1: 0, monde2: 8 } },
          { label: 'Technologie / Digital', value: 'tech', score: { monde1: 0, monde2: 10 } },
          { label: 'Agriculture / Agroalimentaire', value: 'agro', score: { monde1: 0, monde2: 8 } },
          { label: 'Autre secteur', value: 'autre', score: { monde1: 0, monde2: 8 } }
        ],
        required: true
      },
      {
        id: 'q6',
        question: 'Comment préférez-vous organiser la formation de votre équipe ?',
        type: 'single_choice',
        options: [
          { label: 'Formation individuelle en ligne (chacun à son rythme)', value: 'individuel', score: { monde1: 0, monde2: 10 } },
          { label: 'Formation de groupe avec suivi personnalisé', value: 'groupe', score: { monde1: 0, monde2: 10 } },
          { label: 'Programme sur mesure adapté à nos besoins spécifiques', value: 'sur_mesure', score: { monde1: 0, monde2: 10 } },
          { label: 'Mix de formations selon les profils et besoins', value: 'mixte', score: { monde1: 0, monde2: 10 } }
        ],
        required: true
      }
    ],
    
    // Profils additionnels (mappés vers les profils principaux)
    etudiant: [], // Utilise les questions de porteur_projet
    reconversion: [], // Utilise les questions de porteur_projet
    cooperative: [], // Utilise les questions de entreprise
    investisseur: [] // Utilise les questions de salarie
  },
  
  // Questions génériques (avant restructuration, pour compatibilité)
  questions: [],

  routing: {
    seuil_monde1: 35,
    seuil_monde2: 35
  },

  monetization: {
    missions_gratuites_monde1: 2,
    missions_gratuites_monde2: 1,
    message_blocage: 'Vous avez atteint la limite des missions gratuites. Pour continuer votre parcours, passez à un abonnement premium.',
    cta_premium: 'Débloquer tout le parcours'
  }
};

/**
 * Obtient les questions personnalisées selon le profil sélectionné
 */
export function getQuestionsForProfile(profileValue) {
  // Mapper les profils additionnels vers les profils principaux
  const profileMapping = {
    'etudiant': 'porteur_projet',
    'reconversion': 'porteur_projet',
    'cooperative': 'entreprise',
    'investisseur': 'salarie'
  };
  
  const mainProfile = profileMapping[profileValue] || profileValue;
  return DIAGNOSTIC_INITIAL_CONFIG.questionsByProfile[mainProfile] || [];
}

/**
 * Obtient toutes les questions à afficher (profil + questions personnalisées)
 */
export function getAllDiagnosticQuestions(profileValue) {
  const profileQuestion = DIAGNOSTIC_INITIAL_CONFIG.profileQuestion;
  const personalizedQuestions = getQuestionsForProfile(profileValue);
  return [profileQuestion, ...personalizedQuestions];
}

export function calculateDiagnosticResult(answers) {
  let scoreMonde1 = 0;
  let scoreMonde2 = 0;
  let segmentIdentifie = null;
  
  // Identifier le segment depuis la première question (profil)
  const q1Answer = answers['q1'];
  if (q1Answer) {
    const q1Option = DIAGNOSTIC_INITIAL_CONFIG.profileQuestion.options.find(opt => opt.value === q1Answer);
    if (q1Option && q1Option.segment) {
      segmentIdentifie = q1Option.segment;
    }
  }
  
  // Obtenir les questions personnalisées pour ce profil
  const personalizedQuestions = getQuestionsForProfile(q1Answer);
  
  // Calculer les scores sur les questions personnalisées
  personalizedQuestions.forEach(q => {
    const answerValue = answers[q.id];
    if (!answerValue) return;
    const selectedOption = q.options.find(opt => opt.value === answerValue);
    if (selectedOption && selectedOption.score) {
      scoreMonde1 += selectedOption.score.monde1;
      scoreMonde2 += selectedOption.score.monde2;
    }
  });
  
  const seuilMonde2 = DIAGNOSTIC_INITIAL_CONFIG.routing.seuil_monde2;
  let mondeRecommande;
  let justification;
  let parcoursRecommande;
  let missionDebut;
  
  // Adapter selon le segment
  if (segmentIdentifie === 'ideateur') {
    if (scoreMonde2 >= seuilMonde2 && scoreMonde2 > scoreMonde1) {
      mondeRecommande = 'monde2';
      parcoursRecommande = 'LA JEUNE POUSSE';
      missionDebut = 'jeune_pousse_m1_positioning';
      justification = `Votre projet est déjà avancé (${scoreMonde2} points). Vous pouvez démarrer directement au Parcours 2 : LA JEUNE POUSSE pour vous concentrer sur la commercialisation et le financement.`;
    } else {
      mondeRecommande = 'monde1';
      parcoursRecommande = 'L\'IDÉATEUR';
      missionDebut = 'ideateur_m1_problem';
      justification = `Vous êtes en phase d'idéation (${scoreMonde1} points). Commencez par le Parcours 1 : L'IDÉATEUR pour structurer votre idée de la base (de l'idée au MVP).`;
    }
  } else if (segmentIdentifie === 'entreprise') {
    mondeRecommande = 'monde2';
    parcoursRecommande = 'LA JEUNE POUSSE';
    missionDebut = 'jeune_pousse_m1_positioning';
    justification = `En tant qu'entreprise existante, vous avez déjà dépassé le stade de l'idéation. Le Parcours 2 : LA JEUNE POUSSE vous accompagne dans le développement commercial, la structuration et le financement.`;
  } else if (segmentIdentifie === 'formation' || segmentIdentifie === 'formation_personnel') {
    mondeRecommande = 'formation';
    parcoursRecommande = 'FORMATION & DÉVELOPPEMENT';
    missionDebut = 'formation_dashboard';
    justification = `Vous êtes intéressé par la formation. Nos programmes couvrent le développement personnel, la posture commerciale, la gestion de projet et l'entrepreneuriat.`;
  } else {
    // Par défaut, mode idéateur
    mondeRecommande = 'monde1';
    parcoursRecommande = 'L\'IDÉATEUR';
    missionDebut = 'ideateur_m1_problem';
    justification = `Nous vous recommandons de commencer par le Parcours 1 : L'IDÉATEUR pour structurer votre projet.`;
  }
  
  return {
    segment: segmentIdentifie,
    mondeRecommande,
    scores: { monde1: scoreMonde1, monde2: scoreMonde2, total: scoreMonde1 + scoreMonde2 },
    justification,
    parcoursRecommande,
    missionDebut
  };
}

export function checkMissionAccess(parcours, numeroMission, userSubscription = {}) {
  const config = DIAGNOSTIC_INITIAL_CONFIG.monetization;
  
  if (userSubscription.isPremium || userSubscription.isPaid) {
    return { accessible: true, reason: 'Accès premium', cta: null };
  }
  
  const missionsGratuites = parcours === 'ideateur' 
    ? config.missions_gratuites_monde1 
    : config.missions_gratuites_monde2;
  
  if (numeroMission <= missionsGratuites) {
    return { accessible: true, reason: 'Mission gratuite', cta: null };
  }
  
  return {
    accessible: false,
    reason: 'Mission premium',
    cta: config.cta_premium,
    message: config.message_blocage
  };
}

export default DIAGNOSTIC_INITIAL_CONFIG;
