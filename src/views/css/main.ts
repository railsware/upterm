export namespace css {
    const inactiveJobs = {
        pointerEvents: "none",
    };

    const commonJobs = {
        marginBottom: 40,
    };

    export const jobs = (isSessionActive: boolean) =>
        isSessionActive ? commonJobs : Object.assign({}, commonJobs, inactiveJobs);
}
