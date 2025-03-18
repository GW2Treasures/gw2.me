-- Create "ApplicationGrant" for existing "Authorization"
INSERT INTO "ApplicationGrant"
    SELECT DISTINCT ON ("userId", "clientId")
        gen_random_uuid() as "id",
        a."userId",
        c."applicationId",
        a."scope",
        a."emailId",
        a."createdAt",
        a."updatedAt"
    FROM "Authorization" a
    JOIN "Client" c ON c.id = "clientId"
    WHERE a."type" IN ('RefreshToken', 'AccessToken');


-- Migrate "_accountAuthorization" to "_applicationGrants"
INSERT INTO "_applicationGrants"
    SELECT DISTINCT ON (aa."A", a."userId", c."applicationId")
        "A",
        (SELECT g.id FROM "ApplicationGrant" g WHERE g."applicationId" = c."applicationId" AND g."userId" = a."userId") AS "B"
    FROM "_accountAuthorization" aa
    JOIN "Authorization" a ON a.id = aa."B"
    JOIN "Client" c ON c.id = a."clientId";
