/** @jsx React.DOM */

/*
 =========================
 * React JSONTree
 * http://eskimospy.com/stuff/react/json/
 * Copyright 2014, David Vedder
 * MIT Licence
 =========================
 */

/**
 * Creates a React JSON Viewer component for a key and it's associated data
 *
 * @param key String The JSON key (property name) for the node
 * @param value Mixed The associated data for the JSON key
 * @return Component The React Component for that node
 */
var grabNode = function (key, value) {
    var nodeType = objType(value);
    var theNode;
    var aKey = key + Date.now();
    if (nodeType === 'Object') {
        theNode = React.createElement(JSONObjectNode, {data: value, keyName: key, key: aKey})
    } else if (nodeType === 'Array') {
        theNode = React.createElement(JSONArrayNode, {data: value, keyName: key, key: aKey})
    } else if (nodeType === 'String') {
        theNode = React.createElement(JSONStringNode, {keyName: key, value: value, key: aKey})
    } else if (nodeType === 'Number') {
        theNode = React.createElement(JSONNumberNode, {keyName: key, value: value, key: aKey})
    } else if (nodeType === 'Boolean') {
        theNode = React.createElement(JSONBooleanNode, {keyName: key, value: value, key: aKey})
    } else if (nodeType === 'Null') {
        theNode = React.createElement(JSONNullNode, {keyName: key, value: value, key: aKey})
    } else {
        console.error("How did this happen?", nodeType);
    }
    return theNode;
};

/**
 * Returns the type of an object as a string.
 *
 * @param obj Object The object you want to inspect
 * @return String The object's type
 */
var objType  = function (obj) {
    var className = Object.prototype.toString.call(obj).slice(8, -1);
    return className;
}

/**
 * Mixin for stopping events from propagating and collapsing our tree all
 * willy nilly.
 */
var SquashClickEventMixin = {
    handleClick: function (e) {
        e.stopPropagation();
    }
};

/**
 * Mixin for setting intial props and state and handling clicks on
 * nodes that can be expanded.
 */
var ExpandedStateHandlerMixin = {
    getDefaultProps: function () {
        return {data:[], initialExpanded: false};
    },
    getInitialState: function () {
        return {
            expanded: this.props.initialExpanded,
            createdChildNodes: false
        };
    },
    handleClick: function (e) {
        e.stopPropagation();
        this.setState({expanded: !this.state.expanded});
    },
    componentWillReceiveProps: function () {
        // resets our caches and flags we need to build child nodes again
        this.renderedChildren = [];
        this.itemString = false
        this.needsChildNodes= true;
    }
};


/**
 * Array node class. If you have an array, this is what you should use to
 * display it.
 */
var JSONArrayNode = React.createClass({displayName: 'JSONArrayNode',
    mixins: [ExpandedStateHandlerMixin],
    /**
     * Returns the child nodes for each element in the array. If we have
     * generated them previously, we return from cache, otherwise we create
     * them.
     */
    getChildNodes: function () {
        var childNodes = [];
        if (this.state.expanded && this.needsChildNodes) {
            for (var i = 0; i < this.props.data.length; i += 1) {
                childNodes.push( grabNode(i, this.props.data[i]));
            }
            this.needsChildNodes = false;
            this.renderedChildren = childNodes;
        }
        return this.renderedChildren;
    },
    /**
     * flag to see if we still need to render our child nodes
     */
    needsChildNodes: true,
    /**
     * cache store for our child nodes
     */
    renderedChildren: [],
    /**
     * cache store for the number of items string we display
     */
    itemString: false,
    /**
     * Returns the "n Items" string for this node, generating and
     * caching it if it hasn't been created yet.
     */
    getItemString: function () {
        if (!this.itemString) {
            var lenWord = (this.props.data.length === 1) ? ' Item' : ' Items';
            this.itemString = this.props.data.length + lenWord;
        }
        return this.itemString;
    },
    render: function () {
        var childNodes = this.getChildNodes();
        var childListStyle = {
            display: (this.state.expanded) ? 'block' : 'none'
        };
        var cls = "array parentNode";
        cls += (this.state.expanded) ? " expanded" : '';
        return (
            React.DOM.li({className: cls, onClick: this.handleClick},
                React.DOM.label(null, this.props.keyName, ":"),
                React.DOM.span({className: 'children-count'}, this.getItemString()),
                React.DOM.ol({style: childListStyle},
                    childNodes
                )
            )
        );
    }
});

/**
 * Object node class. If you have an object, this is what you should use to
 * display it.
 */
