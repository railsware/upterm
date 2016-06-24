interface PermittedGroups {
    owner: boolean;
    group: boolean;
    others: boolean;
}

interface Permissions {
    read: PermittedGroups;
    write: PermittedGroups;
    execute: PermittedGroups;
}

declare module "mode-to-permissions" {
    function modeToPermissions(mode: number): Permissions;
    namespace modeToPermissions {}
    export = modeToPermissions;
}
