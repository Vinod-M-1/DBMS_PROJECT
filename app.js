const express = require('express');
const app = express();
const mysql2 = require('mysql2');
const ejsMate = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.engine('ejs', ejsMate);


const connection = mysql2.createConnection({
    host: 'localhost',
    user: 'root',          
    password: '2006',
    database: 'artgallery'
});

app.get('/', (req,res)=>{
    res.render('main');
})

app.get('/artists', (req,res)=>{
    const q1 = connection.promise().query('SELECT * FROM Artists');
    const q2 = connection.promise().query('SELECT count(*) from Artists');

    Promise.all([q1, q2])
        .then(([artists, count]) => {
            let artistsinfo = artists[0];
            let countinfo = count[0][0]['count(*)'];
            res.render('index', {artistsinfo, countinfo})
        })
        .catch(err => console.log(err));
})

app.get('/add', (req,res)=>{
    res.render('add');
})

app.get('/edit/:id', (req,res)=>{
    let {id} = req.params;
    let q = 'SELECT * FROM Artists WHERE artist_id = ?';
    connection.query(q, [id], (err,result)=>{
        if(err) return res.send(err);

        res.render('edit', {artist: result[0]});
    })

})

app.put('/edit/:id', (req, res) => {
    let { id } = req.params;
    let { name, biography, style, email, password } = req.body;

    let q = `
        UPDATE Artists 
        SET name=?, biography=?, style=?, email=?, password=? 
        WHERE artist_id=?
    `;

    connection.query(q, [name, biography, style, email, password, id], (err) => {
        if (err) return res.send(err);

        res.redirect('/artists');
    });
});

app.post('/artists', (req,res)=>{
    let {name, biography, style, email, password} = req.body;
    let q = `INSERT INTO artists(name,biography,style,email,password) values(?,?,?,?,?)`;
    connection.query(q,[name,biography,style,email,password], (err,result)=>{
        if (err) {
            console.log(err);
            return res.send(err.message);
        }
        res.redirect('/');
    })
})

app.delete('/delete/:id', (req,res)=>{
    let {id} = req.params;
    let q = `delete from artists where artist_id = ?`
    connection.query(q,[id],(err, result)=>{
        if(err) {
            console.log(err);
            return res.send(err.message);
        }
        res.redirect("/artists");
    })

})

const port = 8080;

app.listen(port, ()=>{
    console.log('App listening at port 8080')
})