/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.raw(`
        CREATE TABLE localtrust_strategies
        (
            name        text PRIMARY KEY,
            description text NOT NULL DEFAULT ''
        );
        INSERT INTO localtrust_strategies (name)
        SELECT DISTINCT localtrust
        FROM strategies;
        CREATE TABLE localtrust_weights
        (
            name    text PRIMARY KEY REFERENCES localtrust_strategies,
            follow  integer NOT NULL,
            comment integer NOT NULL,
            mirror  integer NOT NULL
        );
        INSERT INTO localtrust_weights (name, follow, comment, mirror)
        VALUES ('existingConnections', 1, 0, 0),
               ('c5m8enhancedConnections', 1, 5, 8);
        CREATE VIEW weighted_localtrust_source AS
        SELECT localtrust_weights.name,
               i,
               j,
               COALESCE(follow_local_trusts.v, 0) * localtrust_weights.follow +
               COALESCE(comment_local_trusts.v, 0) * localtrust_weights.comment +
               COALESCE(mirror_local_trusts.v, 0) * localtrust_weights.mirror AS v
        FROM localtrust_weights
                 CROSS JOIN follow_local_trusts
                 FULL JOIN comment_local_trusts USING (i, j)
                 FULL JOIN mirror_local_trusts USING (i, j);
        CREATE MATERIALIZED VIEW weighted_localtrust AS
        SELECT name, i, j, v / sum(v) OVER (PARTITION BY name, i) AS v
        FROM weighted_localtrust_source;
        CREATE INDEX weighted_localtrust_name_i_j_idx ON weighted_localtrust (name, i, j);
        CREATE INDEX weighted_localtrust_name_j_i_idx ON weighted_localtrust (name, j, i);
    `)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropMaterializedViewIfExists('weighted_localtrust')
        .dropViewIfExists('weighted_localtrust_source')
        .dropTableIfExists('localtrust_weights')
        .dropTableIfExists('localtrust_strategies')
};
