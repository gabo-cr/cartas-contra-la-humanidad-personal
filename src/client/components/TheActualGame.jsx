import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Interweave from 'interweave';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

const styles = (theme) => ({
  root: {
    flexGrow: 1
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'left',
    color: theme.palette.text.secondary,
    width: '150px',
    height: '200px'
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular
  },
});

const scoreStyles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    margin: '10px 0',
    border: '2px solid #000',
    borderRadius: '30px'
  },
  score: {
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ccc'
  },
  zar: {
    color: '#7f1b1b'
  }
};

class TheActualGame extends Component {
  render() {
    const { classes, username, game, playCard, czarPick } = this.props;
    
    const isCzar = game.players.indexOf(game.players.find((player) => {
      return username === player.username;
    })) === game.gameState.czar;
    const hasPlayedCard = game.gameState.playedWhiteCards.some((object) => object.username === username);
    const clientIndex = game.gameState.playedWhiteCards.indexOf(game.gameState.playedWhiteCards.find((player) => {
      return username === player.username;
    }));

    return (
      <div className={classes.root}>
        <div style={{ marginTop: '20px', maxWidth: '500px' }}>
          <div expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>Puntos</Typography>
          </div>
          <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                {
                  game.players.map((player, playerIndex) => {
                    return (
                      <div key={player.username} style={scoreStyles.wrapper}>
                        <div style={scoreStyles.score}>
                          {player.score}
                        </div>
                        {
                          playerIndex === game.gameState.czar
                            ? <div style={scoreStyles.zar}>
                                {player.username} (Zar)
                              </div>
                            : <div>
                                {player.username}
                              </div>
                        }
                      </div>
                    );
                  })
                }
          </div>
        </div>

        <Grid id='played-cards' container spacing={2}>
          <Grid className='card' item>
            <Paper className={'black-card ' + classes.paper} style={{ position: 'relative' }}>
              <Interweave content={game.gameState.blackCard.text} />
              <Typography style={{
                color: 'rgba(255,255,255,0.6)',
                position: 'absolute',
                bottom: '10px',
                left: '10px'
              }}><strong>Elige {game.gameState.blackCard.pick}</strong></Typography>
            </Paper>
          </Grid>
          {
            isCzar
              ? game.gameState.czarReady
                ? <Grid className='card white-card zar-card' item>
                  <Paper className={classes.paper} style={{ marginBottom: '10px' }}>Eres el Zar. Elige la carta blanca que quede mejor (o la más graciosa) con la carta negra.</Paper>
                </Grid>
                : <Grid className='card white-card zar-card' item>
                  <Paper className={classes.paper}>Eres el Zar... espera a que todos jueguen.</Paper>
                </Grid>
              : hasPlayedCard
                ? !game.gameState.czarReady
                  ? game.gameState.playedWhiteCards[clientIndex].cards.map((card, index) => {
                    return (
                      <Grid className='card card-hover white-card' item key={index}>
                        <Paper className={classes.paper} style={{ marginBottom: '10px' }}><Interweave content={card} /></Paper>
                      </Grid>
                    );
                  })
                  : <Grid className='card white-card' item>
                    <Paper className={classes.paper} style={{ marginBottom: '10px' }}>Espera a que el árbitro escoja la(s) mejor(es) carta(s) blanca(s).</Paper>
                  </Grid>
                : <Grid className='card white-card' item>
                  <Paper className={classes.paper}>
                    Haz click en una carta para jugarla.
                    <br /><br />
                    {game.gameState.turnTimeLeft}
                  </Paper>
                </Grid>
          }
          {
            game.gameState.czarReady
              ? game.gameState.playedWhiteCards.map((player, index) => {
                return (
                  <Grid className='card card-hover white-card' item key={index} onClick={
                    isCzar
                      ? czarPick(player.username)
                      : null
                  }>
                    {
                      player.cards.map((card, index) => {
                        return (
                          <Paper className={classes.paper} key={index} style={{ marginBottom: '10px', position: 'relative' }}>
                            <Interweave content={card} />
                            {
                              game.gameState.czarHasPicked
                                ? <Typography style={{
                                  color: 'rgba(0, 0, 0, 0.6)',
                                  position: 'absolute',
                                  bottom: '0px',
                                  right: '5px'
                                }}><strong>{player.username}</strong></Typography>
                                : null
                            }
                          </Paper>
                        );
                      })
                    }
                  </Grid>
                );
              })
              : null
          }
        </Grid>

        {!isCzar && (

          <div id='hand'>
            <hr style={{ margin: '20px 0' }}></hr>
            <Grid container spacing={2}>
              <TransitionGroup component={React.Fragment}>
                {
                  game.players.find((player) => {
                    return username === player.username;
                  }).hand.map((card, cardIndex) => {
                    return (
                      <CSSTransition
                        key={card}
                        timeout={500}
                        classNames='item'
                      >
                        <Grid
                          className='card card-hover white-card'
                          item onClick={playCard(cardIndex)}>
                          <Paper className={classes.paper}><Interweave content={card} /></Paper>
                        </Grid>
                      </CSSTransition>
                    );
                  })
                }
              </TransitionGroup>
            </Grid>
          </div>
        )}
      </div>
    );
  }
}

export default hot(withStyles(styles)(TheActualGame));
