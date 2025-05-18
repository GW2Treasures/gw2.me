package me.gw2.types.api;

import javax.annotation.Nullable;
import java.util.Optional;

public record AccountsResponse(Account[] accounts) {
    public record Account(
            String id,
            String name,
            Boolean shared,
            @Nullable Boolean verified,
            @Nullable String displayName
    ) {

        public Optional<Boolean> verifiedOptional() {
            return Optional.ofNullable(verified());
        }

        public Optional<String> displayNameOptional() {
            return Optional.ofNullable(displayName());
        }

        /**
         * Get the display name for this account or fallback to the account name.
         * @return account name for display
         */
        public String getDisplayName() {
            return displayNameOptional().orElse(name);
        }
    }
}
