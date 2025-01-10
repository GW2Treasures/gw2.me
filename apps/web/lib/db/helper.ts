export const notExpired = {
  OR: [
    { expiresAt: { gte: new Date() }},
    { expiresAt: null }
  ]
};
