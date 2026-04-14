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


//Main route for artists
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


// Add route for artists
app.get('/add', (req,res)=>{
    res.render('add');
})


//Edit route for artist
app.get('/edit/:id', (req,res)=>{
    let {id} = req.params;
    let q = 'SELECT * FROM Artists WHERE artist_id = ?';
    connection.query(q, [id], (err,result)=>{
        if(err) return res.send(err);

        res.render('edit', {artist: result[0]});
    })

})

// Artworks main route
app.get("/artists/:id/artworks", (req,res)=>{
    let {id} = req.params;
    let q = 'SELECT * FROM Artworks WHERE artist_id = ?';
    connection.query(q,[id],(err,result)=>{
        if(err) return res.send(err);
        // console.log(result);
        res.render('artworks', {result, artist_id : id});
    })
})

//get add route for artworks
app.get('/artists/:id/addartwork', (req, res) => {
    let { id } = req.params;
    res.render('addart', { artist_id: id });
});

//add route for artworks
app.post('/artists/:id/artworks', (req,res)=>{
    let {id} = req.params;
    let {title, price, category, image_link, artist_id} = req.body;
    let q = `INSERT INTO Artworks (title, price, category, image_link, artist_id)
        VALUES (?, ?, ?, ?, ?)`;

    connection.query(q, [title, price, category, image_link, artist_id], (err)=>{
        if(err) return res.send(err);
        res.redirect(`/artists/${id}/artworks`)
    })
})

//edit route for artworks
app.get('/artworks/edit/:id', (req, res) => {
    let { id } = req.params;

    let q = 'SELECT * FROM Artworks WHERE artwork_id = ?';

    connection.query(q, [id], (err, result) => {
        if (err) return res.send(err);

        res.render('editart', { art: result[0] });
    });
});


//buy route for artworks
app.get('/buy', (req, res) => {
    let { category, status, sort } = req.query;

    let q = 'SELECT * FROM Artworks WHERE 1=1';
    let params = [];

    if (category && category !== '') {
        q += ' AND category = ?';
        params.push(category);
    }

    if (status && status !== '') {
        q += ' AND status = ?';
        params.push(status);
    }

    if (sort === 'low') {
        q += ' ORDER BY price ASC';
    } else if (sort === 'high') {
        q += ' ORDER BY price DESC';
    }

    connection.query(q, params, (err, result) => {
        if (err) return res.send(err);

        res.render('buy', { result, query: req.query });
    });
});

app.get('/buy/:id', (req, res) => {
    let { id } = req.params;

    let q = 'SELECT * FROM Artworks WHERE artwork_id = ?';

    connection.query(q, [id], (err, result) => {
        if (err) return res.send(err);

        let art = result[0];

        // prevent invalid access
        if (!art) return res.send("Artwork not found");

        // prevent buying sold artwork
        if (art.status === 'sold') {
            return res.send("This artwork is already sold");
        }

        res.render('buyform', { art });
    });
});


//exhibitons route
app.get('/exhibitions', (req, res) => {

    let q = `
        SELECT e.exhibition_id, e.exhibition_name, e.location, e.exhibition_date,
           a.title, a.artwork_id
        FROM Exhibitions e
        LEFT JOIN Artwork_Exhibition ae ON e.exhibition_id = ae.exhibition_id
        LEFT JOIN Artworks a ON ae.artwork_id = a.artwork_id
    `;

    connection.query(q, (err, rows) => {
        if (err) return res.send(err);

        // group artworks under each exhibition
        let exhibitions = {};

        rows.forEach(row => {
            if (!exhibitions[row.exhibition_id]) {
                exhibitions[row.exhibition_id] = {
                    exhibition_id: row.exhibition_id,
                    name: row.exhibition_name,
                    location: row.location,
                    date: row.exhibition_date,
                    artworks: []
                };
            }

            if (row.title) {
                exhibitions[row.exhibition_id].artworks.push({
                    title: row.title,
                    id: row.artwork_id
                });
            }
        });

        res.render('exhibitions', { exhibitions: Object.values(exhibitions) });
    });
});

app.get('/exhibitions/add', (req, res) => {
    res.render('addexhibition');
});

