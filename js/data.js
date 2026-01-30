/**
 * Données initiales - Gaïndé Academy v9.1
 * Modules (parcours P1, P2, P3) et utilisateurs (admin, coach, incubé)
 */

const INITIAL_MODULES = [
    {
        id: "P1_M1",
        requiredLevel: 1,
        title: "Mission 1 : Le Vrai Problème",
        parcours: "P1",
        xp: 350,
        video: "y2p9Drw7Dfo",
        shortDesc: "Identifier et valider une douleur client pertinente.",
        theoryTitle: "M-1.1 : Le Problem Statement & 4U",
        paragraphs: [{ id: 1, text: "Ne vendez pas votre solution, validez la douleur." }],
        quiz: [{ q: "Dans l'analyse 4U, que signifie le premier U ?", options: ["Utile", "Unique", "Urgent", "Ultra"], correct: 2 }],
        formStructure: [
            {
                section: "M-1.3 : PROBLÈME",
                fields: [
                    { id: "input-problem", label: "Quel est le problème principal (Pain Point) ?", type: "textarea", placeholder: "Ex: Les agriculteurs perdent..." },
                    { id: "input-target-desc", label: "Qui subit ce problème ? (Cœur de cible)", type: "textarea", placeholder: "Ex: Les petits producteurs..." }
                ]
            }
        ],
        badge: "Détective"
    },
    {
        id: "P1_M2",
        requiredLevel: 2,
        title: "Mission 2 : La Réponse Adéquate",
        parcours: "P1",
        xp: 350,
        video: "",
        shortDesc: "Solution & Fit.",
        theoryTitle: "M-2.1 : Solution",
        paragraphs: [{ id: 1, text: "Le Fit Problème-Solution." }],
        quiz: [{ q: "VRIO : le 'I' signifie...", options: ["Intelligent", "Innovant", "Inimitable", "Immédiat"], correct: 2 }],
        formStructure: [
            { section: "M-2.3 : SOLUTION", fields: [{ id: "input-solution", label: "Décrivez votre solution", type: "textarea" }, { id: "input-activities", label: "Activités Clés (ka)", type: "textarea" }] }
        ]
    },
    {
        id: "P1_M3",
        requiredLevel: 3,
        title: "Mission 3 : Ma Valeur Unique",
        parcours: "P1",
        xp: 350,
        video: "",
        shortDesc: "UVP.",
        theoryTitle: "M-3.1 : Value Prop",
        paragraphs: [{ id: 1, text: "Bénéfices." }],
        quiz: [{ q: "UVP...", options: ["Tech", "Valeur", "Prix", "Liste"], correct: 1 }],
        formStructure: [{ section: "M-3.3 : UVP", fields: [{ id: "input-value-prop", label: "Proposition de Valeur Unique (vp)", type: "textarea" }] }]
    },
    {
        id: "P1_M4",
        requiredLevel: 4,
        title: "Mission 4 : Mon Modèle Éco",
        parcours: "P1",
        xp: 350,
        video: "",
        shortDesc: "BMC Full.",
        theoryTitle: "M-4.1 : BMC",
        paragraphs: [{ id: 1, text: "Scène vs Coulisses." }],
        quiz: [{ q: "Ressources...", options: ["Faire", "Avoir", "Clients", "Revenus"], correct: 1 }],
        formStructure: [
            {
                section: "M-4.3 : BMC",
                fields: [
                    { id: "input-segments", label: "Segments Clients (cs)", type: "textarea" },
                    { id: "input-channels", label: "Canaux (ch)", type: "textarea" },
                    { id: "input-relations", label: "Relations (cr)", type: "textarea" },
                    { id: "input-revenue", label: "Revenus (rev)", type: "textarea" },
                    { id: "input-costs", label: "Coûts (cst)", type: "textarea" }
                ]
            }
        ]
    },
    {
        id: "P1_M5",
        requiredLevel: 5,
        title: "Mission 5 : Mon Premier Prototype",
        parcours: "P1",
        xp: 400,
        video: "",
        shortDesc: "MVP.",
        theoryTitle: "M-5.1 : MVP",
        paragraphs: [{ id: 1, text: "MoSCoW." }],
        quiz: [{ q: "Objectif...", options: ["Argent", "Apprendre", "Parfait", "Banque"], correct: 1 }],
        formStructure: [
            { section: "M-5.3 : MVP", fields: [{ id: "input-resources", label: "Ressources Clés (kr)", type: "textarea" }, { id: "input-partners", label: "Partenaires Clés (kp)", type: "textarea" }] }
        ]
    },
    {
        id: "P1_M6",
        requiredLevel: 6,
        title: "Mission 6 : Mon Identité",
        parcours: "P1",
        xp: 500,
        video: "",
        shortDesc: "Branding.",
        theoryTitle: "M-6.1 : Branding",
        paragraphs: [{ id: 1, text: "Mission/Vision." }],
        quiz: [{ q: "Vision...", options: ["Auj", "Futur", "Prix", "Logo"], correct: 1 }],
        formStructure: [{ section: "M-6.3 : ADN", fields: [{ id: "input-project-name", label: "Nom du Projet", type: "text" }, { id: "input-tagline", label: "Slogan", type: "text" }] }]
    },
    {
        id: "EXAM_P1",
        requiredLevel: 7,
        title: "EXAMEN DE PASSAGE P1",
        parcours: "P1",
        xp: 800,
        video: "",
        shortDesc: "Validation P1.",
        theoryTitle: "Examen Fin Parcours 1",
        paragraphs: [{ id: 1, text: "80% requis." }],
        quiz: [{ q: "4U...", options: ["Utile", "Urgent"], correct: 1 }],
        formStructure: [],
        certifConfig: { duration: 15, passingThreshold: 80, nextLevel: 8 }
    },
    {
        id: "P2_M1",
        requiredLevel: 8,
        title: "Mission 1 : Ma Place sur le Marché",
        parcours: "P2",
        xp: 400,
        video: "",
        shortDesc: "Positionnement.",
        theoryTitle: "Océan Bleu",
        paragraphs: [{ id: 1, text: "Concurrence." }],
        quiz: [{ q: "Mapping...", options: ["Océan Rouge", "Océan Bleu"], correct: 1 }],
        formStructure: [{ section: "M-1.3", fields: [{ id: "mapping", label: "Mapping", type: "text" }] }]
    },
    {
        id: "P3_CERTIF",
        requiredLevel: 16,
        title: "CERTIFICATION FINALE",
        parcours: "P3",
        xp: 1000,
        video: "",
        shortDesc: "Expertise.",
        theoryTitle: "Examen Final",
        paragraphs: [{ id: 1, text: "Certification." }],
        quiz: [{ q: "Final", options: ["A", "B"], correct: 0 }],
        formStructure: [],
        certifConfig: { duration: 30, passingThreshold: 80 }
    }
];

const INITIAL_USERS = [
    { id: 1, prenom: "Cheikh", nom: "Ndiaye", email: "admin@gainde.sn", pass: "admin", role: "admin", phone: "770000000", city: "Dakar", level: 99, xp: 99999, regDate: "2025-01-01" },
    { id: 3, prenom: "Moussa", nom: "Fall", email: "coach@gainde.sn", pass: "coach", role: "coach", phone: "775555555", city: "Saint-Louis", level: 50, xp: 50000, regDate: "2025-01-05" },
    { id: 2, prenom: "Fatou", nom: "Diop", email: "user@gainde.sn", pass: "user", role: "incubé", phone: "771234567", city: "Thiès", level: 0, xp: 0, regDate: "2025-10-15", coachId: 3 }
];
