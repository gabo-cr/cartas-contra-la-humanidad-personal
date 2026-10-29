/* eslint-disable no-console */
import { io, app } from 'fullstack-system';
import fs from 'fs';
import entities from 'entities';
import { randomOf } from '@reverse/random';

let game = {
  hostUsername: null,
  players: [],
  timeoutTime: 0,
  gameState: {
    whiteCards: [],
    blackCards: [],
    czar: 0,
    blackCard: {},
    turnTimeLeft: null,
    playedWhiteCards: [],
    czarReady: false,
    czarHasPicked: false
  },
  started: false,
  decks: [],
  customDecks: [],
  log: []
};

const disconnectTimers = new Map();

function addDecks(addBlackCards, addWhiteCards) {
  const defaultDecksToUse = game.decks.filter((deck) => deck.selected && !deck.custom).map((deck) => {
    return deck.codeName;
  });
  const customDecksToUse = game.decks.filter((deck) => deck.selected && deck.custom).map((deck) => {
    return deck.codeName;
  });

  const jsonContent = {
    blackCards: [],
    whiteCards: []
  };
  // Get the default decks.

  defaultDecksToUse.forEach((deckCodeName) => {
    const deckContents = fs.readFileSync(`src/server/sets/${deckCodeName}.json`);
    
    // Add the black cards.
    if(addBlackCards) {
      const blackCards = JSON.parse(deckContents).blackCards;

      for(const blackCard of blackCards) {
        blackCard.text = entities.decodeHTML(blackCard.text).replace(/_+/g, '_____');
        jsonContent.blackCards.push(blackCard);
      }
    }
    
    // Add the white cards.
    if(addWhiteCards) {
      const whiteCards = JSON.parse(deckContents).whiteCards;

      for(const whiteCard of whiteCards) {
        jsonContent.whiteCards.push(entities.decodeHTML(whiteCard));
      }
    }
  });
  // Get the custom decks.
  customDecksToUse.forEach((deckCodeName) => {
    const customDeckIndex = game.customDecks.findIndex((customDeck) => customDeck.codeName === deckCodeName);
    
    // Add the black cards.
    if(addBlackCards) {
      const blackCards = game.customDecks[customDeckIndex].blackCards;

      for(const blackCard of blackCards) {
        blackCard.text = entities.decodeHTML(blackCard.text).replace(/_+/g, '_____');
        jsonContent.blackCards.push(blackCard);
      }
    }

    // Add the white cards.
    if(addWhiteCards) {
      const whiteCards = game.customDecks[customDeckIndex].whiteCards;

      for(const whiteCard of whiteCards) {
        jsonContent.whiteCards.push(entities.decodeHTML(whiteCard));
      }
    }
  });

  // Shuffle the decks.
  // Borrowed from https://stackoverflow.com/a/2450976/10194810.
  function shuffle(array) {
    let currentIndex = array.length, randomIndex, temporaryValue;
  
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }
  
  if (addBlackCards) {
    game.gameState.blackCards = shuffle(jsonContent.blackCards);
  }

  if (addWhiteCards) {
    game.gameState.whiteCards = shuffle(jsonContent.whiteCards);
  }
}

function getPlayerIndex(username) {
  return game.players.findIndex((player) => player.username === username);
}

function resetGame() {
  // Reset game.
  game = {
    hostUsername: null,
    players: [],
    gameState: {
      whiteCards: [],
      blackCards: [],
      czar: 0,
      blackCard: {},
      turnTimeLeft: null,
      playedWhiteCards: [],
      czarReady: false,
      czarHasPicked: false
    },
    started: false,
    decks: [],
    customDecks: [],
    log: []
  };
  console.log('Game reset!');
}

function removePlayer(username) {
  const playerIndex = game.players.findIndex(
    (player) => player.username === username
  );

  if (playerIndex === -1) return;

  // Remove player.
  game.players.splice(playerIndex, 1);

  io.sockets.emit('updatedGame', game);
  console.log(`Jugador ${username} desconectado.`);
  game.log.push(`Jugador ${username} desconectado.`);

  // If there is not enough people to join.
  let minNumberOfPlayers = 3;

  if(game.players.length < minNumberOfPlayers && game.started) {
    console.log('No hay suficientes jugadores conectados. Terminando juego.');
    io.sockets.emit('gameEndNotEnoughPlayers');
    resetGame();
    return;
  }
  if(game.players.length === 0) {
    console.log('La sala está vacía. Reseteando.');
    resetGame();
  }
}

