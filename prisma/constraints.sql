CREATE INDEX IF NOT EXISTS perfumes_embedding_hnsw_idx
  ON "perfumes" USING hnsw ("embedding" vector_cosine_ops);

ALTER TABLE "reviews" ADD CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE "reviews" ADD CONSTRAINT longevity_range CHECK (longevity IS NULL OR (longevity >= 0 AND longevity <= 10));
ALTER TABLE "reviews" ADD CONSTRAINT projection_range CHECK (projection IS NULL OR (projection >= 0 AND projection <= 10));
ALTER TABLE "reviews" ADD CONSTRAINT sillage_range CHECK (sillage IS NULL OR (sillage >= 0 AND sillage <= 10));
ALTER TABLE "alternatives" ADD CONSTRAINT similarity_score_range CHECK (similarity_score >= 0 AND similarity_score <= 100);
ALTER TABLE "alternatives" ADD CONSTRAINT no_self_alternative CHECK (original_id <> alternative_id);
