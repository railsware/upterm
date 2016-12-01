import * as React from "react";
import {colors} from "../views/css/colors";

/*
 =========================
 * React JSONTree
 * http://eskimospy.com/stuff/react/json/
 * Copyright 2014, David Vedder
 * MIT Licence
 =========================
 */

const listStyle = {
    padding: "2px 0",
    listStyleType: "none",
};

const labelStyle = {
    display: "inline-block",
    marginRight: "0.5em",
    color: colors.magenta,
};

const childrenCount = {
    WebkitUserSelect: "none",
    userSelect: "none",
    cursor: "default",
};

type JSONProps = {
    data: any,
    keyName?: any,
    key?: any,
    initialExpanded?: boolean,
};

type JSONState = {
    expanded?: any,
    createdChildNodes?: any,
};

type JSONValueProps = {
    value: any,
    keyName: any,
    key: any,
};

/**
 * Returns the type of an object as a string.
 *
 * @param obj Object The object you want to inspect
 * @return String The object's type
 */
let objType  = function (obj: any) {
    return Object.prototype.toString.call(obj).slice(8, -1);
};

/**
 * Creates a React JSON Viewer component for a key and it's associated data
 *
 * @param key String The JSON key (property name) for the node
 * @param value Mixed The associated data for the JSON key
 * @return Component The React Component for that node
 */
let grabNode = function (key: any, value: any): any {
    let nodeType = objType(value);
    let aKey = key + Date.now();
    if (nodeType === "Object") {
        return <JSONObjectNode data={value} keyName={key} key={aKey} />;
    } else if (nodeType === "Array") {
        return <JSONArrayNode data={value} keyName={key} key={aKey} />;
    } else if (nodeType === "String") {
        return <JSONStringNode keyName={key} value={value} key={aKey} />;
    } else if (nodeType === "Number") {
        return <JSONNumberNode keyName={key} value={value} key={aKey} />;
    } else if (nodeType === "Boolean") {
        return <JSONBooleanNode keyName={key} value={value} key={aKey} />;
    } else if (nodeType === "Null") {
        return <JSONNullNode keyName={key} value={value} key={aKey} />;
    } else {
        return <div>How did this happen? {nodeType}</div>;
    }
};

/**
 * Mixin for stopping events from propagating and collapsing our tree all
 * willy nilly.
 */
let squashClick = function (e: any) {
    e.stopPropagation();
};

/**
 * Array node class. If you have an array, this is what you should use to
 * display it.
 */
class JSONArrayNode extends React.Component<JSONProps, JSONState> {
    private itemString: boolean | string;
    private needsChildNodes: boolean | Array<any>;
    private renderedChildren: Array<any>;
    constructor(props: JSONProps) {
        super(props);

        this.renderedChildren = [];
        this.needsChildNodes = [];
        this.itemString = false;

        this.state = {
            expanded: props.initialExpanded,
            createdChildNodes: false,
        };

    }

    getDefaultProps() {
        return { data: [], initialExpanded: false };
    }

    componentWillReceiveProps() {
        // resets our caches and flags we need to build child nodes again
        this.renderedChildren = [];
        this.itemString = false;
        this.needsChildNodes = true;
    }
    /**
     * Returns the child nodes for each element in the array. If we have
     * generated them previously, we return from cache, otherwise we create
     * them.
     */
    getChildNodes() {
        let childNodes: Array<any> = [];
        if (this.state.expanded && this.needsChildNodes) {
            for (let i = 0; i < this.props.data.length; i += 1) {
                childNodes.push(grabNode(i, this.props.data[i]));
            }
            this.needsChildNodes = false;
            this.renderedChildren = childNodes;
        }
        return this.renderedChildren;
    }
    /**
     * Returns the "n Items" string for this node, generating and
     * caching it if it hasn't been created yet.
     */
    getItemString() {
        if (!this.itemString) {
            let lenWord = (this.props.data.length === 1) ? " Item" : " Items";
            this.itemString = this.props.data.length + lenWord;
        }
        return this.itemString;
    }
    render(): JSX.Element {
        let childNodes = this.getChildNodes();
        let childListStyle = {
            display: (this.state.expanded) ? "block" : "none",
        };
        let cls = "array jsonTreeParentNode";
        cls += (this.state.expanded) ? " expanded" : "";
        return <li style={listStyle} className={cls} onClick={e => {
            e.stopPropagation();
            this.setState({expanded: !this.state.expanded});
        }}>
            <label style={labelStyle}>{this.props.keyName}: </label>{"[...] "}
            <span style={childrenCount}>{this.getItemString()}</span>
            <ol style={childListStyle}>{childNodes}</ol>
        </li>;
    }
};

/**
 * Object node class. If you have an object, this is what you should use to
 * display it.
 */
