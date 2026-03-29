// Matching leeft in users/ omdat het momenteel enkel de user-match endpoint bedient.
// Verplaats naar src/matching/ als het AI-scoring, gewichten of cross-feature queries krijgt.
import { Injectable } from '@nestjs/common';
import { User } from '../infrastructure/user.entity';
import { Skill } from '../../skills/infrastructure/skill.entity';

// Het hart van de applicatie: de Jaccard-similariteitsberekening.
//
//   Jaccard = |A ∩ B| / |A ∪ B|
//
//   Voorbeeld: Alice heeft {TypeScript, React, Node}, Bob heeft {TypeScript, Vue, Node}:
//   - Intersectie: {TypeScript, Node} → 2
//   - Unie: {TypeScript, React, Node, Vue} → 4
//   - Score: 2/4 = 0.5
//
//   Scores van 0 worden gefilterd (geen enkele gemeenschappelijke skill)
//   en het resultaat wordt van hoog naar laag gesorteerd.

// NestJS decorator — maakt deze class injecteerbaar via dependency injection.
// Zonder dit kan UsersService deze class niet ontvangen in zijn constructor.
@Injectable()
export class MatchingService {

  computeMatches(
    target: User,   // de user waarvoor we matches zoeken
    others: User[], // alle andere users (al gefilterd buiten deze methode)
  ): Array<{ user: User; skills: Skill[]; score: number }> {

    // Stap 1: verzamel de skill-ids van de target user in een Set.
    // Set = HashSet<string> — geen duplicaten, .has() is O(1) vs O(n) bij array.
    // Dankzij ManyToMany is user.skills direct een Skill[], geen wrapper object meer.
    const targetSkillIds = new Set(target.skills.map((s) => s.id));

    return others
      // Stap 2: transformeer elke andere user naar een object met score.
      .map((other) => {
        // Zelfde als targetSkillIds maar voor deze andere user.
        const otherSkillIds = new Set(other.skills.map((s) => s.id));

        // DOORSNEDE — skills die beide users hebben. Dit is de Jaccard teller (∩).
        // [...targetSkillIds] spreidt de Set uit naar array zodat .filter() beschikbaar is.
        const intersection = new Set(
          [...targetSkillIds].filter((id) => otherSkillIds.has(id))
        );

        // UNIE — alle skills van beide users samen. Dit is de Jaccard noemer (∪).
        // De Set verwijdert duplicaten automatisch.
        const union = new Set([...targetSkillIds, ...otherSkillIds]);

        // JACCARD SCORE: doorsnede / unie → getal tussen 0.0 en 1.0.
        // Nul-check voorkomt deling door nul als beide users geen enkele skill hebben.
        const score = union.size === 0 ? 0 : intersection.size / union.size;

        // user.skills is nu direct de array van Skill objecten — geen .skill unwrap meer nodig.
        return { user: other, skills: other.skills, score };
      })

      // Verwijder users met score 0 — geen enkele gemeenschappelijke skill.
      .filter((match) => match.score > 0)

      // Sorteer van hoog naar laag (descending).
      .sort((a, b) => b.score - a.score);
  }
}
