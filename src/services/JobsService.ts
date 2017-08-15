import {Subject} from "rxjs/Subject";
import "rxjs/add/observable/fromEvent";
import {Job} from "../shell/Job";


export class JobsService {
    readonly onStart = new Subject<Job>();
    readonly onFinish = new Subject<Job>();
}
