import * as React from "react";
import * as css from "./css/main";

interface MenuItemProps {
    suggestion: string;
    onHover: () => void;
    onClick: () => void;
    isHighlighted: boolean;
}

const MenuItem = ({suggestion, onHover, onClick, isHighlighted}: MenuItemProps) =>
    <li
        style={css.autocomplete.item(isHighlighted)}
        onMouseOver={onHover}
        onClick={onClick}
    >
        <span>{suggestion}</span>
    </li>;

export interface MenuItemData {
    text: string;
    action: () => void;
};

interface Props {
    offsetTop: number;
    menuItems: MenuItemData[];
    highlightedIndex: number;
    hide: () => void;
}

interface State {
    highlightedIndex: number;
}

export class FloatingMenu extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            highlightedIndex: -1,
        };
    }

    render() {
        const suggestionViews = this.props.menuItems.map((item, index) => <MenuItem
            suggestion={item.text}
            onHover={() => this.setState({highlightedIndex: index})}
            onClick={() => {
                item.action();
                this.props.hide();
            }}
            key={index}
            isHighlighted={index === this.state.highlightedIndex}
        />);

        return (
            <div style={css.floatingMenu.box(this.props.offsetTop)}>
                <ul style={css.autocomplete.suggestionsList}>{suggestionViews}</ul>
            </div>
        );
    }
}