io.on('connection', (socket) => {

  socket.on('newPlayer', (username) => {
    // Si el jugador ya existe, permitir que se reconecte.
    const existingPlayer = game.players.find(
      (player) => player.username === username
    );

    if (existingPlayer) {
      const timer = disconnectTimers.get(username);

      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(username);
      }

      socket.username = username;

      console.log(`Jugador ${username} reconectado.`);

      io.sockets.emit('updatedGame', game);
      return;
    }

    console.log(`Jugador ${username} conectado.`);
    game.log.push(`Jugador ${username} conectado.`);

    // Check if the username already exists.
    for(const player of game.players) {
      if(username === player.username) {
        console.log(`El jugador ${username} intentó unirse, pero el nombre de usuario ya existe.`);
        socket.emit('usernameExists');
        socket.disconnect();
        return;
      }
    }
    // Add player to game.
    game.players.push({
      username: username,
      score: 0,
      hand: []
    });

    // If the player joins in an in progress game.
    if(game.started) {
      const playerIndex = getPlayerIndex(username);

      for(let cards = 0; cards < 10; cards++) {
        game.players[playerIndex].hand.push(game.gameState.whiteCards[0]);
        game.gameState.whiteCards.shift();
      }
    }

    // Get the decks.
    if(game.players.length === 1) {
      fs.readdirSync('src/server/sets/').forEach((file) => {
        const contents = fs.readFileSync(`src/server/sets/${file}`);
        const jsonContent = JSON.parse(contents);

        game.decks.push({
          name: jsonContent.name,
          codeName: jsonContent.codeName,
          official: jsonContent.official,
          custom: false,
          selected: jsonContent.codeName === 'CAH-es-set'
        });
      });
    }
    
    // Update the client states.
    io.sockets.emit('updatedGame', game);

    socket.username = username;
  });

  socket.on('updatedDecks', (decks) => {
    game.decks = decks;

    // Update the client states.
    io.sockets.emit('updatedGame', game);
  });

  socket.on('newCustomDeck', (deckFile) => {
    let customDeckJSON;

    try {
      customDeckJSON = JSON.parse(deckFile.toString('UTF8'));
    }catch(err) {
      io.sockets.emit('badCustomDeck', 'Hubo un error leyendo el archivo. Por favor, asegúrate de que no hay comas sueltas e inténtalo de nuevo.');
      return;
    }
    
    const hasName = customDeckJSON.name;
    const hasCodeName = customDeckJSON.codeName;
    const hasNames = hasName && hasCodeName;

    let formattedCorrectly = true;

    // Check if the deck contains a name and a codeName.
    if(!hasNames) {
      if(!hasName && !hasCodeName) {
        io.sockets.emit('badCustomDeck', 'Las claves name y codeName no se han encontrado. Por favor, asegúrate de que están bien escritas e inténtalo de nuevo.');
      }else if(!hasName) {
        io.sockets.emit('badCustomDeck', 'La clave name no se ha encontrado. Por favor, asegúrate de que están bien escritas e inténtalo de nuevo.');
      }else if(!hasCodeName) {
        io.sockets.emit('badCustomDeck', 'La clave codeName no se ha encontrado. Por favor, asegúrate de que están bien escritas e inténtalo de nuevo.');
      }
      return;
    }

    // Check if the codename exists in another deck.
    game.decks.forEach((deck) => {
      if(deck.codeName === customDeckJSON.codeName) {
        io.sockets.emit('badCustomDeck', 'El código de nombre usado para tu baraja ya exite en otra baraja. Por favor, cambia el código de nombre e inténtalo de nuevo.');
        formattedCorrectly = false;
      }
    });
    game.customDecks.forEach((deck) => {
      if(deck.codeName === customDeckJSON.codeName) {
        io.sockets.emit('badCustomDeck', 'El código de nombre usado para tu baraja ya exite en otra baraja. Por favor, cambia el código de nombre e inténtalo de nuevo.');
        formattedCorrectly = false;
      }
    });
    
    if(formattedCorrectly) {
      // Add deck to deck list.
      game.decks.push({
        name: customDeckJSON.name,
        codeName: customDeckJSON.codeName,
        customDeckJSON: customDeckJSON.codeName,
        official: false,
        custom: true,
        selected: true
      });

      // Add the cards to the game.
      const newCustomDeck = {
        codeName: customDeckJSON.codeName,
        blackCards: [],
        whiteCards: []
      };

      // If there is black cards.
      if(customDeckJSON.blackCards) {
        for(const card of customDeckJSON.blackCards) {
          // Check if the card is valid and ignore if it isn't.
          if(typeof card.text === 'string' && typeof card.pick === 'number') {
            newCustomDeck.blackCards.push(card);
          }
        }
      }
      // If there is white cards.
      if(customDeckJSON.whiteCards) {
        for(const card of customDeckJSON.whiteCards) {
          // Check if the card is valid and ignore if it isn't.
          if(typeof card === 'string') {
            newCustomDeck.whiteCards.push(card);
          }
        }
      }
    }
    game.customDecks.push(newCustomDeck);
    game.log.push(`Baraja personalizada: ${customDeckJSON.name} añadida.`);

    // Send new data.
    io.sockets.emit('updatedGame', game);
  });

  socket.on('start', () => {
    if (
      game.started ||
      game.players.length < 3 ||
      socket.username !== game.players[0].username
    ) {
      return;
    }

    game.hostUsername = socket.username;


    console.log(`Empezando juego con ${game.players.length} jugadores.`);
    addDecks(true, true);

    // Deal cards.
    for(const player of game.players) {
      game.log.push(`El jugador ${player.username} roba las cartas blancas:`);

      for(let i = 0; i < 10; i++) {
        game.log.push(`Jugador ${player.username} Carta Blanca #${i + 1}: ${game.gameState.whiteCards[0]}`);
        player.hand.push(game.gameState.whiteCards[0]);
        game.gameState.whiteCards.shift();
      }
    }

    // Chose black card.
    game.log.push(`Carta Negra en juego: ${game.gameState.blackCards[0].text}`);
    game.gameState.blackCard = game.gameState.blackCards[0];
    game.gameState.blackCards.shift();
    

    const decks = game.decks.filter((deck) => deck.selected).map((deck) => deck.name);

    game.log.push(`Empezando juego con las barajas: ${decks.join(' ')}.`);
    
    game.started = true;
    io.sockets.emit('updatedGame', game);

    console.log('El juego ha empezado.');
  });

  socket.on('playedCard', (username, cardString) => {
    // Add new object to playedWhiteCards.
    if(!game.gameState.playedWhiteCards.find((object) => {
      return object.username === username;
    })) {
      game.gameState.playedWhiteCards.push({
        cards: [],
        username: username
      });
    }
    game.gameState.playedWhiteCards.find((object) => {
      return object.username === username;
    }).cards.push(cardString);

    const playerIndex = getPlayerIndex(username);
    
    // Remove card from client hand.
    game.players[playerIndex].hand = game.players[playerIndex].hand.filter((value) => value !== cardString);
    game.log.push(`El jugador ${username} jugó la Carta Blanca: ${cardString}`);


    let playedCards = 0;

    for(const player of game.gameState.playedWhiteCards) {
      playedCards += player.cards.length;
    }
    game.gameState.czarReady = playedCards === (game.players.length - 1) * game.gameState.blackCard.pick;

    io.sockets.emit('updatedGame', game);
  });

  socket.on('czarPicked', (username) => {
    const currentCzar = game.players[game.gameState.czar];

    if (
      !game.started ||
      !game.gameState.czarReady ||
      game.gameState.czarHasPicked ||
      !currentCzar ||
      socket.username !== currentCzar.username
    ) {
      return;
    }

    const playerIndex = getPlayerIndex(username);

    // No permitir que el zar se elija a sí mismo
    // ni seleccionar un jugador que no haya jugado.
    if (
      playerIndex === -1 ||
      playerIndex === game.gameState.czar ||
      !game.gameState.playedWhiteCards.some(
        (player) => player.username === username
      )
    ) {
      return;
    }
    
    game.log.push(`¡El jugador ${username} gana la ronda!`);
    
    // Increase the score by one.
    game.players[playerIndex].score++;
    game.gameState.czarHasPicked = true;

    // Check for winner.
    for(const player of game.players) {
      if(player.score === 10) {
        game.log.push(`¡El jugador ${player.username} gana el juego!`);
        io.sockets.emit('winner', player.username, game.players, game.log);
        console.log(`${player.username} ha ganado el juego. Reseteando.`);
        resetGame();
        return;
      }
    }

    // Deal more cards.
    for(const player of game.players) {
      if(player.hand.length < 10) {
        const cardsToAdd = 10 - player.hand.length;

        for(let cardsLeft = cardsToAdd; cardsLeft > 0; cardsLeft--) {
          // Check if the white card deck is empty.
          if(game.gameState.whiteCards.length === 0) {
            game.log.push('Rellenando Cartas Blancas.');
            addDecks(false, true);
          }

          // Add card.
          game.log.push(`El jugador ${player.username} robó: ${game.gameState.whiteCards[0]}`);
          player.hand.push(game.gameState.whiteCards[0]);
          game.gameState.whiteCards.shift();
        }
      }
    }

    io.sockets.emit('roundWinner', username);
    io.sockets.emit('updatedGame', game);
  });

  socket.on('nextRound', () => {
    if (!game.started || !game.gameState.czarHasPicked) {
      return;
    }

    const currentCzar = game.players[game.gameState.czar];

    const isHost = socket.username === game.hostUsername;
    const isCzar = currentCzar &&
      socket.username === currentCzar.username;

    if (!isHost && !isCzar) {
      return;
    }

    // Rotar el zar.
    if (game.gameState.czar === game.players.length - 1) {
      game.gameState.czar = 0;
    } else {
      game.gameState.czar++;
    }

    game.log.push(
      `Nuevo árbitro: ${game.players[game.gameState.czar].username}.`
    );

    game.gameState.czarReady = false;
    game.gameState.czarHasPicked = false;
    game.gameState.playedWhiteCards = [];

    // Robar una nueva carta negra.
    if (game.gameState.blackCards.length === 0) {
      game.log.push('Rellenando Cartas Negras.');
      addDecks(true, false);
    }

    game.log.push(
      `Carta Negra en juego: ${game.gameState.blackCards[0].text}`
    );

    game.gameState.blackCard = game.gameState.blackCards[0];
    game.gameState.blackCards.shift();

    io.sockets.emit('updatedGame', game);

    console.log('Nueva ronda.');
  });

  socket.on('kill', () => {
    Object.values(io.sockets.connected).forEach((theSocket) => {
      theSocket.disconnect();
    });
    resetGame();
    console.log('El anfitrión terminó el juego.');
  });

  socket.on('disconnect', () => {
    const username = socket.username;

    if (!username) return;

    // Esperar antes de eliminar al jugador.
    const timer = setTimeout(() => {
      disconnectTimers.delete(username);

      // Si el jugador ya se reconectó mediante otro socket,
      // no eliminarlo de la partida.
      const connectedSockets = Object.values(io.sockets.connected);

      const isConnected = connectedSockets.some(
        (connectedSocket) => connectedSocket.username === username
      );

      if (!isConnected) {
        removePlayer(username);
      }
    }, 30000);

    disconnectTimers.set(username, timer);
  });
});