app.post('/exhibitions', (req, res) => {
    let { name, date, location } = req.body;

    let q = `
        INSERT INTO Exhibitions (exhibition_name, exhibition_date, location)
        VALUES (?, ?, ?)
    `;

    connection.query(q, [name, date, location], (err) => {
        if (err) return res.send(err);

        res.redirect('/exhibitions');
    });
});

app.get('/exhibitions/:id/assign', (req, res) => {
    let { id } = req.params;

    let q = `
        SELECT * FROM Artworks 
        WHERE artwork_id NOT IN (
            SELECT artwork_id FROM Artwork_Exhibition
        )
    `;

    connection.query(q, (err, artworks) => {
        if (err) return res.send(err);

        res.render('assign', { artworks, exhibition_id: id });
    });
});

app.post('/exhibitions/:id/assign', (req, res) => {
    let { id } = req.params;
    let { artwork_id } = req.body;

    let q = `
        INSERT INTO Artwork_Exhibition (artwork_id, exhibition_id)
        VALUES (?, ?)
    `;

    connection.query(q, [artwork_id, id], (err) => {
        if (err) return res.send(err);

        res.redirect('/exhibitions');
    });
});

app.delete('/exhibitions/remove/:exId/:artId', (req, res) => {
    let { exId, artId } = req.params;

    let q = `
        DELETE FROM Artwork_Exhibition 
        WHERE exhibition_id = ? AND artwork_id = ?
    `;

    connection.query(q, [exId, artId], (err) => {
        if (err) return res.send(err);

        res.redirect('/exhibitions');
    });
});

app.post('/buy/:id', (req, res) => {
    let { id } = req.params;
    let { name, contact_info, interest } = req.body;

    // 1️⃣ check artwork exists + available
    let q1 = 'SELECT * FROM Artworks WHERE artwork_id = ?';

    connection.query(q1, [id], (err, result) => {
        if (err) return res.send(err);

        let art = result[0];

        if (!art) return res.send("Artwork not found");

        if (art.status === 'sold') {
            return res.send("Already sold");
        }

        // 2️⃣ insert customer
        let q2 = `
            INSERT INTO Customers (name, contact_info, interest)
            VALUES (?, ?, ?)
        `;

        connection.query(q2, [name, contact_info, interest], (err, custResult) => {
            if (err) return res.send(err);

            let customer_id = custResult.insertId;

            // 3️⃣ insert transaction
            let q3 = `
                INSERT INTO Transactions (artwork_id, customer_id, price, transaction_date)
                VALUES (?, ?, ?, CURDATE())
            `;

            connection.query(q3, [id, customer_id, art.price], (err) => {
                if (err) return res.send(err);

                // 4️⃣ update artwork status
                let q4 = `
                    UPDATE Artworks 
                    SET status = 'sold' 
                    WHERE artwork_id = ?
                `;

                connection.query(q4, [id], (err) => {
                    if (err) return res.send(err);

                    res.redirect('/buy');
                });
            });
        });
    });
});


app.put('/artworks/:id', (req, res) => {
    let { id } = req.params;
    let { title, price, category, image_link } = req.body;

    // get artist_id for redirect
    let q1 = 'SELECT artist_id FROM Artworks WHERE artwork_id = ?';

    connection.query(q1, [id], (err, result) => {
        if (err) return res.send(err);

        let artist_id = result[0].artist_id;

        let q2 = `
            UPDATE Artworks 
            SET title=?, price=?, category=?, image_link=?
            WHERE artwork_id=?
        `;

        connection.query(q2, [title, price, category, image_link, id], (err) => {
            if (err) return res.send(err);

            res.redirect(`/artists/${artist_id}/artworks`);
        });
    });
});

//Delete route on artworks
app.delete('/artworks/:id', (req, res) => {
    let { id } = req.params;

    let q1 = 'SELECT artist_id FROM Artworks WHERE artwork_id = ?';

    connection.query(q1, [id], (err, result) => {
        if (err) return res.send(err);

        let artist_id = result[0].artist_id;

        let q2 = 'DELETE FROM Artworks WHERE artwork_id = ?';

        connection.query(q2, [id], (err) => {
            if (err) return res.send(err);

            res.redirect(`/artists/${artist_id}/artworks`);
        });
    });
});



// Update route route for artists
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


//Post route for artists
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



//Delete route for artists
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