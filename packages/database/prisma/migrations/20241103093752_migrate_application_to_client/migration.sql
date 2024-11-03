INSERT INTO "Client"
    SELECT
        "clientId" as "id",
        "type",
        "clientSecret" as "secret",
        "callbackUrls" as "callbackUrls",
        "id" as "applicationId"
    FROM "Application";
