import express from 'express';
import morgan from 'morgan';
import { createWriteStream } from 'fs';
import path, { join } from 'path';
import methodOverride from 'method-override';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";

const app = express();
const port = 8080
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

const accessLogStream = createWriteStream(join(__dirname, 'log.txt'), {flags: 'a'})

app.use(morgan('common'));

app.use(morgan('combined', {stream: accessLogStream}));

app.get('/', (req, res) => {
    res.send('Hello and Welcome to my API for movies');
});

app.get('/documentation', (req, res) =>{
    res.sendFile('public/documentation.html', {root: __dirname});
})

app.get('/movies', (req, res) => {
    let topMovies = [
        { title: 'Star Wars: Episode IV - A New Hope',
        director: 'George Lucas',
        release: 'July 21, 1978'},
    
        { title: 'Seven',
        director: 'David Fincher',
        release: 'September 22, 1995'},
    
        {title: 'Star Wars: Episode V - The Empire Strikes Back',
        director: 'Irvin Kershner',
        release: 'May 21, 1980'},
    
        {title: 'Back to the Future',
        director: 'Robert Zemeckis',
        release: 'July 3, 1985'}, 
        
        {title: 'Inglorious Bastards',
        director: 'Quentin Tarantino',
        release: 'August 21, 2009'},  
    
        {title: 'Snatch',
        director: 'Guy Ritchie',
        release: 'January 19, 2001'},
    
        {title: 'Tombstone',
        director: 'Geroge P. Cosmatos, Kevin Jarre',
        release: 'December 25, 1993'},
    
        {title: 'Three Amigos',
        director: 'John Landis',
        release: 'December 12, 1986'},
    
        {title: 'Mean Girls',
        director: 'Mark Waters',
        release: 'April 20, 2004'},
    
        {title: 'The Boondock Saints',
        director: 'Troy Duffy',
        release: 'January 21, 2000'},
    ];    
    res.json(topMovies);
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An Error Ocurred')
})

app.listen(port, () => {
    console.log('Your app is listening on port 8080.')
})