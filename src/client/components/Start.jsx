import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
 
const styles = (theme) => ({
  paperRoot: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginBottom: '10px',
    borderRadius: '15px',
  },
  textField: {
    marginRight: theme.spacing.unit,
    width: 240,
  },
  button: {
    margin: theme.spacing.unit,
    marginTop: '16px',
    height: '50px'
  }
});
 
class Start extends Component {
  render() {
    const { classes } = this.props;
 
    return (
      <div id='connect-area'>
        <Typography paragraph>
          ¡Bienvenido a Cartas contra la Humanidad! Si nunca lo has oído, es un juego en el que un jugador hace una pregunta de una Carta Negra, y todo el mundo responde con sus mejores Cartas Blancas. ¡Cuánto más raro, más risas!
        </Typography>
        <Typography paragraph>
          ¡Lo hemos modificado un poco para hacerlo más divertido: pueden jugar desde 3 personas!
        </Typography>
        <Paper className={classes.paperRoot} elevation={1}>
          <Typography style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Crea una partida o únete a la actual
          </Typography>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <TextField
              id="username"
              label="Nombre de usuario"
              className={classes.textField}
              value={this.props.username}
              onChange={this.props.handleUsernameChange}
              margin="normal"
              variant="outlined"
            />
            <Button variant="outlined" color="primary" className={classes.button} onClick={this.props.connect}>
              Jugar
            </Button>
          </div>
        </Paper>
      </div>
    );
  }
}
 
export default hot(withStyles(styles)(Start));