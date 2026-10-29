import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Interweave from 'interweave';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

const styles = (theme) => ({
  root: {
    flexGrow: 1
  },
});

class TheActualGame extends Component {
  render() {
    const { classes, username, game, playCard, czarPick, nextRound } = this.props;

    const isCzar = game.players.indexOf(game.players.find((player) => {
      return username === player.username;
    })) === game.gameState.czar;
    const isHost = game.hostUsername === username;
    const hasPlayedCard = game.gameState.playedWhiteCards.some((object) => object.username === username);
    const clientIndex = game.gameState.playedWhiteCards.indexOf(game.gameState.playedWhiteCards.find((player) => {
      return username === player.username;
    }));

    return (
      <div className={classes.root}>
        <div style={{ marginTop: '15px' }}>
          <div>
            <Typography style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Puntos</Typography>
          </div>
          <div className="score-block">
            {
              game.players.map((player, playerIndex) => {
                return (
                  <div key={player.username} className={'score-wrapper' + (playerIndex === game.gameState.czar ? ' score-zar' : '')}>
                    <div className="score">
                      <p>{player.score}</p>
                    </div>
                    <div className="player-info">
                      <span>{player.username} </span>
                      {(playerIndex === game.gameState.czar) ? <span className='span-zar'>Zar</span> : null}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        <Grid id='black-card-and-instructions' container spacing={2}>
          <Grid className='card' item>
            <div className="black-card" style={{ position: 'relative' }}>
              <Interweave content={game.gameState.blackCard.text} />
              <Typography style={{
                color: '#fff',
                position: 'absolute',
                bottom: '16px',
                left: '16px'
              }}><strong>Elige {game.gameState.blackCard.pick}</strong></Typography>
            </div>
          </Grid>
          {
            isCzar
              ? game.gameState.czarReady
                ? <Grid className='card zar-card' item>
                    <div>
                      <p>Eres el Zar.</p>
                      <p>Elige la carta blanca que quede mejor (o la más graciosa) con la carta negra.</p>
                    </div>
                  </Grid>
                : <Grid className='card zar-card' item>
                    <div>
                      <p>Eres el Zar.</p>
                      <p>Espera a que todos jueguen.</p>
                    </div>
                  </Grid>
              : <Grid className='card' item>
                  <div style={{ backgroundColor: '#edecec',  }}>
                    {
                      hasPlayedCard 
                      ? 'Espera a que el árbitro escoja la(s) mejor(es) carta(s) blanca(s).' 
                      : 'Haz click en una carta para jugarla.'
                    }
                  </div>
                </Grid>
          }
        </Grid>

        <Grid id='played-cards' container spacing={2}>
          {
            hasPlayedCard
              ? !game.gameState.czarReady
                ? game.gameState.playedWhiteCards[clientIndex].cards.map((card, index) => {
                  return (
                    <Grid className='card white-card selected' item key={index}>
                      <div><Interweave content={card} /></div>
                    </Grid>
                  );
                })
                : null
              : null
          }
          {
            game.gameState.czarReady
              ? game.gameState.playedWhiteCards.map((player, index) => {
                return (
                  <Grid className='card white-card selected' item key={index} onClick={
                    isCzar
                      ? czarPick(player.username)
                      : null
                  }>
                    {
                      player.cards.map((card, index) => {
                        return (
                          <div key={index} style={{ position: 'relative' }}>
                            <Interweave content={card} />
                            {
                              game.gameState.czarHasPicked
                                ? <Typography style={{
                                    color: '#fff',
                                    position: 'absolute',
                                    bottom: '16px',
                                    right: '16px'
                                  }}>
                                    <strong>{player.username}</strong>
                                  </Typography>
                                : null
                            }
                          </div>
                        );
                      })
                    }
                  </Grid>
                );
              })
              : null
          }
        </Grid>

        {
          game.gameState.czarHasPicked && (
          <div style={{ margin: '25px 0' }}>
            {(isHost || isCzar) && (
              <Button
                variant='contained'
                color='primary'
                onClick={nextRound}
              >
                Siguiente ronda
              </Button>
            )}

            {!(isHost || isCzar) && (
              <Typography>
                Ronda finalizada. Esperando a que el anfitrión o el zar
                inicie la siguiente ronda.
              </Typography>
            )}
          </div>
        )}

        {!isCzar && (

          <div id='hand'>
            <div style={{ width: '100%', margin: '50px 0 30px', borderBottom: '2px solid #000' }}></div>
            <Typography style={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '10px' }}>
              Tus cartas:
            </Typography>
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
                          className='card white-card'
                          item onClick={playCard(cardIndex)}>
                          <div><Interweave content={card} /></div>
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
