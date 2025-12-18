/**
 * MISSION 1 — PROBLÈME
 * Parcours « L'IDÉATEUR » — CERIP (Version SaaS Gamifiée)
 */

export const MISSION_1_CONFIG = {
  // ============================================
  // 🎯 MÉTADONNÉES
  // ============================================
  metadata: {
    MISSION_ID: 'ideateur_m1_problem',
    PARCOURS: 'L\'IDÉATEUR',
    ORDRE: 1,
    XP_TOTAL: 300,
    BADGE: 'Détective de Problème',
    BADGE_ICON: '🕵️‍♂️',
    PREREQUIS: null
  },

  // ============================================
  // 🎓 ÉTAPE 1 — IMMERSION
  // ============================================
  immersion: {
    title: 'Identification et validation du problème à résoudre',
    videoID: 'y2p9Drw7Dfo',
    estimatedTime: '15-20 minutes',
    validationRule: 'Scroll complet ou vidéo ≥ 95%',
    xpReward: 50,
    content: {
      sections: [
        {
          title: 'INTRODUCTION : LE MYTHE DU "BOROM AFFAIRE" ET LE PIÈGE DE LA SOLUTION',
          content: `Bienvenue dans la première étape décisive de votre aventure entrepreneuriale. Si vous lisez ceci, c'est que vous tenez une idée. Peut-être avez-vous déjà imaginé l'enseigne de votre boutique, le nom de votre GIE, ou la couleur de l'emballage de votre produit.

**Arrêtez tout immédiatement.**

Il existe une réalité brutale dans le monde du business au Sénégal comme ailleurs : la grande majorité des nouvelles entreprises ferment leurs portes dans les premières années. Mais savez-vous pourquoi ? Ce n'est pas parce que le produit était mauvais. Ce n'est pas parce que les associés se sont disputés ou que le financement a manqué. La raison numéro 1, celle qui tue les rêves dans l'œuf, c'est : **"Pas de besoin client"**.

En d'autres termes, ces entrepreneurs, qu'ils soient couturiers, transformateurs de céréales ou prestataires de services, ont passé des mois et investi leurs économies pour bâtir une offre magnifique... pour un problème qui n'existait pas, ou dont personne ne se souciait vraiment. Ils sont tombés dans le piège du **"Solutionnisme"**. Ils sont tombés amoureux de leur marchandise (le jus, le vêtement, le service) au lieu de tomber amoureux du problème de leur client.

Dans ce module, nous allons "formater" votre état d'esprit. Nous allons arrêter de parler de ce que vous voulez vendre, pour nous concentrer obsessionnellement sur ce qui fait souffrir votre client.

**Votre objectif n'est pas d'être un simple vendeur au marché. Votre objectif est de devenir un Enquêteur de Problèmes.**`
        },
        {
          title: 'PARTIE I : L\'ÉNONCÉ DU PROBLÈME (LE "PROBLEM STATEMENT")',
          content: `Un problème bien posé est un business à moitié réussi. Beaucoup d'entrepreneurs débutants, du coin de la rue jusqu'aux bureaux du Plateau, décrivent leur problème de manière floue : "Les gens veulent manger sain" ou "C'est dur de trouver un bon plombier". C'est trop vague. On ne bâtit pas une entreprise solide sur du vent.

Pour définir un problème avec la précision d'un horloger, nous utilisons le **Canevas de l'Énoncé du Problème**. C'est une phrase structurée qui ne laisse aucune place au "peut-être".

### 1. La Structure C.Q.C (Cible - Quoi - Conséquence)

Un bon énoncé doit contenir trois ingrédients inséparables, comme les trois pierres du foyer :

• **La Cible (Qui ?)** : Soyez précis. "Les Sénégalais" n'est pas une cible. "Les femmes" non plus. **"Les gérants de fast-foods à Dakar qui gèrent des livreurs"** est une cible.

• **La Douleur (Quoi ?)** : Quel est le dysfonctionnement ? Quel est le "thiow" (le bruit/problème) ?

• **La Conséquence (Pourquoi c'est grave ?)** : Qu'est-ce que cela leur coûte en argent, en temps perdu, ou en stress (le "fitna") ?

**Mauvais exemple** : "Les tailleurs ont du mal avec les mesures des clients." (C'est mou. On ne sent pas l'urgence de la Tabaski.)

**Bon exemple (Énoncé du Problème)** : "Les chefs d'ateliers de couture à Dakar (Cible) perdent environ 10 heures par semaine à gérer les réclamations dues aux erreurs de mesures notées sur des bouts de papier (Douleur), ce qui entraîne des retouches gratuites coûteuses et la perte de clients fidèles avant les fêtes (Conséquence)."

Voyez-vous la différence ? Le second exemple nous montre l'argent perdu. Si vous leur évitez ces pertes et ce stress, votre solution a une valeur financière immédiate.

### 2. Symptôme vs Cause Racine

L'enquêteur ne s'arrête pas à la surface. Il cherche la racine du mal. Si un client vous dit : "J'ai besoin d'un crédit", c'est un symptôme. Son vrai problème est peut-être : "Je n'arrive pas à payer mes fournisseurs à temps". Si on creuse avec la méthode des **"5 Pourquoi"** : "Pourquoi payer les fournisseurs ?" -> "Pour avoir de la marchandise." -> "Pourquoi tu n'as pas de cash ?" -> "Parce que mes clients me paient toujours en retard."

Le vrai problème n'est pas le manque de crédit (qui coûte cher), mais le recouvrement des créances. Si vous comprenez cela, vous pouvez lui proposer un système de paiement à la livraison ou un outil de relance automatique. Vous avez résolu le problème plus intelligemment car vous avez compris la cause racine.`
        },
        {
          title: 'PARTIE II : L\'ANALYSE 4U (QUALIFIER LE PROBLÈME)',
          content: `Tous les problèmes ne méritent pas qu'on crée une entreprise pour les résoudre. Certains sont comme des "piqûres de moustique" (agaçants mais on fait avec), d'autres sont des "hémorragies" (il faut agir tout de suite). Pour savoir si vous tenez une "affaire en or", nous utilisons la grille d'analyse **4U**. Vous devez noter votre problème sur ces 4 critères.

### 1. URGENT (Est-ce que ça brûle ?)

Le problème demande-t-il une action immédiate ? Imaginez la différence entre vendre des compléments alimentaires et vendre un remède contre une rage de dents. Les compléments, c'est bien, mais si on oublie ce matin, ce n'est pas grave. Si vous avez une rage de dents la veille de la Korité, vous ne négociez pas le prix, vous ne cherchez pas pendant 3 jours. Vous allez chez le premier dentiste et vous payez. C'est un problème **URGENT**. Votre entreprise doit, idéalement, vendre l'antidouleur, pas la vitamine.

### 2. UNDERSERVED (Mal servi)

Existe-t-il des solutions satisfaisantes sur le marché local ? Si vous voulez lancer une nouvelle marque d'eau en sachet, le problème de la soif est réel, mais il est "Over-served" (Trop bien servi). Il y en a à tous les coins de rue. À l'inverse, regardez le transfert d'argent avant l'arrivée de nouveaux acteurs comme Wave. Il y avait des solutions, mais elles étaient chères et parfois compliquées. Le problème était "Underserved" en termes de simplicité et de coût. Cherchez les failles : Trop cher ? Trop lent ? Trop impoli ? Pas fiable ?

### 3. UNWORKABLE (Invivable / Infaisable)

Est-ce que la situation actuelle empêche le client de travailler ? C'est crucial dans le B2B (commerce entre entreprises). Si le frigo d'un vendeur de poisson tombe en panne à cause des coupures de courant et qu'il perd son stock, la situation est "Unworkable". Il risque la faillite. Il est prêt à payer pour une solution solaire ou un générateur fiable. Si le problème est juste une petite gêne, le client gardera ses habitudes. L'humain n'aime pas le changement. Il faut que la douleur soit insupportable pour qu'il bouge.

### 4. UNAVOIDABLE (Inévitable)

Le client est-il obligé de résoudre ce problème ? Cela touche souvent aux obligations ou aux besoins vitaux. Manger à midi est inévitable. Payer l'électricité est inévitable. Se conformer aux nouvelles règles fiscales est inévitable. Si vous résolvez un problème inévitable, vous n'avez pas besoin de créer le besoin. Le besoin est imposé par la vie ou la loi. Vous devez juste être la meilleure réponse.

**Exercice Mental** : Si votre idée coche au moins 3 des 4 U, vous tenez potentiellement une pépite. Sinon, vous allez devoir dépenser des fortunes en publicité pour convaincre les Sénégalais qu'ils ont un problème.`
        },
        {
          title: 'PARTIE III : LA MÉTHODE BLACK & WHITE (VISUALISER LA VALEUR)',
          content: `Maintenant que le problème est qualifié, comment assurer que votre impact sera suffisant ? Utilisez la méthode du contraste **"Black & White"**. Il s'agit de décrire deux réalités parallèles.

### Le Monde "BLACK" (La situation actuelle)

C'est le monde sans votre produit. C'est le "calvaire" du client. Décrivez ce monde avec émotion et faits. Ne dites pas "C'est dur". Dites : "Actuellement, Fatou (votre cible) se réveille stressée. Elle passe 2 heures à attendre un 'Ndiaga Ndiaye' bondé. Elle arrive en retard au travail, son patron la blâme. Elle perd une partie de son salaire en transport inefficace. Elle rentre épuisée, sans temps pour sa famille." C'est sombre. C'est lourd. C'est la Douleur.

### Le Monde "WHITE" (La situation future)

C'est le monde avec votre solution. C'est le soulagement. **Attention, ne décrivez pas votre produit !** Décrivez le résultat sur la vie de Fatou. Dites : "Avec notre service, Fatou trouve un covoiturage sûr depuis son quartier. Elle voyage assise, tranquille. Elle arrive à l'heure, fraîche et dispo. Elle économise sur son budget transport. Elle a de l'énergie le soir pour aider ses enfants."

### Le Delta (L'écart)

Votre entreprise est le Pont entre ces deux mondes. Plus le contraste est fort, plus votre proposition de valeur est puissante. Si le monde Blanc est juste "un tout petit peu mieux" (ex: elle gagne 5 minutes), personne ne sortira son argent. Le changement doit être **radical**.`
        },
        {
          title: 'PARTIE IV : L\'ART DE LA CAUSERIE UTILE (LE "MOM TEST")',
          content: `Tout ce que nous avons vu (Énoncé, 4U, Black & White) ne sont que des hypothèses. Ce sont des idées dans votre tête. Il est temps de sortir ("Génn ci mbedd mi") et d'aller confronter cela à la réalité du terrain.

Mais attention : poser des questions est un art. Si vous le faites mal, on vous servira des mensonges polis qui vous mèneront droit au mur. C'est le principe du **"Mom Test"** : "Ne demande jamais à ta mère si ton idée est bonne, car elle t'aime et te mentira pour te faire plaisir." Au Sénégal, avec notre sens de la Téranga et de la politesse, c'est encore plus vrai. Personne ne veut briser votre rêve en face.

### Les 3 Règles d'Or de l'Entretien de Découverte

**Règle n°1 : Ne parlez jamais de votre idée**

Dès que vous dites "Je veux lancer un business de...", la discussion est faussée. La personne en face devient soit critique, soit trop gentille. Elle ne parle plus de sa vie, elle juge votre idée. L'objectif est de comprendre le problème, pas de vendre la solution.

**Règle n°2 : Demandez des faits passés, pas des opinions futures**

**Mauvaise question** : "Est-ce que tu achèterais du riz local si le packaging était joli ?"
**Réponse (Mensonge poli)** : "Oui bien sûr, c'est important de consommer local !" (En réalité, elle achète le riz importé moins cher).

**Bonne question** : "Raconte-moi la dernière fois que tu as acheté du riz. C'était lequel et pourquoi ?"
**Réponse (Vérité)** : "C'était hier, j'ai pris le parfumé importé parce que mon mari préfère ce goût."

Les actions passées disent la vérité. Les promesses futures ne valent rien.

**Règle n°3 : Cherchez le "Système D" (La débrouille)**

Si le problème est vraiment "Urgent" et "Invivable", votre client essaie déjà de le régler. Demandez : "Comment tu te débrouilles aujourd'hui pour gérer ça ?"

S'il répond : "Bof, je laisse couler, j'attends", alors ce n'est pas un vrai problème.

S'il répond : "C'est l'enfer ! Je note tout sur un carnet, j'appelle mon cousin pour m'aider, je perds du temps", alors **BINGO !** Le fait qu'il dépense déjà de l'énergie ou de l'argent (même maladroitement) prouve qu'il y a un marché. Vous n'avez plus qu'à proposer une solution plus simple que sa "débrouille" actuelle.

### La Structure d'une Causerie Type

1. **Les Salamalecs** : Mettez la personne à l'aise. On discute, on ne fait pas un interrogatoire de police.
2. **L'exploration (Le Contexte)** : "Raconte-moi comment se passe ta journée au magasin / au champ ?"
3. **Le creusage (La Douleur)** : "Qu'est-ce qui te fatigue le plus dans cette tâche ?" -> "Pourquoi c'est pénible ?"
4. **La preuve d'action (Le Système D)** : "Qu'est-ce que tu as essayé pour régler ça ?" "Ça t'a coûté combien ?"
5. **La conclusion** : "Connais-tu quelqu'un d'autre qui a ce souci avec qui je pourrais discuter ?"

Si, après avoir discuté avec 10 ou 20 personnes, vous entendez toujours les mêmes plaintes, les mêmes mots... Félicitations. Vous avez validé votre problème.`
        },
        {
          title: 'CONCLUSION ET PROCHAINES ÉTAPES',
          content: `Vous avez maintenant les outils pour ne plus naviguer à vue. Vous savez formuler un problème clair (Cible + Douleur + Conséquence). Vous savez évaluer son potentiel avec le 4U. Vous savez visualiser l'impact avec le Black & White. Vous savez comment vérifier tout cela sous l'arbre à palabres sans biaiser vos interlocuteurs.

**Ne sautez pas cette étape.** N'achetez pas de stock. Ne louez pas de local. Votre mission, pour l'instant, est d'aller au marché, dans les bureaux, dans les quartiers, et de parler à 10, 20, 50 personnes. Revenez quand vous aurez trouvé une "hémorragie" à soigner.

Une fois ce problème validé, et seulement là, vous pourrez passer à la suite : **La Solution**, où nous verrons comment construire le "médicament" parfait pour cette douleur.

**Bonne enquête, "Gaïndé" (Lion/Champion) !**`
        }
      ]
    }
  },

  // ============================================
  // 🧠 ÉTAPE 2 — TEST DE COMPRÉHENSION
  // ============================================
  comprehensionTest: {
    title: 'Test de Compréhension',
    passingScore: 75,
    xpReward: 100,
    questions: [
      {
        id: 'q1',
        type: 'qcm',
        question: 'Quelle définition correspond le mieux à un *problème réel* ?',
        options: [
          'Intéressant pour le fondateur',
          'Reconnu spontanément par plusieurs clients avec exemples concrets',
          'Anticipé sans retour terrain'
        ],
        correctAnswer: 1,
        explanation: 'Un problème réel est validé par des personnes qui le vivent, avec des preuves concrètes, pas seulement une intuition.'
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'On peut valider un problème sans parler à aucun client si l\'on connaît bien le secteur.',
        correctAnswer: false,
        explanation: 'Même avec une excellente connaissance du secteur, il est essentiel de confirmer le problème auprès des clients réels pour éviter les suppositions.'
      },
      {
        id: 'q3',
        type: 'open',
        question: 'À quoi sert l\'analyse 4U en une phrase ?',
        correctAnswers: ['évaluer', 'pertinence', 'problème', 'urgent', 'underserved', 'unworkable', 'unavoidable'],
        explanation: 'L\'analyse 4U permet d\'évaluer la pertinence d\'un problème selon 4 critères : Urgent, Underserved, Unworkable, Unavoidable.'
      },
      {
        id: 'q4',
        type: 'example',
        question: 'Donne un exemple (même imaginaire) de problème **Urgent** mais **bien servi** (les solutions actuelles sont déjà bonnes).',
        keywords: ['urgent', 'bien servi', 'solutions existantes', 'satisfaisantes'],
        explanation: 'Un problème urgent mais bien servi existe (ex: manger quand on a faim - urgent, mais bien résolu), mais il ne représente pas une opportunité entrepreneuriale.'
      }
    ],
    feedback: {
      success: 'Bravo ! Tu maîtrises les concepts. Tu peux maintenant passer à l\'application sur ton projet.',
      failure: 'Relis attentivement les concepts. Tu dois obtenir au moins 75% pour continuer.'
    }
  },

  // ============================================
  // 🧩 ÉTAPE 3 — ANCRAGE PROJET
  // ============================================
  projectForm: {
    title: 'Ancrage Projet : Mon Problème Validé',
    description: 'Appliquez la théorie à votre projet réel. Soyez précis et concret.',
    xpReward: 150,
    fields: [
      {
        fieldName: 'problem_description',
        label: 'Décrivez le problème',
        type: 'textarea',
        required: true,
        placeholder: 'Décrivez le problème en utilisant la structure C.Q.C (Cible - Quoi - Conséquence)...',
        minLength: 50,
        validation: {
          rules: [
            'Doit contenir au moins 50 caractères',
            'Doit être spécifique et concret',
            'Doit suivre la structure C.Q.C'
          ]
        }
      },
      {
        fieldName: 'cible_concernee',
        label: 'Qui a ce problème ? (Cible précise)',
        type: 'text',
        required: true,
        placeholder: 'Ex: Les gérants de fast-foods à Dakar qui gèrent des livreurs',
        validation: {
          rules: [
            'Doit être une cible précise (pas "tout le monde" ou "les gens")'
          ]
        }
      },
      {
        fieldName: 'analyse_4u_score',
        label: 'Notez l\'urgence de votre problème de 1 à 10',
        type: 'range',
        required: true,
        min: 1,
        max: 10,
        defaultValue: 5,
        validation: {
          rules: [
            'Score entre 1 et 10'
          ]
        }
      },
      {
        fieldName: 'hypothese_a_valider',
        label: 'Quelle est votre hypothèse principale à valider ?',
        type: 'textarea',
        required: true,
        placeholder: 'Ex: Les chefs d\'ateliers perdent 10h/semaine à cause des erreurs de mesures...',
        minLength: 30,
        validation: {
          rules: [
            'Doit être une hypothèse testable',
            'Doit contenir au moins 30 caractères'
          ]
        }
      }
    ]
  },

  // ============================================
  // 🏁 ÉTAPE 4 — CAPITALISATION
  // ============================================
  capitalization: {
    xpAward: 300,
    badge: {
      name: 'Détective de Problème',
      icon: '🕵️‍♂️',
      description: 'A validé un problème réel et pertinent'
    },
    nextMission: 'ideateur_m2_solution',
    feedback: {
      success: 'Problème validé. Tu as identifié une douleur réelle et exploitable. Tu peux maintenant travailler sur une solution pertinente.',
      synthesis: 'Synthèse automatique du problème en 3-5 lignes générée par l\'IA'
    }
  }
};

export default MISSION_1_CONFIG;
