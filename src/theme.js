import { unstable_createMuiStrictModeTheme as createMuiTheme } from '@material-ui/core';

const theme = createMuiTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#0d47a1',
    },
    secondary: {
      main: '#90756d',
    },
  },
  typography: {
    fontFamily: [
      '"Secular One"', 
      "sans-serif",
    ],
  }
});
export default theme