class JSONObjectNode extends React.Component<JSONProps, any> {
    private itemString: boolean | string;
    private needsChildNodes: boolean | Array<any>;
    private renderedChildren: Array<any>;

    constructor(props: JSONProps) {
        super(props);
        this.renderedChildren = [];
        this.needsChildNodes = [];
        this.itemString = false;

        this.state = {
            expanded: props.initialExpanded,
            createdChildNodes: false,
        };
    }
    getDefaultProps() {
        return { data: [], initialExpanded: false };
    }

    componentWillReceiveProps() {
        // resets our caches and flags we need to build child nodes again
        this.renderedChildren = [];
        this.itemString = false;
        this.needsChildNodes = true;
    }
    /**
     * Returns the child nodes for each element in the object. If we have
     * generated them previously, we return from cache, otherwise we create
     * them.
     */
    getChildNodes() {
        if (this.state.expanded && this.needsChildNodes) {
            let obj = this.props.data;
            let childNodes: Array<any> = [];
            for (let k in obj) {
                if (obj.hasOwnProperty(k)) {
                    childNodes.push( grabNode(k, obj[k]));
                }
            }
            this.needsChildNodes = false;
            this.renderedChildren = childNodes;
        }
        return this.renderedChildren;
    }
    /**
     * Returns the "n Items" string for this node, generating and
     * caching it if it hasn't been created yet.
     */
    getItemString() {
        if (!this.itemString) {
            let obj = this.props.data;
            let len = 0;
            let lenWord = " Items";
            for (let k in obj) {
                if (obj.hasOwnProperty(k)) {
                    len += 1;
                }
            }
            if (len === 1) {
                lenWord = " Item";
            }
            this.itemString = len + lenWord;
        }
        return this.itemString;
    }

    render(): JSX.Element {
        let childListStyle = {
            display: (this.state.expanded) ? "block" : "none",
        };
        let cls = "object jsonTreeParentNode";
        cls += (this.state.expanded) ? " expanded" : "";
        return (
            <li style={listStyle} className={cls} onClick={e => {
                e.stopPropagation();
                this.setState({expanded: !this.state.expanded});
            }}>
                <label style={labelStyle}>{this.props.keyName}: </label>{"{...} "}
                <span style={childrenCount}>{this.getItemString()}</span>
                <ul style={childListStyle}>{this.getChildNodes()}</ul>
            </li>
        );
    }
};

/**
 * String node component
 */
class JSONStringNode extends React.Component<JSONValueProps, any> {
    render(): JSX.Element {
        return (
            <li style={listStyle} className="string" onClick={squashClick}>
                <label style={labelStyle}>{this.props.keyName}: </label>
                <span style={{color: colors.green}}>"{this.props.value}"</span>
            </li>
        );
    }
};

/**
 * Number node component
 */
class JSONNumberNode extends React.Component<JSONValueProps, any> {
    render(): JSX.Element {
        return (
            <li style={listStyle} className="" onClick={squashClick}>
                <label style={labelStyle}>{this.props.keyName}: </label>
                <span style={{color: colors.blue}}>{this.props.value}</span>
            </li>
        );
    }
};


/**
 * Null node component
 */
class JSONNullNode extends React.Component<JSONValueProps, any> {
    render(): JSX.Element {
        return (
            <li style={listStyle} className="" onClick={squashClick}>
                <label style={labelStyle}>{this.props.keyName}: </label>
                <span style={{color: colors.red}}>null</span>
            </li>
        );
    }
};

/**
 * Boolean node component
 */
class JSONBooleanNode extends React.Component<JSONValueProps, any> {
    render(): JSX.Element {
        let truthString = (this.props.value) ? "true" : "false";
        return <li style={listStyle} className={"boolean " + truthString} onClick={squashClick}>
            <label style={labelStyle}>{this.props.keyName}: </label>
            <span style={{color: colors.cyan}}>{truthString}</span>
        </li>;
    }
};

/**
 * JSONTree component. This is the 'viewer' base. Pass it a `data` prop and it
 * will render that data, or pass it a `source` URL prop and it will make
 * an XMLHttpRequest for said URL and render that when it loads the data.
 *
 * The first node it draws will be expanded by default.
 */
class JSONTree extends React.Component<JSONProps, any> {
    render(): JSX.Element {
        let nodeType = objType(this.props.data);
        let rootNode: JSX.Element;
        if (nodeType === "Object") {
            rootNode = <JSONObjectNode data={this.props.data} keyName="(root)" initialExpanded={true} />;
        } else if (nodeType === "Array") {
            rootNode = <JSONArrayNode data={this.props.data} initialExpanded={true} keyName="(root)" />;
        } else {
            return <span>How did you manage that?</span>;
        }
        return <ul>{rootNode}</ul>;
    }
};

export default JSONTree;
