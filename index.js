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
import MaskData from 'maskdata';
import jwt from 'jsonwebtoken';

mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const Movies = Models.Movie;
const Users = Models.User;
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const maskJSONOptions = {
    maskWith: "*",
    fields: ['Password', '_id', 'Birthday', 'Email']
}

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

import cors from 'cors';
app.use(cors());

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

/**
 * Allows a user to view the documentation page. 
 */
app.get('/documentation', (req, res) =>{
    res.sendFile('public/documentation.html', {root: __dirname});
});

/**
 * Allows someone to search for a specific user. 
 */
app.get('/users', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Users.find()
      .then((Users) => {
        let maskUsers = [];
        for (let i=0; i<Users.length; i++) {maskUsers[i] = MaskData.maskJSONFields(Users[i], maskJSONOptions);}
        res.status(201).json(Users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

/**
 * Returns all movies in the DB
 */
app.get('/movies', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * returns a movie based on a specific title
 * @param {title}
 */
app.get('/movies/:title', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Movies.findOne({ Title: req.params.title })
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Returns all movies with a specific genre name
 * @param {genreName}
 */
app.get('/movies/genres/:genreName', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Movies.find({ 'Genre.Name': req.params.genreName })
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Returns a list of movies based on the director's name
 * @param {directorName}
 */
app.get('/movies/directors/:directorName', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Movies.find({ 'Director.Name': req.params.directorName })
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Returns a specific user
 * @param {Username}
 */
app.get('/users/:Username', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Users.findOne({ Username: req.params.Username})
      .then((Users) => {
        // let maskUsers = [];
        // for (let i=0; i<Users.length; i++) {maskUsers[i] = MaskData.maskJSONFields(Users[i], maskJSONOptions);}
        res.status(201).json(Users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

/**
 * Allows a new user to be registered into the api
 * @param {Username}
 * @param {Password}
 * @param {Email} 
 */
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

/**
 * Updates the user information.
 */
app.put('/users/:Username',  passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
  let hashedPassword = Users.hashPassword(req.body.Password)
    Users.findOneAndUpdate({ Username: req.params.Username },
      { $set: 
        {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
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

/**
 * Allows the user to add a Favorite Movie to their list
 */
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndUpdate({ Username: req.user.Username },{
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
/**
 * Allows the user to delete their account
 */
app.delete('/users/:Username', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
  Users.findOneAndRemove({ _id: req.user._id})
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

/**
 * Allows the user to remove a movie from their Favorite list
 */
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
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

const port = process.env.PORT || 8080; 
app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port' + port)
});


