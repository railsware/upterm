import * as React from "react";
import {FloatingMenu} from "./FloatingMenu";
import DecorationToggleComponent from "./DecorationToggleComponent";
import {stopBubblingUp} from "./ViewUtils";
import {Job} from "../shell/Job";
import Button from "../plugins/autocompletion_utils/Button";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {Status} from "../Enums";

interface Props {
    job: Job;
    decorateToggler: () => void;
    isDecorated: boolean;
    showDecorationToggle: boolean;
}

interface State {
    offsetTop: number;
    isSticky: boolean;
    showJobMenu: boolean;
}


// TODO: Make sure we only update the view when the model changes.
export class JobHeaderComponent extends React.Component<Props, State> {
    private intersectionObserver = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            const nearTop = entry.boundingClientRect.top < 50;
            const isVisible = entry.intersectionRatio === 1;

            this.setState({...this.state, isSticky: nearTop && !isVisible});
        },
        {
            threshold: 1,
            rootMargin: css.toDOMString(css.promptWrapperHeight),
        },
    );

    /* tslint:disable:member-ordering */
    constructor(props: Props) {
        super(props);

        this.state = {
            offsetTop: 0,
            isSticky: false,
            showJobMenu: false,
        };
    }

    componentDidMount() {
        this.intersectionObserver.observe(this.placeholderNode);
    }

    componentWillUnmount() {
        this.intersectionObserver.unobserve(this.placeholderNode);
        this.intersectionObserver.disconnect();
    }

    render() {
        // FIXME: write better types.
        let decorationToggle: any;
        let scrollToTop: any;
        let jobMenuButton: any;

        if (this.props.showDecorationToggle) {
            decorationToggle = <DecorationToggleComponent
                decorateToggler={this.props.decorateToggler}
                isDecorated={this.props.isDecorated}
            />;
        }

        if (this.state.isSticky) {
            scrollToTop = <span
                style={css.action}
                title="Scroll to beginning of output."
                onClick={this.handleScrollToTop.bind(this)}
            >
                {fontAwesome.longArrowUp}
            </span>;
        }

        jobMenuButton = <span style={{transform: "translateY(-1px)"}} className="jobMenu">
            <Button
                onClick={() => this.setState({showJobMenu: !this.state.showJobMenu} as State)}
            >•••</Button>
        </span>;

        return <div className="job-header" ref="placeholder" id={this.props.job.id.toString()} style={css.promptPlaceholder}>
            <div style={css.promptWrapper(this.state.isSticky, this.props.job.status)}>
                <div style={css.arrow(this.props.job.status)}>
                    <div style={css.arrowInner(this.props.job.status)} />
                </div>
                <div
                    style={css.promptInfo(this.props.job.status)}
                    title={JSON.stringify(this.props.job.status)}
                >
                    {this.props.job.status === Status.Interrupted ? fontAwesome.close : ""}
                </div>
                <div
                    style={css.prompt(this.state.isSticky)}
                    type="text"
                >
                    {this.props.job.prompt.value}
                    </div>
                <div style={css.actions}>
                    {decorationToggle}
                    {scrollToTop}
                    {this.props.job.isInProgress() ? jobMenuButton : undefined}
                </div>
                {this.state.showJobMenu ? <FloatingMenu
                    highlightedIndex={0}
                    menuItems={[{
                        text: "Send SIGKILL",
                        action: () => this.props.job.sendSignal("SIGKILL"),
                    }, {
                        text: "Send SIGTERM",
                        action: () => this.props.job.sendSignal("SIGTERM"),
                    }]}
                    hide={() => this.setState({ showJobMenu: false } as any)}
                    offsetTop={this.state.offsetTop}
                /> : undefined}
            </div>
        </div>;
    }

    scrollIntoView(): void {
        this.placeholderNode.scrollIntoView(true);
    }

    private get placeholderNode(): Element {
        /* tslint:disable:no-string-literal */
        return this.refs["placeholder"] as Element;
    }

    private handleScrollToTop(event: Event) {
        stopBubblingUp(event);

        document.location.href = `#${this.props.job.id}`;
    }
}
