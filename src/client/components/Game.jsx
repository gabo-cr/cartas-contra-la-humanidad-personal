import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { Typography } from '@material-ui/core';
import Fab from '@material-ui/core/Fab';
import SettingsIcon from '@material-ui/icons/Settings';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import WarningIcon from '@material-ui/icons/Warning';
import Slide from '@material-ui/core/Slide';
import TheActualGame from './TheActualGame';

function Transition(props) {
  return <Slide direction='up' {...props} />;
}

const styles = (theme) => ({
  button: {
    marginTop: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2
  },
  list: {
    width: 250
  },
  formRoot: {
    margin: theme.spacing.unit,
    minWidth: 120
  }
});

class Game extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      adminPanelOpen: false,
      jsonDialog: false,
      customDeck: null
    };
  }
  copyCode = (code) => () => {
    var tempInput = document.createElement("input");
    tempInput.style = "position: absolute; left: -1000px; top: -1000px";
    tempInput.value = code;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    var copied = document.getElementById('copied');
    copied.style = "display: inline";
  }
  toggleAdminPanel = (open) => () => {
    this.setState({ adminPanelOpen: open });
  }
  openDialog = () => {
    this.setState({ jsonDialog: true });
  }
  closeDialog = () => {
    this.setState({ jsonDialog: false });
  }
  chooseFile = (event) => {
    this.setState({ customDeck: event.target.files[0] });
  }
  closeAndSubmitFile = () => {
    if(this.state.customDeck) {
      this.props.newCustomDeck(this.state.customDeck)();
      this.setState({
        jsonDialog: false,
        customDeck: null
      });

      // Clear the file from the file select.
      document.getElementById('jsonFileSelect').value = '';
    }else {
      this.closeDialog();
    }
  }

  render() {
    const { classes, username, game, start, playCard, czarPick, nextRound, kill, decks, toggleDeck, toggleAllDecks } = this.props;

    const clientIndex = game.players.indexOf(game.players.find((player) => {
      return username === player.username;
    }));

    return (
      <div id='game-area'>
        {
          !game.started
            ? <>
                <Button 
                  variant='contained' 
                  color='primary' 
                  className={classes.button} 
                  style={{ marginTop: '35px' }} 
                  onClick={start}
                  disabled={username !== game.players[0].username || game.players.length < 3}
                  >
                    Empezar con {game.players.length} jugadores 
                    {game.players.length < 3 && ' (Se necesitan al menos 3 jugadores)'}
                </Button>

                {/*
                <Typography variant='h4' style={{ marginTop: '20px' }}>Selecciona barajas a usar</Typography>
                <Button variant='outlined' color='primary' className={classes.button} onClick={toggleAllDecks} disabled={username !== game.players[0].username}>Alternar todas</Button>

                <Typography variant='h5'>Oficiales</Typography>
                <FormGroup row>
                  {
                    decks.filter((deck) => deck.official).map((deck, index) => {
                      const codeName = deck.codeName;
                      const deckIndex = decks.findIndex((deck) => {
                        return deck.codeName === codeName;
                      });

                      return (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={decks[deckIndex].selected}
                              onChange={toggleDeck(codeName)}
                              value='codeName'
                              color='primary'
                              disabled={clientIndex !== 0 || deck.codeName === 'CAH-es-set'}
                            />
                          }
                          label={deck.name}
                          key={index}
                        />
                      );
                    })
                  }
                </FormGroup>
                <Typography variant='h5'>No oficiales</Typography>
                <Typography paragraph>A) barajas encontradas en <a href='https://crhallberg.com/cah/' target='_blank' rel='noreferrer noopener'>JSON Against Humanity</a>,
                  y B) barajas hechas por el equipo de desarrollo original, sus amigos o equipos de desarrollo posteriores.
                </Typography>
                <FormGroup row>
                  {
                    decks.filter((deck) => !deck.official && !deck.custom).map((deck, index) => {
                      const codeName = deck.codeName;
                      const deckIndex = decks.findIndex((deck) => {
                        return deck.codeName === codeName;
                      });

                      return (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={decks[deckIndex].selected}
                              onChange={toggleDeck(codeName)}
                              value='codeName'
                              color='primary'
                              disabled={clientIndex !== 0}
                            />
                          }
                          label={deck.name}
                          key={index}
                        />
                      );
                    })
                  }
                </FormGroup>
                <Typography variant='h5'>Personalizadas</Typography>
                <Typography paragraph>¡Importa tus propios archivos JSON para jugar con las cartas que TÚ quieres!</Typography>
                <FormGroup row>
                  <Button variant='outlined' color='primary' className={classes.button} disabled={clientIndex !== 0} onClick={this.openDialog}>Importar JSON</Button>
                  {
                    decks.filter((deck) => deck.custom).map((deck, index) => {
                      const codeName = deck.codeName;
                      const deckIndex = decks.findIndex((deck) => {
                        return deck.codeName === codeName;
                      });

                      return (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={decks[deckIndex].selected}
                              onChange={toggleDeck(codeName)}
                              value='codeName'
                              color='primary'
                              disabled={clientIndex !== 0}
                            />
                          }
                          label={deck.name}
                          key={index}
                        />
                      );
                    })
                  }
                </FormGroup>
                */}

                <Typography variant='h4' style={{ marginTop: '20px' }} onClick={this.openDialog}>Jugadores conectados</Typography>
                <ul>
                  {
                    game.players.map((player, index) => {
                      return (
                        <li key={index}>
                          <Typography>{
                            player.username === username
                              ? <strong>{player.username} (Tú)</strong>
                              : player.username
                          }</Typography>
                        </li>
                      );
                    })
                  }
                </ul>
              </>
            : <TheActualGame
                username={username}
                game={game}
                playCard={playCard}
                czarPick={czarPick}
                nextRound={nextRound}
              />
        }
        {
          clientIndex === 0
            ? <div id='admin-panel'>
              <Fab color='primary' aria-label='Settings' className={classes.fab} onClick={this.toggleAdminPanel(true)}>
                <SettingsIcon />
              </Fab>
              <SwipeableDrawer
                anchor='right'
                open={this.state.adminPanelOpen}
                onClose={this.toggleAdminPanel(false)}
                onOpen={this.toggleAdminPanel(true)}
              >
                <div
                  tabIndex={0}
                  role='button'
                  onKeyDown={this.toggleAdminPanel(false)}
                >
                  <Typography variant='h4' style={{
                    textAlign: 'center',
                    marginTop: '20px'
                  }}>Panel de Administración</Typography>
                  <div className={classes.list}>
                    <List>
                      <ListItem button onClick={kill}>
                        <ListItemIcon><WarningIcon /></ListItemIcon>
                        <ListItemText primary='Terminar juego' />
                      </ListItem>
                    </List>
                  </div>
                </div>
              </SwipeableDrawer>
            </div>
            : null
        }

        {/*
        <Dialog
          open={this.state.jsonDialog}
          TransitionComponent={Transition}
          keepMounted
          onClose={this.closeDialog}
          aria-labelledby='alert-dialog-slide-title'
          aria-describedby='alert-dialog-slide-description'
        >
          <DialogTitle id='alert-dialog-slide-title'>Escoge un archivo JSON...</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-slide-description'>
              Envia un archivo JSON usando el botón inferior.
            </DialogContentText>

            <input id='jsonFileSelect' type='file' accept='.json' onChange={this.chooseFile} />
            <Typography paragraph style={{ marginTop: '20px' }}>¿Quieres saber cómo hacer una baraja? Échale un vistazo a <a href='https://github.com/mvarona/CartasContraLaHumanidad/#/' target='_blank' rel='noreferrer noopener'>la documentación</a></Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.closeAndSubmitFile} color='primary'>
              Hecho
            </Button>
          </DialogActions>
        </Dialog>
        */}
      </div>
    );
  }
}

export default hot(withStyles(styles)(Game));
