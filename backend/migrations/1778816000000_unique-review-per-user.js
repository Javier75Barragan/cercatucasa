/**
 * Migración: unique-review-per-user
 * Propósito: Impedir que un usuario califique al mismo vendedor más de una vez.
 * Hallazgo auditoría 2026-05-07 — Prioridad 1.
 */

exports.up = (pgm) => {
  // Eliminar duplicados existentes antes de aplicar el constraint
  // Conserva la reseña más reciente por par (vendor_id, user_id)
  pgm.sql(`
    DELETE FROM reviews
    WHERE id NOT IN (
      SELECT DISTINCT ON (vendor_id, user_id) id
      FROM reviews
      ORDER BY vendor_id, user_id, created_at DESC
    )
  `);

  // Crear constraint unique
  pgm.addConstraint('reviews', 'reviews_vendor_user_unique', {
    unique: ['vendor_id', 'user_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('reviews', 'reviews_vendor_user_unique');
};
