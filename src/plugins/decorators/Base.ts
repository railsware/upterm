import Job from '../../Job';

abstract class Base {
    constructor(protected job: Job) {
    }

    abstract isApplicable(): boolean;

    abstract decorate(): any;

    /**
     * @note Returning `true` from this method
     *       will result in rendering performance
     *       decrease because the output will be
     *       re-decorated after each data chunk.
     */
    shouldDecorateRunningPrograms(): boolean {
        return false;
    }
}
export default Base;
