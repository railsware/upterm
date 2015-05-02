/// <reference path="references.ts" />

module BlackScreen {
    export enum Status {
        NotStarted = <Status><any>'not-started',
        InProgress = <Status><any>'in-progress',
        Failure = <Status><any>'failure',
        Success = <Status><any>'success',
    }
}
