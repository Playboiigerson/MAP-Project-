/**
 * Colors used in the app, with a yellow and white theme.
 * Primary colors:
 * - Primary Yellow: #FFD700 (Gold)
 * - Secondary Yellow: #FFC107 (Amber)
 * - Accent Yellow: #FFEB3B (Yellow)
 * - Pure White: #FFFFFF
 * - Off White: #F9F9F9
 * - Text Dark: #333333
 * - Text Light: #666666
 */

// Primary colors for the new theme
const primaryYellow = '#FFD700'; // Gold
const secondaryYellow = '#FFC107'; // Amber
const accentYellow = '#FFEB3B'; // Yellow
const pureWhite = '#FFFFFF';
const offWhite = '#F9F9F9';
const textDark = '#333333';
const textLight = '#666666';

// Tint colors (primary action colors)
const tintColorLight = secondaryYellow;
const tintColorDark = accentYellow;

// Card and border colors
const cardColorLight = pureWhite;
const cardColorDark = '#333333'; // Dark gray for dark mode cards
const borderColorLight = '#EEEEEE';
const borderColorDark = '#444444'; // Medium gray for dark mode borders

export const Colors = {
  light: {
    text: textDark,
    background: offWhite,
    tint: primaryYellow,
    icon: secondaryYellow,
    tabIconDefault: textLight,
    tabIconSelected: primaryYellow,
    card: cardColorLight,
    border: borderColorLight,
    primary: primaryYellow,
    secondary: secondaryYellow,
    accent: accentYellow,
    adminBubble: primaryYellow, // Yellow for admin messages
    otherBubble: secondaryYellow, // Secondary yellow for other users' messages
    inputBackground: pureWhite,
    placeholderText: '#BBBBBB',
    highlight: '#FFF9C4', // Very light yellow for highlights
    shadow: 'rgba(0, 0, 0, 0.1)' // Shadow color
  },
  dark: {
    text: pureWhite,
    background: '#222222',
    tint: primaryYellow,
    icon: accentYellow,
    tabIconDefault: '#AAAAAA',
    tabIconSelected: primaryYellow,
    card: cardColorDark,
    border: borderColorDark,
    primary: primaryYellow,
    secondary: secondaryYellow,
    accent: accentYellow,
    adminBubble: primaryYellow, // Yellow for admin messages in dark mode
    otherBubble: secondaryYellow, // Secondary yellow for other users' messages in dark mode
    inputBackground: '#444444',
    placeholderText: '#888888',
    highlight: '#423F00', // Dark yellow for highlights
    shadow: 'rgba(0, 0, 0, 0.3)' // Shadow color for dark mode
  },
};
