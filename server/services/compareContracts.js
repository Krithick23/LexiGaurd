/**
 * Contract Version Comparison Service
 * Compares two analyzed contracts using semantic text token similarity,
 * identifies added, removed, modified, and unchanged clauses, and maps risk level trajectories.
 */

function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

function calculateJaccardSimilarity(textA, textB) {
  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

export function compareContractAnalyses(contractOriginal, contractRevised) {
  const originalClauses = contractOriginal.clauses || [];
  const revisedClauses = contractRevised.clauses || [];

  const matchedPairs = [];
  const usedRevisedIndices = new Set();
  const usedOriginalIndices = new Set();

  // Find best semantic matches between original and revised clauses
  originalClauses.forEach((orig, origIdx) => {
    let bestScore = 0;
    let bestRevisedIdx = -1;

    revisedClauses.forEach((rev, revIdx) => {
      if (usedRevisedIndices.has(revIdx)) return;

      const sim = calculateJaccardSimilarity(orig.text, rev.text);
      if (sim > bestScore) {
        bestScore = sim;
        bestRevisedIdx = revIdx;
      }
    });

    // Similarity threshold of 0.4 for meaningful clause alignment
    if (bestScore >= 0.35 && bestRevisedIdx !== -1) {
      usedOriginalIndices.add(origIdx);
      usedRevisedIndices.add(bestRevisedIdx);

      const rev = revisedClauses[bestRevisedIdx];
      let status = 'unchanged';

      if (bestScore < 0.88) {
        status = 'modified';
      }

      // Determine risk change
      const riskSeverity = { High: 3, Medium: 2, Low: 1 };
      const origSev = riskSeverity[orig.risk] || 1;
      const revSev = riskSeverity[rev.risk] || 1;

      let riskChange = 'unchanged';
      if (revSev < origSev) riskChange = 'improved';
      else if (revSev > origSev) riskChange = 'worsened';

      matchedPairs.push({
        status,
        similarity: Math.round(bestScore * 100),
        originalClause: orig,
        revisedClause: rev,
        riskChange,
      });
    }
  });

  // Identify Removed clauses (in original but not matched in revised)
  const removedClauses = [];
  originalClauses.forEach((orig, origIdx) => {
    if (!usedOriginalIndices.has(origIdx)) {
      removedClauses.push({
        status: 'removed',
        originalClause: orig,
        revisedClause: null,
        riskChange: orig.risk === 'Low' ? 'unchanged' : 'resolved_by_removal',
      });
    }
  });

  // Identify Added clauses (in revised but not matched in original)
  const addedClauses = [];
  revisedClauses.forEach((rev, revIdx) => {
    if (!usedRevisedIndices.has(revIdx)) {
      addedClauses.push({
        status: 'added',
        originalClause: null,
        revisedClause: rev,
        riskChange: rev.risk === 'Low' ? 'neutral_addition' : 'new_risk_introduced',
      });
    }
  });

  // Compute Resolved, Persistent, and New Red Flags
  const resolvedRisks = [];
  const persistentRisks = [];
  const newRisks = [];

  matchedPairs.forEach((item) => {
    const origRisk = item.originalClause.risk;
    const revRisk = item.revisedClause.risk;

    if ((origRisk === 'High' || origRisk === 'Medium') && revRisk === 'Low') {
      resolvedRisks.push({
        category: item.revisedClause.category || item.originalClause.category,
        reason: `Risk reduced from ${origRisk} to Low in: "${item.revisedClause.category || item.revisedClause.id}"`,
        revisedClauseId: item.revisedClause.id,
      });
    } else if (
      (origRisk === 'High' || origRisk === 'Medium') &&
      (revRisk === 'High' || revRisk === 'Medium')
    ) {
      persistentRisks.push({
        category: item.revisedClause.category,
        risk: revRisk,
        reason: `Risk persists at ${revRisk} severity: ${item.revisedClause.reason || 'Unfavorable terms remain'}`,
        revisedClauseId: item.revisedClause.id,
      });
    } else if (origRisk === 'Low' && (revRisk === 'High' || revRisk === 'Medium')) {
      newRisks.push({
        category: item.revisedClause.category,
        risk: revRisk,
        reason: `Risk escalated from Low to ${revRisk}: ${item.revisedClause.reason}`,
        revisedClauseId: item.revisedClause.id,
      });
    }
  });

  // Removed risky clauses count as resolved
  removedClauses.forEach((item) => {
    if (item.originalClause.risk === 'High' || item.originalClause.risk === 'Medium') {
      resolvedRisks.push({
        category: item.originalClause.category,
        reason: `Risky ${item.originalClause.risk} clause was eliminated from the agreement.`,
        originalClauseId: item.originalClause.id,
      });
    }
  });

  // Newly added risky clauses count as new risks
  addedClauses.forEach((item) => {
    if (item.revisedClause.risk === 'High' || item.revisedClause.risk === 'Medium') {
      newRisks.push({
        category: item.revisedClause.category,
        risk: item.revisedClause.risk,
        reason: `New ${item.revisedClause.risk} clause introduced: ${item.revisedClause.reason}`,
        revisedClauseId: item.revisedClause.id,
      });
    }
  });

  return {
    contractOriginal: {
      id: contractOriginal._id,
      fileName: contractOriginal.fileName,
      label: contractOriginal.label,
      overallRisk: contractOriginal.overallRisk,
      totalClauses: originalClauses.length,
      createdAt: contractOriginal.createdAt,
    },
    contractRevised: {
      id: contractRevised._id,
      fileName: contractRevised.fileName,
      label: contractRevised.label,
      overallRisk: contractRevised.overallRisk,
      totalClauses: revisedClauses.length,
      createdAt: contractRevised.createdAt,
    },
    metrics: {
      matchedCount: matchedPairs.length,
      modifiedCount: matchedPairs.filter((p) => p.status === 'modified').length,
      unchangedCount: matchedPairs.filter((p) => p.status === 'unchanged').length,
      addedCount: addedClauses.length,
      removedCount: removedClauses.length,
      resolvedRisksCount: resolvedRisks.length,
      persistentRisksCount: persistentRisks.length,
      newRisksCount: newRisks.length,
    },
    resolvedRisks,
    persistentRisks,
    newRisks,
    comparisons: [...matchedPairs, ...addedClauses, ...removedClauses],
  };
}