var JSONObjectNode = React.createClass({displayName: 'JSONObjectNode',
    mixins: [ExpandedStateHandlerMixin],
    /**
     * Returns the child nodes for each element in the object. If we have
     * generated them previously, we return from cache, otherwise we create
     * them.
     */
    getChildNodes: function () {
        if (this.state.expanded && this.needsChildNodes) {
            var obj = this.props.data;
            var childNodes = [];
            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    childNodes.push( grabNode(k, obj[k]));
                }
            }
            this.needsChildNodes = false;
            this.renderedChildren = childNodes;
        }
        return this.renderedChildren;
    },
    /**
     * Returns the "n Items" string for this node, generating and
     * caching it if it hasn't been created yet.
     */
    getItemString: function () {
        if (!this.itemString) {
            var obj = this.props.data;
            var len = 0;
            var lenWord = ' Items';
            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    len += 1;
                }
            }
            if (len === 1) {
                lenWord = ' Item';
            }
            this.itemString = len + lenWord
        }
        return this.itemString;
    },
    /**
     * cache store for the number of items string we display
     */
    itemString: false,
    /**
     * flag to see if we still need to render our child nodes
     */
    needsChildNodes: true,
    /**
     * cache store for our child nodes
     */
    renderedChildren: [],
    render: function () {
        var childListStyle = {
            display: (this.state.expanded) ? 'block' : 'none'
        };
        var cls = "object parentNode";
        cls += (this.state.expanded) ? " expanded" : '';
        return (
            React.DOM.li({className: cls, onClick: this.handleClick},
                React.DOM.label(null, this.props.keyName, ":"),
                React.DOM.span({className: 'children-count'}, this.getItemString()),
                React.DOM.ul({style: childListStyle},
                    this.getChildNodes()
                )
            )
        );
    }
});

/**
 * String node component
 */
var JSONStringNode = React.createClass({displayName: 'JSONStringNode',
    mixins: [SquashClickEventMixin],
    render: function () {
        return (
            React.DOM.li({className: "string itemNode", onClick: this.handleClick},
                React.DOM.label(null, this.props.keyName, ":"),
                React.DOM.span(null, this.props.value)
            )
        );
    }
});

/**
 * Number node component
 */
var JSONNumberNode = React.createClass({displayName: 'JSONNumberNode',
    mixins: [SquashClickEventMixin],
    render: function () {
        return (
            React.DOM.li({className: "number itemNode", onClick: this.handleClick},
                React.DOM.label(null, this.props.keyName, ":"),
                React.DOM.span(null, this.props.value)
            )
        );
    }
});


/**
 * Null node component
 */
var JSONNullNode = React.createClass({displayName: 'JSONNullNode',
    mixins: [SquashClickEventMixin],
    render: function () {
        return (
            React.DOM.li({className: "null itemNode", onClick: this.handleClick},
                React.DOM.label(null, this.props.keyName, ":"),
                React.DOM.span(null, "null")
            )
        );
    }
});

/**
 * Boolean node component
 */
var JSONBooleanNode = React.createClass({displayName: 'JSONBooleanNode',
    mixins: [SquashClickEventMixin],
    render: function () {
        var truthString = (this.props.value) ? 'true' : 'false';
        return (
            React.DOM.li({className: "boolean itemNode " + truthString, onClick: this.handleClick},
                React.DOM.label(null, this.props.keyName, ":"),
                React.DOM.span(null, truthString)
            )
        );
    }
});

/**
 * JSONTree component. This is the 'viewer' base. Pass it a `data` prop and it
 * will render that data, or pass it a `source` URL prop and it will make
 * an XMLHttpRequest for said URL and render that when it loads the data.
 *
 * You can load new data into it by either changing the `data` prop or calling
 * `loadDataFromURL()` on an instance.
 *
 * The first node it draws will be expanded by default.
 */
var JSONTree = React.createClass({displayName: 'JSONTree',
    getDefaultProps: function () {
        return {source: false};
    },
    /**
     * Will try and load data from the given URL and display it
     */
    loadDataFromURL: function (url) {
        var self = this;
        request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400){
                jsonData = JSON.parse(request.responseText);
                self.setProps({
                    data: jsonData
                });
            } else {
                console.error("OH NO! Your request was bad.");
            }
        };
        request.onerror = function() {
            console.error("Connection error");
        };
        request.send();
    },
    componentDidMount: function() {
        if (this.props.source) {
            this.loadDataFromURL(this.props.source);
        }
    },
    render: function() {
        var nodeType = objType(this.props.data);
        var rootNode;
        if (nodeType === 'Object') {
            rootNode = React.createElement(JSONObjectNode, {data: this.props.data, keyName: "(root)", initialExpanded: true})
        } else if (nodeType === 'Array') {
            rootNode = React.createElement(JSONArrayNode, {data: this.props.data, initialExpanded: true, keyName: "(root)"})
        } else {
            console.error("How did you manage that?");
        }
        return (
            React.DOM.ul({className: "json-tree"},
                rootNode
            )
        );
    }
});
