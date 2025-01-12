-- Add scope "accounts" to all authorizations that have a scope starting with "gw2:"
UPDATE "Authorization" SET scope = array_append(scope, 'accounts') WHERE NOT ('accounts' = ANY(scope)) AND EXISTS (
    SELECT 1
    FROM unnest(scope) AS s
    WHERE s LIKE 'gw2:%'
);
