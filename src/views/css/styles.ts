import {Weight, Brightness, Color} from "../../Enums";
import {colors, colorValue, textColor} from "./colors";
import {darken, failurize, lighten} from "./functions";
import {Attributes} from "../../Interfaces";
import {services} from "../../services/index";

const jobBackgroundColor = colors.black;
const backgroundColor = darken(jobBackgroundColor, 4);
export const contentPadding = 10;

export const application = () => ({
    "--font-size": `${services.font.size}px`,
    "--font-family": services.font.family,
    "--letter-width": `${services.font.letterWidth}px`,
    "--letter-height": `${services.font.letterHeight}px`,
    "--content-padding": `${contentPadding}px`,
    "--search-input-color": lighten(backgroundColor, 15),
    "--background-color": backgroundColor,
    "--job-background-color": jobBackgroundColor,
    "--failed-job-background-color": failurize(jobBackgroundColor),
    "--text-color": textColor,

    "--black-color": colors.black,
    "--red-color": colors.red,
    "--white-color": colors.white,
    "--green-color": colors.green,
    "--yellow-color": colors.yellow,
    "--blue-color": colors.blue,
    "--magenta-color": colors.magenta,
    "--cyan-color": colors.cyan,
});

export const charGroup = (attributes: Attributes) => {
    const styles: any = {
        color: colorValue(attributes.color, {isBright: attributes.brightness === Brightness.Bright}),
        backgroundColor: colorValue(attributes.backgroundColor, {isBright: false}),
    };

    if (attributes.inverse) {
        const color = styles.color;

        styles.color = styles.backgroundColor;
        styles.backgroundColor = color;
    }

    if (attributes.underline) {
        styles.textDecoration = "underline";
    }

    if (attributes.weight === Weight.Bold) {
        styles.fontWeight = "bold";
    }

    // Remove default colors to allow CSS override for failed commands and reverse mode.
    if (attributes.color === Color.White && !attributes.inverse) {
        delete styles.color;
    }
    if (attributes.backgroundColor === Color.Black && !attributes.inverse) {
        delete styles.backgroundColor;
    }

    return styles;
};
