import express, { application } from 'express';
import morgan from 'morgan';
import { createWriteStream } from 'fs';
import path, { join } from 'path';
import methodOverride from 'method-override';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import * as Models from './models.js';
import {check, validationResult} from 'express-validator';

mongoose.connect('mongodb://127.0.0.1:27017/[movieDB]', {useNewUrlParser: true, useUnifiedTopology: true});

const Movies = Models.Movie;
const Users = Models.User;
const app = express();
const port = 8080;
const __dirname = dirname(fileURLToPath(import.meta.url));

let movies = [
    { title: 'Star Wars: Episode IV - A New Hope',
    directors: {
        name: 'George Lucas',
        born: '1944',
        death: 'N/A',
        bio:'George Walton Lucas Jr. is an American filmmaker. Lucas is best known for creating the Star Wars and Indiana Jones franchises and founding Lucasfilm, LucasArts, Industrial Light & Magic and THX.',
    },
    genres: {
        name: 'Fantasy',
        description: 'A story set in a galaxy far far away about saving the entirety of civilization.'
    },
    image: 'https://picsum.photos/200/300',
    release: 'July 21, 1978'},

    { title: 'Seven',
    directors: {
        name: 'David Fincher',
        born: '1962',
        death: 'N/A',
        bio:'David Andrew Leo Fincher is an American film director. His films, mostly psychological thrillers, have received 40 nominations at the Academy Awards, including three for him as Best Director.',
    },
    genres: {
        name: 'Thriller',
        description: 'When retiring police Detective William Somerset (Morgan Freeman) tackles a final case with the aid of newly transferred David Mills (Brad Pitt), they discover a number of elaborate and grizzly murders.',
    },
    image: 'https://picsum.photos/200/300',
    release: 'September 22, 1995'},

    {title: 'Star Wars: Episode V - The Empire Strikes Back',
    directors: {
        name: 'Irvin Kershner',
        born: '1923',
        death: '2010',
        bio:'American film director, actor, and producer of film and television.',
    },
    genres: {
        name: 'Fantasy',
        description: 'A story set in a galaxy far far away about saving the entirety of civilization.',
    },
    image: 'https://picsum.photos/200/300',
    release: 'May 21, 1980'},

    {title: 'Tombstone',
    directors: {
        name: 'George P. Cosmatos',
        born: '1941',
        death: '2005',
        bio:'George Pan Cosmatos was a Greek-Italian film director and screenwriter.',
    },
    genres: {
        name: 'Western',
        description: 'Wyatt Earp (Kurt Russell) and his brothers, Morgan (Bill Paxton) and Virgil (Sam Elliott), have left their gunslinger ways behind them to settle down and start a business in the town of Tombstone, Ariz. While they are not looking to find trouble, trouble soon finds them when they become targets of the ruthless Cowboy gang. Now, together with Wyatts best friend, Doc Holliday (Val Kilmer), the brothers pick up their guns once more to restore order to a lawless land.',
    },
    image: 'https://picsum.photos/200/300',
    release: 'December 25, 1993'},

    {title: 'Three Amigos',
    directors: {
        name: 'John Landis',
        born: '1950',
        death: 'N/A',
        bio:'an American filmmaker and actor',
    },
    genres: {
        name: 'Comedy',
        description: 'Three cowboy movie stars from the silent era -- Dusty Bottoms (Chevy Chase), Lucky Day (Steve Martin) and Ned Nederlander (Martin Short) -- are fired when one of their movies bombs.',
    },
    image: 'https://picsum.photos/200/300',
    release: 'December 12, 1986'},

    {title: 'Mean Girls',
    directors: {
        name: 'Mark Waters',
        born: '1964',
        death: 'N/A',
        bio:'Mark Stephen Waters is an American filmmaker',
    },
    genres: {
        name: 'Comedy',
        description: 'Teenage Cady Heron (Lindsay Lohan) was educated in Africa by her scientist parents. When her family moves to the suburbs of Illinois, Cady finally gets to experience public school and gets a quick primer on the cruel, tacit laws of popularity that divide her fellow students into tightly knit cliques. She unwittingly finds herself in the good graces of an elite group of cool students dubbed "the Plastics," but Cady soon realizes how her shallow group of new friends earned this nickname.',
    },
    image: 'https://picsum.photos/200/300',
    release: 'April 20, 2004'},

    {title: 'The Boondock Saints',
    directors: {
        name: 'Troy Duffy',
        born: '1971',
        death: 'N/A',
        bio:'Troy Duffy is an American filmmaker and musician. He has directed two films, The Boondock Saints and its sequel The Boondock Saints II: All Saints Day',
    },
    genres: {
        name: 'Action',
        description: 'The film stars Sean Patrick Flanery and Norman Reedus as fraternal twin brothers Connor and Murphy MacManus, who become vigilantes after killing two members of the Russian Mafia in self-defense.',
    },
    image: 'https://picsum.photos/200/300',
    release: 'January 21, 2000'},
];    

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