app.get('/api/currentGame', (req, res) => {
  res.send(game);
});

app.get('/api/set/:set', (req, res) => {
  const set = req.params.set;

  if(fs.existsSync(`src/server/sets/${set}.json`)) {
    const contents = fs.readFileSync(`src/server/sets/${set}.json`);

    res.send(JSON.parse(contents));
    return;
  }
  res.send(`El set '${req.params.set}' no existe.`);
});

app.get('/api/sets', (req, res) => {
  res.send(fs.readdirSync('src/server/sets/').map((set) => set.replace('.json', '')));
});

app.get('/api/randomWhiteCard/:set?', (req, res) => {
  const set = req.params.set || 'CAH-es-set';

  if(fs.existsSync(`src/server/sets/${set}.json`)) {
    const contents = fs.readFileSync(`src/server/sets/${set}.json`);
  
    res.send(randomOf(JSON.parse(contents).whiteCards));
    return;
  }
  res.send(`El set '${req.params.set}' no existe.`);
});

app.get('/api/randomBlackCard/:set?', (req, res) => {
  const set = req.params.set || 'CAH-es-set';

  if(fs.existsSync(`src/server/sets/${set}.json`)) {
    const contents = fs.readFileSync(`src/server/sets/${set}.json`);

    res.send(randomOf(JSON.parse(contents).blackCards).text);
    return;
  }
  res.send(`El set '${req.params.set}' no existe.`);
});

var express = require('express');
app.use(express.static('public'));
