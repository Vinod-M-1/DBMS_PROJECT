-- CREATE DATABASE artgallery;
-- USE artgallery;

-- CREATE TABLE Artists (
--     artist_id INT PRIMARY KEY AUTO_INCREMENT,
--     name VARCHAR(100) NOT NULL,
--     biography TEXT,
--     style VARCHAR(50),
--     email VARCHAR(100) UNIQUE NOT NULL,
--     password VARCHAR(255) NOT NULL
-- );

-- CREATE TABLE Artworks (
--     artwork_id INT PRIMARY KEY AUTO_INCREMENT,
--     title VARCHAR(100) NOT NULL,
--     price DECIMAL(10,2),
--     status ENUM('available','sold') DEFAULT 'available',
--     category VARCHAR(50),   -- moved here
--     image_link VARCHAR(255),
--     artist_id INT,

--     FOREIGN KEY (artist_id) REFERENCES Artists(artist_id)
--         ON DELETE CASCADE
-- );

-- CREATE TABLE Artwork_Exhibition (
--     exhibition_id INT PRIMARY KEY AUTO_INCREMENT,
--     artwork_id INT,
--     exhibition_name VARCHAR(100),
--     exhibition_date DATE,
--     location VARCHAR(100),

--     FOREIGN KEY (artwork_id) REFERENCES Artworks(artwork_id)
--         ON DELETE CASCADE
-- );


-- CREATE TABLE Customers (
--     customer_id INT PRIMARY KEY AUTO_INCREMENT,
--     name VARCHAR(100) NOT NULL,
--     contact_info VARCHAR(100),
--     interest VARCHAR(100)
-- );

-- CREATE TABLE Transactions (
--     transaction_id INT PRIMARY KEY AUTO_INCREMENT,
--     artwork_id INT UNIQUE,
--     customer_id INT,
--     price DECIMAL(10,2),
--     transaction_date DATE,

--     FOREIGN KEY (artwork_id) REFERENCES Artworks(artwork_id)
--         ON DELETE CASCADE,
--     FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
--         ON DELETE CASCADE
-- );