import cors from 'cors';
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];
app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1 ){
            let message = 'The CORS policy for this application does not allow access from origin' + origin;
            return callback(new Error(message), false);
        }
    }
}))

import { auths } from './auth.js';
import passport from 'passport';
import ('./passport.js');
auths(app);

const accessLogStream = createWriteStream(join(__dirname, 'log.txt'), {flags: 'a'});

app.use(morgan('common'));

app.use(morgan('combined', {stream: accessLogStream}));

//message on the homepage
app.get('/', (req, res) => {
    res.send('Hello and Welcome to my API for movies');
});
//displays the documentation page
app.get('/documentation', (req, res) =>{
    res.sendFile('public/documentation.html', {root: __dirname});
});
//returns a list of all the movies for users
app.get('/movies', passport.authenticate('jwt', {session: false, failureRedirect: "/login" }), (req, res) => {
    Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
//returns a specific movie based on the title
app.get('/movies/:title', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ Title: req.params.title })
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
//returns all movies with a specific genre name
app.get('/movies/genres/:genreName', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.find({ 'Genre.Name': req.params.genreName })
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});
//return a list of movies by a specific director
app.get('/movies/directors/:directorName', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.find({ 'Director.Name': req.params.directorName })
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      res.status(500).send('Error: ' + err);
    });
});
//returns a specific user
app.get('/users/:Username', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOne({ Username: req.params.Username})
    .then((user) => {
        res.json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});
//add a new user and adds them to the user list
app.post('/users', [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array()});
    }
    let hashedPassword = Users.hashPassword(req.body.Password)
    Users.findOne({ Username: req.body.Username })
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
        Users
            .create({
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user) => {res.status(201).json(user)})
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
    }  
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});
//update username
app.put('/users/:Username',  passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },
      { $set: 
        {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }
      },
      { new: true })
      .then((updatedUser) => {
        if (!updatedUser) {
            return res.status(400).send('Error: No user was found');
        } else {
            res.json(updatedUser);
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
  });
})
//updates the users favorite movie list
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },{
        $addToSet: { FavoriteMovies: req.params.MovieID }
        },
        { new: true })
        .then((updatedUser) => {
            if(!updatedUser) {
                return res.status(400).send('Error: Movie not found');
            }else{
                res.json(updatedUser);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
    });
})    
//delete a user by their username
app.delete('/users/:Username/:Email', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username, Email: req.params.Email})
    .then((user) => {
        if (user != user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

//remove a movie from users fav
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
	Users.findOneAndUpdate(
		{ Username: req.params.Username },
		{
		$pull: { FavoriteMovies: req.params.MovieID },
		},
		{ new: true })
		.then((updatedUser) => {
			if (!updatedUser) {
				return res.status(404).send('Error: User not found');
			} else {
				res.json(updatedUser);
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An Error Ocurred')
});

app.listen(port, () => {
    console.log('Your app is listening on port 8080.')
});

