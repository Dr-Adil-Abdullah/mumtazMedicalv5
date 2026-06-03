function numberValue(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function getLoyaltyThresholds(settings = {}) {
  const silver = Math.max(1, Math.floor(numberValue(settings.loyalty_silver_at, 100)));
  const gold = Math.max(silver + 1, Math.floor(numberValue(settings.loyalty_gold_at, 500)));
  const platinum = Math.max(gold + 1, Math.floor(numberValue(settings.loyalty_platinum_at, 2000)));

  return {
    bronze: 0,
    silver,
    gold,
    platinum
  };
}

export function getLoyaltyStage(points = 0, settings = {}) {
  const totalPoints = Math.max(0, Math.floor(numberValue(points)));
  const thresholds = getLoyaltyThresholds(settings);

  if (totalPoints >= thresholds.platinum) {
    return { id: 'platinum', label: 'Platinum', icon: '💎', minPoints: thresholds.platinum, nextMinPoints: null };
  }

  if (totalPoints >= thresholds.gold) {
    return { id: 'gold', label: 'Gold', icon: '🥇', minPoints: thresholds.gold, nextMinPoints: thresholds.platinum };
  }

  if (totalPoints >= thresholds.silver) {
    return { id: 'silver', label: 'Silver', icon: '⭐', minPoints: thresholds.silver, nextMinPoints: thresholds.gold };
  }

  return { id: 'bronze', label: 'Bronze', icon: '🥉', minPoints: thresholds.bronze, nextMinPoints: thresholds.silver };
}

export function getPointsToNextStage(points = 0, settings = {}) {
  const stage = getLoyaltyStage(points, settings);
  if (!stage.nextMinPoints) return 0;
  return Math.max(0, stage.nextMinPoints - Math.max(0, Math.floor(numberValue(points))));
}

export function getLoyaltyProgress(points = 0, settings = {}) {
  const stage = getLoyaltyStage(points, settings);
  if (!stage.nextMinPoints) return 100;

  const current = Math.max(0, Math.floor(numberValue(points)));
  const span = Math.max(1, stage.nextMinPoints - stage.minPoints);
  return Math.max(0, Math.min(100, ((current - stage.minPoints) / span) * 100));
}

export function calculateLoyaltyPointsEarned({ saleTotal = 0, paymentMode = 'cash', settings = {} }) {
  if (!settings?.loyalty_enabled) return 0;
  if (paymentMode !== 'cash') return 0;

  const rate = numberValue(settings.loyalty_points_rate, 0);
  if (rate <= 0) return 0;

  return Math.max(0, Math.floor(numberValue(saleTotal) * rate));
}

export function calculateLoyaltyRedeemValue(points = 0, settings = {}) {
  const redeemRate = numberValue(settings.loyalty_redeem_rate, 0);
  if (redeemRate <= 0) return 0;
  return Math.max(0, numberValue(points) * redeemRate);
}
