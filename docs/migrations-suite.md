# Migrations « suite » (P1→P2, pédagogie, QCM)

Exécuter dans l’ordre dans le SQL Editor Supabase :

1. **`migration-p1-p2-progression.sql`**  
   Trigger : passage automatique en P2 quand `p1_score >= 70`.

2. **`migration-pedagogie.sql`**  
   Tables `learning_modules`, `module_quiz_questions`, `module_quiz_choices`, `incube_module_progress` + RLS + trigger de recalcul des scores P1/P2.

3. **`migration-qcm-certification.sql`**  
   Colonnes examen sur `certification_candidates`, tables `exam_questions` / `exam_question_choices`, RLS, RPC `submit_certification_exam`.

4. **(Optionnel)** **`seed-learning-modules.sql`**  
   Données de test pour des modules P1/P2 (adapter `organisation_id` si besoin).

Après exécution, les incubés peuvent :
- Voir les modules de leur phase (P1 ou P2) et passer les quiz formatifs → mise à jour des scores et passage auto P1→P2 si ≥ 70 %.
- Lancer l’examen de certification (QCM chronométré 30 min), soumettre → notation côté serveur et statut CERTIFIED/FAILED (seuil 70 %).
