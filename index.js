import express from 'express';
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

let users = [
    { 
        id: uuidv4(),
        name: 'Musah',
        favoriteMovie: []
    },
    {
        id: uuidv4(),
        name: 'Zach',
        favoriteMovie: []
    },
    {
        id: 4569,
        // id: uuidv4(),
        name: 'Seager',
        favoriteMovie: []
    },
];

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

const accessLogStream = createWriteStream(join(__dirname, 'log.txt'), {flags: 'a'});

app.use(morgan('common'));

app.use(morgan('combined', {stream: accessLogStream}));

app.get('/', (req, res) => {
    res.send('Hello and Welcome to my API for movies');
});

app.get('/documentation', (req, res) =>{
    res.sendFile('public/documentation.html', {root: __dirname});
});

app.get('/movies', (req, res) => {
    res.json(movies);
});

app.get('/movies/:title', (req, res) => {
    let title = req.params.title;
    let movie = movies.find(movie => movie.title === title);

    if (movie) {
        res.status(200).json(movie);
    }else {
        res.status(400).send('That movie can not be found in the database');
    }
});

app.get('/movies/genres/:genreName', (req, res) => {
    let genreName = req.params.genreName;
    let genre = movies.find(movie => movie.genres.name == genreName).genres;

    if (genre) {
        res.status(200).json(genre);
    }else {
        res.status(400).send('This genre could not be found');
    }
});

app.get('/movies/directors/:directorName', (req, res) => {
    let directorName = req.params.directorName;
    let director = movies.find(movie => movie.directors.name === directorName).directors;

    if (director) {
        res.status(200).json(director);
    }else {
        res.status(400).send('That director could not be found');
    }
});


app.get('/users', (req, res) => {
    res.json(users);
});


app.post('/users', (req, res) => {
    Users.findOne({ Username: req.body.Username })
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
        Users
            .create({
                Username: req.body.Username,
                Password: req.body.Password,
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

app.put('/users/:id', (req, res) => {
        let id = req.params.id;
        let updatedUser = req.body.user;
        let user = users.find((user) => { return user.id == id});
        
        if (user) {
            user.name = updatedUser;
            res.status(200).json(user);
        }else{
            res.status(400).send('User not found.');
        }
});

app.delete('/users/:id', (req, res) => {
    let id = req.params.id;
    let idx = users.findIndex((user) => { return user.id == id });
    console.log(idx)
    if (idx) {
        users.splice(idx, 1);
        res.status(200).send('E-mail has be removed');
    }else {
        res.status(400).send('User not found');
    }
});

app.post('/users/movies', (req, res) => {
    let id = req.body.id;
    let movieTitle = req.body.movieTitle;

    let user = users.find((user) => { return user.id == id});

    let movie = movies.find((movie) => { return movie.title == movieTitle});

    if (user && movie) {
        user.favoriteMovie.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to your favorites`);
    }else {
        res.status(400).send('User could not be found')
    }
});

app.delete('/users/:id/:movieTitle', (req, res) => {
    let id = req.params.id;
    let movieTitle = req.params.movieTitle;

    let user = users.find((user) => { return user.id == id});


    if (user) {
        user.favoriteMovie = user.favoriteMovie.filter(title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user's favorites`);
    } else {
        res.status(400).send('User and movie not found.')
    }
}); 

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An Error Ocurred')
});

app.listen(port, () => {
    console.log('Your app is listening on port 8080.')
});

