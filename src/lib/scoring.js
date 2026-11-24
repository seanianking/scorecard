// Pure scoring logic (no DB access) so it is easy to test and reuse.
//
// Method:
//  - For each contestant and criterion, average the scores from every judge who scored it.
//  - A criterion contributes (average × weight) points out of (maxScore × weight) possible.
//  - Event and overall totals are sums of their criteria; percent = points / possible.
//  - A criterion nobody has scored yet contributes 0 points, so rankings are provisional until
//    `completeness` reaches 1.
//  - Contestants are ranked within their age group by total points; ties share a rank.

const round = (n, places = 2) => Math.round(n * 10 ** places) / 10 ** places;

export function computeResults({ events, contestants, scores, judgeCount }) {
  const criteria = events.flatMap((e) => e.criteria.map((c) => ({ ...c, eventId: e.id })));

  // contestantId -> criterionId -> number[]
  const byContestant = new Map();
  for (const s of scores) {
    if (!byContestant.has(s.contestantId)) byContestant.set(s.contestantId, new Map());
    const m = byContestant.get(s.contestantId);
    if (!m.has(s.criterionId)) m.set(s.criterionId, []);
    m.get(s.criterionId).push(s.value);
  }

  const expectedScores = criteria.length * judgeCount;

  const rows = contestants.map((contestant) => {
    const m = byContestant.get(contestant.id) ?? new Map();
    let totalPoints = 0;
    let totalPossible = 0;
    let entered = 0;

    const eventResults = events.map((event) => {
      let points = 0;
      let possible = 0;
      const criterionResults = event.criteria.map((c) => {
        const values = m.get(c.id) ?? [];
        entered += values.length;
        const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
        const p = (average ?? 0) * c.weight;
        points += p;
        possible += c.maxScore * c.weight;
        return {
          criterionId: c.id,
          name: c.name,
          maxScore: c.maxScore,
          weight: c.weight,
          average: average === null ? null : round(average),
          judgesScored: values.length,
        };
      });
      totalPoints += points;
      totalPossible += possible;
      return {
        eventId: event.id,
        name: event.name,
        points: round(points),
        possible: round(possible),
        percent: possible ? round((points / possible) * 100, 1) : 0,
        criteria: criterionResults,
      };
    });

    return {
      contestant,
      events: eventResults,
      totalPoints: round(totalPoints),
      totalPossible: round(totalPossible),
      percent: totalPossible ? round((totalPoints / totalPossible) * 100, 1) : 0,
      completeness: expectedScores ? Math.min(1, entered / expectedScores) : 0,
    };
  });

  // Rank within age group.
  const groups = new Map();
  for (const row of rows) {
    const key = row.contestant.ageGroupId ?? "none";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => b.totalPoints - a.totalPoints);
    list.forEach((row, i) => {
      row.rank = i > 0 && row.totalPoints === list[i - 1].totalPoints ? list[i - 1].rank : i + 1;
    });
  }

  return { rows, groups };
}
