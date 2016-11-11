import * as React from "react";
import {colors} from "../../views/css/colors";

const buttonStyles = {
  borderColor: colors.blue,
  borderStyle: "solid",
  borderRadius: "4px",
  borderWidth: "1px",
  padding: "2px",
  color: colors.blue,
  WebkitUserSelect: "none",
  fontSize: "10px",
  margin: "4px",
  cursor: "pointer",
};

type ButtonProps = {
  onClick: () => void;
  children?: React.ReactElement<any>;
};

const Button = ({ onClick, children} : ButtonProps) => <span
  style={buttonStyles}
  onClick={onClick}
>{children}</span>;

export default Button;
