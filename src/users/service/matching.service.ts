import { Injectable, Logger } from '@nestjs/common';
import { User } from '../infrastructure/user.entity';
import { Skill } from '../../skills/infrastructure/skill.entity';

// The core of the application: the Jaccard similarity calculation.
//
//   Jaccard = |A ∩ B| / |A ∪ B|
//
//   Example: Alice has {TypeScript, React, Node}, Bob has {TypeScript, Vue, Node}:
//   - Intersection: {TypeScript, Node} → 2
//   - Union: {TypeScript, React, Node, Vue} → 4
//   - Score: 2/4 = 0.5
//
//   Scores of 0 are filtered out (no shared skills at all)
//   and the result is sorted from high to low.

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  computeMatches(
    target: User,
    others: User[],
  ): Array<{ user: User; skills: Skill[]; score: number }> {
    const start = Date.now();

    // Step 1: collect the skill IDs of the target user into a Set.
    // Set = HashSet<string> — no duplicates, .has() is O(1) vs O(n) for arrays.
    // Thanks to ManyToMany, user.skills is directly a Skill[], no wrapper object needed.
    const targetSkillIds = new Set(target.skills.map((s) => s.id));

    const results = others
      // Step 2: transform each other user into an object with a score.
      .map((other) => {
        // Same as targetSkillIds but for this other user.
        const otherSkillIds = new Set(other.skills.map((s) => s.id));

        // INTERSECTION — skills that both users share. This is the Jaccard numerator (∩).
        // [...targetSkillIds] spreads the Set into an array so .filter() is available.
        const intersection = new Set(
          [...targetSkillIds].filter((id) => otherSkillIds.has(id)),
        );

        // UNION — all skills of both users combined. This is the Jaccard denominator (∪).
        // The Set removes duplicates automatically.
        const union = new Set([...targetSkillIds, ...otherSkillIds]);

        // JACCARD SCORE: intersection / union → number between 0.0 and 1.0.
        // Zero-check prevents division by zero if both users have no skills at all.
        const score = union.size === 0 ? 0 : intersection.size / union.size;

        // user.skills is now directly the array of Skill objects — no .skill unwrap needed.
        return { user: other, skills: other.skills, score };
      })

      // Remove users with score 0 — no shared skills at all.
      .filter((match) => match.score > 0)

      // Sort from high to low (descending).
      .sort((a, b) => b.score - a.score);

    this.logger.log(
      `Computed matches in ${Date.now() - start}ms — ${others.length} candidates → ${results.length} matches`,
    );

    return results;
  }
}
