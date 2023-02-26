/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.raw(`
        CREATE VIEW follow_local_trusts AS (
            SELECT
                follower AS i,
                following AS j,
                1 AS v
            FROM profile_follows
        );
        CREATE MATERIALIZED VIEW comment_local_trusts AS (
            SELECT comments.profile_id AS i,
                   comments.to_profile_id AS j,
                   count(*) AS v
            FROM comments
            WHERE comments.profile_id <> comments.to_profile_id
            GROUP BY comments.profile_id, comments.to_profile_id
        );
        CREATE INDEX comment_local_trusts_i_j_idx ON comment_local_trusts (i, j);
        CREATE INDEX comment_local_trusts_j_i_idx ON comment_local_trusts (j, i);
        CREATE MATERIALIZED VIEW mirror_local_trusts AS (
            SELECT mirrors.profile_id AS i,
                   mirrors.to_profile_id AS j,
                   count(*) AS v
            FROM mirrors
            WHERE mirrors.profile_id <> mirrors.to_profile_id
            GROUP BY mirrors.profile_id, mirrors.to_profile_id
        );
        CREATE INDEX mirror_local_trusts_i_j_idx ON mirror_local_trusts (i, j);
        CREATE INDEX mirror_local_trusts_j_i_idx ON mirror_local_trusts (j, i);
    `)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropMaterializedViewIfExists('mirror_local_trusts')
        .dropMaterializedViewIfExists('comment_local_trusts')
        .dropViewIfExists('follow_local_trusts')
};
